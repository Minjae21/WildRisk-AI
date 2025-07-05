# software/backend/app/api/v1/endpoints/model_interaction.py
from fastapi import APIRouter, HTTPException, status, Query
from app.models.example_schema import PredictorInput, PredictorOutput, CountyCommunitiesOutput # Ensure CountyCommunitiesOutput is imported
from app.services import predictor_service

router = APIRouter()

@router.post(
    "/predict-bp-risk",
    response_model=PredictorOutput,
    summary="Get BP Risk Prediction from Predictor Model",
    description="Receives community name part, county name part, and state abbreviation to predict Burning Potential (BP) risk.",
    status_code=status.HTTP_200_OK
)
async def predict_bp_risk_endpoint(input_data: PredictorInput):
    try:
        prediction_result_dict = predictor_service.get_final_bp_prediction(
            community_part=input_data.community_name_part,
            county_part=input_data.county_name_part,
            state_abbr_part=input_data.state_abbr
        )

        # Check if the service function itself returned an error structure
        if prediction_result_dict.get("error"):
            # Determine appropriate status code based on error if possible
            # For now, using 404 for "not found" type errors, 400 for bad input, 500 for others
            # This logic can be refined.
            error_detail = prediction_result_dict["error"]
            status_code = status.HTTP_404_NOT_FOUND # Default for data not found
            if "invalid input" in error_detail.lower() or "format" in error_detail.lower():
                status_code = status.HTTP_400_BAD_REQUEST
            elif "internal error" in error_detail.lower() or "failed to load" in error_detail.lower():
                 status_code = status.HTTP_503_SERVICE_UNAVAILABLE

            # For the Pydantic model, ensure all required fields are present or have defaults
            # even if it's an error response, if PredictorOutput is strictly used.
            # Or, consider a different error response model for clarity.
            # For now, returning a PredictorOutput with error populated:
            return PredictorOutput(
                bp_prediction=None,
                confidence=0.0,
                levels_used=[],
                error=error_detail,
                # Default other fields or set to None if optional
                individual_predictions=None,
                risk_factors_summary="Prediction failed.",
                map_data_details=None
            )

        return PredictorOutput(**prediction_result_dict)

    except ValueError as ve: # Catch ValueErrors explicitly if service raises them for bad input
        print(f"ValueError in BP Risk prediction endpoint: {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        import traceback
        print(f"ERROR: BP Risk prediction endpoint unexpected failure: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An internal error occurred during BP risk prediction: {str(e)}",
        )

@router.get(
    "/county-map-communities",
    response_model=CountyCommunitiesOutput,
    summary="Get communities with lat/lng for a specific county for map display"
)
async def get_county_map_data(
    county_name: str = Query(..., description="The simple name of the county, e.g., 'Travis' or 'Los Angeles'"),
    state_abbr: str = Query(..., min_length=2, max_length=2, description="The 2-letter state abbreviation, e.g., 'TX' or 'CA'")
):
    try:
        result_dict = predictor_service.get_communities_for_county_map(county_name, state_abbr.upper())
        
        # The service function now returns a dict that includes an 'error' key if something went wrong
        if result_dict.get("error"):
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result_dict["error"])
        
        # If no error, construct the Pydantic model from the dict
        return CountyCommunitiesOutput(**result_dict)
        
    except HTTPException as httpe: # Re-raise known HTTPExceptions
        raise httpe
    except ValueError as ve: # Catch specific ValueErrors from service logic
        print(f"ValueError in /county-map-communities endpoint: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        import traceback
        print(f"Error in /county-map-communities endpoint: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve county map data.")