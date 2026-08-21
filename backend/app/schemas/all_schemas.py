from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

# ==================== AUTH SCHEMAS ====================
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=4)
    full_name: str = "Commuter"
    role: str = "user"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    role: str
    full_name: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    reliability_score: float
    created_at: datetime


# ==================== ROUTE SCHEMAS ====================
class RouteRequest(BaseModel):
    origin_lat: float = Field(..., description="Origin latitude")
    origin_lng: float = Field(..., description="Origin longitude")
    dest_lat: float = Field(..., description="Destination latitude")
    dest_lng: float = Field(..., description="Destination longitude")
    origin_name: Optional[str] = "Origin Location"
    dest_name: Optional[str] = "Destination Location"
    user_profile: str = Field("GENERAL", description="GENERAL, WOMAN, CHILD_GUARDIAN, ELDERLY, ACCESSIBILITY")
    travel_mode: str = Field("WALKING", description="WALKING, CYCLING, DRIVING, ACCESSIBILITY")
    hour: Optional[float] = Field(None, description="Time of day as float (0.0 to 23.99)")
    day_of_week: Optional[int] = Field(2, description="0=Monday, 6=Sunday")
    weather: Optional[str] = Field("CLEAR", description="CLEAR, RAIN, STORM, FOG")
    weights_override: Optional[Dict[str, float]] = None

class FactorDetail(BaseModel):
    key: str
    name: str
    normalized_value: float
    weight: float
    weighted_score: float
    impact: str
    description: str

class SegmentDetail(BaseModel):
    segment_id: Optional[str] = "SEG-0000"
    name: Optional[str] = "Road Segment"
    length_meters: float = 100.0
    risk_score: float = 0.0
    confidence_score: float = 50.0
    confidence_level: Optional[str] = "MODERATE"
    confidence_label: Optional[str] = "Moderate Confidence"
    is_limited_data: bool = False
    risk_grade: Optional[str] = "LOW_RISK"
    risk_label: Optional[str] = "Low Risk"
    risk_color: Optional[str] = "#10B981"
    factors: List[FactorDetail] = []
    positives: List[str] = []
    warnings: List[str] = []
    ai_explanation: Optional[str] = ""
    geometry: Optional[Dict[str, Any]] = None

class RouteAlternative(BaseModel):
    route_id: str
    route_type: str # FASTEST, BALANCED, SAFEST
    is_recommended: bool = False
    title: str
    badge_label: str
    distance_meters: float
    distance_km_str: str
    duration_seconds: float
    duration_min_str: str
    risk_score: float
    confidence_score: float
    confidence_label: str
    is_limited_data: bool
    risk_grade: str
    risk_label: str
    risk_color: str
    ai_explanation: str
    positives: List[str] = []
    warnings: List[str] = []
    factors: List[FactorDetail] = []
    segments: List[SegmentDetail] = []
    coordinates: List[List[float]] = [] # [[lng, lat], ...] for Leaflet polyline

class RouteResponse(BaseModel):
    routes: List[RouteAlternative]
    recommended_route_id: str
    travel_mode: str
    user_profile: str
    simulated_time_str: str
    origin: Dict[str, Any]
    destination: Dict[str, Any]
    active_hazard_count: int

class PresetRoute(BaseModel):
    id: str
    title: str
    description: str
    origin_name: str
    origin_coords: List[float] # [lat, lng]
    dest_name: str
    dest_coords: List[float]   # [lat, lng]
    recommended_mode: str
    scenario_hint: str


# ==================== REPORT SCHEMAS ====================
class ReportCreate(BaseModel):
    category: str = Field(..., description="Poor Lighting, Harassment, Suspicious Activity, Accident, Road Blocked, Unsafe Crowd, Isolated Area, Other")
    severity: str = Field("MEDIUM", description="LOW, MEDIUM, HIGH, CRITICAL")
    description: str
    latitude: float
    longitude: float
    segment_id: Optional[str] = None
    photo_url: Optional[str] = None
    is_anonymous: bool = True

class ReportResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    category: str
    severity: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    segment_id: Optional[str] = None
    status: str
    reliability: float
    upvotes: int
    created_at: datetime


# ==================== SAFE PLACE SCHEMAS ====================
class SafePlaceResponse(BaseModel):
    id: str
    name: str
    category: str # police, hospital, pharmacy, fire_station, safe_haven
    latitude: float
    longitude: float
    address: Optional[str] = None
    phone: Optional[str] = None
    is_24_7: bool
    emergency_types: List[str] = []
    distance_meters: Optional[float] = None


# ==================== ADMIN SCHEMAS ====================
class ReportActionRequest(BaseModel):
    action: str = Field(..., description="VERIFY, REJECT, SET_SEVERITY, MARK_DUPLICATE")
    new_severity: Optional[str] = None

class AdminDashboardResponse(BaseModel):
    total_reports: int
    pending_reports: int
    verified_reports: int
    rejected_reports: int
    high_risk_segments_count: int
    active_alerts_count: int
    routes_analyzed_count: int
    avg_system_confidence: float
    reports_today: int
    reports_by_category: Dict[str, int]
    reports_by_severity: Dict[str, int]
    recent_reports: List[ReportResponse]
    high_risk_segments: List[SegmentDetail]
