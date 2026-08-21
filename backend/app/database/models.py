from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.connection import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    full_name = Column(String(100), default="Commuter")
    role = Column(String(20), default="user") # "user" or "admin"
    reliability_score = Column(Float, default=0.5) # 0.5 for new, 0.8 regular, 1.0 verified
    created_at = Column(DateTime, default=utc_now)

    reports = relationship("Report", back_populates="user")


class RoadSegment(Base):
    __tablename__ = "road_segments"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    road_type = Column(String(50), default="secondary_street")
    start_node = Column(String(100), nullable=True)
    end_node = Column(String(100), nullable=True)
    length_meters = Column(Float, default=100.0)
    speed_limit_kmh = Column(Integer, default=40)
    
    # Intrinsic factors (0.0 to 1.0)
    street_lighting = Column(Float, default=0.5) # 1.0 = brightly lit, 0.0 = dark
    pedestrian_infrastructure = Column(Float, default=0.5) # 1.0 = wide sidewalks & crossings
    isolation_score = Column(Float, default=0.3) # 1.0 = very secluded / deserted
    traffic_density = Column(Float, default=0.5) # 1.0 = heavy traffic
    accessibility_score = Column(Float, default=0.5) # 1.0 = ramps, smooth, no obstacles
    
    # Statistical history
    historical_crime_count = Column(Integer, default=0)
    accident_count = Column(Integer, default=0)
    
    # GeoJSON linestring representation: {"type": "LineString", "coordinates": [[lng, lat], ...]}
    geometry = Column(JSON, nullable=False)
    
    created_at = Column(DateTime, default=utc_now)

    reports = relationship("Report", back_populates="segment")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(50), primary_key=True, index=True)
    category = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    segment_id = Column(String(50), ForeignKey("road_segments.id"), nullable=True)
    occurred_at = Column(DateTime, default=utc_now, index=True)
    verified = Column(Boolean, default=True)
    source = Column(String(50), default="PUBLIC_SAFETY_LOG")


class Report(Base):
    __tablename__ = "reports"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=True)
    category = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    segment_id = Column(String(50), ForeignKey("road_segments.id"), nullable=True)
    status = Column(String(20), default="PENDING", index=True) # PENDING, VERIFIED, REJECTED, DUPLICATE
    reliability = Column(Float, default=0.5)
    upvotes = Column(Integer, default=0)
    photo_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="reports")
    segment = relationship("RoadSegment", back_populates="reports")


class SafePlace(Base):
    __tablename__ = "safe_places"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False, index=True) # police, hospital, pharmacy, safe_haven, fire_station
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    address = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    is_24_7 = Column(Boolean, default=True)
    emergency_types = Column(JSON, default=list)


class RouteLog(Base):
    __tablename__ = "route_logs"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(50), nullable=True)
    origin_lat = Column(Float, nullable=False)
    origin_lng = Column(Float, nullable=False)
    dest_lat = Column(Float, nullable=False)
    dest_lng = Column(Float, nullable=False)
    travel_mode = Column(String(30), default="WALKING")
    user_profile = Column(String(30), default="GENERAL")
    selected_route_type = Column(String(30), default="BALANCED")
    risk_score = Column(Float, default=0.0)
    confidence_score = Column(Float, default=100.0)
    created_at = Column(DateTime, default=utc_now)
