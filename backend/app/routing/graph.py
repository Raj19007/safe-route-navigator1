import math
import heapq
from typing import Dict, List, Tuple, Any, Optional

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle distance in meters between two lat/lon points.
    """
    R = 6371000.0 # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class RoadNetworkGraph:
    def __init__(self):
        self.nodes: Dict[str, Tuple[float, float]] = {} # node_id -> (lat, lng)
        self.edges: Dict[str, List[Dict[str, Any]]] = {} # node_id -> [edge_data, ...]
        self.segments_by_id: Dict[str, Dict[str, Any]] = {}

    def load_segments(self, segments_data: List[Dict[str, Any]]):
        self.nodes.clear()
        self.edges.clear()
        self.segments_by_id.clear()

        for seg in segments_data:
            seg_id = seg["id"]
            self.segments_by_id[seg_id] = seg
            coords = seg["geometry"]["coordinates"] # [[lng, lat], ...]
            
            start_coord = (coords[0][1], coords[0][0])
            end_coord = (coords[-1][1], coords[-1][0])
            
            start_node = seg.get("start_node") or f"N_{coords[0][1]:.4f}_{coords[0][0]:.4f}"
            end_node = seg.get("end_node") or f"N_{coords[-1][1]:.4f}_{coords[-1][0]:.4f}"

            self.nodes[start_node] = start_coord
            self.nodes[end_node] = end_coord

            if start_node not in self.edges:
                self.edges[start_node] = []
            if end_node not in self.edges:
                self.edges[end_node] = []

            length_m = seg.get("length_meters", haversine_distance(start_coord[0], start_coord[1], end_coord[0], end_coord[1]))
            speed_kmh = seg.get("speed_limit_kmh", 40)

            # Bidirectional road network
            self.edges[start_node].append({
                "target": end_node,
                "segment_id": seg_id,
                "length_meters": length_m,
                "speed_kmh": speed_kmh,
                "segment": seg
            })
            self.edges[end_node].append({
                "target": start_node,
                "segment_id": seg_id,
                "length_meters": length_m,
                "speed_kmh": speed_kmh,
                "segment": seg
            })

    def find_nearest_node(self, lat: float, lng: float) -> Optional[str]:
        if not self.nodes:
            return None
        best_node = None
        min_dist = float("inf")
        for node_id, (nlat, nlng) in self.nodes.items():
            dist = haversine_distance(lat, lng, nlat, nlng)
            if dist < min_dist:
                min_dist = dist
                best_node = node_id
        return best_node

    def find_k_shortest_paths(
        self,
        start_node: str,
        end_node: str,
        k: int = 3,
        weight_func = None
    ) -> List[List[Dict[str, Any]]]:
        """
        Finds k diverse candidate paths between start_node and end_node.
        Returns list of path segment lists.
        """
        if start_node not in self.nodes or end_node not in self.nodes:
            return []

        # Dijkstra helper
        def dijkstra(excluded_edges=set()):
            dist = {start_node: 0.0}
            prev = {}
            heap = [(0.0, start_node)]
            visited = set()

            while heap:
                d, u = heapq.heappop(heap)
                if u in visited:
                    continue
                visited.add(u)

                if u == end_node:
                    break

                for edge in self.edges.get(u, []):
                    v = edge["target"]
                    seg_id = edge["segment_id"]
                    if (u, v, seg_id) in excluded_edges or (v, u, seg_id) in excluded_edges:
                        continue

                    cost = weight_func(edge) if weight_func else edge["length_meters"]
                    new_dist = d + cost
                    if v not in dist or new_dist < dist[v]:
                        dist[v] = new_dist
                        prev[v] = (u, edge)
                        heapq.heappush(heap, (new_dist, v))

            if end_node not in prev and start_node != end_node:
                return None

            path_edges = []
            curr = end_node
            while curr != start_node:
                if curr not in prev:
                    return None
                u, edge = prev[curr]
                path_edges.append(edge)
                curr = u
            path_edges.reverse()
            return path_edges

        # 1. First shortest path
        paths = []
        first_path = dijkstra()
        if not first_path:
            return []
        paths.append(first_path)

        # 2. Yen's algorithm variation to find structurally diverse paths
        candidate_paths = []
        excluded_edges = set()

        for _ in range(1, k + 2):
            if len(paths) >= k:
                break
            
            # Select an edge from existing paths to temporarily exclude for diversity
            for p in paths:
                if len(p) > 2:
                    # Exclude middle edges
                    mid_idx = len(p) // 2
                    edge_to_ban = p[mid_idx]
                    excluded_edges.add((p[mid_idx-1]["target"], edge_to_ban["target"], edge_to_ban["segment_id"]))
                    alt_path = dijkstra(excluded_edges)
                    if alt_path and alt_path not in paths and alt_path not in candidate_paths:
                        candidate_paths.append(alt_path)

            if candidate_paths:
                candidate_paths.sort(key=lambda p: sum(e["length_meters"] for e in p))
                paths.append(candidate_paths.pop(0))
            else:
                break

        return paths[:k]

network_graph = RoadNetworkGraph()
