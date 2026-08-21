from typing import Dict, List, Any

FACTOR_METADATA = {
    "crime_history": {
        "title": "Crime History",
        "low_desc": "Low incident frequency in municipal records",
        "med_desc": "Moderate historical incidents logged",
        "high_desc": "Elevated historical crime density reported",
        "positive": "Low historical incident rate in this sector",
        "warning": "Sector has elevated historical incident logs"
    },
    "recent_reports": {
        "title": "Recent Crowd Reports",
        "low_desc": "No recent hazards or disturbances reported",
        "med_desc": "Recent minor hazard or caution alert logged nearby",
        "high_desc": "Multiple active recent community alerts in vicinity",
        "positive": "Zero active hazard reports in the last 72 hours",
        "warning": "Recent crowd-sourced hazard alerts in this vicinity"
    },
    "time_of_day": {
        "title": "Time of Day",
        "low_desc": "Broad daylight hours with maximum visibility",
        "med_desc": "Dusk / evening transition period",
        "high_desc": "Late-night / early hours (reduced ambient visibility)",
        "positive": "Peak daytime visibility and natural crowd presence",
        "warning": "Late night hours increase vulnerability"
    },
    "street_lighting": {
        "title": "Street Lighting",
        "low_desc": "Well-lit roadway with consistent illumination",
        "med_desc": "Partial or intermittent street lighting",
        "high_desc": "Poor / broken street lights and dark corridors",
        "positive": "Bright, continuous street illumination",
        "warning": "Dimly lit or unlit street segments"
    },
    "crowd_isolation": {
        "title": "Crowd & Isolation",
        "low_desc": "Active pedestrian presence and open establishments",
        "med_desc": "Moderate activity with quiet stretches",
        "high_desc": "Deserted / isolated area with minimal bystander presence",
        "positive": "Active pedestrian activity and high 'eyes on the street'",
        "warning": "Secluded stretch with low bystander visibility"
    },
    "infrastructure": {
        "title": "Pedestrian Infrastructure",
        "low_desc": "Wide sidewalks, clear crossings, and ramps",
        "med_desc": "Standard sidewalks with occasional obstructions",
        "high_desc": "Poor sidewalks or forced walking on vehicle lane",
        "positive": "Dedicated pedestrian sidewalks and clear crosswalks",
        "warning": "Substandard walkways or construction bottlenecks"
    },
    "emergency_access": {
        "title": "Emergency Access",
        "low_desc": "Within rapid reach of police or medical facility",
        "med_desc": "Standard emergency vehicle response radius",
        "high_desc": "Distance to nearest emergency station is over 2.5 km",
        "positive": "Proximity to emergency response station (< 500m)",
        "warning": "Extended distance from immediate emergency posts"
    },
    "accident_history": {
        "title": "Traffic & Accidents",
        "low_desc": "Calm traffic flow with low accident rate",
        "med_desc": "Moderate traffic volume and intersection crossings",
        "high_desc": "Heavy vehicle traffic or high collision hotspot",
        "positive": "Calm, speed-restricted road environment",
        "warning": "High-traffic intersection or accident hotspot"
    },
    "weather": {
        "title": "Weather Conditions",
        "low_desc": "Clear visibility and dry ground",
        "med_desc": "Overcast or light precipitation",
        "high_desc": "Heavy rain, storm, or fog causing slick surfaces",
        "positive": "Clear, dry weather conditions",
        "warning": "Inclement weather reducing footing and visibility"
    }
}

def explain_risk_factors(
    normalized_factors: Dict[str, float],
    weights: Dict[str, float],
    risk_score: float,
    confidence_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Produces transparent, explainable factor breakdown and natural language AI summary.
    """
    factor_list = []
    positives = []
    warnings = []

    for factor_key, norm_val in normalized_factors.items():
        weight = weights.get(factor_key, 0.1)
        weighted_contribution = norm_val * weight * 100.0
        meta = FACTOR_METADATA.get(factor_key, {
            "title": factor_key.replace("_", " ").title(),
            "low_desc": "Favorable safety condition",
            "med_desc": "Moderate safety condition",
            "high_desc": "Elevated risk condition",
            "positive": f"Good {factor_key.replace('_', ' ')}",
            "warning": f"Elevated {factor_key.replace('_', ' ')} risk"
        })

        if norm_val <= 0.30:
            impact = "low"
            desc = meta["low_desc"]
            if weight >= 0.10 and len(positives) < 3:
                positives.append(meta["positive"])
        elif norm_val <= 0.60:
            impact = "medium"
            desc = meta["med_desc"]
        else:
            impact = "high" if norm_val <= 0.80 else "critical"
            desc = meta["high_desc"]
            if len(warnings) < 3:
                warnings.append(meta["warning"])

        factor_list.append({
            "key": factor_key,
            "name": meta["title"],
            "normalized_value": round(norm_val, 3),
            "weight": round(weight, 3),
            "weighted_score": round(weighted_contribution, 1),
            "impact": impact,
            "description": desc
        })

    # Sort factors by weighted contribution descending
    factor_list.sort(key=lambda x: x["weighted_score"], reverse=True)

    # If no warnings, add default clean status
    if not warnings:
        warnings.append("No critical hazard alerts active along this route")
    if not positives:
        positives.append("Standard urban route characteristics")

    # Generate synthesized natural language breakdown
    if risk_score <= 25:
        summary_grade = "Low Risk / High Safety"
        summary_text = f"This route maintains excellent safety indicators with {positives[0].lower()}."
    elif risk_score <= 50:
        summary_grade = "Moderate / Balanced Risk"
        summary_text = f"This route offers a balanced travel profile. Caution advised regarding {warnings[0].lower()}."
    elif risk_score <= 75:
        summary_grade = "Elevated Risk"
        summary_text = f"Elevated caution required due to {warnings[0].lower()}. Consider alternative well-lit arterial avenues."
    else:
        summary_grade = "High Risk"
        summary_text = f"High estimated risk score driven by {warnings[0].lower()} and low ambient safety factors."

    if confidence_data.get("is_limited_data"):
        summary_text += " Note: Limited community data available for segments of this corridor."

    return {
        "factors": factor_list,
        "positives": positives,
        "warnings": warnings,
        "summary_grade": summary_grade,
        "ai_explanation": summary_text
    }
