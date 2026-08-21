import math
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.risk_engine.decay import calculate_recency_decay

SEVERITY_WEIGHTS = {
    "LOW": 0.25,
    "MEDIUM": 0.55,
    "HIGH": 0.85,
    "CRITICAL": 1.00
}

USER_RELIABILITY = {
    "new": 0.5,
    "regular": 0.8,
    "verified": 1.0
}

def calculate_time_factor(hour: float, day_of_week: int = 0) -> float:
    """
    Computes normalized time risk (0.0 to 1.0) based on diurnal cycle and weekend effect.
    Peaks around 00:00 - 03:30 (late night / early hours).
    Low point around 11:00 - 15:00 (broad daylight).
    """
    # Base diurnal mathematical curve: cosine oscillation with peak at 02:00
    # Peak at 2.0 hrs, valley at 14.0 hrs
    rad = ((hour - 2.0) % 24) * (2 * math.pi / 24)
    base_curve = 0.5 + 0.45 * math.cos(rad) # oscillates between 0.05 and 0.95
    
    # Weekend night bump (Friday/Saturday nights)
    is_weekend_night = (day_of_week in [4, 5] and (hour >= 21 or hour <= 4))
    if is_weekend_night:
        base_curve = min(1.0, base_curve * 1.15)
        
    return round(max(0.05, min(1.0, base_curve)), 3)

def calculate_crime_factor(incident_count: int, high_sev_count: int = 0) -> float:
    """
    Normalized crime history score (0.0 to 1.0) with logarithmic diminishing returns.
    0 incidents -> 0.05 (baseline urban noise)
    2 incidents -> 0.25
    5 incidents -> 0.55
    12+ incidents -> 0.85+
    """
    weighted_count = incident_count + (high_sev_count * 1.5)
    if weighted_count <= 0:
        return 0.05
    score = 1.0 - math.exp(-0.15 * weighted_count)
    return round(max(0.05, min(1.0, score)), 3)

def calculate_recent_reports_factor(
    reports: List[Dict[str, Any]], 
    ref_time: Optional[datetime] = None,
    decay_lambda: float = 0.08
) -> float:
    """
    Computes aggregate recent reports risk factor (0.0 to 1.0).
    Applies:
    1. Recency exponential decay: exp(-lambda * delta_days)
    2. Reporter reliability weighting (0.5 to 1.0)
    3. Severity weight (LOW=0.25 to CRITICAL=1.0)
    4. Sub-linear aggregation to prevent duplicate report flooding
    """
    if not reports:
        return 0.02
        
    total_weighted_impact = 0.0
    for rep in reports:
        # Check report status (ignore rejected)
        status = rep.get("status", "PENDING")
        if status == "REJECTED":
            continue
            
        sev = rep.get("severity", "MEDIUM")
        sev_weight = SEVERITY_WEIGHTS.get(sev, 0.5)
        
        rel = rep.get("reliability", 0.5)
        created_at = rep.get("created_at")
        
        decay = calculate_recency_decay(created_at, ref_time, decay_lambda) if created_at else 0.8
        
        # Report impact = severity * reliability * recency
        rep_impact = sev_weight * rel * decay
        total_weighted_impact += rep_impact

    # Diminishing returns scaling: 1.0 - exp(-0.6 * sum)
    score = 1.0 - math.exp(-0.65 * total_weighted_impact)
    return round(max(0.02, min(1.0, score)), 3)

def calculate_lighting_factor(street_lighting: float, hour: Optional[float] = None) -> float:
    """
    street_lighting: 1.0 = brightly lit LED lamps, 0.0 = dark alley
    Inverts so that 0.0 = Safe (bright), 1.0 = Risky (dark).
    If daytime (08:00 - 17:30), daylight significantly mitigates bad street lighting.
    """
    darkness = max(0.0, min(1.0, 1.0 - street_lighting))
    if hour is not None:
        if 8.0 <= hour <= 17.5:
            # Daytime: natural sun mitigates lighting deficiency
            darkness *= 0.25
        elif 17.5 < hour < 20.0 or 6.0 <= hour < 8.0:
            # Twilight
            darkness *= 0.70
    return round(darkness, 3)

def calculate_isolation_factor(isolation_score: float, traffic_density: float, hour: Optional[float] = None) -> float:
    """
    High isolation + low pedestrian/traffic density = high isolation risk.
    Deserted streets late at night have amplified isolation risk.
    """
    # isolation_score is 1.0 for secluded alleys, 0.0 for bustling pedestrian plazas
    density_modifier = max(0.1, 1.0 - (traffic_density * 0.7))
    raw_iso = isolation_score * density_modifier
    
    if hour is not None and (hour >= 22 or hour <= 5):
        raw_iso = min(1.0, raw_iso * 1.3)
        
    return round(max(0.05, min(1.0, raw_iso)), 3)

def calculate_infrastructure_factor(
    pedestrian_infra: float,
    accessibility_score: float,
    mode: str = "WALKING"
) -> float:
    """
    Inverted score: 0.0 = excellent infrastructure, 1.0 = hazardous / broken / no sidewalks.
    """
    if mode.upper() == "ACCESSIBILITY":
        base_infra = accessibility_score
    else:
        base_infra = (pedestrian_infra * 0.7) + (accessibility_score * 0.3)
        
    infra_risk = max(0.05, min(1.0, 1.0 - base_infra))
    return round(infra_risk, 3)

def calculate_emergency_access_factor(dist_to_police_m: float, dist_to_hospital_m: float) -> float:
    """
    Proximity to emergency response points (police stations, hospitals).
    < 300m -> 0.05 (Immediate proximity)
    1000m -> 0.35
    2500m+ -> 0.85+
    """
    min_dist = min(dist_to_police_m, dist_to_hospital_m)
    # Log scale normalized up to 3000m
    score = min_dist / 3000.0
    return round(max(0.05, min(1.0, score)), 3)

def calculate_accident_factor(accident_count: int, traffic_density: float) -> float:
    """
    Risk of vehicular and pedestrian collisions.
    """
    raw = (accident_count * 0.15) + (traffic_density * 0.35)
    return round(max(0.05, min(1.0, raw)), 3)

def calculate_weather_factor(condition: str = "CLEAR") -> float:
    """
    Adverse weather hazard factor (reduced visibility, slick road).
    """
    weather_map = {
        "CLEAR": 0.05,
        "CLOUDY": 0.15,
        "RAIN": 0.45,
        "HEAVY_RAIN": 0.75,
        "STORM": 0.90,
        "FOG": 0.60,
        "SNOW": 0.80
    }
    return weather_map.get(condition.upper(), 0.10)
