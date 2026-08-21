import os
import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database.connection import engine, SessionLocal, Base
from app.database.models import User, RoadSegment, Incident, Report, SafePlace
from app.services.auth_service import get_password_hash
from app.routing.graph import network_graph

def seed_database_if_empty():
    # 1. Create all tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # Check if already seeded
        seg_count = db.query(RoadSegment).count()
        if seg_count > 0:
            print(f"Database already contains {seg_count} road segments. Skipping initial seed.")
            # Still initialize network graph in memory
            segments = db.query(RoadSegment).all()
            seg_dicts = [
                {
                    "id": s.id, "name": s.name, "road_type": s.road_type,
                    "start_node": s.start_node, "end_node": s.end_node,
                    "length_meters": s.length_meters, "speed_limit_kmh": s.speed_limit_kmh,
                    "street_lighting": s.street_lighting, "pedestrian_infrastructure": s.pedestrian_infrastructure,
                    "isolation_score": s.isolation_score, "traffic_density": s.traffic_density,
                    "accessibility_score": s.accessibility_score,
                    "historical_crime_count": s.historical_crime_count, "accident_count": s.accident_count,
                    "geometry": s.geometry
                }
                for s in segments
            ]
            network_graph.load_segments(seg_dicts)
            return

        print("Seeding database with synthetic dataset...")
        data_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "seed")
        if not os.path.exists(data_dir):
            data_dir = os.path.join(os.getcwd(), "data", "seed")

        # 2. Seed Default Users
        admin_user = User(
            id="USR-ADMIN",
            email="admin@saferoute.local",
            hashed_password=get_password_hash("admin123"),
            full_name="Municipal Safety Admin",
            role="admin",
            reliability_score=1.0
        )
        demo_user = User(
            id="USR-DEMO",
            email="commuter@saferoute.local",
            hashed_password=get_password_hash("user123"),
            full_name="Verified Commuter",
            role="user",
            reliability_score=0.8
        )
        db.add(admin_user)
        db.add(demo_user)
        db.commit()

        # 3. Seed Road Segments
        segs_file = os.path.join(data_dir, "road_segments.json")
        seg_dicts = []
        if os.path.exists(segs_file):
            with open(segs_file, "r", encoding="utf-8") as f:
                segments_data = json.load(f)
                for s in segments_data:
                    seg = RoadSegment(
                        id=s["id"],
                        name=s["name"],
                        road_type=s["road_type"],
                        start_node=s.get("start_node"),
                        end_node=s.get("end_node"),
                        length_meters=s["length_meters"],
                        speed_limit_kmh=s.get("speed_limit_kmh", 40),
                        street_lighting=s.get("street_lighting", 0.5),
                        pedestrian_infrastructure=s.get("pedestrian_infrastructure", 0.5),
                        isolation_score=s.get("isolation_score", 0.3),
                        traffic_density=s.get("traffic_density", 0.5),
                        accessibility_score=s.get("accessibility_score", 0.5),
                        historical_crime_count=s.get("historical_crime_count", 0),
                        accident_count=s.get("accident_count", 0),
                        geometry=s["geometry"]
                    )
                    db.add(seg)
                    seg_dicts.append(s)
            db.commit()
            print(f"Seeded {len(segments_data)} road segments.")
            network_graph.load_segments(seg_dicts)

        # 4. Seed Incidents
        incidents_file = os.path.join(data_dir, "incidents.json")
        if os.path.exists(incidents_file):
            with open(incidents_file, "r", encoding="utf-8") as f:
                incidents_data = json.load(f)
                for inc in incidents_data:
                    occ_dt = datetime.fromisoformat(inc["occurred_at"].replace("Z", "+00:00"))
                    incident = Incident(
                        id=inc["id"],
                        category=inc["category"],
                        severity=inc["severity"],
                        title=inc["title"],
                        description=inc["description"],
                        latitude=inc["latitude"],
                        longitude=inc["longitude"],
                        segment_id=inc.get("segment_id"),
                        occurred_at=occ_dt,
                        verified=inc.get("verified", True),
                        source=inc.get("source", "PUBLIC_SAFETY_LOG")
                    )
                    db.add(incident)
            db.commit()
            print(f"Seeded {len(incidents_data)} historical incidents.")

        # 5. Seed Reports
        reports_file = os.path.join(data_dir, "crowd_reports.json")
        if os.path.exists(reports_file):
            with open(reports_file, "r", encoding="utf-8") as f:
                reports_data = json.load(f)
                for rep in reports_data:
                    c_dt = datetime.fromisoformat(rep["created_at"].replace("Z", "+00:00"))
                    report = Report(
                        id=rep["id"],
                        user_id=rep.get("user_id"),
                        category=rep["category"],
                        severity=rep["severity"],
                        description=rep["description"],
                        latitude=rep["latitude"],
                        longitude=rep["longitude"],
                        segment_id=rep.get("segment_id"),
                        status=rep.get("status", "PENDING"),
                        reliability=rep.get("reliability", 0.5),
                        upvotes=rep.get("upvotes", 0),
                        created_at=c_dt,
                        updated_at=c_dt
                    )
                    db.add(report)
            db.commit()
            print(f"Seeded {len(reports_data)} crowd reports.")

        # 6. Seed Safe Places
        places_file = os.path.join(data_dir, "safe_places.json")
        if os.path.exists(places_file):
            with open(places_file, "r", encoding="utf-8") as f:
                places_data = json.load(f)
                for p in places_data:
                    place = SafePlace(
                        id=p["id"],
                        name=p["name"],
                        category=p["category"],
                        latitude=p["latitude"],
                        longitude=p["longitude"],
                        address=p.get("address"),
                        phone=p.get("phone"),
                        is_24_7=p.get("is_24_7", True),
                        emergency_types=p.get("emergency_types", [])
                    )
                    db.add(place)
            db.commit()
            print(f"Seeded {len(places_data)} safe places.")

    finally:
        db.close()
