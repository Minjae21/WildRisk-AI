# software/backend/tests/api/v1/endpoints/test_model_interaction.py
from fastapi.testclient import TestClient
from fastapi import status
import pytest

# Assuming API prefix is /api/v1 and endpoint prefix is /predictor
PREDICT_BP_RISK_URL = "/api/v1/predictor/predict-bp-risk"
COUNTY_MAP_COMMUNITIES_URL = "/api/v1/predictor/county-map-communities"

# --- Tests for /predict-bp-risk ---
def test_predict_bp_risk_success(client: TestClient):
    """Test successful BP risk prediction."""
    # Use known good data that exists in your WRC Excel files
    # and for which your COUNTYNAME lookup in predictor_service will work.
    # Example: Assuming "Austin", "Travis", "TX" is valid.
    test_payload = {
        "community_name_part": "Austin",
        "county_name_part": "Travis",
        "state_abbr": "TX"
    }
    response = client.post(PREDICT_BP_RISK_URL, json=test_payload)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "bp_prediction" in data
    assert "confidence" in data
    assert "levels_used" in data
    assert data["error"] is None
    if data["bp_prediction"] is not None: # bp_prediction can be None if no levels had data
        assert 0.0 <= data["bp_prediction"] <= 1.0
    if data["confidence"] is not None:
        assert 0.0 <= data["confidence"] <= 1.0

def test_predict_bp_risk_missing_field(client: TestClient):
    """Test request with a missing required field."""
    test_payload = {
        "community_name_part": "SomeCity",
        # "county_name_part": "SomeCounty", // Missing county
        "state_abbr": "ST"
    }
    response = client.post(PREDICT_BP_RISK_URL, json=test_payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_predict_bp_risk_invalid_state_abbr(client: TestClient):
    """Test request with an invalid state abbreviation format."""
    test_payload = {
        "community_name_part": "SomeCity",
        "county_name_part": "SomeCounty",
        "state_abbr": "TOOLONG" # Invalid
    }
    response = client.post(PREDICT_BP_RISK_URL, json=test_payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_predict_bp_risk_location_not_found(client: TestClient, mocker):
    """Test when predictor_service returns a 'location not found' error."""
    # Mock the service function to simulate a "not found" scenario
    # This makes it a true unit test for the endpoint's error handling
    mocker.patch(
        'app.services.predictor_service.get_final_bp_prediction',
        return_value={"error": "Community 'UnknownCity, XX' not found.", "bp_prediction": None}
    )
    
    test_payload = {
        "community_name_part": "UnknownCity",
        "county_name_part": "UnknownCounty",
        "state_abbr": "XX"
    }
    response = client.post(PREDICT_BP_RISK_URL, json=test_payload)
    
    # The endpoint currently re-raises specific errors as HTTPExceptions or returns PredictorOutput
    # If it returns PredictorOutput with an error field:
    assert response.status_code == status.HTTP_200_OK # Or 404 if endpoint converts it
    data = response.json()
    assert data["error"] is not None
    assert "UnknownCity, XX" in data["error"]
    assert data["bp_prediction"] is None
    # If your endpoint re-raises a 404 HTTPException for this case:
    # assert response.status_code == status.HTTP_404_NOT_FOUND
    # assert "UnknownCity, XX" in response.json()["detail"]


# --- Tests for /county-map-communities ---
def test_get_county_map_communities_success(client: TestClient):
    """Test successful retrieval of communities for map."""
    # Use a county and state known to be in your communities_with_lat_lng.xlsx
    # Example: Travis, TX or Los Angeles, CA
    params = {"county_name": "Travis", "state_abbr": "TX"}
    response = client.get(COUNTY_MAP_COMMUNITIES_URL, params=params)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["county_name"] == "Travis"
    assert data["state_abbr"] == "TX"
    assert "communities" in data
    assert isinstance(data["communities"], list)
    if len(data["communities"]) > 0:
        first_community = data["communities"][0]
        assert "id" in first_community
        assert "name" in first_community
        assert "lat" in first_community
        assert "lng" in first_community
        assert "severity" in first_community
        assert first_community["severity"] in ["medium", "high"] # Since low is filtered

def test_get_county_map_communities_not_found(client: TestClient):
    """Test when no communities are found for a county/state."""
    params = {"county_name": "NonExistentCounty", "state_abbr": "XX"}
    response = client.get(COUNTY_MAP_COMMUNITIES_URL, params=params)
    
    assert response.status_code == status.HTTP_404_NOT_FOUND # Endpoint raises HTTPException
    data = response.json()
    assert "detail" in data
    assert "No base communities found" in data["detail"]

def test_get_county_map_communities_missing_param(client: TestClient):
    """Test request missing a required query parameter."""
    params = {"county_name": "SomeCounty"} # Missing state_abbr
    response = client.get(COUNTY_MAP_COMMUNITIES_URL, params=params)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY