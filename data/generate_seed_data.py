import json
import random
import math
from datetime import datetime, timedelta

# Center coordinates: Representative Metropolitan Hub (e.g., Downtown / Tech Corridor / University district)
# Let's use an area around 12.9716, 77.5946 (or standard grid ~40.7128, -74.0060 or 37.7749, -122.4194)
# Let's use a clear coordinate bounding box: Lat ~ 37.7600 to 37.7950, Lng ~ -122.4350 to -122.3900 (San Francisco / Metropolis grid)
# or Bangalore / Mumbai grid (e.g. Lat 12.9200 to 12.9800, Lng 77.5600 to 77.6400)
# Let's use clean standard city coordinates: Lat 37.7700, Lng -122.4200 (approx 5km x 5km area)

BASE_LAT = 37.7749
BASE_LNG = -122.4194

random.seed(42)

# 1. Generate Key Landmark Nodes
landmarks = {
    "college_campus": (37.7880, -122.4075, "University Main Campus", "education"),
    "central_station": (37.7650, -122.4150, "Central Railway Station", "transit"),
    "tech_park": (37.7895, -122.3950, "Innovation Tech Park", "commercial"),
    "downtown_plaza": (37.7850, -122.4080, "Downtown Market Plaza", "commercial"),
    "city_hospital": (37.7700, -122.4050, "City General Hospital", "hospital"),
    "metro_north": (37.7920, -122.4050, "North Metro Station", "transit"),
    "metro_south": (37.7610, -122.4220, "South Metro Hub", "transit"),
    "west_district": (37.7720, -122.4320, "West Residential District", "residential"),
    "night_market_alley": (37.7790, -122.4120, "Old Town Quarter", "entertainment"),
    "industrial_park": (37.7620, -122.3980, "Eastern Logistics Zone", "industrial"),
}

# 2. Generate 75+ Road Segments with Realistic Attributes
# Connect key nodes and intermediate intersections
nodes = []
for i in range(7):
    for j in range(7):
        lat = 37.7580 + (i * 0.006) + random.uniform(-0.0008, 0.0008)
        lng = -122.4350 + (j * 0.007) + random.uniform(-0.0008, 0.0008)
        nodes.append((lat, lng, f"Node_{i}_{j}"))

road_segments = []
seg_id = 1

road_types = ["primary_arterial", "secondary_street", "residential_way", "commercial_avenue", "narrow_alley", "pedestrian_walkway", "cycle_track"]

for i in range(len(nodes)):
    lat1, lng1, name1 = nodes[i]
    # Connect to adjacent horizontal and vertical neighbors
    grid_r = i // 7
    grid_c = i % 7
    neighbors = []
    if grid_c < 6:
        neighbors.append(i + 1)
    if grid_r < 6:
        neighbors.append(i + 7)
    # Diagonal shortcuts
    if grid_r < 6 and grid_c < 6 and random.random() > 0.6:
        neighbors.append(i + 8)

    for n_idx in neighbors:
        lat2, lng2, name2 = nodes[n_idx]
        
        # Calculate approx length in meters
        dlat = (lat2 - lat1) * 111000
        dlng = (lng2 - lng1) * 111000 * math.cos(math.radians(BASE_LAT))
        length_m = round(math.sqrt(dlat*dlat + dlng*dlng), 1)

        # Distinguish characteristic areas:
        # Central avenues have high lighting, high crowd
        # Back alleys / industrial zones have low lighting, high isolation
        is_central = (2 <= grid_r <= 4) and (2 <= grid_c <= 4)
        is_industrial = (grid_r <= 1) and (grid_c >= 5)
        is_residential = (grid_c <= 2)

        if is_central:
            road_type = random.choice(["primary_arterial", "commercial_avenue", "pedestrian_walkway"])
            street_lighting = round(random.uniform(0.75, 0.98), 2)
            pedestrian_infra = round(random.uniform(0.7, 0.95), 2)
            isolation = round(random.uniform(0.1, 0.3), 2)
            traffic = round(random.uniform(0.6, 0.9), 2)
            accessibility = round(random.uniform(0.7, 0.95), 2)
            historical_crime = random.randint(1, 5)
            accident_count = random.randint(1, 4)
            name = f"Central Ave Sec {seg_id}" if "arterial" in road_type else f"Grand Blvd Sec {seg_id}"
        elif is_industrial:
            road_type = random.choice(["secondary_street", "narrow_alley"])
            street_lighting = round(random.uniform(0.15, 0.45), 2)
            pedestrian_infra = round(random.uniform(0.2, 0.45), 2)
            isolation = round(random.uniform(0.65, 0.92), 2)
            traffic = round(random.uniform(0.2, 0.5), 2)
            accessibility = round(random.uniform(0.3, 0.6), 2)
            historical_crime = random.randint(5, 16)
            accident_count = random.randint(2, 6)
            name = f"Industrial Way Sec {seg_id}" if road_type != "narrow_alley" else f"Shadow Alley {seg_id}"
        elif is_residential:
            road_type = random.choice(["residential_way", "secondary_street", "cycle_track"])
            street_lighting = round(random.uniform(0.5, 0.8), 2)
            pedestrian_infra = round(random.uniform(0.6, 0.85), 2)
            isolation = round(random.uniform(0.25, 0.55), 2)
            traffic = round(random.uniform(0.2, 0.5), 2)
            accessibility = round(random.uniform(0.6, 0.85), 2)
            historical_crime = random.randint(0, 3)
            accident_count = random.randint(0, 2)
            name = f"Pine Green Way {seg_id}"
        else:
            road_type = random.choice(road_types)
            street_lighting = round(random.uniform(0.4, 0.85), 2)
            pedestrian_infra = round(random.uniform(0.4, 0.8), 2)
            isolation = round(random.uniform(0.3, 0.7), 2)
            traffic = round(random.uniform(0.3, 0.7), 2)
            accessibility = round(random.uniform(0.4, 0.8), 2)
            historical_crime = random.randint(1, 8)
            accident_count = random.randint(0, 4)
            name = f"Market Cross {seg_id}"

        # Segment coordinates (Linestring with 2 or 3 intermediate vertices for realistic curved roads)
        mid_lat = (lat1 + lat2) / 2 + random.uniform(-0.0003, 0.0003)
        mid_lng = (lng1 + lng2) / 2 + random.uniform(-0.0003, 0.0003)
        coords = [
            [lng1, lat1],
            [mid_lng, mid_lat],
            [lng2, lat2]
        ]

        segment = {
            "id": f"SEG-{seg_id:04d}",
            "name": name,
            "road_type": road_type,
            "start_node": name1,
            "end_node": name2,
            "length_meters": length_m,
            "speed_limit_kmh": 30 if "pedestrian" in road_type or "alley" in road_type else 50,
            "street_lighting": street_lighting,
            "pedestrian_infrastructure": pedestrian_infra,
            "isolation_score": isolation,
            "traffic_density": traffic,
            "accessibility_score": accessibility,
            "historical_crime_count": historical_crime,
            "accident_count": accident_count,
            "geometry": {
                "type": "LineString",
                "coordinates": coords
            }
        }
        road_segments.append(segment)
        seg_id += 1

print(f"Generated {len(road_segments)} road segments")

# 3. Generate 200+ Historical Incidents
incident_categories = ["THEFT", "HARASSMENT", "POOR_LIGHTING_HAZARD", "PHYSICAL_ASSAULT", "SUSPICIOUS_ACTIVITY", "TRAFFIC_ACCIDENT", "VANDALISM"]
severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

incidents = []
now = datetime.utcnow()

for i in range(1, 220):
    # Pick a random segment or coordinate
    seg = random.choice(road_segments)
    coords = seg["geometry"]["coordinates"]
    # Point along segment
    t = random.random()
    lat = coords[0][1] * (1-t) + coords[2][1] * t + random.uniform(-0.0002, 0.0002)
    lng = coords[0][0] * (1-t) + coords[2][0] * t + random.uniform(-0.0002, 0.0002)
    
    # Days ago (from 1 to 180 days ago)
    days_ago = random.expovariate(1/40) # more recent clustering
    days_ago = min(180, max(0.5, days_ago))
    occurred_at = now - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
    
    cat = random.choice(incident_categories)
    if cat in ["PHYSICAL_ASSAULT"]:
        sev = random.choice(["HIGH", "CRITICAL"])
    elif cat in ["HARASSMENT", "THEFT"]:
        sev = random.choice(["MEDIUM", "HIGH"])
    elif cat in ["POOR_LIGHTING_HAZARD", "SUSPICIOUS_ACTIVITY"]:
        sev = random.choice(["LOW", "MEDIUM"])
    else:
        sev = random.choice(severities)

    incidents.append({
        "id": f"INC-{i:04d}",
        "category": cat,
        "severity": sev,
        "title": f"{cat.replace('_', ' ').title()} near {seg['name']}",
        "description": f"Historical incident report logged at {occurred_at.strftime('%Y-%m-%d %H:%M')}. Incident verified by local safety registry.",
        "latitude": round(lat, 6),
        "longitude": round(lng, 6),
        "segment_id": seg["id"],
        "occurred_at": occurred_at.isoformat() + "Z",
        "verified": True,
        "source": "POLICE_ARCHIVE" if sev in ["HIGH", "CRITICAL"] else "PUBLIC_SAFETY_LOG"
    })

print(f"Generated {len(incidents)} incidents")

# 4. Generate 180+ Crowd-Sourced Reports
report_categories = [
    "Poor Lighting", "Harassment", "Suspicious Activity", "Accident", 
    "Road Blocked", "Unsafe Crowd", "Isolated Area", "Other"
]

reports = []
for i in range(1, 190):
    seg = random.choice(road_segments)
    coords = seg["geometry"]["coordinates"]
    lat = coords[1][1] + random.uniform(-0.0003, 0.0003)
    lng = coords[1][0] + random.uniform(-0.0003, 0.0003)

    # Recency: 0.1 to 30 days
    days_ago = random.expovariate(1/10)
    days_ago = min(30, max(0.01, days_ago))
    created_at = now - timedelta(days=days_ago, minutes=random.randint(1, 500))

    cat = random.choice(report_categories)
    if cat in ["Harassment", "Unsafe Crowd"]:
        sev = random.choice(["MEDIUM", "HIGH", "CRITICAL"])
    elif cat in ["Poor Lighting", "Isolated Area"]:
        sev = random.choice(["LOW", "MEDIUM", "HIGH"])
    else:
        sev = random.choice(severities)

    status = random.choices(["VERIFIED", "PENDING", "REJECTED"], weights=[0.65, 0.25, 0.10])[0]
    reliability = random.choice([0.5, 0.8, 1.0])

    descriptions = {
        "Poor Lighting": "Multiple overhead street lamps completely broken. Pitch dark walking path.",
        "Harassment": "Verbal harassment reported near bus shelter. Individuals loitering aggressively.",
        "Suspicious Activity": "Unmarked vehicles parked with headlights off in quiet alleyway.",
        "Accident": "Two-wheeler skid due to loose gravel, slow traffic.",
        "Road Blocked": "Construction barricades occupying the entire sidewalk, forced into traffic.",
        "Unsafe Crowd": "Rowdy unorganized group blocking pedestrian walkway.",
        "Isolated Area": "No open shops, deserted street after 9 PM, no security presence.",
        "Other": "Broken glass bottles scattered across cycling path."
    }

    reports.append({
        "id": f"REP-{i:04d}",
        "user_id": f"USR-{random.randint(1, 15):03d}",
        "category": cat,
        "severity": sev,
        "description": descriptions.get(cat, "Crowd-sourced safety observation submitted by commuter."),
        "latitude": round(lat, 6),
        "longitude": round(lng, 6),
        "segment_id": seg["id"],
        "status": status,
        "reliability": reliability,
        "upvotes": random.randint(0, 35),
        "created_at": created_at.isoformat() + "Z"
    })

print(f"Generated {len(reports)} crowd reports")

# 5. Generate Safe Places (22 Police Stations, 20 Hospitals/Clinics, 30 Safe Havens/24h Pharmacies)
safe_places = []
p_id = 1

police_names = [
    "Central Police Precinct HQ", "North Metro Police Station", "Westside Division Police Post", 
    "South Gate Police Beat Box", "Tech Corridor Police Station", "Downtown Community Police Station",
    "University Safety & Security Dept", "Riverside Police Station", "Highway Patrol Station 4",
    "Civic Center Police Post", "Old Quarter Police Kiosk", "Green Park Police Station",
    "East Gate Transit Police", "Harbor Division Police Station", "Market Square Police Beat",
    "7th Ave Police Station", "Grand Blvd Police Substation", "Midtown Rapid Response Post",
    "West End Police Precinct", "Industrial District Police Station", "City Watch Tower Station", "South Ridge Police Station"
]

hospital_names = [
    "City General Hospital Trauma Center", "Apollo Apex Emergency Care", "Memorial Medical Center", 
    "St. Jude Emergency Hospital", "University Teaching Hospital", "Downtown Urgent Care Clinic",
    "Westside Health & Trauma Center", "Metropolitan Children & Emergency Hospital", "Sunrise 24/7 Medical Center",
    "Civic Emergency Care Hospital", "Northside Community Clinic", "Mercy Health Hospital",
    "Greenwood Emergency Ward", "St. Luke's Hospital", "Highland Medical & Trauma",
    "Riverside 24h Urgent Care", "Valley Emergency Clinic", "Grand City Hospital",
    "Tech Park Medical & First Aid", "Harbor View Health Center"
]

safe_haven_names = [
    "24/7 Apollo Pharmacy & First Aid", "MedPlus 24-Hour Chemist", "Guardian All-Night Pharmacy",
    "Transit Station 24/7 Security Kiosk", "City Hall 24-Hour Safe Haven", "WellSpring 24h Community Shelter",
    "7-Eleven 24h Safe Beacon Station", "Metro Hub Help & Information Desk", "Campus 24/7 Escort Hub",
    "Downtown Women Support Center", "Civic Center 24-Hour Well-Lit Plaza", "Fire Station No. 1 Safe Zone",
    "Fire Station No. 4 Emergency Hub", "Shell 24h Service Station & SOS Point", "Central Library 24h Security Desk",
    "Red Cross Community First Response Station", "Westside 24/7 Transit Shelter", "North Star Emergency Kiosk",
    "Beacon 24h Safe Haven Point", "City Guardian 24/7 Help Point"
]

for name in police_names:
    lat = BASE_LAT + random.uniform(-0.015, 0.015)
    lng = BASE_LNG + random.uniform(-0.02, 0.02)
    safe_places.append({
        "id": f"SAF-{p_id:04d}",
        "name": name,
        "category": "police",
        "latitude": round(lat, 6),
        "longitude": round(lng, 6),
        "address": f"{random.randint(10, 899)} Main Street, Central District",
        "phone": f"+1 (555) 01{random.randint(10, 99)}",
        "is_24_7": True,
        "emergency_types": ["SOS", "POLICE", "SECURITY"]
    })
    p_id += 1

for name in hospital_names:
    lat = BASE_LAT + random.uniform(-0.015, 0.015)
    lng = BASE_LNG + random.uniform(-0.02, 0.02)
    safe_places.append({
        "id": f"SAF-{p_id:04d}",
        "name": name,
        "category": "hospital",
        "latitude": round(lat, 6),
        "longitude": round(lng, 6),
        "address": f"{random.randint(10, 899)} Health Ave, Sector {random.randint(1, 9)}",
        "phone": f"+1 (555) 02{random.randint(10, 99)}",
        "is_24_7": True,
        "emergency_types": ["AMBULANCE", "MEDICAL", "TRAUMA"]
    })
    p_id += 1

for name in safe_haven_names:
    lat = BASE_LAT + random.uniform(-0.015, 0.015)
    lng = BASE_LNG + random.uniform(-0.02, 0.02)
    cat = "pharmacy" if "Pharmacy" in name or "Chemist" in name else "fire_station" if "Fire" in name else "safe_haven"
    safe_places.append({
        "id": f"SAF-{p_id:04d}",
        "name": name,
        "category": cat,
        "latitude": round(lat, 6),
        "longitude": round(lng, 6),
        "address": f"{random.randint(10, 899)} Broadway, Zone {random.randint(1, 8)}",
        "phone": f"+1 (555) 03{random.randint(10, 99)}",
        "is_24_7": True,
        "emergency_types": ["SHELTER", "FIRST_AID", "SAFE_HAVEN"]
    })
    p_id += 1

print(f"Generated {len(safe_places)} safe places")

# Save files
import os
os.makedirs("data/seed", exist_ok=True)

with open("data/seed/road_segments.json", "w", encoding="utf-8") as f:
    json.dump(road_segments, f, indent=2)

with open("data/seed/incidents.json", "w", encoding="utf-8") as f:
    json.dump(incidents, f, indent=2)

with open("data/seed/crowd_reports.json", "w", encoding="utf-8") as f:
    json.dump(reports, f, indent=2)

with open("data/seed/safe_places.json", "w", encoding="utf-8") as f:
    json.dump(safe_places, f, indent=2)

# Also generate sample CSVs & GeoJSON for standard open GIS tool compatibility
import csv
with open("data/sample_incidents.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["id", "category", "severity", "title", "latitude", "longitude", "occurred_at", "source"])
    writer.writeheader()
    for inc in incidents:
        writer.writerow({
            "id": inc["id"],
            "category": inc["category"],
            "severity": inc["severity"],
            "title": inc["title"],
            "latitude": inc["latitude"],
            "longitude": inc["longitude"],
            "occurred_at": inc["occurred_at"],
            "source": inc["source"]
        })

with open("data/sample_reports.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["id", "user_id", "category", "severity", "description", "latitude", "longitude", "status", "reliability", "created_at"])
    writer.writeheader()
    for rep in reports:
        writer.writerow({
            "id": rep["id"],
            "user_id": rep["user_id"],
            "category": rep["category"],
            "severity": rep["severity"],
            "description": rep["description"],
            "latitude": rep["latitude"],
            "longitude": rep["longitude"],
            "status": rep["status"],
            "reliability": rep["reliability"],
            "created_at": rep["created_at"]
        })

# GeoJSON for roads
geojson_roads = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "id": seg["id"],
                "name": seg["name"],
                "road_type": seg["road_type"],
                "length_meters": seg["length_meters"],
                "street_lighting": seg["street_lighting"],
                "pedestrian_infrastructure": seg["pedestrian_infrastructure"],
                "isolation_score": seg["isolation_score"],
                "traffic_density": seg["traffic_density"],
                "accessibility_score": seg["accessibility_score"]
            },
            "geometry": seg["geometry"]
        }
        for seg in road_segments
    ]
}

with open("data/sample_roads.geojson", "w", encoding="utf-8") as f:
    json.dump(geojson_roads, f, indent=2)

print("Demo dataset generated successfully in data/ and data/seed/")
