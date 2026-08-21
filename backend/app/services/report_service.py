import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.database.models import Report, RoadSegment, User
from app.routing.graph import haversine_distance, network_graph
from app.schemas.all_schemas import ReportCreate

def create_report(
    db: Session,
    report_in: ReportCreate,
    current_user: Optional[User] = None
) -> Report:
    """
    Submits a crowd-sourced safety report.
    Performs duplicate clustering: if an identical category report was submitted within 150m
    in the last 4 hours, it reinforces the existing report (increments upvotes/reliability)
    to prevent duplicate multiplier exploitation.
    """
    now = datetime.now(timezone.utc)
    cluster_threshold_time = now - timedelta(hours=4)

    # Find nearest segment if not specified
    segment_id = report_in.segment_id
    if not segment_id and network_graph.segments_by_id:
        nearest_node = network_graph.find_nearest_node(report_in.latitude, report_in.longitude)
        if nearest_node and nearest_node in network_graph.edges and network_graph.edges[nearest_node]:
            segment_id = network_graph.edges[nearest_node][0]["segment_id"]

    # Check for duplicate cluster
    recent_reports = db.query(Report).filter(
        Report.category == report_in.category,
        Report.created_at >= cluster_threshold_time,
        Report.status != "REJECTED"
    ).all()

    for existing in recent_reports:
        dist = haversine_distance(report_in.latitude, report_in.longitude, existing.latitude, existing.longitude)
        if dist <= 150.0:
            # Cluster match found!
            existing.upvotes += 1
            # Escalate severity if incoming report has higher severity
            sev_rank = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
            if sev_rank.get(report_in.severity, 2) > sev_rank.get(existing.severity, 2):
                existing.severity = report_in.severity
            # Increase reliability due to multi-user confirmation
            existing.reliability = min(1.0, existing.reliability + 0.15)
            existing.updated_at = now
            db.commit()
            db.refresh(existing)
            return existing

    # Assign initial reliability
    user_reliability = 0.5
    user_id = None
    if current_user:
        user_id = current_user.id
        user_reliability = current_user.reliability_score

    report_id = f"REP-{uuid.uuid4().hex[:8].upper()}"
    new_report = Report(
        id=report_id,
        user_id=user_id,
        category=report_in.category,
        severity=report_in.severity,
        description=report_in.description,
        latitude=report_in.latitude,
        longitude=report_in.longitude,
        segment_id=segment_id,
        status="PENDING" if user_reliability < 0.8 else "VERIFIED",
        reliability=user_reliability,
        upvotes=1,
        photo_url=report_in.photo_url,
        created_at=now,
        updated_at=now
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report

def get_nearby_reports(
    db: Session,
    lat: float,
    lng: float,
    radius_meters: float = 2000.0,
    limit: int = 50
) -> List[Report]:
    reports = db.query(Report).filter(Report.status != "REJECTED").order_by(Report.created_at.desc()).all()
    filtered = []
    for r in reports:
        d = haversine_distance(lat, lng, r.latitude, r.longitude)
        if d <= radius_meters:
            filtered.append(r)
        if len(filtered) >= limit:
            break
    return filtered
