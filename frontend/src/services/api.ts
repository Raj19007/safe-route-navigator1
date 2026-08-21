import axios from 'axios';
import { RouteResponse, PresetRoute, SafePlace, CrowdReport, AdminDashboardData, UserAuth } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Set Auth Token in headers
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('saferoute_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Routes
  calculateRoutes: async (payload: {
    origin_lat: number;
    origin_lng: number;
    dest_lat: number;
    dest_lng: number;
    origin_name?: string;
    dest_name?: string;
    user_profile: string;
    travel_mode: string;
    hour?: number;
    weather?: string;
  }): Promise<RouteResponse> => {
    const res = await apiClient.post<RouteResponse>('/routes/calculate', payload);
    return res.data;
  },

  getPresets: async (): Promise<PresetRoute[]> => {
    const res = await apiClient.get<PresetRoute[]>('/routes/presets');
    return res.data;
  },

  // Safety Map
  getSafetyMap: async (params?: { hour?: number; user_profile?: string; travel_mode?: string }) => {
    const res = await apiClient.get('/risk/safety-map', { params });
    return res.data;
  },

  // Safe Places
  getSafePlaces: async (category?: string, lat?: number, lng?: number): Promise<SafePlace[]> => {
    const res = await apiClient.get<SafePlace[]>('/places/safe', {
      params: { category, lat, lng }
    });
    return res.data;
  },

  // Crowd Reports
  submitReport: async (payload: {
    category: string;
    severity: string;
    description: string;
    latitude: number;
    longitude: number;
    is_anonymous?: boolean;
    photo_url?: string;
  }): Promise<CrowdReport> => {
    const res = await apiClient.post<CrowdReport>('/reports', payload);
    return res.data;
  },

  getNearbyReports: async (lat: number, lng: number, radius?: number): Promise<CrowdReport[]> => {
    const res = await apiClient.get<CrowdReport[]>('/reports/nearby', {
      params: { lat, lng, radius }
    });
    return res.data;
  },

  // Admin
  getAdminDashboard: async (): Promise<AdminDashboardData> => {
    const res = await apiClient.get<AdminDashboardData>('/admin/dashboard');
    return res.data;
  },

  verifyReport: async (reportId: string): Promise<CrowdReport> => {
    const res = await apiClient.post<CrowdReport>(`/admin/reports/${reportId}/verify`);
    return res.data;
  },

  rejectReport: async (reportId: string): Promise<CrowdReport> => {
    const res = await apiClient.post<CrowdReport>(`/admin/reports/${reportId}/reject`);
    return res.data;
  },

  // Auth
  login: async (email: string, password: string): Promise<UserAuth> => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },

  register: async (email: string, password: string, full_name: string, role: string = 'user'): Promise<UserAuth> => {
    const res = await apiClient.post('/auth/register', { email, password, full_name, role });
    return res.data;
  }
};
