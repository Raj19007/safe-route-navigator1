from typing import Dict

# Standard Base Weights (sum = 1.00)
BASE_WEIGHTS: Dict[str, float] = {
    "crime_history": 0.20,
    "recent_reports": 0.20,
    "time_of_day": 0.15,
    "crowd_isolation": 0.10,
    "street_lighting": 0.10,
    "infrastructure": 0.10,
    "emergency_access": 0.05,
    "accident_history": 0.05,
    "weather": 0.05,
}

# Profile Modulations
# Adjust factor sensitivity based on user profile
PROFILE_MODIFIERS: Dict[str, Dict[str, float]] = {
    "GENERAL": {
        "crime_history": 1.0,
        "recent_reports": 1.0,
        "time_of_day": 1.0,
        "crowd_isolation": 1.0,
        "street_lighting": 1.0,
        "infrastructure": 1.0,
        "emergency_access": 1.0,
        "accident_history": 1.0,
        "weather": 1.0,
    },
    "WOMAN": {
        # Increased sensitivity to lighting, isolation, recent harassment reports, and time of day
        "crime_history": 1.1,
        "recent_reports": 1.3,
        "time_of_day": 1.25,
        "crowd_isolation": 1.35,
        "street_lighting": 1.4,
        "infrastructure": 0.9,
        "emergency_access": 1.2,
        "accident_history": 0.8,
        "weather": 0.9,
    },
    "CHILD_GUARDIAN": {
        # High emphasis on traffic safety, sidewalks, lighting, and safe surroundings
        "crime_history": 1.2,
        "recent_reports": 1.2,
        "time_of_day": 1.1,
        "crowd_isolation": 1.2,
        "street_lighting": 1.2,
        "infrastructure": 1.4,
        "emergency_access": 1.3,
        "accident_history": 1.4,
        "weather": 1.1,
    },
    "ELDERLY": {
        # High emphasis on infrastructure quality, smooth footing, emergency proximity, lighting
        "crime_history": 1.0,
        "recent_reports": 1.1,
        "time_of_day": 1.1,
        "crowd_isolation": 1.15,
        "street_lighting": 1.3,
        "infrastructure": 1.5,
        "emergency_access": 1.4,
        "accident_history": 1.1,
        "weather": 1.2,
    },
    "ACCESSIBILITY": {
        # Maximum emphasis on infrastructure, smooth ramps, pedestrian paths, emergency access
        "crime_history": 0.8,
        "recent_reports": 1.0,
        "time_of_day": 0.9,
        "crowd_isolation": 1.1,
        "street_lighting": 1.2,
        "infrastructure": 1.8,
        "emergency_access": 1.4,
        "accident_history": 1.0,
        "weather": 1.2,
    }
}

# Travel Mode Modulations
MODE_MODIFIERS: Dict[str, Dict[str, float]] = {
    "WALKING": {
        "street_lighting": 1.3,
        "crowd_isolation": 1.3,
        "infrastructure": 1.2,
        "accident_history": 0.8,
        "time_of_day": 1.2,
    },
    "CYCLING": {
        "street_lighting": 1.1,
        "crowd_isolation": 0.9,
        "infrastructure": 1.4,
        "accident_history": 1.4,
        "time_of_day": 1.0,
    },
    "DRIVING": {
        "street_lighting": 0.7,
        "crowd_isolation": 0.6,
        "infrastructure": 0.9,
        "accident_history": 1.5,
        "emergency_access": 1.2,
        "time_of_day": 0.8,
    },
    "ACCESSIBILITY": {
        "street_lighting": 1.2,
        "crowd_isolation": 1.1,
        "infrastructure": 2.0,
        "accident_history": 1.1,
        "emergency_access": 1.3,
    }
}

def get_effective_weights(profile: str = "GENERAL", mode: str = "WALKING") -> Dict[str, float]:
    """
    Computes normalized factor weights for a given user profile and travel mode.
    Total weights are normalized so that sum(weights) == 1.00.
    """
    profile_key = profile.upper() if profile.upper() in PROFILE_MODIFIERS else "GENERAL"
    mode_key = mode.upper() if mode.upper() in MODE_MODIFIERS else "WALKING"

    p_mods = PROFILE_MODIFIERS[profile_key]
    m_mods = MODE_MODIFIERS[mode_key]

    raw_weights = {}
    for factor, base_w in BASE_WEIGHTS.items():
        p_mod = p_mods.get(factor, 1.0)
        m_mod = m_mods.get(factor, 1.0)
        raw_weights[factor] = base_w * p_mod * m_mod

    total = sum(raw_weights.values())
    if total <= 0:
        return BASE_WEIGHTS.copy()

    # Normalize so sum is exactly 1.0
    return {k: v / total for k, v in raw_weights.items()}
