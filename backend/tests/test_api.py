import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Safe Route Navigator" in data["service"]

def test_preset_routes(client):
    response = client.get("/api/routes/presets")
    assert response.status_code == 200
    presets = response.json()
    assert len(presets) >= 3
    assert any("College" in p["title"] for p in presets)

def test_calculate_routes(client):
    payload = {
        "origin_lat": 37.7880,
        "origin_lng": -122.4075,
        "dest_lat": 37.7650,
        "dest_lng": -122.4150,
        "user_profile": "WOMAN",
        "travel_mode": "WALKING",
        "hour": 23.5 # 11:30 PM
    }
    response = client.post("/api/routes/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "routes" in data
    assert len(data["routes"]) == 3
    route_types = [r["route_type"] for r in data["routes"]]
    assert "FASTEST" in route_types
    assert "BALANCED" in route_types
    assert "SAFEST" in route_types
    
    # Must have recommended route
    assert any(r["is_recommended"] for r in data["routes"])
    
    # Each route must have explainability and segments
    for r in data["routes"]:
        assert 0.0 <= r["risk_score"] <= 100.0
        assert 0.0 <= r["confidence_score"] <= 100.0
        assert len(r["factors"]) > 0
        assert len(r["segments"]) > 0

def test_submit_crowd_report_and_clustering(client):
    report_data = {
        "category": "Poor Lighting",
        "severity": "HIGH",
        "description": "Broken overhead lamp creating dark alley corner",
        "latitude": 37.7790,
        "longitude": -122.4120,
        "is_anonymous": True
    }
    # Submit first report
    res1 = client.post("/api/reports", json=report_data)
    assert res1.status_code == 201
    rep1 = res1.json()
    assert rep1["category"] == "Poor Lighting"
    assert rep1["severity"] == "HIGH"

    # Submit second report in same location (duplicate clustering)
    res2 = client.post("/api/reports", json=report_data)
    assert res2.status_code == 201
    rep2 = res2.json()
    # Clustering should have matched existing report and increased upvotes
    assert rep2["id"] == rep1["id"]
    assert rep2["upvotes"] >= 2

def test_safety_map_endpoint(client):
    response = client.get("/api/risk/safety-map?hour=14.0&user_profile=GENERAL&travel_mode=WALKING")
    assert response.status_code == 200
    data = response.json()
    assert "segments" in data
    assert "incidents" in data
    assert "reports" in data
    assert "safe_places" in data
    assert len(data["segments"]) > 0

def test_safe_places_endpoint(client):
    response = client.get("/api/places/safe?category=police&lat=37.775&lng=-122.419")
    assert response.status_code == 200
    places = response.json()
    assert len(places) > 0
    assert all(p["category"] == "police" for p in places)
    # Sorted by distance
    if len(places) > 1:
        assert places[0]["distance_meters"] <= places[1]["distance_meters"]

def test_admin_dashboard_endpoint(client):
    response = client.get("/api/admin/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "total_reports" in data
    assert "high_risk_segments_count" in data
    assert "avg_system_confidence" in data
