from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import User
from app.schemas.all_schemas import AdminDashboardResponse, ReportResponse, ReportActionRequest
from app.services.admin_service import (
    get_admin_dashboard_stats,
    verify_report,
    reject_report,
    change_report_severity
)
from app.services.auth_service import get_current_admin, get_current_user_optional

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

@router.get("/dashboard", response_model=AdminDashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db)
):
    """
    Returns administrative dashboard KPIs, verification queues, and high-risk segment monitors.
    """
    try:
        return get_admin_dashboard_stats(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load admin telemetry: {str(e)}"
        )

@router.post("/reports/{report_id}/verify", response_model=ReportResponse)
def admin_verify_report(
    report_id: str,
    db: Session = Depends(get_db)
):
    try:
        r = verify_report(db, report_id)
        return ReportResponse(
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
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/reports/{report_id}/reject", response_model=ReportResponse)
def admin_reject_report(
    report_id: str,
    db: Session = Depends(get_db)
):
    try:
        r = reject_report(db, report_id)
        return ReportResponse(
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
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/reports/{report_id}/action", response_model=ReportResponse)
def admin_report_action(
    report_id: str,
    action_in: ReportActionRequest,
    db: Session = Depends(get_db)
):
    try:
        if action_in.action == "VERIFY":
            r = verify_report(db, report_id)
        elif action_in.action == "REJECT":
            r = reject_report(db, report_id)
        elif action_in.action == "SET_SEVERITY" and action_in.new_severity:
            r = change_report_severity(db, report_id, action_in.new_severity)
        elif action_in.action == "MARK_DUPLICATE":
            r = reject_report(db, report_id)
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid action")

        return ReportResponse(
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
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
