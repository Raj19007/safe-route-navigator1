import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, Crosshair, X, Loader2 } from 'lucide-react';

interface LocationSearchInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelectLocation: (coords: [number, number], displayName: string) => void;
  onLocateMe?: () => void;
  isLocating?: boolean;
  type: 'origin' | 'destination';
}

interface SearchResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
}

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  onSelectLocation,
  onLocateMe,
  isLocating = false,
  type,
}) => {
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (text: string) => {
    onChangeText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          text
        )}&limit=5&addressdetails=1`;
        const res = await fetch(url, {
          headers: { 'Accept-Language': 'en' },
        });
        const data = await res.json();
        setSuggestions(data || []);
        setIsOpen(true);
      } catch (err) {
        console.warn('Search query failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 350);
  };

  const handleSelect = (item: SearchResult) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    // Shorten display name for input field
    const shortName = item.display_name.split(',').slice(0, 3).join(',').trim();
    onSelectLocation([lat, lng], shortName);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              type === 'origin' ? 'bg-emerald-400 shadow-glow-emerald' : 'bg-rose-400 shadow-glow-red'
            }`}
          />
          {label}
        </label>
        {type === 'origin' && onLocateMe && (
          <button
            type="button"
            onClick={onLocateMe}
            disabled={isLocating}
            className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 hover:underline transition-all"
          >
            <Crosshair className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'Use My GPS'}</span>
          </button>
        )}
      </div>

      <div className="relative flex items-center">
        {type === 'origin' ? (
          <MapPin className="w-4 h-4 text-emerald-400 absolute left-3 pointer-events-none" />
        ) : (
          <Navigation className="w-4 h-4 text-rose-400 absolute left-3 pointer-events-none" />
        )}

        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl pl-9 pr-8 py-2.5 text-xs font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors shadow-inner"
        />

        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 text-cyan-400 absolute right-3 animate-spin" />
        ) : value ? (
          <button
            type="button"
            onClick={() => {
              onChangeText('');
              setSuggestions([]);
              setIsOpen(false);
            }}
            className="absolute right-2.5 p-1 rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-800"
          >
            <X className="w-3 h-3" />
          </button>
        ) : null}
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 glass-panel rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-56 overflow-y-auto">
          {suggestions.map((item) => {
            const parts = item.display_name.split(',');
            const primaryName = parts[0];
            const secondaryName = parts.slice(1, 4).join(',').trim();

            return (
              <button
                key={item.place_id}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left px-3 py-2.5 hover:bg-slate-800/90 flex items-start gap-2.5 border-b border-slate-800/60 last:border-none transition-colors group"
              >
                <MapPin className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 truncate">
                    {primaryName}
                  </div>
                  {secondaryName && (
                    <div className="text-[10px] text-slate-400 truncate">
                      {secondaryName}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
