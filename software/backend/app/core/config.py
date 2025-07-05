import os
import json
from typing import List, Union
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Backend API"
    API_V1_STR: str = "/api/v1"

    # Example: Load CORS origins from .env
    # The variable in .env should be a JSON string array like '["http://localhost:5173"]'
    BACKEND_CORS_ORIGINS_STR: str = '[]' # Default to empty JSON array string

    @property
    def BACKEND_CORS_ORIGINS(self) -> List[str]:
        """Parses the JSON string from .env into a list of origins."""
        try:
            return json.loads(self.BACKEND_CORS_ORIGINS_STR)
        except json.JSONDecodeError:
            # Handle error or return a default list if parsing fails
            print(f"Warning: Could not parse BACKEND_CORS_ORIGINS_STR: {self.BACKEND_CORS_ORIGINS_STR}")
            return ["http://localhost:5173"] # Sensible default for dev

    # Add other settings needed by your application
    MODEL_PATH: str = "./default/model/path" # Default if not in .env
    MODEL_NN_COMMUNITY_PATH: str = "ml_models/Community_model_weights.keras"
    MODEL_NN_COUNTY_PATH: str = "ml_models/County_model_weights.keras"
    MODEL_RF_STATES_PATH: str = "ml_models/rf_model_states.pkl"
    MODEL_RF_COUNTIES_PATH: str = "ml_models/rf_model_counties.pkl"
    MODEL_RF_COMMUNITIES_PATH: str = "ml_models/rf_model_communities.pkl"
    META_WEIGHTS_PATH: str = "ml_models/meta_estimator_weights.json"
    WRC_DATA_PATH: str = "data/wrc_download_20240522.xlsx"
    COMMUNITIES_LAT_LNG_DATA_PATH: str = "data/communities_with_lat_lng.xlsx"

    class Config:
        # This tells pydantic-settings to load variables from a .env file
        env_file = ".env"
        env_file_encoding = "utf-8"
        # Make matching case-insensitive for environment variables
        case_sensitive = False

# Create a single instance of the settings to be imported elsewhere
settings = Settings()

# You can access settings like this in other files:
# from app.core.config import settings
# print(settings.PROJECT_NAME)
# print(settings.BACKEND_CORS_ORIGINS)