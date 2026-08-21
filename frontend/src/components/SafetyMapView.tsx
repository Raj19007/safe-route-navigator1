import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MapComponent } from './MapComponent';
import { SafePlace, Incident, CrowdReport, SegmentDetail } from '../types';
import { getRiskTheme } from '../utils/theme';
import { Shield, Filter, AlertTriangle, Layers, RefreshCw } from 'lucide-react';

export const SafetyMapView: React.FC = () => {
  const [segments, setSegments] = useState<SegmentDetail[]>([]);
  const [safePlaces, setSafePlaces] = useState<SafePlace[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [reports, setReports] = useState<CrowdReport[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<SegmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  const loadSafetyMap = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSafetyMap();
      setSegments(data.segments || []);
      setSafePlaces(data.safe_places || []);
      setIncidents(data.incidents || []);
      setReports(data.reports || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSafetyMap();
  }, []);

  const filteredSegments = segments.filter(s => {
    if (filterLevel === 'ALL') return true;
    if (filterLevel === 'SAFE') return s.risk_score <= 40;
    if (filterLevel === 'MODERATE') return s.risk_score > 40 && s.risk_score <= 60;
    if (filterLevel === 'HIGH') return s.risk_score > 60;
    return true;
  });

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Controls & Segment Inspector */}
      <div className="w-full md:w-80 glass-panel p-4 z-20 flex flex-col gap-4 border-r border-slate-800 shrink-0 overflow-y-auto max-h-[40vh] md:max-h-full">
        <div>
          <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            City-Wide Safety Topology
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-dimensional safety map & emergency nodes
          </p>
        </div>

        {/* Filter Buttons */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
            Risk Filter
          </label>
          <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {['ALL', 'SAFE', 'MODERATE', 'HIGH'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`py-1 rounded-lg text-[10px] font-bold transition-all ${
                  filterLevel === lvl
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Road Segments</span>
            <span className="text-base font-bold text-slate-100">{segments.length}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Safe Havens</span>
            <span className="text-base font-bold text-emerald-400">{safePlaces.length}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Crowd Alerts</span>
            <span className="text-base font-bold text-amber-400">{reports.length}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Historical Logs</span>
            <span className="text-base font-bold text-slate-300">{incidents.length}</span>
          </div>
        </div>

        {/* Top Hazards list */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Active Community Alerts
          </h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
            {reports.slice(0, 15).map(rep => (
              <div key={rep.id} className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-slate-200">{rep.category}</span>
                  <span className="text-rose-400">{rep.severity}</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{rep.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map View */}
      <div className="flex-1 h-full min-h-[300px]">
        <MapComponent
          routes={[]}
          selectedRoute={null}
          onSelectRoute={() => {}}
          originCoords={[18.6465, 73.7597]}
          destCoords={[18.6508, 73.7705]}
          safePlaces={safePlaces}
          incidents={incidents}
          reports={reports}
        />
      </div>
    </div>
  );
};
