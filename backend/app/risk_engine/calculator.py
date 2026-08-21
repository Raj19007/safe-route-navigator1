import math
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from app.risk_engine.weights import get_effective_weights
from app.risk_engine.factors import (
    calculate_crime_factor,
    calculate_recent_reports_factor,
    calculate_time_factor,
    calculate_lighting_factor,
    calculate_isolation_factor,
    calculate_infrastructure_factor,
    calculate_emergency_access_factor,
    calculate_accident_factor,
    calculate_weather_factor
)
from app.risk_engine.confidence import calculate_confidence_score
from app.risk_engine.explainer import explain_risk_factors

def calculate_segment_risk(
    segment: Dict[str, Any],
    incidents: List[Dict[str, Any]],
    reports: List[Dict[str, Any]],
    dist_to_police: float = 1200.0,
    dist_to_hospital: float = 1500.0,
    hour: float = 14.0,
    day_of_week: int = 2,
    profile: str = "GENERAL",
    mode: str = "WALKING",
    weather: str = "CLEAR",
    ref_time: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Evaluates safety risk for a single road segment.
    """
    weights = get_effective_weights(profile=profile, mode=mode)
    
    # 1. Compute individual normalized factor values [0.0 -> Safe, 1.0 -> Risky]
    inc_count = segment.get("historical_crime_count", len(incidents))
    high_sev_inc = sum(1 for inc in incidents if inc.get("severity") in ["HIGH", "CRITICAL"])
    f_crime = calculate_crime_factor(inc_count, high_sev_inc)

    f_reports = calculate_recent_reports_factor(reports, ref_time=ref_time)
    f_time = calculate_time_factor(hour, day_of_week)
    
    f_lighting = calculate_lighting_factor(segment.get("street_lighting", 0.5), hour=hour)
    f_isolation = calculate_isolation_factor(
        segment.get("isolation_score", 0.3),
        segment.get("traffic_density", 0.5),
        hour=hour
    )
    f_infra = calculate_infrastructure_factor(
        segment.get("pedestrian_infrastructure", 0.5),
        segment.get("accessibility_score", 0.5),
        mode=mode
    )
    f_emergency = calculate_emergency_access_factor(dist_to_police, dist_to_hospital)
    f_accident = calculate_accident_factor(
        segment.get("accident_count", 0),
        segment.get("traffic_density", 0.5)
    )
    f_weather = calculate_weather_factor(weather)

    normalized_factors = {
        "crime_history": f_crime,
        "recent_reports": f_reports,
        "time_of_day": f_time,
        "crowd_isolation": f_isolation,
        "street_lighting": f_lighting,
        "infrastructure": f_infra,
        "emergency_access": f_emergency,
        "accident_history": f_accident,
        "weather": f_weather
    }

    # 2. Weighted Sum Calculation
    raw_risk = sum(normalized_factors[k] * weights[k] for k in normalized_factors) * 100.0
    risk_score = round(max(0.0, min(100.0, raw_risk)), 1)

    # 3. Confidence Calculation
    confidence_data = calculate_confidence_score(
        incident_count=inc_count,
        recent_reports_count=len(reports),
        has_lighting_data=segment.get("street_lighting") is not None,
        has_infra_data=segment.get("pedestrian_infrastructure") is not None,
        has_emergency_data=True
    )

    # 4. Human-Readable Explanation
    explanation = explain_risk_factors(normalized_factors, weights, risk_score, confidence_data)

    # 5. Risk Category Color & Grade
    if risk_score <= 20.0:
        color = "#10B981" # Green
        grade = "VERY_SAFE"
        label = "Very Safe"
    elif risk_score <= 40.0:
        color = "#84CC16" # Light Green / Lime
        grade = "LOW_RISK"
        label = "Low Risk"
    elif risk_score <= 60.0:
        color = "#F59E0B" # Amber / Yellow
        grade = "MODERATE_RISK"
        label = "Moderate Risk"
    elif risk_score <= 80.0:
        color = "#F97316" # Orange
        grade = "ELEVATED_RISK"
        label = "Elevated Risk"
    else:
        color = "#EF4444" # Red
        grade = "HIGH_RISK"
        label = "High Risk"

    return {
        "segment_id": segment.get("id"),
        "name": segment.get("name"),
        "length_meters": segment.get("length_meters", 100.0),
        "risk_score": risk_score,
        "confidence_score": confidence_data["confidence_score"],
        "confidence_level": confidence_data["level"],
        "confidence_label": confidence_data["label"],
        "is_limited_data": confidence_data["is_limited_data"],
        "risk_grade": grade,
        "risk_label": label,
        "risk_color": color,
        "factors": explanation["factors"],
        "positives": explanation["positives"],
        "warnings": explanation["warnings"],
        "ai_explanation": explanation["ai_explanation"],
        "geometry": segment.get("geometry")
    }


def aggregate_route_risk(
    segment_evaluations: List[Dict[str, Any]],
    gamma_penalty: float = 0.25
) -> Dict[str, Any]:
    """
    Aggregates segment evaluations into an overall route risk score.
    Applies distance-weighted average PLUS a non-linear penalty for extreme high-risk segments
    so dangerous bottlenecks cannot be concealed by long safe stretches.
    """
    if not segment_evaluations:
        return {
            "risk_score": 50.0,
            "confidence_score": 30.0,
            "risk_grade": "UNKNOWN",
            "risk_color": "#6B7280",
            "risk_label": "Unknown / Limited Data",
            "segments": []
        }

    total_len = sum(s.get("length_meters", 100.0) for s in segment_evaluations)
    if total_len <= 0:
        total_len = 1.0

    # Distance-weighted average risk & confidence
    weighted_risk_sum = sum(
        s["risk_score"] * s.get("length_meters", 100.0)
        for s in segment_evaluations
    )
    mean_risk = weighted_risk_sum / total_len

    weighted_conf_sum = sum(
        s["confidence_score"] * s.get("length_meters", 100.0)
        for s in segment_evaluations
    )
    mean_confidence = weighted_conf_sum / total_len

    # Non-linear worst-segment penalty
    max_seg_risk = max(s["risk_score"] for s in segment_evaluations)
    min_seg_conf = min(s["confidence_score"] for s in segment_evaluations)
    
    risk_spike = max(0.0, max_seg_risk - mean_risk)
    final_risk = round(max(0.0, min(100.0, mean_risk + (gamma_penalty * risk_spike))), 1)
    
    # Low confidence segments pull down route confidence
    final_confidence = round(max(10.0, min(100.0, (mean_confidence * 0.8) + (min_seg_conf * 0.2))), 1)

    # Consolidated factors: aggregate weighted averages
    consolidated_factors_map: Dict[str, Dict[str, Any]] = {}
    for seg in segment_evaluations:
        seg_len = seg.get("length_meters", 100.0)
        for f in seg.get("factors", []):
            k = f["key"]
            if k not in consolidated_factors_map:
                consolidated_factors_map[k] = {
                    "key": k,
                    "name": f["name"],
                    "impact": f["impact"],
                    "description": f["description"],
                    "weighted_score": 0.0,
                    "weight": f["weight"],
                    "normalized_value": 0.0
                }
            consolidated_factors_map[k]["weighted_score"] += (f["weighted_score"] * seg_len) / total_len
            consolidated_factors_map[k]["normalized_value"] += (f["normalized_value"] * seg_len) / total_len

    factors_list = list(consolidated_factors_map.values())
    for f in factors_list:
        f["weighted_score"] = round(f["weighted_score"], 1)
        f["normalized_value"] = round(f["normalized_value"], 3)
        if f["normalized_value"] > 0.6:
            f["impact"] = "high"
        elif f["normalized_value"] > 0.35:
            f["impact"] = "medium"
        else:
            f["impact"] = "low"

    factors_list.sort(key=lambda x: x["weighted_score"], reverse=True)

    # Collect unique positives and warnings across segments
    positives = []
    warnings = []
    for s in segment_evaluations:
        for p in s.get("positives", []):
            if p not in positives and len(positives) < 4:
                positives.append(p)
        for w in s.get("warnings", []):
            if w not in warnings and len(warnings) < 4:
                warnings.append(w)

    if not warnings:
        warnings.append("Continuous safe road corridor")
    if not positives:
        positives.append("Satisfactory route characteristics")

    # Risk classification label & color
    if final_risk <= 20.0:
        color = "#10B981"
        grade = "VERY_SAFE"
        label = "Very Safe"
    elif final_risk <= 40.0:
        color = "#84CC16"
        grade = "LOW_RISK"
        label = "Low Risk"
    elif final_risk <= 60.0:
        color = "#F59E0B"
        grade = "MODERATE_RISK"
        label = "Moderate Risk"
    elif final_risk <= 80.0:
        color = "#F97316"
        grade = "ELEVATED_RISK"
        label = "Elevated Risk"
    else:
        color = "#EF4444"
        grade = "HIGH_RISK"
        label = "High Risk"

    # AI narrative synthesis
    if final_risk <= 30.0:
        ai_summary = f"Optimal safety corridor. Characterized by {positives[0].lower()}."
    elif final_risk <= 55.0:
        ai_summary = f"Balanced route profile with manageable risk. Note: {warnings[0].lower()}."
    else:
        ai_summary = f"Caution recommended along this route due to {warnings[0].lower()} and elevated risk on critical segments."

    return {
        "risk_score": final_risk,
        "confidence_score": final_confidence,
        "confidence_label": "High Confidence" if final_confidence >= 80 else "Moderate Confidence" if final_confidence >= 50 else "Limited Data Available",
        "is_limited_data": final_confidence < 50.0,
        "risk_grade": grade,
        "risk_label": label,
        "risk_color": color,
        "factors": factors_list,
        "positives": positives,
        "warnings": warnings,
        "ai_explanation": ai_summary,
        "segment_count": len(segment_evaluations),
        "total_distance_meters": round(total_len, 1)
    }
