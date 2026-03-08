import os

from fastapi.testclient import TestClient

os.environ.setdefault("AI_PROVIDER", "local")

from main import app


client = TestClient(app)


def test_root_health():
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert body.get("status")


def test_readiness_health():
    response = client.get("/health/ready")
    assert response.status_code == 200
    body = response.json()
    assert "ready" in body
    assert "database" in body


def test_furniture_endpoint_available():
    response = client.get("/furniture")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_video_upload_is_supported():
    files = {"file": ("room_scan.webm", b"not-a-real-video", "video/webm")}
    data = {"style_theme": "Modern", "lang": "en"}

    response = client.post("/upload/1", files=files, data=data)
    assert response.status_code == 200

    payload = response.json()
    assert payload.get("image_path", "").endswith(".webm")
    assert isinstance(payload.get("ai_output"), dict)

def test_one_tap_purchase_returns_invoice():
    files = {"file": ("room_scan.webm", b"not-a-real-video", "video/webm")}
    data = {"style_theme": "Modern", "lang": "en"}

    upload = client.post("/upload/1", files=files, data=data)
    assert upload.status_code == 200
    design_id = upload.json()["id"]

    purchase = client.post(f"/purchase/one-tap/{design_id}")
    assert purchase.status_code == 200
    payload = purchase.json()
    assert "invoice_id" in payload
    assert "total_amount" in payload
