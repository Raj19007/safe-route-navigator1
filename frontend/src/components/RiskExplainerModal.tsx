import React from 'react';
import { RouteAlternative } from '../types';
import { getRiskTheme, getConfidenceBadge } from '../utils/theme';
import { 
  X, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  Info, 
  Layers,
  HelpCircle
} from 'lucide-react';

interface RiskExplainerModalProps {
  route: RouteAlternative | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RiskExplainerModal: React.FC<RiskExplainerModalProps> = ({
  route,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !route) return null;

  const riskTheme = getRiskTheme(route.risk_score, route.is_limited_data);
  const confBadge = getConfidenceBadge(route.confidence_score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="glass-panel w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                Safety & Risk Explainability Breakdown
              </h2>
              <p className="text-xs text-slate-400">
                Transparent multi-factor decomposition for {route.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Top Score Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            {/* Risk Score */}
            <div className="flex flex-col">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                Estimated Risk Score
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-black" style={{ color: riskTheme.color }}>
                  {Math.round(route.risk_score)}
                </span>
                <span className="text-sm text-slate-500 font-bold">/ 100</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ml-2 ${riskTheme.badgeClass}`}>
                  {route.risk_label}
                </span>
              </div>
            </div>

            {/* Confidence */}
            <div className="flex flex-col">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                Data Certainty (Confidence)
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-black text-slate-100">
                  {Math.round(route.confidence_score)}%
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${confBadge.badgeClass}`}>
                  {confBadge.label}
                </span>
              </div>
            </div>

            {/* Distance / Duration */}
            <div className="flex flex-col">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                Travel Dimensions
              </span>
              <div className="mt-1 text-sm font-semibold text-slate-200">
                <span>{route.duration_min_str}</span>
                <span className="mx-2 text-slate-600">•</span>
                <span>{route.distance_km_str}</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5">
                {route.segments.length} evaluated road segments
              </span>
            </div>
          </div>

          {/* AI Narrative Explanation */}
          <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/40 p-4 rounded-xl border border-indigo-500/20">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-indigo-300">
                Explainable Safety Assessment
              </h3>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {route.ai_explanation}
            </p>
          </div>

          {/* Positives & Warnings Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Positive Indicators */}
            <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <h4 className="font-bold text-xs uppercase tracking-wider">
                  Positive Safety Factors
                </h4>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {route.positives.map((p, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Warnings & Risk Alerts */}
            <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <h4 className="font-bold text-xs uppercase tracking-wider">
                  Hazards & Elevated Risks
                </h4>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {route.warnings.map((w, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-amber-400 font-bold">⚠</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* All 9 Evaluated Factors Progress Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                All 9 Factor Weight Contributions
              </h4>
              <span className="text-[11px] text-slate-500">
                Scale: 0.0 (Safe) → 1.0 (Risky)
              </span>
            </div>

            <div className="space-y-3">
              {route.factors.map((factor) => {
                const percent = Math.round(factor.normalized_value * 100);
                const impactColor = 
                  factor.impact === 'low' ? 'bg-emerald-500' :
                  factor.impact === 'medium' ? 'bg-amber-500' :
                  factor.impact === 'high' ? 'bg-orange-500' : 'bg-rose-500';

                return (
                  <div key={factor.key} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-200">{factor.name}</span>
                        <span className="text-[10px] text-slate-400">
                          (Weight: {Math.round(factor.weight * 100)}%)
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] text-slate-400 font-mono">
                          Val: {factor.normalized_value.toFixed(2)}
                        </span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded text-white ${impactColor}`}>
                          {factor.impact}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${impactColor}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-400">
                      {factor.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Critical Safety Principle & Disclaimer */}
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-700/80 flex items-start space-x-3 text-xs text-slate-400">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-slate-200 block font-semibold">
                Critical Safety Principle
              </strong>
              <p>
                The system provides an <strong>Estimated Risk Score</strong> and explicit uncertainty confidence. 
                It does <strong>NOT</strong> predict the occurrence of crime. Areas with limited historical logs or sparse crowd observations are marked with lower confidence rather than assumed safe.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
