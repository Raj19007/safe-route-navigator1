import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AdminDashboardData } from '../types';
import { getRiskTheme } from '../utils/theme';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Sparkles,
  TrendingUp,
  FileText
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerify = async (id: string) => {
    try {
      await api.verifyReport(id);
      setActionMsg(`Report ${id} verified! Reliability boosted.`);
      setTimeout(() => setActionMsg(''), 2500);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.rejectReport(id);
      setActionMsg(`Report ${id} rejected & removed from risk calculation.`);
      setTimeout(() => setActionMsg(''), 2500);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickAdminAuth = async () => {
    setIsLoading(true);
    try {
      const authRes = await api.login('admin@saferoute.local', 'admin123');
      localStorage.setItem('saferoute_auth_token', authRes.token);
      setActionMsg('✓ Authenticated as Municipal Admin!');
      loadData();
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-12 text-slate-300 space-y-4">
        <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold">Loading Municipal Safety Telemetry...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center">
        <div className="glass-panel p-8 rounded-3xl border border-purple-500/40 max-w-md space-y-4 shadow-glow-indigo">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto text-purple-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-slate-100">Municipal Admin Access</h2>
          <p className="text-xs text-slate-400">
            Authenticate to review live hazard queues, adjust spatial risk parameters, and monitor city-wide safety telemetry.
          </p>
          <button
            onClick={handleQuickAdminAuth}
            className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider shadow-glow-indigo transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-purple-200" />
            <span>1-Click Admin Sign In</span>
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
            Municipal Safety Administration Console
          </h2>
          <p className="text-xs text-slate-400">
            Real-time hazard telemetry, crowd observation verification, and data quality assurance
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Reports */}
        <div className="glass-card p-3.5 rounded-2xl border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Reports</span>
          <span className="text-2xl font-black text-slate-100">{data.total_reports}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">{data.reports_today} submitted today</span>
        </div>

        {/* Pending Verification */}
        <div className="glass-card p-3.5 rounded-2xl border border-amber-500/30 bg-amber-950/10">
          <span className="text-[10px] uppercase font-bold text-amber-400 block">Pending Review</span>
          <span className="text-2xl font-black text-amber-300">{data.pending_reports}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{data.verified_reports} verified</span>
        </div>

        {/* Active Alerts */}
        <div className="glass-card p-3.5 rounded-2xl border border-rose-500/30 bg-rose-950/10">
          <span className="text-[10px] uppercase font-bold text-rose-400 block">Active Alerts</span>
          <span className="text-2xl font-black text-rose-400">{data.active_alerts_count}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">High/Critical severity</span>
        </div>

        {/* High-Risk Segments */}
        <div className="glass-card p-3.5 rounded-2xl border border-orange-500/30">
          <span className="text-[10px] uppercase font-bold text-orange-400 block">High-Risk Segments</span>
          <span className="text-2xl font-black text-orange-400">{data.high_risk_segments_count}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Score &gt; 60/100</span>
        </div>

        {/* Routes Analyzed */}
        <div className="glass-card p-3.5 rounded-2xl border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-indigo-400 block">Routes Analyzed</span>
          <span className="text-2xl font-black text-indigo-300">{data.routes_analyzed_count}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Total calculations</span>
        </div>

        {/* Average Confidence */}
        <div className="glass-card p-3.5 rounded-2xl border border-emerald-500/30">
          <span className="text-[10px] uppercase font-bold text-emerald-400 block">Avg Confidence</span>
          <span className="text-2xl font-black text-emerald-400">{data.avg_system_confidence}%</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">System certainty</span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Incident Verification Queue */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              Community Report Verification Queue
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {data.recent_reports.length} Recent Submissions
            </span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {data.recent_reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-100">{rep.category}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                      rep.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                      rep.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' :
                      rep.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                      'bg-lime-500/20 text-lime-300 border-lime-500/40'
                    }`}>
                      {rep.severity}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                      rep.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400' :
                      rep.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {rep.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{rep.description}</p>
                  <div className="flex items-center space-x-3 text-[10px] text-slate-500 font-mono">
                    <span>Lat: {rep.latitude.toFixed(4)}, Lng: {rep.longitude.toFixed(4)}</span>
                    <span>Reliability: {rep.reliability}</span>
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="flex items-center space-x-1.5 shrink-0">
                  {rep.status !== 'VERIFIED' && (
                    <button
                      onClick={() => handleVerify(rep.id)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-xs font-bold transition-all border border-emerald-500/30 flex items-center gap-1"
                      title="Verify Report"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verify</span>
                    </button>
                  )}
                  {rep.status !== 'REJECTED' && (
                    <button
                      onClick={() => handleReject(rep.id)}
                      className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold transition-all border border-rose-500/30 flex items-center gap-1"
                      title="Reject Report"
                    >
                      <XCircle className="w-3 h-3" />
                      <span>Reject</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: High-Risk Segments Monitor */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              High-Risk Corridor Watchlist
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Top Bottlenecks
            </span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {data.high_risk_segments.map((seg, idx) => {
              const theme = getRiskTheme(seg.risk_score, seg.is_limited_data);
              return (
                <div
                  key={idx}
                  className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-100">{seg.name}</span>
                    <span
                      className="text-xs font-extrabold px-2 py-0.5 rounded"
                      style={{ color: theme.color, backgroundColor: theme.bgColor }}
                    >
                      Risk: {Math.round(seg.risk_score)}/100
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                    <span>Length: {Math.round(seg.length_meters)}m</span>
                    <span>•</span>
                    <span>Confidence: {Math.round(seg.confidence_score)}%</span>
                  </div>

                  {seg.warnings && seg.warnings.length > 0 && (
                    <p className="text-[11px] text-amber-400 font-medium">
                      ⚠ {seg.warnings[0]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
