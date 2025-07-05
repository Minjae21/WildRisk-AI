# software/backend/app/services/predictor_service.py
import pandas as pd
import numpy as np
import json
import pickle
import keras
from sklearn.preprocessing import StandardScaler
from pathlib import Path
import random
import warnings # Import warnings module

from app.core.config import settings

print("INFO: Initializing predictor_service.py module...")

RF_STATES_PATH = Path(settings.MODEL_RF_STATES_PATH)
RF_COUNTIES_PATH = Path(settings.MODEL_RF_COUNTIES_PATH)
RF_COMMUNITIES_PATH = Path(settings.MODEL_RF_COMMUNITIES_PATH)
NN_COMMUNITY_PATH = Path(settings.MODEL_NN_COMMUNITY_PATH)
NN_COUNTY_PATH = Path(settings.MODEL_NN_COUNTY_PATH)
WEIGHTS_JSON_PATH = Path(settings.META_WEIGHTS_PATH)
WRC_EXCEL_DATA_PATH = Path(settings.WRC_DATA_PATH)
COMMUNITIES_LAT_LNG_DATA_PATH = Path(settings.COMMUNITIES_LAT_LNG_DATA_PATH)

model_nn_com_global = None
model_nn_coun_global = None
rf_states_global = None
model_rf_coun_global = None
model_rf_com_global = None

best_com_weights_global = None
best_coun_weights_global = None
w1_agg_global, w2_agg_global, w3_agg_global = None, None, None

state_df_predictor_global = None
county_df_predictor_global = None
community_df_predictor_global = None
communities_lat_lng_df_global = None

scalar_com_global = None
scalar_coun_global = None
scalar_states_global = None

REQUIRED_COLS_FEATURES = ['POP', 'TOTAL_BUILDINGS', 'BUILDINGS_FRACTION_ME', 'BUILDINGS_FRACTION_IE', 'BUILDINGS_FRACTION_DE']
SCALER_FEATURE_NAMES_COM = None
SCALER_FEATURE_NAMES_COUN = None
SCALER_FEATURE_NAMES_STATES = None


def load_map_specific_data():
    global communities_lat_lng_df_global
    try:
        if not COMMUNITIES_LAT_LNG_DATA_PATH.exists():
            raise FileNotFoundError(f"Community lat/lng data not found at {COMMUNITIES_LAT_LNG_DATA_PATH.resolve()}")
        communities_lat_lng_df_global = pd.read_excel(COMMUNITIES_LAT_LNG_DATA_PATH)
        print(f"INFO: Loaded community lat/lng data for map. Shape: {communities_lat_lng_df_global.shape}")
    except Exception as e:
        print(f"CRITICAL ERROR loading community lat/lng data: {e}")
        raise RuntimeError(f"Failed to load community map data: {e}")

def load_all_models_and_data():
    global model_nn_com_global, model_nn_coun_global, rf_states_global, model_rf_coun_global, model_rf_com_global
    global best_com_weights_global, best_coun_weights_global, w1_agg_global, w2_agg_global, w3_agg_global
    global state_df_predictor_global, county_df_predictor_global, community_df_predictor_global
    global scalar_com_global, scalar_coun_global, scalar_states_global
    global SCALER_FEATURE_NAMES_COM, SCALER_FEATURE_NAMES_COUN, SCALER_FEATURE_NAMES_STATES


    print("INFO: Loading ML models and data from configured paths...")
    try:
        if not NN_COMMUNITY_PATH.exists(): raise FileNotFoundError(f"Keras Community NN model not found at {NN_COMMUNITY_PATH.resolve()}")
        model_nn_com_global = keras.saving.load_model(NN_COMMUNITY_PATH)
        if not NN_COUNTY_PATH.exists(): raise FileNotFoundError(f"Keras County NN model not found at {NN_COUNTY_PATH.resolve()}")
        model_nn_coun_global = keras.saving.load_model(NN_COUNTY_PATH)
        print("INFO: Keras NN models loaded.")

        if not RF_STATES_PATH.exists(): raise FileNotFoundError(f"RF States model not found at {RF_STATES_PATH.resolve()}")
        with open(RF_STATES_PATH, 'rb') as f: rf_states_global = pickle.load(f)
        if not RF_COUNTIES_PATH.exists(): raise FileNotFoundError(f"RF Counties model not found at {RF_COUNTIES_PATH.resolve()}")
        with open(RF_COUNTIES_PATH, 'rb') as f: model_rf_coun_global = pickle.load(f)
        if not RF_COMMUNITIES_PATH.exists(): raise FileNotFoundError(f"RF Communities model not found at {RF_COMMUNITIES_PATH.resolve()}")
        with open(RF_COMMUNITIES_PATH, 'rb') as f: model_rf_com_global = pickle.load(f)
        print("INFO: Random Forest models loaded.")

        if not WEIGHTS_JSON_PATH.exists(): raise FileNotFoundError(f"Weights JSON not found at {WEIGHTS_JSON_PATH.resolve()}")
        with open(WEIGHTS_JSON_PATH, 'r') as f: weights_data = json.load(f)
        weights_agg_comm = weights_data["aggregate_comm_coun_rf&nn_weights"]["community_level"]
        weights_agg_coun = weights_data["aggregate_comm_coun_rf&nn_weights"]["county_level"]
        weights_agg_all = weights_data["aggregation_weights_for_all_models"]
        best_com_weights_global = [weights_agg_comm["neural_net_weight"], weights_agg_comm["random_forest_weight"]]
        best_coun_weights_global = [weights_agg_coun["neural_net_weight"], weights_agg_coun["random_forest_weight"]]
        w1_agg_global = weights_agg_all["community_weight"]
        w2_agg_global = weights_agg_all["county_weight"]
        w3_agg_global = weights_agg_all["state_weight"]
        print("INFO: Model weights extracted.")

        if not WRC_EXCEL_DATA_PATH.exists(): raise FileNotFoundError(f"WRC Excel data not found at {WRC_EXCEL_DATA_PATH.resolve()}")
        excel_file_wrc = pd.ExcelFile(WRC_EXCEL_DATA_PATH)
        state_df_predictor_global = excel_file_wrc.parse('States')
        county_df_predictor_global = excel_file_wrc.parse('Counties')
        community_df_predictor_global = excel_file_wrc.parse('Communities')
        print(f"INFO: WRC Excel data parsed. Shapes: Comm={community_df_predictor_global.shape}, County={county_df_predictor_global.shape}, State={state_df_predictor_global.shape}")

        def fit_scaler_on_features(df: pd.DataFrame, feature_cols: list, df_name_for_log: str) -> tuple[StandardScaler, list[str]]:
            if df is None: raise ValueError(f"DataFrame '{df_name_for_log}' is None for scaler fitting.")
            missing_cols = [col for col in feature_cols if col not in df.columns]
            if missing_cols: raise ValueError(f"Scaler fitting error for '{df_name_for_log}': Missing columns {missing_cols}. Available: {df.columns.tolist()}")
            
            df_for_scaling = df[feature_cols].dropna()
            if df_for_scaling.empty: raise ValueError(f"No data for scaling '{df_name_for_log}' using {feature_cols} after dropna.")
            
            scaler = StandardScaler()
            scaler.fit(df_for_scaling)
            print(f"INFO: Fitted scaler for '{df_name_for_log}' using {len(df_for_scaling)} rows. Features: {list(df_for_scaling.columns)}")
            return scaler, list(df_for_scaling.columns)
        
        scalar_com_global, SCALER_FEATURE_NAMES_COM = fit_scaler_on_features(county_df_predictor_global, REQUIRED_COLS_FEATURES, "WRC County DF (for Community Model's features)")
        scalar_coun_global, SCALER_FEATURE_NAMES_COUN = fit_scaler_on_features(community_df_predictor_global, REQUIRED_COLS_FEATURES, "WRC Community DF (for County Model's features)")
        scalar_states_global, SCALER_FEATURE_NAMES_STATES = fit_scaler_on_features(state_df_predictor_global, REQUIRED_COLS_FEATURES, "WRC State DF (for State Model's features)")
        print("INFO: All predictor model scalers fitted.")
        
        load_map_specific_data()
        
        print("INFO: Predictor service initialization complete (all models, data, and scalers).")

    except FileNotFoundError as e:
        print(f"CRITICAL FileNotFoundError during initialization: {e}")
        raise RuntimeError(f"Predictor service failed initialization due to missing file: {e}")
    except Exception as e:
        import traceback
        print(f"CRITICAL ERROR loading models or data during initialization: {e}")
        traceback.print_exc()
        raise RuntimeError(f"Predictor service failed to initialize: {e}")

load_all_models_and_data()

def get_scaled_features_for_predictor(community_full: str, county_full: str, state_abbr: str):
    com_feat_s, coun_feat_s, state_feat_s = None, None, None
    
    if county_df_predictor_global is None or community_df_predictor_global is None or state_df_predictor_global is None:
        raise ValueError("Predictor DataFrames not loaded for feature scaling.")
    if scalar_com_global is None or scalar_coun_global is None or scalar_states_global is None:
        raise ValueError("Predictor Scalers not loaded for feature scaling.")
    if SCALER_FEATURE_NAMES_COM is None or SCALER_FEATURE_NAMES_COUN is None or SCALER_FEATURE_NAMES_STATES is None:
        raise ValueError("Scaler feature names not initialized.")

    # --- Community Model Features (from county data, scaled by scalar_com_global) ---
    county_record = county_df_predictor_global[county_df_predictor_global['NAME'] == county_full]
    if not county_record.empty:
        if all(col in county_record.columns for col in SCALER_FEATURE_NAMES_COM):
            raw_feat_df = county_record.iloc[[0]][SCALER_FEATURE_NAMES_COM] 
            with warnings.catch_warnings():
                warnings.filterwarnings(
                    action="ignore",
                    message="X does not have valid feature names, but StandardScaler was fitted with feature names",
                    category=UserWarning, # Use category keyword
                    module="sklearn.utils.validation" # Use module keyword
                )
                com_feat_s = scalar_com_global.transform(raw_feat_df)
        else: print(f"WARN: Predictor: County '{county_full}' (for com model) missing required feature cols. Expected: {SCALER_FEATURE_NAMES_COM}")
    else: print(f"WARN: Predictor: County '{county_full}' (for community features) not found.")

    # --- County Model Features (from community data, scaled by scalar_coun_global) ---
    community_record = community_df_predictor_global[community_df_predictor_global['NAME'] == community_full]
    if not community_record.empty:
        if all(col in community_record.columns for col in SCALER_FEATURE_NAMES_COUN):
            raw_feat_df = community_record.iloc[[0]][SCALER_FEATURE_NAMES_COUN]
            with warnings.catch_warnings():
                warnings.filterwarnings(
                    action="ignore",
                    message="X does not have valid feature names, but StandardScaler was fitted with feature names",
                    category=UserWarning,
                    module="sklearn.utils.validation"
                )
                coun_feat_s = scalar_coun_global.transform(raw_feat_df)
        else: print(f"WARN: Predictor: Community '{community_full}' (for coun model) missing required feature cols. Expected: {SCALER_FEATURE_NAMES_COUN}")
    else: print(f"WARN: Predictor: Community '{community_full}' (for county features) not found.")

    # --- State Model Features ---
    state_record = state_df_predictor_global[state_df_predictor_global['STUSPS'] == state_abbr]
    if not state_record.empty:
        if all(col in state_record.columns for col in SCALER_FEATURE_NAMES_STATES):
            raw_feat_df = state_record.iloc[[0]][SCALER_FEATURE_NAMES_STATES]
            with warnings.catch_warnings():
                warnings.filterwarnings(
                    action="ignore",
                    message="X does not have valid feature names, but StandardScaler was fitted with feature names",
                    category=UserWarning,
                    module="sklearn.utils.validation"
                )
                state_feat_s = scalar_states_global.transform(raw_feat_df)
        else: print(f"WARN: Predictor: State '{state_abbr}' missing required feature cols. Expected: {SCALER_FEATURE_NAMES_STATES}")
    else: print(f"WARN: Predictor: State '{state_abbr}' not found.")
        
    return com_feat_s, coun_feat_s, state_feat_s

def get_individual_model_predictions_for_predictor(X_com_s, X_coun_s, X_states_s):
    preds_com_e, preds_coun_e, preds_state_rf = None, None, None
    if X_com_s is not None:
        nn_preds_com = model_nn_com_global.predict(X_com_s, verbose=0).ravel()
        rf_preds_com = model_rf_com_global.predict(X_com_s).ravel()
        preds_com_e = best_com_weights_global[0] * nn_preds_com + best_com_weights_global[1] * rf_preds_com
    if X_coun_s is not None:
        nn_preds_coun = model_nn_coun_global.predict(X_coun_s, verbose=0).ravel()
        rf_preds_coun = model_rf_coun_global.predict(X_coun_s).ravel()
        preds_coun_e = best_coun_weights_global[0] * nn_preds_coun + best_coun_weights_global[1] * rf_preds_coun
    if X_states_s is not None:
        preds_state_rf = rf_states_global.predict(X_states_s).ravel()
    return preds_com_e, preds_coun_e, preds_state_rf

def get_final_bp_prediction(community_part: str, county_part: str, state_abbr_part: str, for_map_display: bool = False):
    if not for_map_display:
        print(f"BP Prediction for: com='{community_part}', coun='{county_part}', state='{state_abbr_part}'")
    
    community_full_name = f"{community_part.strip()}, {state_abbr_part.strip().upper()}"
    county_full_name = f"{county_part.strip()} County, {state_abbr_part.strip().upper()}"
    state_abbr = state_abbr_part.strip().upper()

    if not for_map_display:
        print(f"Constructed for predictor lookup: community_full='{community_full_name}', county_full='{county_full_name}', state_abbr='{state_abbr}'")

    try:
        com_feat_s, coun_feat_s, state_feat_s = get_scaled_features_for_predictor(
            community_full_name, county_full_name, state_abbr
        )
    except ValueError as e:
        return {"error": f"Feature lookup/scaling error: {e}", "bp_prediction": None}
    except Exception as e:
        if not for_map_display: import traceback; traceback.print_exc()
        return {"error": f"Internal error processing features for predictor: {e}", "bp_prediction": None}

    preds_com_e, preds_coun_e, preds_state_rf = get_individual_model_predictions_for_predictor(
        com_feat_s, coun_feat_s, state_feat_s
    )
    pred_c = preds_com_e[0] if preds_com_e is not None and len(preds_com_e) > 0 else None
    pred_co = preds_coun_e[0] if preds_coun_e is not None and len(preds_coun_e) > 0 else None
    pred_s = preds_state_rf[0] if preds_state_rf is not None and len(preds_state_rf) > 0 else None
    
    if not for_map_display:
        print(f"DEBUG: Predictor individual preds: Com={pred_c}, Coun={pred_co}, State={pred_s}")

    combined_pred_value = 0.0; levels_used = []; weighted_sum = 0; total_weight_used = 0
    if pred_c is not None: weighted_sum += w1_agg_global * pred_c; total_weight_used += w1_agg_global; levels_used.append('community')
    if pred_co is not None: weighted_sum += w2_agg_global * pred_co; total_weight_used += w2_agg_global; levels_used.append('county')
    if pred_s is not None: weighted_sum += w3_agg_global * pred_s; total_weight_used += w3_agg_global; levels_used.append('state')

    if total_weight_used > 0: combined_pred_value = weighted_sum / total_weight_used
    elif pred_s is not None: combined_pred_value = pred_s; levels_used = ['state']
    else: return {"error": "No valid level predictions from predictor.", "bp_prediction": None, "levels_used": []}

    if for_map_display:
        return {"bp_prediction": float(combined_pred_value), "error": None}

    confidence = min(0.95, 0.7 + 0.15 * len(levels_used))
    simulated_map_data_for_main_response = {"type": "FeatureCollection", "features": []}
    result = {
        "bp_prediction": round(float(combined_pred_value), 4), "confidence": round(confidence, 2), "levels_used": levels_used,
        "individual_predictions": {"community":round(float(pred_c),4)if pred_c is not None else None,"county":round(float(pred_co),4)if pred_co is not None else None,"state":round(float(pred_s),4)if pred_s is not None else None,},
        "error": None, "risk_factors_summary": f"Predictor score based on {len(levels_used)} level(s).",
        "map_data_details": simulated_map_data_for_main_response 
    }
    if not for_map_display:
        print(f"Final BP Prediction (predictor service): {result}")
    return result

def get_communities_for_county_map(county_name_part_input: str, state_abbr_input: str):
    if communities_lat_lng_df_global is None or communities_lat_lng_df_global.empty:
        return {"error": "Community location data for map not loaded.", "county_name": county_name_part_input, "state_abbr": state_abbr_input, "communities": []}

    target_county = county_name_part_input.strip()
    target_state = state_abbr_input.strip().upper()

    COUNTY_COL_EXCEL = 'County' 
    STATE_COL_EXCEL = 'State'
    COMMUNITY_NAME_COL_EXCEL = 'Community'
    LAT_COL_EXCEL = 'LATITUDE'
    LNG_COL_EXCEL = 'LONGITUDE'
    
    required_map_cols = [COUNTY_COL_EXCEL, STATE_COL_EXCEL, COMMUNITY_NAME_COL_EXCEL, LAT_COL_EXCEL, LNG_COL_EXCEL]
    missing_map_cols = [col for col in required_map_cols if col not in communities_lat_lng_df_global.columns]
    if missing_map_cols:
        return {"error": f"Map data error: Missing required columns {missing_map_cols} in community lat/lng source. Available: {communities_lat_lng_df_global.columns.tolist()}", "county_name": target_county, "state_abbr": target_state, "communities": []}

    try:
        county_communities_df = communities_lat_lng_df_global[
            (communities_lat_lng_df_global[COUNTY_COL_EXCEL].astype(str).str.strip().str.lower() == target_county.lower()) &
            (communities_lat_lng_df_global[STATE_COL_EXCEL].astype(str).str.strip().str.upper() == target_state)
        ]
    except Exception as e:
        return {"error": f"Error filtering map data for {target_county}, {target_state}: {e}", "county_name": target_county, "state_abbr": target_state, "communities": []}

    if county_communities_df.empty:
        return {"error": f"No base communities found for map in {target_county} County, {target_state}.", "county_name": target_county, "state_abbr": target_state, "communities": []}

    output_communities_for_map = []
    print(f"INFO: Found {len(county_communities_df)} communities in {target_county}, {target_state} from Excel for map display.")

    for index, row in county_communities_df.iterrows():
        try:
            lat = float(row[LAT_COL_EXCEL])
            lng = float(row[LNG_COL_EXCEL])
            community_name_part_from_excel = str(row[COMMUNITY_NAME_COL_EXCEL]).strip()
            
            prediction_data = get_final_bp_prediction(
                community_part=community_name_part_from_excel,
                county_part=target_county,
                state_abbr_part=target_state,
                for_map_display=True
            )

            bp_rank_for_severity = 0.0
            if prediction_data.get("error") or prediction_data.get("bp_prediction") is None:
                print(f"  WARN: Predictor model failed or returned no BP for map point {community_name_part_from_excel}: {prediction_data.get('error')}")
            else:
                bp_rank_for_severity = prediction_data["bp_prediction"]

            # --- ADD THIS LOG ---
            print(f"DEBUG_MAP_SEVERITY: Community: {community_name_part_from_excel}, BP_Rank: {bp_rank_for_severity}, Assigned Severity: ", end="\n")
            # --- END ADD ---

            severity = "low"
            if bp_rank_for_severity >= 0.65: severity = "high"
            elif bp_rank_for_severity >= 0.35: severity = "medium"

            output_communities_for_map.append({
                "id": f"{target_county}-{target_state}-{community_name_part_from_excel.replace(' ','-')}-{index}",
                "name": f"{community_name_part_from_excel}, {target_state}",
                "lat": lat,
                "lng": lng,
                "severity": severity
            })
        except Exception as e:
            import traceback
            print(f"WARN: Skipping map point row processing due to error: {row.to_dict() if isinstance(row, pd.Series) else row}, error: {e}")
            traceback.print_exc()
            continue
    
    final_points_to_display = list(output_communities_for_map)
    target_point_count = 55
    if output_communities_for_map and len(output_communities_for_map) < target_point_count:
        print(f"INFO: Original map points for {target_county}: {len(output_communities_for_map)}. Simulating more.")
        num_to_add = target_point_count - len(output_communities_for_map)
        for i in range(num_to_add):
            if not output_communities_for_map: break
            original_point_dict = random.choice(output_communities_for_map)
            jitter_lat = (random.random() - 0.5) * 0.02 
            jitter_lng = (random.random() - 0.5) * 0.02
            final_points_to_display.append({
                "id": f"{original_point_dict['id']}-sim-{i}",
                "name": f"{original_point_dict['name']} (sim)",
                "lat": original_point_dict['lat'] + jitter_lat,
                "lng": original_point_dict['lng'] + jitter_lng,
                "severity": original_point_dict['severity']
            })
    elif len(output_communities_for_map) > target_point_count:
        final_points_to_display = output_communities_for_map[:target_point_count]
    
    print(f"INFO: Returning {len(final_points_to_display)} communities for map of {target_county}, {target_state}.")
    return {"county_name": target_county, "state_abbr": target_state, "communities": final_points_to_display, "error": None}

print("INFO: Predictor service module fully loaded and initialized at end of file.")