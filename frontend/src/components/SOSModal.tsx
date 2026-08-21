import React, { useState } from 'react';
import { SafePlace } from '../types';
import { 
  X, 
  PhoneCall, 
  ShieldAlert, 
  MapPin, 
  Navigation, 
  Share2, 
  MessageSquare, 
  Copy, 
  Check,
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
  const [copied, setCopied] = useState(false);
  const [emergencyPhone, setEmergencyPhone] = useState('');

  if (!isOpen) return null;

  const lat = currentCoords[0].toFixed(5);
  const lng = currentCoords[1].toFixed(5);
  const googleMapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
  const emergencyMessage = `🚨 *EMERGENCY SOS ALERT!* 🚨\nI am in an emergency and need immediate assistance.\n📍 My Live Location: ${googleMapsUrl}\n⏰ Time: ${new Date().toLocaleTimeString()}`;

  const handleCopyLocation = () => {
    navigator.clipboard.writeText(`EMERGENCY: Need help! My location: ${googleMapsUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppSOS = () => {
    const encoded = encodeURIComponent(emergencyMessage);
    const targetUrl = emergencyPhone 
      ? `https://api.whatsapp.com/send?phone=${emergencyPhone.replace(/\D/g, '')}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(targetUrl, '_blank');
  };

  const handleSmsSOS = () => {
    const encoded = encodeURIComponent(`EMERGENCY SOS: Need assistance! My location: ${googleMapsUrl}`);
    window.open(`sms:${emergencyPhone}?body=${encoded}`, '_self');
  };

  const emergencyContacts = [
    { title: 'National Emergency Helpline', number: '112', desc: 'All-in-one Police, Medical & Fire Dispatch', color: 'bg-rose-600' },
    { title: 'Police Control Room', number: '100', desc: 'Direct Police Rapid Response', color: 'bg-blue-600' },
    { title: 'Medical Trauma & Ambulance', number: '108', desc: 'Emergency Medical Services (EMS)', color: 'bg-emerald-600' },
    { title: "Women's Safety Helpline", number: '1091', desc: '24/7 Rapid Women Protection Unit', color: 'bg-purple-600' },
  ];

  // Nearest police & hospital
  const nearestPolice = safePlaces.find(p => p.category === 'police');
  const nearestHospital = safePlaces.find(p => p.category === 'hospital');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-in fade-in duration-200">
      <div 
        className="glass-panel w-full max-w-xl rounded-3xl shadow-2xl border border-rose-500/50 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-rose-900/60 bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-600 flex items-center justify-center shadow-glow-red hazard-pulse">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-black text-lg text-white tracking-wide">
                EMERGENCY SOS ASSISTANCE
              </h2>
              <p className="text-xs text-rose-300 font-medium">
                Live Location Broadcast & Rapid Emergency Dispatch
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-rose-300 hover:text-white hover:bg-rose-900/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(85vh-120px)]">
          {/* GPS Coordinates Broadcast & WhatsApp 1-Tap Share */}
          <div className="bg-gradient-to-br from-slate-900/95 to-slate-950 p-4 rounded-2xl border border-rose-500/30 space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <MapPin className="w-5 h-5 text-rose-400 animate-bounce" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Your Live GPS Coordinates</span>
                  <span className="font-mono font-bold text-slate-100 text-sm">
                    {lat}, {lng}
                  </span>
                </div>
              </div>
              <button
                onClick={handleCopyLocation}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            {/* Custom Contact input & 1-Tap Broadcast */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="Optional: Trusted Contact Phone Number"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleWhatsAppSOS}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-glow-emerald transition-all"
                >
                  <MessageSquare className="w-4 h-4 fill-white" />
                  <span>Send via WhatsApp</span>
                </button>

                <button
                  onClick={handleSmsSOS}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-glow-red transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Send SOS SMS</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick 1-Tap Emergency Dialers */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
              Instant Emergency Helpline Dialers
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {emergencyContacts.map((c, i) => (
                <a
                  key={i}
                  href={`tel:${c.number}`}
                  className="bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-rose-500/50 p-3 rounded-xl transition-all flex items-center justify-between group shadow-sm"
                >
                  <div>
                    <h4 className="font-bold text-xs text-slate-100 group-hover:text-rose-300 transition-colors">
                      {c.title}
                    </h4>
                    <p className="text-[10px] text-slate-400">{c.desc}</p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg text-white font-black text-xs shadow-md ${c.color}`}>
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
              Nearest Safe Havens (Immediate Physical Refuge)
            </h3>

            <div className="space-y-2">
              {nearestPolice && (
                <div className="bg-slate-900/70 p-3 rounded-xl border border-blue-500/30 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-blue-400 font-bold uppercase block">Nearest Police Precinct</span>
                    <strong className="text-slate-100 font-semibold">{nearestPolice.name}</strong>
                    <p className="text-[11px] text-slate-400">{nearestPolice.address}</p>
                  </div>
                  <a
                    href={`tel:${nearestPolice.phone}`}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                </div>
              )}

              {nearestHospital && (
                <div className="bg-slate-900/70 p-3 rounded-xl border border-rose-500/30 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-rose-400 font-bold uppercase block">Nearest Emergency Trauma Center</span>
                    <strong className="text-slate-100 font-semibold">{nearestHospital.name}</strong>
                    <p className="text-[11px] text-slate-400">{nearestHospital.address}</p>
                  </div>
                  <a
                    href={`tel:${nearestHospital.phone}`}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
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
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/90 flex justify-end">
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

