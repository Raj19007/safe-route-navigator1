import React from 'react';
import { RouteAlternative } from '../types';
import { getRiskTheme, getConfidenceBadge } from '../utils/theme';
import { Clock, Navigation, Shield, AlertTriangle, CheckCircle2, Star, Eye } from 'lucide-react';

interface RouteCardProps {
  route: RouteAlternative;
  isSelected: boolean;
  onSelect: () => void;
  onOpenExplainer: () => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({
  route,
  isSelected,
  onSelect,
  onOpenExplainer,
}) => {
  const riskTheme = getRiskTheme(route.risk_score, route.is_limited_data);
  const confBadge = getConfidenceBadge(route.confidence_score);

  return (
    <div
      onClick={onSelect}
      className={`glass-card rounded-2xl p-4 transition-all duration-300 cursor-pointer border relative overflow-hidden ${
        isSelected
          ? 'border-emerald-500/80 bg-slate-800/90 shadow-glow-emerald scale-[1.01]'
          : 'border-slate-800/80 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-800/60'
      }`}
    >
      {/* Recommended Banner */}
      {route.is_recommended && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-slate-950 font-black text-[10px] uppercase tracking-wider px-3 py-0.5 rounded-bl-xl flex items-center space-x-1 shadow-md">
          <Star className="w-3 h-3 fill-slate-950 text-slate-950" />
          <span>RECOMMENDED</span>
        </div>
      )}

      {/* Header Info */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-extrabold text-sm text-slate-100 tracking-wide">
              {route.title}
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
              {route.route_type}
            </span>
          </div>

          <div className="flex items-center space-x-3 mt-1 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1 text-slate-200 font-bold">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              {route.duration_min_str}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Navigation className="w-3.5 h-3.5 text-slate-400" />
              {route.distance_km_str}
            </span>
          </div>
        </div>
      </div>

      {/* Risk & Confidence Badges */}
      <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
        {/* Estimated Risk */}
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Estimated Risk
          </span>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span
              className="text-lg font-extrabold tracking-tight"
              style={{ color: riskTheme.color }}
            >
              {Math.round(route.risk_score)}
            </span>
            <span className="text-xs text-slate-500 font-medium">/ 100</span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ml-1 ${riskTheme.badgeClass}`}
            >
              {route.risk_label}
            </span>
          </div>
        </div>

        {/* Confidence */}
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Confidence
          </span>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className="text-lg font-extrabold text-slate-200">
              {Math.round(route.confidence_score)}%
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${confBadge.badgeClass}`}
            >
              {confBadge.label}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Factors Preview */}
      <div className="space-y-1 text-xs mb-3">
        {route.positives.slice(0, 1).map((p, idx) => (
          <div key={idx} className="flex items-center space-x-1.5 text-emerald-400/90 text-[11px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">{p}</span>
          </div>
        ))}
        {route.warnings.slice(0, 1).map((w, idx) => (
          <div key={idx} className="flex items-center space-x-1.5 text-amber-400/90 text-[11px]">
            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">{w}</span>
          </div>
        ))}
      </div>

      {/* Action Footers */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenExplainer();
          }}
          className="flex items-center space-x-1 text-xs text-indigo-300 hover:text-indigo-200 font-semibold transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Explain Why</span>
        </button>

        <span className="text-[11px] text-slate-400">
          {route.segments.length} segments analyzed
        </span>
      </div>
    </div>
  );
};
