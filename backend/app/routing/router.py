import math
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.routing.graph import network_graph, haversine_distance
from app.risk_engine.calculator import calculate_segment_risk, aggregate_route_risk
from app.schemas.all_schemas import RouteAlternative, RouteResponse, PresetRoute

SPEED_BY_MODE_KMH = {
    "WALKING": 4.8,
    "CYCLING": 15.0,
    "DRIVING": 35.0,
    "ACCESSIBILITY": 3.5
}

PRESET_ROUTES = [
    PresetRoute(
        id="preset_college_to_station",
        title="College Campus → Central Railway Station",
        description="Core hackathon scenario: Compare direct alley shortcut vs main arterial vs illuminated boulevard.",
        origin_name="University Main Campus",
        origin_coords=[37.7880, -122.4075],
        dest_name="Central Railway Station",
        dest_coords=[37.7650, -122.4150],
        recommended_mode="WALKING",
        scenario_hint="Try toggling time to 11:30 PM or submitting a Poor Lighting report on Route B to see real-time recommendation shift!"
    ),
    PresetRoute(
        id="preset_tech_to_downtown",
        title="Innovation Tech Park → Downtown Plaza",
        description="Commuter evening path comparing rapid transit corridor vs riverside path.",
        origin_name="Innovation Tech Park",
        origin_coords=[37.7895, -122.3950],
        dest_name="Downtown Market Plaza",
        dest_coords=[37.7850, -122.4080],
        recommended_mode="CYCLING",
        scenario_hint="Examines bicycle lane infrastructure and high-traffic intersection safety."
    ),
    PresetRoute(
        id="preset_hospital_to_metro",
        title="City General Hospital → North Metro Hub",
        description="Accessibility & night transit corridor with emergency services proximity.",
        origin_name="City General Hospital",
        origin_coords=[37.7700, -122.4050],
        dest_name="North Metro Station",
        dest_coords=[37.7920, -122.4050],
        recommended_mode="ACCESSIBILITY",
        scenario_hint="Emphasizes wheelchair ramps, curb cuts, and emergency call box proximity."
    )
]

def format_duration(seconds: float) -> str:
    mins = int(round(seconds / 60.0))
    if mins < 60:
        return f"{max(1, mins)} min"
    hours = mins // 60
    rem_mins = mins % 60
    return f"{hours} hr {rem_mins} min"

def format_distance(meters: float) -> str:
    km = meters / 1000.0
    return f"{km:.1f} km"

def build_route_coordinates(segments: List[Dict[str, Any]]) -> List[List[float]]:
    coords = []
    for s in segments:
        geom = s.get("geometry", {})
        if geom and "coordinates" in geom:
            coords.extend(geom["coordinates"])
    # De-duplicate consecutive identical points
    unique_coords = []
    for pt in coords:
        if not unique_coords or unique_coords[-1] != pt:
            unique_coords.append(pt)
    return unique_coords

def generate_multi_alternative_routes(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
    incidents_by_segment: Dict[str, List[Dict[str, Any]]],
    reports_by_segment: Dict[str, List[Dict[str, Any]]],
    safe_places: List[Dict[str, Any]],
    user_profile: str = "GENERAL",
    travel_mode: str = "WALKING",
    hour: float = 14.0,
    day_of_week: int = 2,
    weather: str = "CLEAR",
    ref_time: Optional[datetime] = None
) -> RouteResponse:
    """
    Computes 3 distinct routes:
    1. Fastest Route (min travel time)
    2. Balanced Route (optimal trade-off between time and safety)
    3. Safest Route (minimized risk score, maximizes illumination & emergency proximity)
    """
    mode_speed_kmh = SPEED_BY_MODE_KMH.get(travel_mode.upper(), 4.8)
    speed_mps = (mode_speed_kmh * 1000.0) / 3600.0

    # 1. Match coordinates to graph nodes
    start_node = network_graph.find_nearest_node(origin_lat, origin_lng)
    end_node = network_graph.find_nearest_node(dest_lat, dest_lng)

    # Search for candidate paths
    candidate_paths = []
    if start_node and end_node:
        candidate_paths = network_graph.find_k_shortest_paths(start_node, end_node, k=4)

    # If graph pathfinding has fewer than 3 options, construct diverse corridor variations
    all_known_segs = list(network_graph.segments_by_id.values())
    if len(candidate_paths) < 3 and all_known_segs:
        # Build synthetic representative corridor paths connecting nodes
        sorted_by_lat = sorted(all_known_segs, key=lambda s: s["geometry"]["coordinates"][0][1])
        p1 = sorted_by_lat[:min(5, len(sorted_by_lat))] # direct
        p2 = sorted_by_lat[2:min(8, len(sorted_by_lat))] # perimeter
        p3 = sorted_by_lat[4:min(10, len(sorted_by_lat))] # outer
        candidate_paths = [
            [{"segment": s, "length_meters": s["length_meters"]} for s in p1],
            [{"segment": s, "length_meters": s["length_meters"]} for s in p2],
            [{"segment": s, "length_meters": s["length_meters"]} for s in p3],
        ]

    # Evaluate each candidate route path
    evaluated_candidates = []
    route_idx = 1

    for path_edges in candidate_paths:
        path_segments = [e["segment"] for e in path_edges if "segment" in e]
        if not path_segments:
            continue

        # Evaluate each segment in path
        seg_evals = []
        for seg in path_segments:
            seg_id = seg["id"]
            seg_incidents = incidents_by_segment.get(seg_id, [])
            seg_reports = reports_by_segment.get(seg_id, [])
            
            # Distance to nearest police/hospital
            coords = seg["geometry"]["coordinates"]
            mid_lat = (coords[0][1] + coords[-1][1]) / 2.0
            mid_lng = (coords[0][0] + coords[-1][0]) / 2.0
            
            min_police = 1200.0
            min_hosp = 1500.0
            for sp in safe_places:
                d = haversine_distance(mid_lat, mid_lng, sp["latitude"], sp["longitude"])
                if sp["category"] == "police" and d < min_police:
                    min_police = d
                elif sp["category"] == "hospital" and d < min_hosp:
                    min_hosp = d

            eval_res = calculate_segment_risk(
                segment=seg,
                incidents=seg_incidents,
                reports=seg_reports,
                dist_to_police=min_police,
                dist_to_hospital=min_hosp,
                hour=hour,
                day_of_week=day_of_week,
                profile=user_profile,
                mode=travel_mode,
                weather=weather,
                ref_time=ref_time
            )
            seg_evals.append(eval_res)

        # Aggregate path
        agg = aggregate_route_risk(seg_evals)
        total_distance = agg["total_distance_meters"]
        duration_sec = total_distance / speed_mps

        evaluated_candidates.append({
            "candidate_idx": route_idx,
            "segments": seg_evals,
            "agg": agg,
            "total_distance": total_distance,
            "duration_sec": duration_sec,
            "coordinates": build_route_coordinates(path_segments)
        })
        route_idx += 1

    # Ensure we have at least 3 routes
    while len(evaluated_candidates) < 3:
        # Duplicate with small distance & risk multiplier variation
        base = evaluated_candidates[0] if evaluated_candidates else None
        if base:
            new_dist = base["total_distance"] * (1.15 + (len(evaluated_candidates) * 0.1))
            new_dur = base["duration_sec"] * (1.15 + (len(evaluated_candidates) * 0.1))
            new_risk = max(10.0, min(90.0, base["agg"]["risk_score"] * 0.8))
            evaluated_candidates.append({
                "candidate_idx": len(evaluated_candidates) + 1,
                "segments": base["segments"],
                "agg": {**base["agg"], "risk_score": new_risk},
                "total_distance": new_dist,
                "duration_sec": new_dur,
                "coordinates": base["coordinates"]
            })
        else:
            break

    # Sort candidates to categorize into FASTEST, BALANCED, SAFEST
    # Fastest = lowest duration
    # Safest = lowest risk
    # Balanced = minimum weighted objective (0.5 * normalized_time + 0.5 * normalized_risk)
    min_time = min(c["duration_sec"] for c in evaluated_candidates)
    min_risk = min(c["agg"]["risk_score"] for c in evaluated_candidates)

    for c in evaluated_candidates:
        norm_time = c["duration_sec"] / max(1.0, min_time)
        norm_risk = c["agg"]["risk_score"] / 100.0
        
        # Profile adjustments for recommendation
        if user_profile.upper() in ["WOMAN", "CHILD_GUARDIAN", "ELDERLY"]:
            # Prioritize safety slightly more (65% risk weight, 35% time weight)
            c["objective_score"] = (0.35 * norm_time) + (0.65 * norm_risk)
        elif user_profile.upper() == "ACCESSIBILITY":
            c["objective_score"] = (0.30 * norm_time) + (0.70 * norm_risk)
        else:
            c["objective_score"] = (0.50 * norm_time) + (0.50 * norm_risk)

    fastest_cand = min(evaluated_candidates, key=lambda c: c["duration_sec"])
    safest_cand = min(evaluated_candidates, key=lambda c: c["agg"]["risk_score"])
    
    # Pick balanced from remaining or best objective score
    remaining = [c for c in evaluated_candidates if c != fastest_cand and c != safest_cand]
    if remaining:
        balanced_cand = min(remaining, key=lambda c: c["objective_score"])
    else:
        # If fastest and safest are the same, pick another candidate
        balanced_cand = min(evaluated_candidates, key=lambda c: c["objective_score"])

    # Determine recommended candidate based on objective score
    best_candidate = min([fastest_cand, balanced_cand, safest_cand], key=lambda c: c["objective_score"])

    def create_route_alt(cand: Dict[str, Any], r_type: str, title: str, badge: str) -> RouteAlternative:
        agg = cand["agg"]
        is_rec = (cand == best_candidate)
        return RouteAlternative(
            route_id=f"route_{r_type.lower()}_{cand['candidate_idx']}",
            route_type=r_type,
            is_recommended=is_rec,
            title=title,
            badge_label=badge + (" ⭐ RECOMMENDED" if is_rec else ""),
            distance_meters=cand["total_distance"],
            distance_km_str=format_distance(cand["total_distance"]),
            duration_seconds=cand["duration_sec"],
            duration_min_str=format_duration(cand["duration_sec"]),
            risk_score=agg["risk_score"],
            confidence_score=agg["confidence_score"],
            confidence_label=agg["confidence_label"],
            is_limited_data=agg["is_limited_data"],
            risk_grade=agg["risk_grade"],
            risk_label=agg["risk_label"],
            risk_color=agg["risk_color"],
            ai_explanation=agg["ai_explanation"],
            positives=agg["positives"],
            warnings=agg["warnings"],
            factors=agg["factors"],
            segments=cand["segments"],
            coordinates=cand["coordinates"]
        )

    route_fastest = create_route_alt(fastest_cand, "FASTEST", "Fastest Route", "FASTEST")
    route_balanced = create_route_alt(balanced_cand, "BALANCED", "Balanced Route", "BALANCED")
    route_safest = create_route_alt(safest_cand, "SAFEST", "Safest Route", "SAFEST")

    final_routes = [route_fastest, route_balanced, route_safest]
    recommended_route = next((r for r in final_routes if r.is_recommended), route_balanced)

    # Active hazard count
    total_active_hazards = 0
    for s in recommended_route.segments:
        sid = s.segment_id if hasattr(s, "segment_id") else s.get("segment_id") if isinstance(s, dict) else None
        if sid and sid in reports_by_segment:
            total_active_hazards += len(reports_by_segment[sid])

    # Time representation
    int_hr = int(hour)
    int_min = int((hour - int_hr) * 60)
    time_str = f"{int_hr:02d}:{int_min:02d} {'PM' if int_hr >= 12 else 'AM'}"

    return RouteResponse(
        routes=final_routes,
        recommended_route_id=recommended_route.route_id,
        travel_mode=travel_mode,
        user_profile=user_profile,
        simulated_time_str=time_str,
        origin={"lat": origin_lat, "lng": origin_lng},
        destination={"lat": dest_lat, "lng": dest_lng},
        active_hazard_count=total_active_hazards
    )
