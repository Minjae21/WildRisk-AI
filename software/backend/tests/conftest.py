import pytest
from collections.abc import Generator # Import Generator from collections.abc
from fastapi.testclient import TestClient
from app.main import app # Import your FastAPI app instance

# Use Generator type hint for fixtures yielding values
@pytest.fixture(scope="module")
def client() -> Generator[TestClient, None, None]: # Correct type hint
    """
    Provides a FastAPI TestClient instance for making requests to the app.
    """
    # The TestClient should be used as a context manager
    with TestClient(app) as test_client:
        yield test_client # Yield the client instance
    # Teardown happens automatically when the 'with' block exits