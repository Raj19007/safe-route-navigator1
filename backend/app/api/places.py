from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import SafePlace
from app.routing.graph import haversine_distance
from app.schemas.all_schemas import SafePlaceResponse

router = APIRouter(prefix="/places", tags=["Safe Places & Emergency Havens"])

@router.get("/safe", response_model=List[SafePlaceResponse])
def get_safe_places(
    category: Optional[str] = Query(None, description="police, hospital, pharmacy, safe_haven, fire_station"),
    lat: Optional[float] = Query(None, description="Current latitude for distance sorting"),
    lng: Optional[float] = Query(None, description="Current longitude for distance sorting"),
    limit: int = Query(50, description="Max places to return"),
    db: Session = Depends(get_db)
):
    query = db.query(SafePlace)
    if category:
        query = query.filter(SafePlace.category == category.lower())
    places = query.all()

    results = []
    for p in places:
        dist = None
        if lat is not None and lng is not None:
            dist = round(haversine_distance(lat, lng, p.latitude, p.longitude), 1)
        results.append(SafePlaceResponse(
            id=p.id,
            name=p.name,
            category=p.category,
            latitude=p.latitude,
            longitude=p.longitude,
            address=p.address,
            phone=p.phone,
            is_24_7=p.is_24_7,
            emergency_types=p.emergency_types or [],
            distance_meters=dist
        ))

    if lat is not None and lng is not None:
        results.sort(key=lambda x: x.distance_meters if x.distance_meters is not None else 999999)

    return results[:limit]
