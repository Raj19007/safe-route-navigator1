import React from 'react';
import { 
  MapPin, 
  Navigation, 
  User, 
  Clock, 
  Sun, 
  Moon, 
  CloudRain, 
  Search, 
  Sparkles, 
  Compass,
  Footprints,
  Bike,
  Car,
  Accessibility,
  Crosshair,
  Volume2,
  VolumeX,
  Building
} from 'lucide-react';
import { TravelMode, UserProfile, PresetRoute } from '../types';

interface NavigationControlPanelProps {
  originText: string;
  setOriginText: (text: string) => void;
  destText: string;
  setDestText: (text: string) => void;
  originCoords: [number, number];
  destCoords: [number, number];
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  travelMode: TravelMode;
  setTravelMode: (mode: TravelMode) => void;
  timeHour: number;
  setTimeHour: (hour: number) => void;
  weather: string;
  setWeather: (w: string) => void;
  presets: PresetRoute[];
  onSelectPreset: (preset: PresetRoute) => void;
  onCalculateRoutes: () => void;
  onLocateMe: () => void;
  isLocating: boolean;
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  isLoading: boolean;
}

export const NavigationControlPanel: React.FC<NavigationControlPanelProps> = ({
  originText,
  setOriginText,
  destText,
  setDestText,
  userProfile,
  setUserProfile,
  travelMode,
  setTravelMode,
  timeHour,
  setTimeHour,
  weather,
  setWeather,
  presets,
  onSelectPreset,
  onCalculateRoutes,
  onLocateMe,
  isLocating,
  voiceEnabled,
  setVoiceEnabled,
  isLoading,
}) => {
  const formatTimeStr = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const dispH = h % 12 === 0 ? 12 : h % 12;
    return `${dispH}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const isNight = timeHour >= 20 || timeHour <= 5.5;

  return (
    <div className="glass-panel rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-700/60 text-slate-100 flex flex-col gap-4">
      {/* Header & Presets */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Compass className="w-5 h-5 text-emerald-400 animate-pulse" />
          <span className="font-extrabold text-xs sm:text-sm tracking-wider uppercase text-slate-200">
            Route Optimizer
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Voice Assistant Toggle Button */}
          <button
            type="button"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
              voiceEnabled 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-glow-cyan' 
                : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
            title={voiceEnabled ? 'Voice Guidance Enabled' : 'Voice Guidance Muted'}
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline text-[10px]">{voiceEnabled ? 'Audio ON' : 'Muted'}</span>
          </button>
          
          {presets.length > 0 && (
            <div className="flex items-center space-x-1">
              <select
                onChange={(e) => {
                  const found = presets.find(p => p.id === e.target.value);
                  if (found) onSelectPreset(found);
                }}
                className="bg-slate-900/90 text-xs text-amber-300 font-medium px-2 py-1.5 rounded-xl border border-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer max-w-[130px] sm:max-w-none"
                defaultValue=""
              >
                <option value="" disabled>Presets / Scenarios...</option>
                {presets.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Origin & Destination Inputs with GPS Locate Button */}
      <div className="space-y-2.5">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-glow-emerald" />
              From (Origin)
            </label>
            <button
              type="button"
              onClick={onLocateMe}
              disabled={isLocating}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 hover:underline transition-all"
            >
              <Crosshair className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating GPS...' : 'Use My GPS Location'}</span>
            </button>
          </div>
          <div className="relative flex items-center">
            <MapPin className="w-4 h-4 text-emerald-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={originText}
              onChange={(e) => setOriginText(e.target.value)}
              placeholder="e.g. DY Patil Campus or GPS Location"
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-rose-400 shadow-glow-red" />
            To (Destination)
          </label>
          <div className="relative flex items-center">
            <Navigation className="w-4 h-4 text-rose-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={destText}
              onChange={(e) => setDestText(e.target.value)}
              placeholder="e.g. Akurdi Railway Station or City Center"
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Profile & Mode Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* User Profile */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
            <User className="w-3 h-3 text-indigo-400" />
            Profile
          </label>
          <select
            value={userProfile}
            onChange={(e) => setUserProfile(e.target.value as UserProfile)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="GENERAL">General Commuter</option>
            <option value="WOMAN">Woman (Priority Safety)</option>
            <option value="CHILD_GUARDIAN">Child / Guardian</option>
            <option value="ELDERLY">Elderly (Footing & Light)</option>
            <option value="ACCESSIBILITY">Accessibility (Ramps)</option>
          </select>
        </div>

        {/* Travel Mode */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
            <Navigation className="w-3 h-3 text-teal-400" />
            Mode
          </label>
          <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setTravelMode('WALKING')}
              title="Walking"
              className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${
                travelMode === 'WALKING'
                  ? 'bg-emerald-600 text-white shadow-glow-emerald'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setTravelMode('CYCLING')}
              title="Cycling"
              className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${
                travelMode === 'CYCLING'
                  ? 'bg-emerald-600 text-white shadow-glow-emerald'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setTravelMode('DRIVING')}
              title="Driving"
              className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${
                travelMode === 'DRIVING'
                  ? 'bg-emerald-600 text-white shadow-glow-emerald'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setTravelMode('ACCESSIBILITY')}
              title="Accessibility / Wheelchair"
              className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${
                travelMode === 'ACCESSIBILITY'
                  ? 'bg-emerald-600 text-white shadow-glow-emerald'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Accessibility className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Simulated Time of Day */}
      <div className="space-y-2 pt-1 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-amber-400" />
            Simulated Time:
          </label>
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-amber-300">
            {isNight ? <Moon className="w-3 h-3 text-indigo-400" /> : <Sun className="w-3 h-3 text-amber-400" />}
            <span>{formatTimeStr(timeHour)}</span>
          </div>
        </div>

        {/* Quick Time Pills */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => setTimeHour(9.0)}
            className={`py-1 rounded-lg text-[10px] font-semibold transition-all border ${
              timeHour === 9.0
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-glow-amber'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            Day (9 AM)
          </button>
          <button
            type="button"
            onClick={() => setTimeHour(14.0)}
            className={`py-1 rounded-lg text-[10px] font-semibold transition-all border ${
              timeHour === 14.0
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-glow-amber'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            Peak (2 PM)
          </button>
          <button
            type="button"
            onClick={() => setTimeHour(18.5)}
            className={`py-1 rounded-lg text-[10px] font-semibold transition-all border ${
              timeHour === 18.5
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            Dusk (6:30 PM)
          </button>
          <button
            type="button"
            onClick={() => setTimeHour(23.5)}
            className={`py-1 rounded-lg text-[10px] font-semibold transition-all border ${
              timeHour === 23.5
                ? 'bg-indigo-500/30 text-indigo-300 border-indigo-500/50 shadow-glow-indigo'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            Night (11:30 PM)
          </button>
        </div>

        {/* Continuous Slider */}
        <input
          type="range"
          min="0"
          max="23.75"
          step="0.25"
          value={timeHour}
          onChange={(e) => setTimeHour(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
      </div>

      {/* Primary CTA */}
      <button
        onClick={onCalculateRoutes}
        disabled={isLoading}
        className="w-full mt-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-glow-emerald transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Calculating Safety Metrics...</span>
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            <span>FIND SAFE ROUTE</span>
          </>
        )}
      </button>
    </div>
  );
};

