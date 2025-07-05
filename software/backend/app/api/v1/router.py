from fastapi import APIRouter
from app.api.v1.endpoints import model_interaction

api_v1_router = APIRouter()

# Include routers from specific endpoint files
# Prefix makes all routes in model_interaction start with /assessment
# Tags group related endpoints in the automatic API documentation (Swagger UI)
api_v1_router.include_router(
    model_interaction.router,
    prefix="/predictor", # Or keep /assessment, or /model
    tags=["Predictor Model"]
)

# You could include other endpoint routers here for v1
# from app.api.v1.endpoints import user_management
# api_v1_router.include_router(user_management.router, prefix="/users", tags=["Users"])