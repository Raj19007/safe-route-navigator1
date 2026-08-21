import React, { useEffect, useState } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Polyline, 
  Marker, 
  Popup, 
  Circle,
  useMap, 
  useMapEvents 
} from 'react-leaflet';
import L from 'leaflet';
import { RouteAlternative, SafePlace, Incident, CrowdReport } from '../types';
import { getRiskTheme } from '../utils/theme';
import { Shield, Cross, AlertCircle, Phone, MapPin, Layers, Flame, Navigation, Crosshair } from 'lucide-react';

// Custom SVG Icons for Leaflet
const createSvgIcon = (svgString: string, size: [number, number] = [32, 32]) => {
  return L.divIcon({
    html: svgString,
    className: 'custom-map-icon',
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [0, -size[1]],
  });
};

const userGpsIcon = createSvgIcon(`
  <div class="relative flex items-center justify-center w-8 h-8">
    <div class="absolute w-7 h-7 rounded-full bg-cyan-400 opacity-75 gps-pulse-ring"></div>
    <div class="relative w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-glow-cyan"></div>
  </div>
`, [32, 32]);

const originIcon = createSvgIcon(`
  <div class="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white shadow-glow-emerald flex items-center justify-center text-white font-bold">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
  </div>
`);

const destIcon = createSvgIcon(`
  <div class="w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-glow-red flex items-center justify-center text-white">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"/></svg>
  </div>
`);

const policeIcon = createSvgIcon(`
  <div class="w-7 h-7 rounded-xl bg-blue-600 border border-blue-400 shadow-md flex items-center justify-center text-white">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  </div>
`, [28, 28]);

const hospitalIcon = createSvgIcon(`
  <div class="w-7 h-7 rounded-xl bg-rose-600 border border-rose-400 shadow-md flex items-center justify-center text-white font-bold text-xs">
    +
  </div>
`, [28, 28]);

const pharmacyIcon = createSvgIcon(`
  <div class="w-7 h-7 rounded-xl bg-teal-600 border border-teal-400 shadow-md flex items-center justify-center text-white font-bold text-xs">
    Rx
  </div>
`, [28, 28]);

const reportHazardIcon = createSvgIcon(`
  <div class="w-7 h-7 rounded-full bg-amber-500 border-2 border-white shadow-glow-amber flex items-center justify-center text-slate-950 font-black text-xs hazard-pulse">
    !
  </div>
`, [28, 28]);

// Map center adjuster
const MapController: React.FC<{
  center: [number, number];
  bounds?: [number, number][];
}> = ({ center, bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40] });
    } else {
      map.setView(center, 14);
    }
  }, [center, bounds, map]);
  return null;
};

// Map click handler
const MapClickHandler: React.FC<{
  onMapClick?: (lat: number, lng: number) => void;
}> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

interface MapComponentProps {
  routes: RouteAlternative[];
  selectedRoute: RouteAlternative | null;
  onSelectRoute: (route: RouteAlternative) => void;
  originCoords: [number, number];
  destCoords: [number, number];
  safePlaces: SafePlace[];
  incidents: Incident[];
  reports: CrowdReport[];
  userLocation?: [number, number] | null;
  userAccuracy?: number | null;
  onMapClick?: (lat: number, lng: number) => void;
  showSafePlaces?: boolean;
  showHazards?: boolean;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  routes,
  selectedRoute,
  onSelectRoute,
  originCoords,
  destCoords,
  safePlaces = [],
  reports = [],
  userLocation,
  userAccuracy,
  onMapClick,
  showSafePlaces = true,
  showHazards = true,
}) => {
  const [layersOpen, setLayersOpen] = useState(false);
  const [filterSafePlaces, setFilterSafePlaces] = useState(showSafePlaces);
  const [filterHazards, setFilterHazards] = useState(showHazards);
  const [showRiskHeatmap, setShowRiskHeatmap] = useState(true);

  // Compute map bounds covering origin, destination, and routes
  const allPoints: [number, number][] = [originCoords, destCoords];
  if (userLocation) allPoints.push(userLocation);
  if (selectedRoute && selectedRoute.coordinates) {
    selectedRoute.coordinates.forEach(c => allPoints.push([c[1], c[0]]));
  }

  return (
    <div className="relative w-full h-full min-h-[420px]">
      <MapContainer
        center={userLocation || originCoords}
        zoom={14}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <MapController center={userLocation || originCoords} bounds={allPoints.length > 2 ? allPoints : undefined} />
        <MapClickHandler onMapClick={onMapClick} />

        {/* Dark Sleek Map Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Live GPS User Location Marker & Translucent Accuracy Circle */}
        {userLocation && (
          <>
            <Circle
              center={userLocation}
              radius={userAccuracy || 120}
              pathOptions={{
                color: '#06B6D4',
                fillColor: '#06B6D4',
                fillOpacity: 0.15,
                weight: 1.5,
              }}
            />
            <Marker position={userLocation} icon={userGpsIcon}>
              <Popup>
                <div className="p-1 text-xs">
                  <strong className="text-cyan-400 font-bold block flex items-center gap-1">
                    <Crosshair className="w-3 h-3 text-cyan-400" /> You Are Here
                  </strong>
                  <span className="text-slate-300">Live GPS Location Locked</span>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Risk Heatmap Density Overlay */}
        {showRiskHeatmap && reports.map((rep, idx) => {
          const color = rep.severity === 'CRITICAL' ? '#EF4444' : rep.severity === 'HIGH' ? '#F97316' : '#F59E0B';
          return (
            <Circle
              key={`heatmap-${rep.id || idx}`}
              center={[rep.latitude, rep.longitude]}
              radius={180}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.18,
                weight: 0,
              }}
            />
          );
        })}


        {/* Unselected Routes Polylines (Subtle background paths) */}
        {routes
          .filter(r => r.route_id !== selectedRoute?.route_id)
          .map(route => {
            const latlngs: [number, number][] = route.coordinates.map(c => [c[1], c[0]]);
            const theme = getRiskTheme(route.risk_score, route.is_limited_data);
            return (
              <Polyline
                key={route.route_id}
                positions={latlngs}
                pathOptions={{
                  color: theme.color,
                  weight: 5,
                  opacity: 0.45,
                  dashArray: '6, 6',
                }}
                eventHandlers={{
                  click: () => onSelectRoute(route),
                }}
              >
                <Popup>
                  <div className="p-1 text-xs">
                    <strong className="block font-bold text-slate-100">{route.title}</strong>
                    <span className="text-slate-300">Duration: {route.duration_min_str}</span>
                    <br />
                    <span style={{ color: theme.color }} className="font-bold">
                      Risk: {Math.round(route.risk_score)}/100 ({route.risk_label})
                    </span>
                  </div>
                </Popup>
              </Polyline>
            );
          })}

        {/* Selected Route - Render Segment-by-Segment with Risk Colors */}
        {selectedRoute && selectedRoute.segments && selectedRoute.segments.length > 0 ? (
          selectedRoute.segments.map((seg, idx) => {
            if (!seg.geometry || !seg.geometry.coordinates) return null;
            const segCoords: [number, number][] = seg.geometry.coordinates.map(c => [c[1], c[0]]);
            const theme = getRiskTheme(seg.risk_score, seg.is_limited_data);
            return (
              <Polyline
                key={`seg-${idx}-${seg.segment_id}`}
                positions={segCoords}
                pathOptions={{
                  color: theme.color,
                  weight: 8,
                  opacity: 0.95,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              >
                <Popup>
                  <div className="p-2 text-xs space-y-1 max-w-xs">
                    <strong className="block text-slate-100 text-sm font-bold">{seg.name}</strong>
                    <div className="flex items-center space-x-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white" style={{ backgroundColor: theme.color }}>
                        Risk: {Math.round(seg.risk_score)}/100
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        Conf: {Math.round(seg.confidence_score)}%
                      </span>
                    </div>
                    {seg.positives && seg.positives[0] && (
                      <p className="text-emerald-400 text-[11px]">✓ {seg.positives[0]}</p>
                    )}
                    {seg.warnings && seg.warnings[0] && (
                      <p className="text-amber-400 text-[11px]">⚠ {seg.warnings[0]}</p>
                    )}
                  </div>
                </Popup>
              </Polyline>
            );
          })
        ) : selectedRoute && (
          <Polyline
            positions={selectedRoute.coordinates.map(c => [c[1], c[0]])}
            pathOptions={{
              color: getRiskTheme(selectedRoute.risk_score).color,
              weight: 8,
              opacity: 0.95,
            }}
          />
        )}

        {/* Origin & Destination Markers */}
        <Marker position={originCoords} icon={originIcon}>
          <Popup>
            <div className="p-1 text-xs">
              <strong className="text-emerald-400 font-bold block">Start / Origin</strong>
              <span className="text-slate-300">Your departure point</span>
            </div>
          </Popup>
        </Marker>

        <Marker position={destCoords} icon={destIcon}>
          <Popup>
            <div className="p-1 text-xs">
              <strong className="text-rose-400 font-bold block">Destination</strong>
              <span className="text-slate-300">Target Arrival Location</span>
            </div>
          </Popup>
        </Marker>

        {/* Safe Places Layer - Filtered to nearby active area */}
        {filterSafePlaces &&
          safePlaces
            .filter(p => {
              const d1 = Math.hypot(p.latitude - originCoords[0], p.longitude - originCoords[1]);
              const d2 = Math.hypot(p.latitude - destCoords[0], p.longitude - destCoords[1]);
              return d1 < 0.15 || d2 < 0.15; // Within ~15km
            })
            .map(place => {
              const icon =
                place.category === 'police' ? policeIcon :
                place.category === 'hospital' ? hospitalIcon : pharmacyIcon;

              return (
                <Marker
                  key={place.id}
                  position={[place.latitude, place.longitude]}
                  icon={icon}
                >
                  <Popup>
                    <div className="p-2 text-xs space-y-1 max-w-xs">
                      <div className="flex items-center space-x-1 text-indigo-400 font-bold uppercase text-[10px]">
                        <Shield className="w-3 h-3" />
                        <span>{place.category.replace('_', ' ')}</span>
                      </div>
                      <strong className="block text-slate-100 text-sm font-bold">{place.name}</strong>
                      {place.address && <p className="text-slate-400 text-[11px]">{place.address}</p>}
                      {place.phone && (
                        <div className="flex items-center space-x-1 text-emerald-400 text-[11px] font-semibold">
                          <Phone className="w-3 h-3" />
                          <span>{place.phone}</span>
                        </div>
                      )}
                      {place.is_24_7 && (
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                          24/7 OPEN EMERGENCY HAVEN
                        </span>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

        {/* Crowd Reports Layer - Filtered to nearby active area */}
        {filterHazards &&
          reports
            .filter(r => {
              const d1 = Math.hypot(r.latitude - originCoords[0], r.longitude - originCoords[1]);
              const d2 = Math.hypot(r.latitude - destCoords[0], r.longitude - destCoords[1]);
              return d1 < 0.15 || d2 < 0.15;
            })
            .slice(0, 15)
            .map(rep => (
              <Marker
                key={rep.id}
                position={[rep.latitude, rep.longitude]}
                icon={reportHazardIcon}
              >
                <Popup>
                  <div className="p-2 text-xs space-y-1 max-w-xs">
                    <div className="flex items-center space-x-1 text-amber-400 font-bold uppercase text-[10px]">
                      <AlertCircle className="w-3 h-3" />
                      <span>Hazard Alert: {rep.category}</span>
                    </div>
                    <p className="text-slate-200 text-xs">{rep.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                      <span className="font-semibold text-rose-400">Severity: {rep.severity}</span>
                      <span>Upvotes: {rep.upvotes}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
      </MapContainer>

      {/* Floating Layer Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={() => setLayersOpen(!layersOpen)}
          className="p-2.5 rounded-2xl bg-slate-950/90 hover:bg-slate-900 text-slate-200 border border-slate-700/80 shadow-2xl transition-all flex items-center gap-1.5 text-xs font-bold"
          title="Toggle Layers"
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">Map Layers</span>
        </button>

        {layersOpen && (
          <div className="glass-panel p-3.5 rounded-2xl border border-slate-700/80 shadow-2xl space-y-2.5 text-xs min-w-[190px] animate-in fade-in zoom-in-95">
            <label className="flex items-center space-x-2 text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={filterSafePlaces}
                onChange={(e) => setFilterSafePlaces(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              <span>Nearby Safe Havens</span>
            </label>
            <label className="flex items-center space-x-2 text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={filterHazards}
                onChange={(e) => setFilterHazards(e.target.checked)}
                className="rounded accent-amber-500"
              />
              <span>Hazard Incident Pins</span>
            </label>
            <label className="flex items-center space-x-2 text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={showRiskHeatmap}
                onChange={(e) => setShowRiskHeatmap(e.target.checked)}
                className="rounded accent-rose-500"
              />
              <span>Risk Density Heatmap</span>
            </label>
          </div>
        )}
      </div>

      {/* Modern Floating Bottom Legend */}
      <div className="absolute bottom-4 left-4 z-20 glass-panel px-3.5 py-2 rounded-2xl border border-slate-800/80 shadow-xl hidden md:flex items-center space-x-3 text-[11px] font-bold text-slate-300">
        <span className="text-slate-400 uppercase text-[9px] font-black tracking-wider">Safety Risk:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-glow-emerald" /> 0-40 Safe
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-glow-amber" /> 41-70 Moderate
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-glow-red" /> 71-100 High Risk
        </span>
      </div>
    </div>
  );
};
