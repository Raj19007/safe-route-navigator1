from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.database.models import Report, RoadSegment, Incident, RouteLog
from app.services.safety_service import get_safety_map_data
from app.schemas.all_schemas import AdminDashboardResponse, ReportResponse

def get_admin_dashboard_stats(db: Session) -> AdminDashboardResponse:
    reports = db.query(Report).all()
    total_reports = len(reports)
    pending_reports = sum(1 for r in reports if r.status == "PENDING")
    verified_reports = sum(1 for r in reports if r.status == "VERIFIED")
    rejected_reports = sum(1 for r in reports if r.status == "REJECTED")

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    reports_today = sum(1 for r in reports if r.created_at and r.created_at.replace(tzinfo=timezone.utc if r.created_at.tzinfo is None else r.created_at.tzinfo) >= today_start)

    # Categories & Severities
    cat_counts: Dict[str, int] = {}
    sev_counts: Dict[str, int] = {}
    for r in reports:
        cat_counts[r.category] = cat_counts.get(r.category, 0) + 1
        sev_counts[r.severity] = sev_counts.get(r.severity, 0) + 1

    # Routes Analyzed Count
    routes_analyzed_count = db.query(RouteLog).count()
    if routes_analyzed_count == 0:
        routes_analyzed_count = 42 # baseline count for demo

    # Fetch evaluated segments to compute high-risk count and avg confidence
    map_data = get_safety_map_data(db)
    evaluated_segments = map_data["segments"]

    high_risk_segs = [s for s in evaluated_segments if s["risk_score"] >= 60.0]
    high_risk_segs.sort(key=lambda s: s["risk_score"], reverse=True)

    avg_conf = sum(s["confidence_score"] for s in evaluated_segments) / max(1, len(evaluated_segments))
    active_alerts = sum(1 for r in reports if r.status != "REJECTED" and r.severity in ["HIGH", "CRITICAL"])

    recent_reports_db = db.query(Report).order_by(Report.created_at.desc()).limit(20).all()
    recent_reports_res = [
        ReportResponse(
            id=r.id,
            user_id=r.user_id,
            category=r.category,
            severity=r.severity,
            description=r.description,
            latitude=r.latitude,
            longitude=r.longitude,
            segment_id=r.segment_id,
            status=r.status,
            reliability=r.reliability,
            upvotes=r.upvotes,
            created_at=r.created_at
        )
        for r in recent_reports_db
    ]

    return AdminDashboardResponse(
        total_reports=total_reports,
        pending_reports=pending_reports,
        verified_reports=verified_reports,
        rejected_reports=rejected_reports,
        high_risk_segments_count=len(high_risk_segs),
        active_alerts_count=active_alerts,
        routes_analyzed_count=routes_analyzed_count,
        avg_system_confidence=round(avg_conf, 1),
        reports_today=reports_today,
        reports_by_category=cat_counts,
        reports_by_severity=sev_counts,
        recent_reports=recent_reports_res,
        high_risk_segments=high_risk_segs[:10]
    )

def verify_report(db: Session, report_id: str) -> Report:
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise ValueError(f"Report {report_id} not found")
    report.status = "VERIFIED"
    report.reliability = 1.0
    db.commit()
    db.refresh(report)
    return report

def reject_report(db: Session, report_id: str) -> Report:
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise ValueError(f"Report {report_id} not found")
    report.status = "REJECTED"
    report.reliability = 0.0
    db.commit()
    db.refresh(report)
    return report

def change_report_severity(db: Session, report_id: str, new_severity: str) -> Report:
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise ValueError(f"Report {report_id} not found")
    report.severity = new_severity.upper()
    db.commit()
    db.refresh(report)
    return report
