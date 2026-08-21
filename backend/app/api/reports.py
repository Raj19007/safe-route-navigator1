from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import User, Report
from app.schemas.all_schemas import ReportCreate, ReportResponse
from app.services.report_service import create_report, get_nearby_reports
from app.services.auth_service import get_current_user_optional

router = APIRouter(prefix="/reports", tags=["Crowd-Sourced Reports"])

@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def submit_report(
    report_in: ReportCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Submits a new crowd-sourced hazard/incident report.
    Applies duplicate clustering to prevent duplicate multiplication of risk.
    """
    try:
        report = create_report(db, report_in, current_user=current_user)
        return ReportResponse(
            id=report.id,
            user_id=report.user_id,
            category=report.category,
            severity=report.severity,
            description=report.description,
            latitude=report.latitude,
            longitude=report.longitude,
            segment_id=report.segment_id,
            status=report.status,
            reliability=report.reliability,
            upvotes=report.upvotes,
            created_at=report.created_at
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record safety report: {str(e)}"
        )

@router.get("/nearby", response_model=List[ReportResponse])
def get_reports_in_vicinity(
    lat: float = Query(..., description="Center latitude"),
    lng: float = Query(..., description="Center longitude"),
    radius: float = Query(2000.0, description="Radius in meters"),
    limit: int = Query(50, description="Max reports to return"),
    db: Session = Depends(get_db)
):
    reports = get_nearby_reports(db, lat=lat, lng=lng, radius_meters=radius, limit=limit)
    return [
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
        for r in reports
    ]

@router.get("", response_model=List[ReportResponse])
def list_reports(
    status_filter: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Report)
    if status_filter:
        query = query.filter(Report.status == status_filter.upper())
    reports = query.order_by(Report.created_at.desc()).limit(limit).all()
    return [
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
        for r in reports
    ]
