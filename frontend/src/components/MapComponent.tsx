import React, { useEffect, useState } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Polyline, 
  Marker, 
  Popup, 
  useMap, 
  useMapEvents 
} from 'react-leaflet';
import L from 'leaflet';
import { RouteAlternative, SafePlace, Incident, CrowdReport } from '../types';
import { getRiskTheme } from '../utils/theme';
import { Shield, Cross, AlertCircle, Phone, MapPin, Layers } from 'lucide-react';

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

const originIcon = createSvgIcon(`
  <div class="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center text-white">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
  </div>
`);

const destIcon = createSvgIcon(`
  <div class="w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"/></svg>
  </div>
`);

const policeIcon = createSvgIcon(`
  <div class="w-7 h-7 rounded-lg bg-blue-600 border border-blue-300 shadow-md flex items-center justify-center text-white">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  </div>
`, [28, 28]);

const hospitalIcon = createSvgIcon(`
  <div class="w-7 h-7 rounded-lg bg-rose-600 border border-rose-300 shadow-md flex items-center justify-center text-white font-bold text-xs">
    +
  </div>
`, [28, 28]);

const pharmacyIcon = createSvgIcon(`
  <div class="w-7 h-7 rounded-lg bg-teal-600 border border-teal-300 shadow-md flex items-center justify-center text-white font-bold text-xs">
    Rx
  </div>
`, [28, 28]);

const reportHazardIcon = createSvgIcon(`
  <div class="w-7 h-7 rounded-full bg-amber-500/90 border-2 border-white shadow-lg flex items-center justify-center text-slate-950 font-black text-xs">
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
  onMapClick,
  showSafePlaces = true,
  showHazards = true,
}) => {
  const [layersOpen, setLayersOpen] = useState(false);
  const [filterSafePlaces, setFilterSafePlaces] = useState(showSafePlaces);
  const [filterHazards, setFilterHazards] = useState(showHazards);

  // Compute map bounds covering origin, destination, and routes
  const allPoints: [number, number][] = [originCoords, destCoords];
  if (selectedRoute && selectedRoute.coordinates) {
    selectedRoute.coordinates.forEach(c => allPoints.push([c[1], c[0]]));
  }

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <MapContainer
        center={originCoords}
        zoom={14}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <MapController center={originCoords} bounds={allPoints.length > 2 ? allPoints : undefined} />
        <MapClickHandler onMapClick={onMapClick} />

        {/* Dark Matter Sleek Map Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

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

        {/* Safe Places Layer */}
        {filterSafePlaces &&
          safePlaces.map(place => {
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
                    <strong className="block text-slate-100 text-sm">{place.name}</strong>
                    {place.address && <p className="text-slate-400 text-[11px]">{place.address}</p>}
                    {place.phone && (
                      <div className="flex items-center space-x-1 text-emerald-400 text-[11px] font-semibold">
                        <Phone className="w-3 h-3" />
                        <span>{place.phone}</span>
                      </div>
                    )}
                    {place.is_24_7 && (
                      <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                        24/7 OPEN EMERGENCY HAVEN
                      </span>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Crowd Reports Layer */}
        {filterHazards &&
          reports.slice(0, 30).map(rep => (
            <Marker
              key={rep.id}
              position={[rep.latitude, rep.longitude]}
              icon={reportHazardIcon}
            >
              <Popup>
                <div className="p-2 text-xs space-y-1 max-w-xs">
                  <div className="flex items-center space-x-1 text-amber-400 font-bold uppercase text-[10px]">
                    <AlertCircle className="w-3 h-3" />
                    <span>Crowd Hazard: {rep.category}</span>
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

      {/* Floating Layer Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={() => setLayersOpen(!layersOpen)}
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 shadow-xl transition-all flex items-center gap-1.5 text-xs font-semibold"
          title="Toggle Map Layers"
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Layers</span>
        </button>

        {layersOpen && (
          <div className="glass-panel p-3 rounded-xl border border-slate-700/80 shadow-2xl space-y-2 text-xs min-w-[170px] animate-in fade-in zoom-in-95">
            <label className="flex items-center space-x-2 text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={filterSafePlaces}
                onChange={(e) => setFilterSafePlaces(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              <span>Safe Places (Police/Hospital)</span>
            </label>
            <label className="flex items-center space-x-2 text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={filterHazards}
                onChange={(e) => setFilterHazards(e.target.checked)}
                className="rounded accent-amber-500"
              />
              <span>Community Hazard Alerts</span>
            </label>
          </div>
        )}
      </div>

      {/* Centralized Legend Box */}
      <div className="absolute bottom-4 left-4 z-20 glass-panel px-3 py-2 rounded-xl border border-slate-800/80 shadow-xl hidden md:flex items-center space-x-3 text-[11px] font-semibold text-slate-300">
        <span className="text-slate-400 font-bold uppercase text-[10px]">Risk Legend:</span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> 0-20 Safe
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-lime-500" /> 21-40 Low
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 41-60 Moderate
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> 61-80 Elevated
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> 81-100 High
        </span>
      </div>
    </div>
  );
};
