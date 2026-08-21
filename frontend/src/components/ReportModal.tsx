import React, { useState } from 'react';
import { api } from '../services/api';
import { ReportCategory, IncidentSeverity } from '../types';
import { 
  X, 
  AlertOctagon, 
  MapPin, 
  Send, 
  ShieldCheck, 
  Sparkles,
  Camera
} from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCoords: [number, number];
  onReportSubmitted: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  defaultCoords,
  onReportSubmitted,
}) => {
  const [category, setCategory] = useState<ReportCategory>('Poor Lighting');
  const [severity, setSeverity] = useState<IncidentSeverity>('HIGH');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState(defaultCoords[0]);
  const [lng, setLng] = useState(defaultCoords[1]);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.submitReport({
        category,
        severity,
        description: description || `Crowd-sourced ${category} report submitted via mobile terminal.`,
        latitude: lat,
        longitude: lng,
        is_anonymous: isAnonymous,
      });

      setSuccessMsg('Report verified & logged! Recalculating route risks...');
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMsg('');
        onReportSubmitted();
        onClose();
      }, 900);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="glass-panel w-full max-w-lg rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/70">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-100">
                Report Safety Hazard / Incident
              </h2>
              <p className="text-xs text-slate-400">
                Community crowd-sourced safety intelligence
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {successMsg && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Category Selector */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Hazard Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ReportCategory)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="Poor Lighting">Poor Lighting / Broken Lamp</option>
              <option value="Harassment">Harassment / Intimidation</option>
              <option value="Suspicious Activity">Suspicious Activity / Loitering</option>
              <option value="Accident">Accident / Collision Hazard</option>
              <option value="Road Blocked">Road / Sidewalk Blocked</option>
              <option value="Unsafe Crowd">Unsafe Crowd / Rowdy Gathering</option>
              <option value="Isolated Area">Isolated / Pitch Dark Alley</option>
              <option value="Other">Other Safety Observation</option>
            </select>
          </div>

          {/* Severity Selector */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Severity Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as IncidentSeverity[]).map((s) => {
                const color = 
                  s === 'LOW' ? 'border-lime-500 text-lime-400' :
                  s === 'MEDIUM' ? 'border-amber-500 text-amber-400' :
                  s === 'HIGH' ? 'border-orange-500 text-orange-400' : 'border-rose-500 text-rose-400';

                const isSelected = severity === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverity(s)}
                    className={`py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                      isSelected
                        ? `bg-slate-800 ${color} shadow-md`
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Description & Details
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you observed (e.g. Broken overhead streetlights creating completely dark corner near bus shelter...)"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Coordinates (Auto-detected / pinned) */}
          <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="text-[10px] text-slate-400 font-semibold uppercase block">
                Latitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold uppercase block">
                Longitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-slate-200"
              />
            </div>
          </div>

          {/* Anonymous toggle */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded accent-amber-500"
              />
              <span>Submit as Anonymous Community Observer</span>
            </label>

            <span className="text-[10px] text-slate-500">
              Reliability: 0.8 (Regular User)
            </span>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-950/40 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>SUBMIT HAZARD REPORT</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
