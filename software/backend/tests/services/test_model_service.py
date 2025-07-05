# software/backend/tests/services/test_predictor_service.py
import pytest
import pandas as pd
from app.services import predictor_service
# from app.models.example_schema import PredictorInput # Not directly used by service functions

# Mock global data for more isolated unit tests if needed.
# For this example, we rely on global data being loaded by conftest/app init.
# If load_all_models_and_data fails, these tests would also fail indirectly.

def test_get_final_bp_prediction_valid_input():
    """
    Test the main prediction function with valid inputs that should yield a result.
    This is more of an integration test for the service function as it uses loaded models.
    Ensure "Austin", "Travis", "TX" has corresponding entries in your WRC Excel for all levels.
    """
    result = predictor_service.get_final_bp_prediction(
        community_part="Austin",
        county_part="Travis",
        state_abbr_part="TX"
    )
    assert result["error"] is None
    assert result["bp_prediction"] is not None
    assert 0.0 <= result["bp_prediction"] <= 1.0
    assert "community" in result["levels_used"] or \
           "county" in result["levels_used"] or \
           "state" in result["levels_used"]

def test_get_final_bp_prediction_community_not_in_wrc_data(mocker):
    """
    Test when a community feature lookup fails within get_scaled_features_for_predictor.
    This requires mocking the DataFrame filtering to simulate "not found".
    """
    # Simulate community_df_predictor_global returning an empty DataFrame for the lookup
    mock_empty_df = pd.DataFrame()
    mocker.patch.object(predictor_service, 'community_df_predictor_global', {"NAME": []}) # Simplified mock
    # More precise: patch the filtering part:
    # `mocker.patch('pandas.DataFrame.__getitem__', return_value=mock_empty_df)` (can be tricky)

    # A simpler way for this specific case: mock get_scaled_features_for_predictor to return Nones
    mocker.patch(
        'app.services.predictor_service.get_scaled_features_for_predictor',
        return_value=(None, None, None) # Simulate no features found for any level
    )

    result = predictor_service.get_final_bp_prediction(
        community_part="VeryFakeCity",
        county_part="VeryFakeCounty",
        state_abbr_part="XX"
    )
    assert result["error"] is not None
    assert "No valid level predictions" in result["error"] # Or specific error from get_scaled_features
    assert result["bp_prediction"] is None


def test_get_communities_for_county_map_filters_low_severity(mocker):
    """
    Test that get_communities_for_county_map filters out low severity points.
    """
    # Mock communities_lat_lng_df_global data
    mock_map_data = pd.DataFrame({
        'Community': ["TownA", "TownB", "TownC"],
        'County': ["TestCounty", "TestCounty", "TestCounty"],
        'State': ["TS", "TS", "TS"],
        'LATITUDE': [30.0, 30.1, 30.2],
        'LONGITUDE': [-95.0, -95.1, -95.2]
    })
    mocker.patch.object(predictor_service, 'communities_lat_lng_df_global', mock_map_data)

    # Mock get_final_bp_prediction to control the severity
    def mock_predictor_for_map(community_part, county_part, state_abbr_part, for_map_display=False):
        if community_part == "TownA": return {"bp_prediction": 0.8} # High
        if community_part == "TownB": return {"bp_prediction": 0.5} # Medium
        if community_part == "TownC": return {"bp_prediction": 0.2} # Low
        return {"bp_prediction": 0.0, "error": "Unknown town for mock"}

    mocker.patch('app.services.predictor_service.get_final_bp_prediction', side_effect=mock_predictor_for_map)

    result = predictor_service.get_communities_for_county_map(
        county_name_part_input="TestCounty",
        state_abbr_input="TS"
    )

    assert result["error"] is None
    assert len(result["communities"]) <= 55 # Due to target_point_count
    
    # Check if only medium and high are present
    severities_found = {c["severity"] for c in result["communities"]}
    assert "low" not in severities_found
    assert "medium" in severities_found or "high" in severities_found # At least one should be there if Towns A/B were processed

    # Count original (non-simulated) points returned
    original_points = [c for c in result["communities"] if "(sim)" not in c["name"]]
    assert len(original_points) == 2 # TownA (high) and TownB (medium)
    assert any(p["name"] == "TownA, TS" for p in original_points)
    assert any(p["name"] == "TownB, TS" for p in original_points)
    assert not any(p["name"] == "TownC, TS" for p in original_points)

# Add more tests for edge cases in get_communities_for_county_map (e.g., Excel missing columns, empty Excel)