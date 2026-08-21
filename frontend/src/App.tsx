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
  // Navigation State - Centered on DY Patil Campus, Akurdi, Pune, India
  const [activeTab, setActiveTab] = useState<'navigator' | 'safety-map' | 'admin'>('navigator');
  const [originText, setOriginText] = useState('🎓 DY Patil Campus Main Gate, Akurdi');
  const [destText, setDestText] = useState('Akurdi Railway Station');
  const [originCoords, setOriginCoords] = useState<[number, number]>([18.6465, 73.7597]);
  const [destCoords, setDestCoords] = useState<[number, number]>([18.6508, 73.7705]);
  const [userProfile, setUserProfile] = useState<UserProfile>('WOMAN');
  const [travelMode, setTravelMode] = useState<TravelMode>('WALKING');
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
      <main className="flex-1 relative overflow-hidden flex">
        {activeTab === 'admin' ? (
          <AdminDashboard />
        ) : activeTab === 'safety-map' ? (
          <SafetyMapView />
        ) : (
          /* Navigator Dual-Pane View */
          <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden relative">
            {/* Left Sidebar: Controls & Route Comparison Cards */}
            <div className="w-full lg:w-[440px] xl:w-[480px] h-full overflow-y-auto p-3 sm:p-4 md:p-5 space-y-4 border-r border-slate-800/80 shrink-0 z-20 glass-panel lg:bg-slate-950/80">
              {/* Route Input Panel with Autocomplete Search */}
              <NavigationControlPanel
                originText={originText}
                setOriginText={setOriginText}
                destText={destText}
                setDestText={setDestText}
                originCoords={originCoords}
                destCoords={destCoords}
                onSelectOriginLocation={handleSelectOriginLocation}
                onSelectDestLocation={handleSelectDestLocation}
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                travelMode={travelMode}
                setTravelMode={setTravelMode}
                timeHour={timeHour}
                setTimeHour={setTimeHour}
                weather={weather}
                setWeather={setWeather}
                presets={presets}
                onSelectPreset={handleSelectPreset}
                onCalculateRoutes={() => handleCalculateRoutes()}
                onLocateMe={handleLocateMe}
                isLocating={isLocating}
                voiceEnabled={voiceEnabled}
                setVoiceEnabled={setVoiceEnabled}
                isLoading={isLoading}
              />

              {/* Route Comparison Cards */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                    Calculated Safe Alternatives ({routes.length})
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Mode: {travelMode}
                  </span>
                </div>

                {isLoading && routes.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 space-y-2">
                    <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-semibold">Evaluating multi-factor safety segments...</p>
                  </div>
                ) : (
                  routes.map((route) => (
                    <RouteCard
                      key={route.route_id}
                      route={route}
                      isSelected={selectedRoute?.route_id === route.route_id}
                      onSelect={() => setSelectedRoute(route)}
                      onOpenExplainer={() => {
                        setSelectedRoute(route);
                        setIsExplainerOpen(true);
                      }}
                    />
                  ))
                )}
              </div>

              {/* Educational Safety Principle Notice */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 space-y-1 shadow-sm">
                <div className="flex items-center space-x-1.5 text-slate-200 font-bold">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Uncertainty & Data Availability</span>
                </div>
                <p>
                  Risk scores account for data confidence. If an area lacks historical records or recent reports, the confidence score drops rather than automatically rating the road as safe.
                </p>
              </div>
            </div>

            {/* Right Map Canvas */}
            <div className="flex-1 h-[50vh] lg:h-full relative">
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
            </div>
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
