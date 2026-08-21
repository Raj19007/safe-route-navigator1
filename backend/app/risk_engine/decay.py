import math
from datetime import datetime, timezone
from typing import Union

def calculate_recency_decay(
    event_time: Union[datetime, str],
    reference_time: Union[datetime, str, None] = None,
    decay_lambda: float = 0.08
) -> float:
    """
    Calculates exponential recency decay factor:
    decay_factor = exp(-lambda * delta_days)
    
    Returns a float in range (0.0, 1.0] where 1.0 is immediate and decays over time.
    With default lambda = 0.08:
    - 0 days ago: 1.00 (100% impact)
    - 3 days ago: 0.79 (79% impact)
    - 7 days ago: 0.57 (~half life)
    - 30 days ago: 0.09 (9% impact)
    - 90 days ago: 0.0007 (virtually 0)
    """
    if isinstance(event_time, str):
        event_time = datetime.fromisoformat(event_time.replace("Z", "+00:00"))
    
    if reference_time is None:
        reference_time = datetime.now(timezone.utc)
    elif isinstance(reference_time, str):
        reference_time = datetime.fromisoformat(reference_time.replace("Z", "+00:00"))
    
    # Ensure timezone awareness
    if event_time.tzinfo is None:
        event_time = event_time.replace(tzinfo=timezone.utc)
    if reference_time.tzinfo is None:
        reference_time = reference_time.replace(tzinfo=timezone.utc)
        
    delta_seconds = (reference_time - event_time).total_seconds()
    if delta_seconds < 0:
        delta_seconds = 0
        
    delta_days = delta_seconds / 86400.0
    decay_factor = math.exp(-decay_lambda * delta_days)
    
    return max(0.001, min(1.0, decay_factor))
