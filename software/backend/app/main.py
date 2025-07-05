from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_v1_router # Import the v1 router
from app.core.config import settings # Import settings

# Create the FastAPI application instance
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json", # URL for the OpenAPI spec
    docs_url=f"{settings.API_V1_STR}/docs", # URL for Swagger UI
    redoc_url=f"{settings.API_V1_STR}/redoc" # URL for ReDoc documentation
)

# --- CORS (Cross-Origin Resource Sharing) Middleware ---
# This is crucial for allowing your frontend (running on a different port/domain)
# to communicate with the backend.
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS], # Origins allowed
        allow_credentials=True, # Allow cookies
        allow_methods=["*"],    # Allow all methods (GET, POST, etc.)
        allow_headers=["*"],    # Allow all headers
    )
else:
    # Maybe allow all origins in dev if not specified (less secure)
    print("WARN: No CORS origins specified. Allowing all origins for development.")
    app.add_middleware(
         CORSMiddleware,
         allow_origins=["*"],
         allow_credentials=True,
         allow_methods=["*"],
         allow_headers=["*"],
     )


# --- Include API Routers ---
# Include the main router for API version 1
# All routes defined in api_v1_router will be prefixed with /api/v1
app.include_router(api_v1_router, prefix=settings.API_V1_STR)


# --- Root Endpoint ---
@app.get("/", summary="Root", tags=["Root"])
async def read_root():
    """
    Simple health check or info endpoint.
    """
    return {"message": f"Welcome to {settings.PROJECT_NAME}! API Docs at /api/v1/docs"}

# --- Optional: Add event handlers (e.g., load model on startup) ---
# @app.on_event("startup")
# async def startup_event():
#     print("INFO:     Application startup...")
#     # Load ML models or initialize resources here if needed globally
#     # model_service.load_global_model()
#
# @app.on_event("shutdown")
# async def shutdown_event():
#     print("INFO:     Application shutdown...")
#     # Clean up resources here