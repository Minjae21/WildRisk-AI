from pydantic import BaseModel, Field
from typing import Optional, List, Any

class PredictorInput(BaseModel):
    community_name_part: str = Field(..., examples=["Austin"], description="The name of the city or town, e.g., 'Austin'")
    county_name_part: str = Field(..., examples=["Travis"], description="The name of the county, e.g., 'Travis' (without 'County')")
    state_abbr: str = Field(..., examples=["TX"], min_length=2, max_length=2, description="The 2-letter state abbreviation, e.g., 'TX'")
    
    # selected_date: Optional[date] = None # If needed later for RAG

class PredictorOutput(BaseModel): # No change needed here if already defined
    bp_prediction: Optional[float] = Field(None, examples=[0.6231])
    confidence: Optional[float] = Field(None, examples=[0.95])
    levels_used: List[str] = Field(default_factory=list, examples=[["community", "county", "state"]])
    individual_predictions: Optional[dict[str, Optional[float]]] = Field(None)
    error: Optional[str] = Field(None, description="Error message if prediction failed")
    input_latitude: Optional[float] = Field(None, description="Latitude of the input community")
    input_longitude: Optional[float] = Field(None, description="Longitude of the input community")
    risk_factors_summary: Optional[str] = Field("Predictor model score generated. RAG insights pending.")
    map_data_details: Optional[Any] = Field({"type": "FeatureCollection", "features": []})

class CountyCommunityMapPoint(BaseModel):
    id: str # Use 'Community' name or a generated ID
    name: str # Full Community Name e.g. "Austin, TX"
    lat: float
    lng: float
    severity: str # "low", "medium", "high" -> to be derived

class CountyCommunitiesOutput(BaseModel):
    county_name: str
    state_abbr: str
    communities: List[CountyCommunityMapPoint]
    error: Optional[str] = None
