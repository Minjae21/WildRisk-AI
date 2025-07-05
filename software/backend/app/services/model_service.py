# software/backend/app/services/model_service.py
from app.models.example_schema import RiskAssessmentInput, RiskAssessmentOutput
from app.core.config import settings
import time
import random
from datetime import date

# --- Placeholder for actual model loading ---
print(f"INFO: Placeholder: Would load model from: {settings.MODEL_PATH}")

# --- !!! Replace this function's logic with your actual model !!! ---
def get_risk_assessment(input_data: RiskAssessmentInput) -> RiskAssessmentOutput:
    """
    This function takes the validated input data (location, date),
    simulates interaction with an ML model, and returns structured risk assessment output.
    """
    start_time = time.time()
    print(f"INFO: Simulating risk assessment for location: '{input_data.location}', date: {input_data.selected_date}")

    # --- Simulation Logic ---
    random.seed(hash(input_data.location + str(input_data.selected_date)))
    simulated_score = random.randint(1, 10)

    # Simulate factors based on score and input
    simulated_factors = [
        f"Conditions evaluated for {input_data.location} on {input_data.selected_date}",
    ]
    if simulated_score > 7:
        simulated_factors.extend([
            "Simulated: High probability based on historical data patterns",
            "Simulated: Dry vegetation index detected",
            "Simulated: Predicted high winds"
        ])
    elif simulated_score > 4:
        simulated_factors.extend([
            "Simulated: Moderate fuel load observed",
            "Simulated: Elevated temperature forecast"
        ])
    else:
        simulated_factors.append("Simulated: Generally favorable conditions")

    simulated_factors.append(f"Base assessment score: {simulated_score}/10")

    # --- *** GENERATE MOCK MAP DATA *** ---
    mock_center_lat = 37.7749
    mock_center_lng = -122.4194
    num_points = random.randint(5, 15)
    mock_features = [] # Initialize empty list
    print(f"DEBUG: Attempting to generate {num_points} mock features...") # <-- DEBUG LOG 1
    for i in range(num_points):
        offset_lat = (random.random() - 0.5) * 0.1
        offset_lng = (random.random() - 0.5) * 0.1
        severity = random.choice(["low", "medium", "high"])
        year = random.randint(2018, 2023)

        # Create the feature dictionary
        feature = {
            "id": f"simulated-{i}",
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [mock_center_lng + offset_lng, mock_center_lat + offset_lat]
            },
            "properties": {
                "severity": severity,
                "year": year
            }
        }
        mock_features.append(feature) # Append the created feature

    # This print statement confirms if features were actually added
    print(f"DEBUG: Generated mock_features list (length {len(mock_features)}): {mock_features[:2]}...") # <-- DEBUG LOG 2 (log first few)

    # Create the final map_data structure
    simulated_map_data = {
        "type": "FeatureCollection",
        "features": mock_features # Assign the potentially populated list
    }
    # --- *** END OF MOCK MAP DATA GENERATION *** ---

    processing_time = (time.time() - start_time) * 1000
    print(f"INFO: Simulation took {processing_time:.2f} ms")

    # Structure the output according to the RiskAssessmentOutput schema
    output = RiskAssessmentOutput(
        risk_score=simulated_score,
        risk_factors=simulated_factors,
        map_data=simulated_map_data, # Use the simulated data object
        comparison_data={"average_score": 5, "your_score": simulated_score},
        generated_at=date.today()
    )

    # --- *** ADD FINAL LOGS BEFORE RETURN *** ---
    print(f"DEBUG: simulated_map_data being assigned to output: {simulated_map_data}") # <-- DEBUG LOG 3
    print(f"DEBUG: Full output object being returned: {output.model_dump()}") # <-- DEBUG LOG 4 (use model_dump for Pydantic v2+)
    # For Pydantic v1, use: print(f"DEBUG: Full output object being returned: {output.dict()}")

    return output