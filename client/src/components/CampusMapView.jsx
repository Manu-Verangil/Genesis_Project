import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  Navigation,
  Clock,
  Phone,
  Compass,
  Building,
  Info,
  Utensils,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { api } from '../api';

export function CampusMapView({ onNavigateToCanteen }) {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLocations = async () => {
    try {
      const res = await api.getMapLocations();
      if (res.success) {
        setLocations(res.data);
        if (res.data.length > 0) setSelectedLocation(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const categories = [
    'All',
    'Food & Dining',
    'Academic Store',
    'Retail Store',
    'Facilities',
    'Medical & Health',
    'Sports & Recreation',
    'Administration'
  ];

  const filteredLocations = locations.filter((loc) => {
    if (selectedCategory !== 'All' && loc.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !loc.name.toLowerCase().includes(q) &&
        !loc.description.toLowerCase().includes(q) &&
        !loc.building.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Search & Category Filter Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-400" />
              <span>Interactive Campus Guide & Map</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Phase 3 (Slide 10)
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Easily find Canteen 1 & 2, print stores, academic blocks, and campus facilities
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search store, canteen, xerox, library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-4 border-t border-slate-800 mt-4 pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Layout: Visual Interactive Map (Left) + Detail Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Visual SVG Campus Map (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-300">
                Campus Blueprint Map (Click any building pin)
              </span>
            </div>
            <span className="text-[10px] text-slate-500">Scale: 1:500m • Main Campus</span>
          </div>

          {/* SVG Map Canvas */}
          <div className="relative w-full h-96 sm:h-[450px] bg-slate-950/90 rounded-2xl my-4 border border-slate-800 overflow-hidden flex items-center justify-center p-4">
            {/* Background Grid & Pathways */}
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {/* Grid Lines */}
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1e293b" strokeWidth="0.3" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />

              {/* Campus Walkways & Roads */}
              {/* Main Spine Road */}
              <path
                d="M 50,0 L 50,100"
                stroke="#334155"
                strokeWidth="2.5"
                strokeDasharray="2,1"
              />
              {/* Cross Ring Road */}
              <path
                d="M 0,50 L 100,50"
                stroke="#334155"
                strokeWidth="2.5"
                strokeDasharray="2,1"
              />
              {/* Outer Loop */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#334155"
                strokeWidth="1.5"
              />

              {/* Campus Greenery Zones */}
              <circle cx="50" cy="50" r="12" fill="#064e3b" opacity="0.3" />
              <rect x="15" y="15" width="20" height="15" rx="3" fill="#064e3b" opacity="0.2" />
              <rect x="65" y="65" width="22" height="18" rx="3" fill="#064e3b" opacity="0.2" />

              {/* Building Footprint Blocks */}
              <rect x="36" y="50" width="14" height="12" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="0.5" />
              <rect x="64" y="16" width="16" height="12" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="0.5" />
              <rect x="14" y="44" width="14" height="14" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="0.5" />
              <rect x="28" y="34" width="15" height="10" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="0.5" />
              <rect x="42" y="78" width="18" height="14" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="0.5" />
              <rect x="74" y="58" width="14" height="14" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="0.5" />
              <rect x="68" y="8" width="16" height="12" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="0.5" />
            </svg>

            {/* Interactive Location Markers Overlay */}
            {locations.map((loc) => {
              const isSelected = selectedLocation?.id === loc.id;
              const isCanteen = loc.category === 'Food & Dining';

              return (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc)}
                  style={{
                    left: `${loc.coordinates.x}%`,
                    top: `${loc.coordinates.y}%`
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 group transition-all duration-300 ${
                    isSelected ? 'scale-125 z-20' : 'hover:scale-110'
                  }`}
                >
                  <div className="relative flex flex-col items-center">
                    {/* Pulsing indicator */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shadow-xl border-2 transition ${
                        isSelected
                          ? 'bg-blue-600 border-white text-white shadow-blue-500/80 animate-bounce'
                          : isCanteen
                          ? 'bg-amber-600 border-amber-300 text-white shadow-amber-600/50'
                          : 'bg-slate-800 border-slate-600 text-slate-200'
                      }`}
                    >
                      {isCanteen ? (
                        <Utensils className="w-3.5 h-3.5" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5" />
                      )}
                    </div>

                    {/* Pin Label Tooltip */}
                    <span
                      className={`mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap shadow-md pointer-events-none transition ${
                        isSelected
                          ? 'bg-blue-600 text-white border border-blue-400'
                          : 'bg-slate-900/90 text-slate-300 border border-slate-700 opacity-90 group-hover:opacity-100'
                      }`}
                    >
                      {loc.name.split('(')[0]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Zone Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Canteen & Dining
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Academic & Stores
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Campus Parks
              </span>
            </div>
            <span>Click any pin to inspect directions and hours</span>
          </div>
        </div>

        {/* Right Column: Selected Location Detail Card */}
        <div className="space-y-4">
          {selectedLocation ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between">
              <div>
                {/* Location Image */}
                <div className="relative h-44 w-full bg-slate-800">
                  <img
                    src={selectedLocation.image}
                    alt={selectedLocation.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md text-[10px] font-bold text-cyan-300 border border-slate-700">
                    {selectedLocation.zone}
                  </span>
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-blue-600/90 text-white text-[10px] font-bold">
                    {selectedLocation.category}
                  </span>
                </div>

                {/* Details Content */}
                <div className="p-5 space-y-3.5">
                  <div>
                    <h3 className="font-extrabold text-white text-base leading-tight">
                      {selectedLocation.name}
                    </h3>
                    <p className="text-xs text-blue-400 mt-1 font-medium flex items-center gap-1">
                      <Building className="w-3.5 h-3.5" />
                      {selectedLocation.building} • {selectedLocation.floor}
                    </p>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedLocation.description}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{selectedLocation.timings}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{selectedLocation.contact}</span>
                    </div>

                    <div className="flex items-start gap-2 text-amber-300/90 text-[11px] pt-1">
                      <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Peak Crowd:</strong> {selectedLocation.popularTimes}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0">
                {selectedLocation.category === 'Food & Dining' ? (
                  <button
                    onClick={() => onNavigateToCanteen(selectedLocation.id)}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                  >
                    <Utensils className="w-4 h-4" />
                    <span>View Live Menu & Order Ahead</span>
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      alert(
                        `Walking route to ${selectedLocation.name} is highlighted on map. Proceed straight from Central Courtyard for ~250 meters.`
                      )
                    }
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-4 h-4 text-cyan-400" />
                    <span>Get Walking Directions</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
              Select a location on the map to view details.
            </div>
          )}

          {/* Quick List of Stores / Locations */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Campus Stores & Hubs ({filteredLocations.length})
            </h4>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {filteredLocations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc)}
                  className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition ${
                    selectedLocation?.id === loc.id
                      ? 'bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/40'
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 border border-slate-700/30'
                  }`}
                >
                  <span className="truncate pr-2">{loc.name}</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
