from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.safety_service import get_safety_map_data

router = APIRouter(prefix="/risk", tags=["Safety Map & Risk Telemetry"])

@router.get("/safety-map")
def get_safety_map(
    hour: Optional[float] = Query(None, description="Time of day as float (0.0 - 23.99)"),
    user_profile: str = Query("GENERAL", description="User profile"),
    travel_mode: str = Query("WALKING", description="Travel mode"),
    db: Session = Depends(get_db)
):
    """
    Returns full municipal safety topology including all evaluated road segments with risk color coding,
    recent crowd reports, historical incident hotspots, and emergency safe places.
    """
    try:
        return get_safety_map_data(
            db=db,
            hour=hour,
            user_profile=user_profile,
            travel_mode=travel_mode
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate safety map topology: {str(e)}"
        )
