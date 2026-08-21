from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from app.database.models import RoadSegment, Incident, Report, SafePlace, RouteLog
from app.routing.graph import network_graph, haversine_distance
from app.routing.router import generate_multi_alternative_routes
from app.risk_engine.calculator import calculate_segment_risk
from app.schemas.all_schemas import RouteRequest, RouteResponse, SegmentDetail

def ensure_graph_initialized(db: Session):
    """
    Initializes graph in memory if not loaded.
    """
    if not network_graph.segments_by_id:
        segments = db.query(RoadSegment).all()
        seg_dicts = []
        for s in segments:
            seg_dicts.append({
                "id": s.id,
                "name": s.name,
                "road_type": s.road_type,
                "start_node": s.start_node,
                "end_node": s.end_node,
                "length_meters": s.length_meters,
                "speed_limit_kmh": s.speed_limit_kmh,
                "street_lighting": s.street_lighting,
                "pedestrian_infrastructure": s.pedestrian_infrastructure,
                "isolation_score": s.isolation_score,
                "traffic_density": s.traffic_density,
                "accessibility_score": s.accessibility_score,
                "historical_crime_count": s.historical_crime_count,
                "accident_count": s.accident_count,
                "geometry": s.geometry
            })
        network_graph.load_segments(seg_dicts)

def calculate_routes_service(
    db: Session,
    request: RouteRequest,
    user_id: Optional[str] = None
) -> RouteResponse:
    ensure_graph_initialized(db)
    
    # 1. Fetch all incidents grouped by segment
    incidents = db.query(Incident).all()
    incidents_by_seg: Dict[str, List[Dict[str, Any]]] = {}
    for inc in incidents:
        sid = inc.segment_id or "UNKNOWN"
        if sid not in incidents_by_seg:
            incidents_by_seg[sid] = []
        incidents_by_seg[sid].append({
            "id": inc.id,
            "category": inc.category,
            "severity": inc.severity,
            "occurred_at": inc.occurred_at
        })

    # 2. Fetch all reports grouped by segment (ignore rejected)
    reports = db.query(Report).filter(Report.status != "REJECTED").all()
    reports_by_seg: Dict[str, List[Dict[str, Any]]] = {}
    for rep in reports:
        sid = rep.segment_id or "UNKNOWN"
        if sid not in reports_by_seg:
            reports_by_seg[sid] = []
        reports_by_seg[sid].append({
            "id": rep.id,
            "category": rep.category,
            "severity": rep.severity,
            "status": rep.status,
            "reliability": rep.reliability,
            "created_at": rep.created_at
        })

    # 3. Fetch safe places
    places = db.query(SafePlace).all()
    places_list = [
        {
            "id": p.id,
            "name": p.name,
            "category": p.category,
            "latitude": p.latitude,
            "longitude": p.longitude
        }
        for p in places
    ]

    # Current simulated hour
    hour = request.hour
    if hour is None:
        now = datetime.now(timezone.utc)
        hour = now.hour + (now.minute / 60.0)

    # 4. Generate multi-alternative routes
    response = generate_multi_alternative_routes(
        origin_lat=request.origin_lat,
        origin_lng=request.origin_lng,
        dest_lat=request.dest_lat,
        dest_lng=request.dest_lng,
        incidents_by_segment=incidents_by_seg,
        reports_by_segment=reports_by_seg,
        safe_places=places_list,
        user_profile=request.user_profile,
        travel_mode=request.travel_mode,
        hour=hour,
        day_of_week=request.day_of_week or 2,
        weather=request.weather or "CLEAR"
    )

    # Log route query for admin analytics
    recommended = next((r for r in response.routes if r.is_recommended), response.routes[0])
    log = RouteLog(
        id=f"LOG-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')[:18]}",
        user_id=user_id,
        origin_lat=request.origin_lat,
        origin_lng=request.origin_lng,
        dest_lat=request.dest_lat,
        dest_lng=request.dest_lng,
        travel_mode=request.travel_mode,
        user_profile=request.user_profile,
        selected_route_type=recommended.route_type,
        risk_score=recommended.risk_score,
        confidence_score=recommended.confidence_score
    )
    try:
        db.add(log)
        db.commit()
    except Exception:
        db.rollback()

    return response

def get_safety_map_data(
    db: Session,
    hour: Optional[float] = None,
    user_profile: str = "GENERAL",
    travel_mode: str = "WALKING"
) -> Dict[str, Any]:
    ensure_graph_initialized(db)
    
    if hour is None:
        now = datetime.now(timezone.utc)
        hour = now.hour + (now.minute / 60.0)

    incidents = db.query(Incident).all()
    incidents_by_seg: Dict[str, List[Dict[str, Any]]] = {}
    for inc in incidents:
        sid = inc.segment_id or "UNKNOWN"
        if sid not in incidents_by_seg:
            incidents_by_seg[sid] = []
        incidents_by_seg[sid].append({"id": inc.id, "category": inc.category, "severity": inc.severity, "occurred_at": inc.occurred_at})

    reports = db.query(Report).filter(Report.status != "REJECTED").all()
    reports_by_seg: Dict[str, List[Dict[str, Any]]] = {}
    for rep in reports:
        sid = rep.segment_id or "UNKNOWN"
        if sid not in reports_by_seg:
            reports_by_seg[sid] = []
        reports_by_seg[sid].append({"id": rep.id, "category": rep.category, "severity": rep.severity, "status": rep.status, "reliability": rep.reliability, "created_at": rep.created_at})

    safe_places = db.query(SafePlace).all()
    segments = db.query(RoadSegment).all()

    evaluated_segments = []
    for s in segments:
        seg_dict = {
            "id": s.id,
            "name": s.name,
            "road_type": s.road_type,
            "length_meters": s.length_meters,
            "street_lighting": s.street_lighting,
            "pedestrian_infrastructure": s.pedestrian_infrastructure,
            "isolation_score": s.isolation_score,
            "traffic_density": s.traffic_density,
            "accessibility_score": s.accessibility_score,
            "historical_crime_count": s.historical_crime_count,
            "accident_count": s.accident_count,
            "geometry": s.geometry
        }
        res = calculate_segment_risk(
            segment=seg_dict,
            incidents=incidents_by_seg.get(s.id, []),
            reports=reports_by_seg.get(s.id, []),
            dist_to_police=1000.0,
            dist_to_hospital=1500.0,
            hour=hour,
            profile=user_profile,
            mode=travel_mode
        )
        evaluated_segments.append(res)

    return {
        "segments": evaluated_segments,
        "incidents": [
            {
                "id": inc.id,
                "category": inc.category,
                "severity": inc.severity,
                "title": inc.title,
                "description": inc.description,
                "latitude": inc.latitude,
                "longitude": inc.longitude,
                "occurred_at": inc.occurred_at.isoformat() if inc.occurred_at else None
            }
            for inc in incidents[:120]
        ],
        "reports": [
            {
                "id": rep.id,
                "category": rep.category,
                "severity": rep.severity,
                "description": rep.description,
                "latitude": rep.latitude,
                "longitude": rep.longitude,
                "status": rep.status,
                "reliability": rep.reliability,
                "created_at": rep.created_at.isoformat() if rep.created_at else None
            }
            for rep in reports
        ],
        "safe_places": [
            {
                "id": sp.id,
                "name": sp.name,
                "category": sp.category,
                "latitude": sp.latitude,
                "longitude": sp.longitude,
                "address": sp.address,
                "phone": sp.phone,
                "is_24_7": sp.is_24_7,
                "emergency_types": sp.emergency_types
            }
            for sp in safe_places
        ]
    }
