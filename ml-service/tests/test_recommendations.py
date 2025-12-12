from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_recommendations():
    response = client.post("/recommendations", json={"user_id": 1})
    assert response.status_code == 200
    assert "recommendations" in response.json()