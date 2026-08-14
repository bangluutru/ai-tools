from fastapi.testclient import TestClient

from src.server import app


client = TestClient(app)


def test_health_describes_antigravity_runtime_without_provider_fallback():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["ai_runtime"] == "antigravity"
    assert response.json()["ai_runtime_enabled"] is False


def test_stub_export_does_not_claim_success():
    response = client.post("/api/invoices/generate-excel", json={})
    assert response.status_code == 501


def test_request_size_limit_rejects_large_content_length():
    response = client.post(
        "/api/invoices/generate-excel",
        headers={"Content-Length": "999999999"},
        content=b"{}",
    )
    assert response.status_code == 413
