import traceback
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import User
from app.schemas.all_schemas import RouteRequest, RouteResponse, PresetRoute
from app.services.safety_service import calculate_routes_service
from app.services.auth_service import get_current_user_optional
from app.routing.router import PRESET_ROUTES

router = APIRouter(prefix="/routes", tags=["Routing & Risk Assessment"])

@router.post("/calculate", response_model=RouteResponse)
def calculate_routes(
    request: RouteRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    try:
        user_id = current_user.id if current_user else None
        return calculate_routes_service(db, request, user_id=user_id)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Route calculation error: {str(e)}"
        )

@router.get("/presets", response_model=List[PresetRoute])
def get_preset_routes():
    return PRESET_ROUTES
