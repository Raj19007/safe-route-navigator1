from typing import List, Dict, Any, Optional

def calculate_confidence_score(
    incident_count: int,
    recent_reports_count: int,
    has_lighting_data: bool = True,
    has_infra_data: bool = True,
    has_emergency_data: bool = True,
    avg_report_reliability: float = 0.8,
    data_freshness_days: float = 1.0,
    has_sufficient_spatial_samples: bool = True
) -> Dict[str, Any]:
    """
    Computes separate confidence / certainty score (0 - 100%).
    
    Principles:
    1. Sparse / missing data lowers confidence (never marks an area as safe).
    2. Verified reports & higher sample density increase confidence.
    3. Old or missing data introduces uncertainty penalties.
    """
    base_confidence = 45.0 # baseline urban topology confidence
    
    # 1. Historical data volume & density (up to +25)
    if incident_count >= 5:
        base_confidence += 20.0
    elif incident_count >= 2:
        base_confidence += 12.0
    elif incident_count >= 1:
        base_confidence += 6.0
    else:
        # Zero historical records = slight uncertainty penalty
        base_confidence -= 10.0

    # 2. Recent crowd reports & freshness (up to +20)
    if recent_reports_count >= 4:
        base_confidence += 18.0 * avg_report_reliability
    elif recent_reports_count >= 1:
        base_confidence += 10.0 * avg_report_reliability
    else:
        base_confidence -= 5.0

    # 3. Factor completeness (+15 total, penalty if missing)
    if not has_lighting_data:
        base_confidence -= 18.0
    else:
        base_confidence += 5.0
        
    if not has_infra_data:
        base_confidence -= 12.0
    else:
        base_confidence += 5.0

    if not has_emergency_data:
        base_confidence -= 8.0
    else:
        base_confidence += 5.0

    # 4. Spatial sample coverage
    if not has_sufficient_spatial_samples:
        base_confidence -= 20.0

    # 5. Data staleness penalty
    if data_freshness_days > 90:
        base_confidence -= 15.0
    elif data_freshness_days > 30:
        base_confidence -= 8.0

    confidence = round(max(15.0, min(98.0, base_confidence)), 1)
    
    # Generate human label
    if confidence >= 80.0:
        level = "HIGH"
        label = "High Confidence"
        description = "Extensive multi-source historical safety logs and recent verified observations available."
    elif confidence >= 50.0:
        level = "MODERATE"
        label = "Moderate Confidence"
        description = "Adequate municipal baseline and spatial data available."
    else:
        level = "LOW"
        label = "Limited Safety Data Available"
        description = "Sparse crowd reports and unverified segment attributes. Exercise standard vigilance."

    return {
        "confidence_score": confidence,
        "level": level,
        "label": label,
        "description": description,
        "is_limited_data": confidence < 50.0
    }
