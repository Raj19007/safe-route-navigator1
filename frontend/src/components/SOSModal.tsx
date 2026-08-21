import React from 'react';
import { SafePlace } from '../types';
import { 
  X, 
  PhoneCall, 
  ShieldAlert, 
  MapPin, 
  Navigation, 
  Cross, 
  HeartHandshake, 
  ExternalLink 
} from 'lucide-react';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCoords: [number, number];
  safePlaces: SafePlace[];
}

export const SOSModal: React.FC<SOSModalProps> = ({
  isOpen,
  onClose,
  currentCoords,
  safePlaces,
}) => {
  if (!isOpen) return null;

  const emergencyContacts = [
    { title: 'National Emergency Response', number: '112', desc: 'All-in-one Police, Fire & Ambulance', color: 'bg-rose-600' },
    { title: 'Police Rapid Dispatch', number: '100', desc: 'Direct Municipal Police Control Room', color: 'bg-blue-600' },
    { title: 'Medical Trauma & Ambulance', number: '108', desc: 'Emergency Medical Services (EMS)', color: 'bg-emerald-600' },
    { title: "Women's Safety Helpline", number: '1091', desc: '24/7 Rapid Women Safety Support', color: 'bg-purple-600' },
  ];

  // Nearest police & hospital
  const nearestPolice = safePlaces.find(p => p.category === 'police');
  const nearestHospital = safePlaces.find(p => p.category === 'hospital');
  const nearestPharmacy = safePlaces.find(p => p.category === 'pharmacy' || p.category === 'safe_haven');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="glass-panel w-full max-w-xl rounded-2xl shadow-2xl border border-rose-500/50 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-rose-900/60 bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center shadow-glow-red hazard-pulse">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-black text-lg text-white tracking-wide">
                EMERGENCY SOS ASSISTANCE
              </h2>
              <p className="text-xs text-rose-300">
                Direct Emergency Dispatch & Nearest Safe Haven Guidance
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-rose-300 hover:text-white hover:bg-rose-900/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          {/* GPS Coordinates Broadcast */}
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-rose-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-rose-400" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Your Current GPS Lock</span>
                <span className="font-mono font-bold text-slate-200">
                  {currentCoords[0].toFixed(5)}, {currentCoords[1].toFixed(5)}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              GPS Active
            </span>
          </div>

          {/* Quick 1-Tap Emergency Dialers */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
              Instant Emergency Dialers
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {emergencyContacts.map((c, i) => (
                <a
                  key={i}
                  href={`tel:${c.number}`}
                  className="bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-rose-500/50 p-3.5 rounded-xl transition-all flex items-center justify-between group shadow-sm"
                >
                  <div>
                    <h4 className="font-bold text-xs text-slate-100 group-hover:text-rose-300 transition-colors">
                      {c.title}
                    </h4>
                    <p className="text-[11px] text-slate-400">{c.desc}</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg text-white font-extrabold text-xs shadow-md ${c.color}`}>
                    {c.number}
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Nearest Physical Safe Havens */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              Nearest Safe Havens (Immediate Refuge)
            </h3>

            <div className="space-y-2">
              {nearestPolice && (
                <div className="bg-slate-900/60 p-3 rounded-xl border border-blue-500/30 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-blue-400 font-bold uppercase block">Nearest Police Precinct</span>
                    <strong className="text-slate-100">{nearestPolice.name}</strong>
                    <p className="text-[11px] text-slate-400">{nearestPolice.address}</p>
                  </div>
                  <a
                    href={`tel:${nearestPolice.phone}`}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                </div>
              )}

              {nearestHospital && (
                <div className="bg-slate-900/60 p-3 rounded-xl border border-rose-500/30 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-rose-400 font-bold uppercase block">Nearest Emergency Trauma Center</span>
                    <strong className="text-slate-100">{nearestHospital.name}</strong>
                    <p className="text-[11px] text-slate-400">{nearestHospital.address}</p>
                  </div>
                  <a
                    href={`tel:${nearestHospital.phone}`}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
          >
            Close Emergency Panel
          </button>
        </div>
      </div>
    </div>
  );
};
