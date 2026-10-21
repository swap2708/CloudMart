from fastapi.testclient import TestClient


def test_health_check_endpoint(client: TestClient):
    """Test that /health returns 200 with healthy status and database connection."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert "version" in data
