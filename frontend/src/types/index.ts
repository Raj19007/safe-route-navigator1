export type TravelMode = 'WALKING' | 'CYCLING' | 'DRIVING' | 'ACCESSIBILITY';
export type UserProfile = 'GENERAL' | 'WOMAN' | 'CHILD_GUARDIAN' | 'ELDERLY' | 'ACCESSIBILITY';
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ReportCategory = 
  | 'Poor Lighting'
  | 'Harassment'
  | 'Suspicious Activity'
  | 'Accident'
  | 'Road Blocked'
  | 'Unsafe Crowd'
  | 'Isolated Area'
  | 'Other';

export interface FactorDetail {
  key: string;
  name: string;
  normalized_value: number;
  weight: number;
  weighted_score: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface SegmentDetail {
  segment_id?: string;
  name?: string;
  length_meters: number;
  risk_score: number;
  confidence_score: number;
  confidence_level?: string;
  confidence_label?: string;
  is_limited_data: boolean;
  risk_grade?: string;
  risk_label?: string;
  risk_color?: string;
  factors: FactorDetail[];
  positives: string[];
  warnings: string[];
  ai_explanation?: string;
  geometry?: {
    type: string;
    coordinates: number[][];
  };
}

export interface RouteAlternative {
  route_id: string;
  route_type: 'FASTEST' | 'BALANCED' | 'SAFEST';
  is_recommended: boolean;
  title: string;
  badge_label: string;
  distance_meters: number;
  distance_km_str: string;
  duration_seconds: number;
  duration_min_str: string;
  risk_score: number;
  confidence_score: number;
  confidence_label: string;
  is_limited_data: boolean;
  risk_grade: string;
  risk_label: string;
  risk_color: string;
  ai_explanation: string;
  positives: string[];
  warnings: string[];
  factors: FactorDetail[];
  segments: SegmentDetail[];
  coordinates: number[][]; // [[lng, lat], ...]
}

export interface RouteResponse {
  routes: RouteAlternative[];
  recommended_route_id: string;
  travel_mode: TravelMode;
  user_profile: UserProfile;
  simulated_time_str: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  active_hazard_count: number;
}

export interface PresetRoute {
  id: string;
  title: string;
  description: string;
  origin_name: string;
  origin_coords: [number, number];
  dest_name: string;
  dest_coords: [number, number];
  recommended_mode: TravelMode;
  scenario_hint: string;
}

export interface SafePlace {
  id: string;
  name: string;
  category: 'police' | 'hospital' | 'pharmacy' | 'safe_haven' | 'fire_station';
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  is_24_7: boolean;
  emergency_types: string[];
  distance_meters?: number;
}

export interface Incident {
  id: string;
  category: string;
  severity: IncidentSeverity;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  occurred_at?: string;
}

export interface CrowdReport {
  id: string;
  user_id?: string;
  category: ReportCategory;
  severity: IncidentSeverity;
  description?: string;
  latitude: number;
  longitude: number;
  segment_id?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'DUPLICATE';
  reliability: number;
  upvotes: number;
  created_at: string;
}

export interface AdminDashboardData {
  total_reports: number;
  pending_reports: number;
  verified_reports: number;
  rejected_reports: number;
  high_risk_segments_count: number;
  active_alerts_count: number;
  routes_analyzed_count: number;
  avg_system_confidence: number;
  reports_today: number;
  reports_by_category: Record<string, number>;
  reports_by_severity: Record<string, number>;
  recent_reports: CrowdReport[];
  high_risk_segments: SegmentDetail[];
}

export interface UserAuth {
  user_id: string;
  email: string;
  role: 'user' | 'admin';
  full_name: string;
  token: string;
}
