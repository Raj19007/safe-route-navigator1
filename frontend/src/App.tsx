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
  // Navigation State
  const [activeTab, setActiveTab] = useState<'navigator' | 'safety-map' | 'admin'>('navigator');
  const [originText, setOriginText] = useState('University Main Campus');
  const [destText, setDestText] = useState('Central Railway Station');
  const [originCoords, setOriginCoords] = useState<[number, number]>([37.7880, -122.4075]);
  const [destCoords, setDestCoords] = useState<[number, number]>([37.7650, -122.4150]);
  const [userProfile, setUserProfile] = useState<UserProfile>('WOMAN');
  const [travelMode, setTravelMode] = useState<TravelMode>('WALKING');
  const [timeHour, setTimeHour] = useState<number>(14.0); // 2:00 PM default
  const [weather, setWeather] = useState<string>('CLEAR');

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

  // Main Route Calculation
  const handleCalculateRoutes = useCallback(async (customHour?: number, customProfile?: UserProfile, customMode?: TravelMode) => {
    setIsLoading(true);
    try {
      const res = await api.calculateRoutes({
        origin_lat: originCoords[0],
        origin_lng: originCoords[1],
        dest_lat: destCoords[0],
        dest_lng: destCoords[1],
        origin_name: originText,
        dest_name: destText,
        user_profile: customProfile || userProfile,
        travel_mode: customMode || travelMode,
        hour: customHour !== undefined ? customHour : timeHour,
        weather: weather,
      });

      setRoutes(res.routes);
      // Auto-select recommended route or first
      const rec = res.routes.find(r => r.is_recommended) || res.routes[0];
      setSelectedRoute(rec);

      // Load nearby reports
      const nearbyReps = await api.getNearbyReports(originCoords[0], originCoords[1], 3000);
      setReports(nearbyReps);
    } catch (err) {
      console.error('Error calculating routes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [originCoords, destCoords, originText, destText, userProfile, travelMode, timeHour, weather]);

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

      {/* Judge Demo Console Bar */}
      {demoMode && (
        <DemoScenarioBar
          onRunScenario1={runScenario1}
          onRunScenario2={runScenario2}
          onRunScenario3={runScenario3}
          onReset={resetScenario}
          activeScenario={activeScenario}
        />
      )}

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
              {/* Route Input Panel */}
              <NavigationControlPanel
                originText={originText}
                setOriginText={setOriginText}
                destText={destText}
                setDestText={setDestText}
                originCoords={originCoords}
                destCoords={destCoords}
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
                isLoading={isLoading}
              />

              {/* Route Comparison Cards */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                    Calculated Alternatives ({routes.length})
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
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-300 font-bold">
                  <Info className="w-3.5 h-3.5 text-emerald-400" />
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
                onMapClick={(lat, lng) => {
                  // If clicked, allows quick update of destination
                  setDestCoords([lat, lng]);
                  setDestText(`Pinned Destination (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
                }}
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
