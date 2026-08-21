import pytest
from datetime import datetime, timezone, timedelta
from app.risk_engine.decay import calculate_recency_decay
from app.risk_engine.confidence import calculate_confidence_score
from app.risk_engine.factors import (
    calculate_time_factor,
    calculate_lighting_factor,
    calculate_recent_reports_factor,
    calculate_crime_factor
)
from app.risk_engine.weights import get_effective_weights
from app.risk_engine.calculator import calculate_segment_risk, aggregate_route_risk

def test_risk_score_range():
    """Risk scores must always clamp between 0.0 and 100.0 under extreme conditions."""
    dummy_seg = {
        "id": "SEG-TEST",
        "name": "Test Highway",
        "length_meters": 500.0,
        "street_lighting": 0.0,
        "pedestrian_infrastructure": 0.0,
        "isolation_score": 1.0,
        "traffic_density": 1.0,
        "accessibility_score": 0.0,
        "historical_crime_count": 50,
        "accident_count": 20,
        "geometry": {"type": "LineString", "coordinates": [[-122.4, 37.7], [-122.41, 37.71]]}
    }
    extreme_incidents = [{"id": f"INC-{i}", "category": "PHYSICAL_ASSAULT", "severity": "CRITICAL"} for i in range(25)]
    extreme_reports = [{"id": f"REP-{i}", "category": "Harassment", "severity": "CRITICAL", "status": "VERIFIED", "reliability": 1.0} for i in range(15)]

    res = calculate_segment_risk(
        segment=dummy_seg,
        incidents=extreme_incidents,
        reports=extreme_reports,
        dist_to_police=5000.0,
        dist_to_hospital=5000.0,
        hour=2.0, # late night peak
        profile="WOMAN",
        mode="WALKING"
    )

    assert 0.0 <= res["risk_score"] <= 100.0
    assert res["risk_score"] >= 80.0 # Extreme hazards should result in High Risk
    assert res["risk_grade"] == "HIGH_RISK"
    assert res["risk_color"] == "#EF4444"

def test_missing_data_reduces_confidence():
    """Uncertainty principle: missing data must lower confidence, NEVER mark area safe."""
    full_data_conf = calculate_confidence_score(
        incident_count=10,
        recent_reports_count=5,
        has_lighting_data=True,
        has_infra_data=True,
        has_emergency_data=True
    )

    missing_data_conf = calculate_confidence_score(
        incident_count=0,
        recent_reports_count=0,
        has_lighting_data=False,
        has_infra_data=False,
        has_emergency_data=False,
        has_sufficient_spatial_samples=False
    )

    assert full_data_conf["confidence_score"] > missing_data_conf["confidence_score"]
    assert missing_data_conf["is_limited_data"] is True
    assert "Limited Safety Data Available" in missing_data_conf["label"]

def test_recent_report_has_higher_weight_and_decays():
    """Recent reports must carry greater impact than older decayed reports."""
    now = datetime.now(timezone.utc)
    fresh_time = now - timedelta(hours=2)
    old_time = now - timedelta(days=25)

    fresh_decay = calculate_recency_decay(fresh_time, now, decay_lambda=0.08)
    old_decay = calculate_recency_decay(old_time, now, decay_lambda=0.08)

    assert fresh_decay > 0.90
    assert old_decay < 0.20

    fresh_report = [{"category": "Harassment", "severity": "HIGH", "status": "VERIFIED", "reliability": 1.0, "created_at": fresh_time.isoformat()}]
    old_report = [{"category": "Harassment", "severity": "HIGH", "status": "VERIFIED", "reliability": 1.0, "created_at": old_time.isoformat()}]

    fresh_factor = calculate_recent_reports_factor(fresh_report, ref_time=now)
    old_factor = calculate_recent_reports_factor(old_report, ref_time=now)

    assert fresh_factor > old_factor

def test_time_of_day_diurnal_curve():
    """Late night (23:00 to 03:00) must have significantly higher risk factor than afternoon (14:00)."""
    night_risk = calculate_time_factor(23.5)
    day_risk = calculate_time_factor(14.0)

    assert night_risk > day_risk
    assert night_risk >= 0.70
    assert day_risk <= 0.25

def test_high_risk_segment_affects_route_aggregation():
    """Non-linear penalty must prevent hiding 1 dangerous alley among safe segments."""
    safe_seg = {
        "segment_id": "SEG-SAFE",
        "length_meters": 500.0,
        "risk_score": 15.0,
        "confidence_score": 90.0,
        "factors": [],
        "positives": ["Good lighting"],
        "warnings": []
    }
    dangerous_seg = {
        "segment_id": "SEG-DANGER",
        "length_meters": 100.0, # short segment
        "risk_score": 90.0,
        "confidence_score": 85.0,
        "factors": [],
        "positives": [],
        "warnings": ["Severe hazard alert"]
    }

    # 4 safe segments + 1 dangerous segment
    route_with_danger = [safe_seg, safe_seg, safe_seg, safe_seg, dangerous_danger := dangerous_seg]
    agg_with_danger = aggregate_route_risk(route_with_danger, gamma_penalty=0.25)

    # Linear mean would be (4*15 + 90)/5 = 30.
    # Non-linear penalty should elevate risk score significantly above linear mean!
    linear_mean = (4 * 15.0 * 500.0 + 90.0 * 100.0) / (4 * 500.0 + 100.0)
    assert agg_with_danger["risk_score"] > linear_mean
    assert "Severe hazard alert" in agg_with_danger["warnings"]

def test_profile_weight_customization():
    """Custom user profiles must dynamically tune risk factor sensitivities."""
    general_w = get_effective_weights("GENERAL", "WALKING")
    woman_w = get_effective_weights("WOMAN", "WALKING")
    access_w = get_effective_weights("ACCESSIBILITY", "ACCESSIBILITY")

    # Woman profile elevates lighting and isolation sensitivity
    assert woman_w["street_lighting"] > general_w["street_lighting"]
    assert woman_w["crowd_isolation"] > general_w["crowd_isolation"]

    # Accessibility profile elevates infrastructure sensitivity
    assert access_w["infrastructure"] > general_w["infrastructure"]
