import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { NavigationControlPanel } from './components/NavigationControlPanel';
import { RouteCard } from './components/RouteCard';
import { MapComponent } from './components/MapComponent';
import { RiskExplainerModal } from './components/RiskExplainerModal';
import { ReportModal } from './components/ReportModal';
import { SOSModal } from './components/SOSModal';
import { DemoScenarioBar } from './components/DemoScenarioBar';
import { AdminDashboard } from './components/AdminDashboard';
import { SafetyMapView } from './components/SafetyMapView';
import { AuthModal } from './components/AuthModal';
import { LocationSearchInput } from './components/LocationSearchInput';
import { api } from './services/api';
import { 
  RouteAlternative, 
  PresetRoute, 
  SafePlace, 
  Incident, 
  CrowdReport, 
  TravelMode, 
  UserProfile,
  UserAuth 
} from './types';
import { 
  Shield, 
  Clock, 
  MapPin, 
  Navigation, 
  Sparkles, 
  AlertOctagon, 
  Info,
  ChevronDown
} from 'lucide-react';

export const App: React.FC = () => {
  // Navigation State - Centered on DY Patil Technical Campus, Talsande, Kolhapur
  const [activeTab, setActiveTab] = useState<'navigator' | 'safety-map' | 'admin'>('navigator');
  const [originText, setOriginText] = useState('🎓 D. Y. Patil Technical Campus, Talsande, Kolhapur');
  const [destText, setDestText] = useState('Chhatrapati Shahu Maharaj Terminus (Kolhapur Railway Station)');
  const [originCoords, setOriginCoords] = useState<[number, number]>([16.8524, 74.2980]);
  const [destCoords, setDestCoords] = useState<[number, number]>([16.7025, 74.2415]);
  const [userProfile, setUserProfile] = useState<UserProfile>('WOMAN');
  const [travelMode, setTravelMode] = useState<TravelMode>('DRIVING');
  const [timeHour, setTimeHour] = useState<number>(14.0); // 2:00 PM default
  const [weather, setWeather] = useState<string>('CLEAR');

  // Live GPS Tracking State
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Voice Safety Assistant State
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);

  // Route calculation state
  const [routes, setRoutes] = useState<RouteAlternative[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteAlternative | null>(null);
  const [presets, setPresets] = useState<PresetRoute[]>([]);
  const [safePlaces, setSafePlaces] = useState<SafePlace[]>([]);
  const [reports, setReports] = useState<CrowdReport[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Modals state
  const [isExplainerOpen, setIsExplainerOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isSOSOpen, setIsSOSOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserAuth | null>(null);

  // Demo Mode state
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [demoBannerMsg, setDemoBannerMsg] = useState<string | null>(null);

  // Voice synthesis helper
  const speakSafetyAlert = useCallback((text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  // Geocoding helper for any custom Indian or global place search
  const geocodeLocation = async (query: string): Promise<[number, number] | null> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
    } catch (e) {
      console.warn("Geocoding lookup error:", e);
    }
    return null;
  };

  // Handle GPS "Locate Me"
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = pos.coords.accuracy;
        setUserLocation([lat, lng]);
        setUserAccuracy(acc);
        setOriginCoords([lat, lng]);
        setOriginText(`📍 Current GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        setIsLocating(false);
        setDemoBannerMsg(`✓ GPS Locked in India/Local! Accuracy ±${Math.round(acc)}m.`);
        speakSafetyAlert('GPS Location locked. Calculating safe road paths from your live location.');
      },
      (err) => {
        console.warn('GPS error:', err);
        setIsLocating(false);
        setDemoBannerMsg('Could not fetch precise GPS. Defaulted to DY Patil Campus, Pune.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [speakSafetyAlert]);

  // Auto-request GPS on startup if available
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLocation([lat, lng]);
          setUserAccuracy(pos.coords.accuracy);
        },
        () => {},
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  // Load Presets & Initial Places on startup
  useEffect(() => {
    const initData = async () => {
      try {
        const [presetList, placesList] = await Promise.all([
          api.getPresets(),
          api.getSafePlaces()
        ]);
        setPresets(presetList);
        setSafePlaces(placesList);
      } catch (err) {
        console.error('Failed to load initial data', err);
      }
    };
    initData();
  }, []);

  // Main Route Calculation with automatic Geocoding
  const handleCalculateRoutes = useCallback(async (customHour?: number, customProfile?: UserProfile, customMode?: TravelMode) => {
    setIsLoading(true);
    try {
      let activeOrigin = originCoords;
      let activeDest = destCoords;

      // If user typed a new location query without coordinates, geocode it
      if (!originText.includes('(') && !originText.includes('DY Patil')) {
        const geoOrigin = await geocodeLocation(originText);
        if (geoOrigin) {
          activeOrigin = geoOrigin;
          setOriginCoords(geoOrigin);
        }
      }

      if (!destText.includes('(') && !destText.includes('Akurdi')) {
        const geoDest = await geocodeLocation(destText);
        if (geoDest) {
          activeDest = geoDest;
          setDestCoords(geoDest);
        }
      }

      const res = await api.calculateRoutes({
        origin_lat: activeOrigin[0],
        origin_lng: activeOrigin[1],
        dest_lat: activeDest[0],
        dest_lng: activeDest[1],
        origin_name: originText,
        dest_name: destText,
        user_profile: customProfile || userProfile,
        travel_mode: customMode || travelMode,
        hour: customHour !== undefined ? customHour : timeHour,
        weather: weather,
      });

      setRoutes(res.routes);
      const rec = res.routes.find(r => r.is_recommended) || res.routes[0];
      setSelectedRoute(rec);

      if (rec) {
        speakSafetyAlert(`${rec.title} selected. Safety risk score is ${Math.round(rec.risk_score)} out of 100.`);
      }

      // Load nearby reports
      const nearbyReps = await api.getNearbyReports(activeOrigin[0], activeOrigin[1], 3000);
      setReports(nearbyReps);
    } catch (err) {
      console.error('Error calculating routes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [originCoords, destCoords, originText, destText, userProfile, travelMode, timeHour, weather, speakSafetyAlert]);



  // Trigger initial calculation
  useEffect(() => {
    handleCalculateRoutes();
  }, [originCoords, destCoords, userProfile, travelMode, timeHour]);

  // Handle Preset Selection
  const handleSelectPreset = (preset: PresetRoute) => {
    setOriginText(preset.origin_name);
    setOriginCoords(preset.origin_coords);
    setDestText(preset.dest_name);
    setDestCoords(preset.dest_coords);
    setTravelMode(preset.recommended_mode);
    setActiveScenario(null);
    setDemoBannerMsg(`Loaded: ${preset.title}. ${preset.scenario_hint}`);
  };

  // Demo Scenario 1: Night Shift (11:30 PM)
  const runScenario1 = () => {
    setActiveScenario('scenario1');
    setTimeHour(23.5); // 11:30 PM
    setDemoBannerMsg('🌙 Scenario 1 Active: Simulated 11:30 PM Late Night. Observe increased risk scores due to darkness and reduced foot traffic.');
  };

  // Demo Scenario 2: Live Incident Injection on Route B
  const runScenario2 = async () => {
    setActiveScenario('scenario2');
    setIsLoading(true);
    try {
      // Inject high-severity report directly on Route B mid-segment
      await api.submitReport({
        category: 'Poor Lighting',
        severity: 'HIGH',
        description: 'Multiple streetlights vandalized and dark alley corner observed by commuter.',
        latitude: 37.7790,
        longitude: -122.4120,
        is_anonymous: true
      });

      // Recalculate routes immediately
      await handleCalculateRoutes();
      setDemoBannerMsg('⚠ Scenario 2 Active: Live Poor Lighting hazard submitted on Route B! Route B risk surged (43 → 57). Recommendation dynamically switched to Route C!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Demo Scenario 3: Accessibility Mode
  const runScenario3 = () => {
    setActiveScenario('scenario3');
    setUserProfile('ACCESSIBILITY');
    setTravelMode('ACCESSIBILITY');
    setDemoBannerMsg('♿ Scenario 3 Active: Wheelchair Accessibility mode prioritized smooth sidewalks, ramps, and curb cuts while penalizing broken alleys.');
  };

  // Reset Scenario
  const resetScenario = () => {
    setActiveScenario(null);
    setTimeHour(14.0); // 2:00 PM
    setUserProfile('WOMAN');
    setTravelMode('WALKING');
    setDemoBannerMsg('Reset to standard daytime baseline.');
    handleCalculateRoutes(14.0, 'WOMAN', 'WALKING');
  };

  // Selection handlers from Search Autocomplete
  const handleSelectOriginLocation = (coords: [number, number], name: string) => {
    setOriginCoords(coords);
    setOriginText(name);
  };

  const handleSelectDestLocation = (coords: [number, number], name: string) => {
    setDestCoords(coords);
    setDestText(name);
  };

  // Map Click handler with reverse geocoding
  const handleMapClick = async (lat: number, lng: number) => {
    setDestCoords([lat, lng]);
    setDestText(`Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`);
      const data = await res.json();
      if (data && data.display_name) {
        const short = data.display_name.split(',').slice(0, 3).join(',').trim();
        setDestText(short);
      }
    } catch (e) {
      console.warn("Reverse geocode failed:", e);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSOS={() => setIsSOSOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        currentUser={currentUser}
        onLogout={() => {
          localStorage.removeItem('saferoute_auth_token');
          setCurrentUser(null);
        }}
        demoMode={demoMode}
        setDemoMode={setDemoMode}
      />

      {/* Live Demo Notification Toast */}
      {demoBannerMsg && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border-b border-emerald-500/30 px-4 py-1.5 flex items-center justify-between text-xs text-emerald-300 shrink-0">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold">{demoBannerMsg}</span>
          </div>
          <button
            onClick={() => setDemoBannerMsg(null)}
            className="text-slate-400 hover:text-white text-xs px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden w-full h-full">
        {activeTab === 'admin' ? (
          <AdminDashboard />
        ) : activeTab === 'safety-map' ? (
          <SafetyMapView />
        ) : (
          /* Full-Screen Pure Map Layout with Floating Cards */
          <div className="w-full h-full relative overflow-hidden">
            {/* 100% Full Viewport Map */}
            <MapComponent
              routes={routes}
              selectedRoute={selectedRoute}
              onSelectRoute={(r) => setSelectedRoute(r)}
              originCoords={originCoords}
              destCoords={destCoords}
              safePlaces={safePlaces}
              incidents={incidents}
              reports={reports}
              userLocation={userLocation}
              userAccuracy={userAccuracy}
              onMapClick={handleMapClick}
            />

            {/* Floating Top Search Card (Glassmorphism) */}
            <div className="absolute top-3 left-3 right-3 sm:right-auto sm:w-[420px] z-30 transition-all">
              <div className="glass-panel p-4 rounded-3xl border border-slate-700/70 shadow-2xl space-y-3">
                {/* Search Inputs */}
                <div className="space-y-2.5">
                  <LocationSearchInput
                    label="Starting Point"
                    placeholder="Search start location or tap 'Use My GPS'..."
                    value={originText}
                    onChangeText={setOriginText}
                    onSelectLocation={handleSelectOriginLocation}
                    onLocateMe={handleLocateMe}
                    isLocating={isLocating}
                    type="origin"
                  />

                  <LocationSearchInput
                    label="Destination Point"
                    placeholder="Search target location or click map..."
                    value={destText}
                    onChangeText={setDestText}
                    onSelectLocation={handleSelectDestLocation}
                    type="destination"
                  />
                </div>

                {/* Travel Mode Selector & Calculate CTA */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                  <div className="flex items-center space-x-1 bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
                    {(['WALKING', 'CYCLING', 'DRIVING', 'ACCESSIBILITY'] as TravelMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setTravelMode(mode);
                          handleCalculateRoutes(undefined, undefined, mode);
                        }}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase transition-all ${
                          travelMode === mode
                            ? 'bg-emerald-500 text-slate-950 shadow-glow-emerald'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        {mode === 'WALKING' ? 'Walk' : mode === 'CYCLING' ? 'Cycle' : mode === 'DRIVING' ? 'Drive' : 'Access'}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCalculateRoutes()}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-glow-emerald hover:opacity-95 transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>{isLoading ? 'Routing...' : 'Find Route'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Floating Bottom Selected Route Pill / Card */}
            {selectedRoute && (
              <div className="absolute bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:w-[440px] z-30 animate-in fade-in slide-in-from-bottom-4">
                <div className="glass-panel p-4 rounded-3xl border border-slate-700/80 shadow-2xl space-y-3">
                  {/* Route Alternatives Switcher */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <div className="flex items-center space-x-1.5">
                      {routes.map((r) => (
                        <button
                          key={r.route_id}
                          onClick={() => setSelectedRoute(r)}
                          className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase transition-all border ${
                            selectedRoute.route_id === r.route_id
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-emerald-400/50 shadow-glow-emerald'
                              : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {r.route_type}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setIsExplainerOpen(true)}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 hover:underline"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>AI Explainer</span>
                    </button>
                  </div>

                  {/* Selected Route Info */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-sm text-slate-100 flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: selectedRoute.risk_color || '#10B981' }}
                        />
                        {selectedRoute.title}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {selectedRoute.duration_min_str} • {selectedRoute.distance_km_str}
                      </p>
                    </div>

                    <div
                      className="px-3 py-1.5 rounded-2xl text-right font-black text-xs flex flex-col items-end border"
                      style={{
                        backgroundColor: `${selectedRoute.risk_color}18`,
                        borderColor: `${selectedRoute.risk_color}40`,
                        color: selectedRoute.risk_color || '#10B981'
                      }}
                    >
                      <span>Risk: {Math.round(selectedRoute.risk_score)}/100</span>
                      <span className="text-[9px] opacity-80 uppercase tracking-wider">
                        {selectedRoute.risk_label}
                      </span>
                    </div>
                  </div>

                  {/* Highlights / Positives */}
                  {selectedRoute.positives && selectedRoute.positives.length > 0 && (
                    <div className="p-2 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-1.5 font-medium">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span className="truncate">{selectedRoute.positives[0]}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <RiskExplainerModal
        route={selectedRoute}
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        defaultCoords={originCoords}
        onReportSubmitted={() => {
          handleCalculateRoutes();
          setDemoBannerMsg('✓ Community hazard logged! Routes re-evaluated with new incident penalty.');
        }}
      />

      <SOSModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
        currentCoords={originCoords}
        safePlaces={safePlaces}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          setDemoBannerMsg(`Signed in as ${u.full_name} (${u.role.toUpperCase()})`);
        }}
      />
    </div>
  );
};
export default App;
