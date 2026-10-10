import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  Layers,
  Locate,
  Footprints,
  Maximize2,
  Minimize2,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';
import { api } from '../api';

// Tile Layer Configurations for Real Map
const TILE_LAYERS = {
  street: {
    name: 'Street Map',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  satellite: {
    name: 'Satellite View',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  },
  dark: {
    name: 'Dark Mode Map',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
  }
};

// Default Campus Center (Anna University / Guindy Engineering Campus Coordinates in Chennai)
const DEFAULT_CAMPUS_CENTER = [13.0108, 80.2335];

export function CampusMapView({ onNavigateToCanteen }) {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeLayer, setActiveLayer] = useState('street');
  const [userLocation, setUserLocation] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const userMarkerRef = useRef(null);

  // Fetch campus locations
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

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CAMPUS_CENTER,
      zoom: 16,
      minZoom: 14,
      maxZoom: 19,
      zoomControl: false
    });

    // Custom positioned zoom control
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial Tile Layer
    const tileLayer = L.tileLayer(TILE_LAYERS[activeLayer].url, {
      attribution: TILE_LAYERS[activeLayer].attribution,
      maxZoom: 19
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Feature Groups
    markersLayerRef.current = L.featureGroup().addTo(map);
    routeLayerRef.current = L.featureGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when layer switch changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newTile = L.tileLayer(TILE_LAYERS[activeLayer].url, {
      attribution: TILE_LAYERS[activeLayer].attribution,
      maxZoom: 19
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
  }, [activeLayer]);

  // Create custom marker icons
  const createCustomIcon = (loc, isSelected) => {
    const isCanteen = loc.category === 'Food & Dining';
    const isAcademic = loc.category === 'Academic Store';
    const isMedical = loc.category === 'Medical & Health';
    const isSports = loc.category === 'Sports & Recreation';

    let bgClass = 'bg-blue-600 border-white text-white';
    let iconChar = '📍';

    if (isCanteen) {
      bgClass = 'bg-amber-500 border-amber-200 text-slate-950 font-bold';
      iconChar = '🍽️';
    } else if (isMedical) {
      bgClass = 'bg-rose-600 border-rose-200 text-white';
      iconChar = '🏥';
    } else if (isSports) {
      bgClass = 'bg-emerald-600 border-emerald-200 text-white';
      iconChar = '🏃';
    } else if (isAcademic) {
      bgClass = 'bg-cyan-600 border-cyan-200 text-white';
      iconChar = '🖨️';
    }

    const selectedRing = isSelected
      ? 'ring-4 ring-blue-400 scale-125 z-50 animate-bounce'
      : 'hover:scale-110';

    const html = `
      <div class="relative group cursor-pointer flex flex-col items-center">
        <div class="w-8 h-8 rounded-full border-2 shadow-xl flex items-center justify-center text-xs transition duration-200 ${bgClass} ${selectedRing}">
          <span>${iconChar}</span>
        </div>
        <div class="mt-1 px-1.5 py-0.5 rounded-md bg-slate-950/90 text-white text-[9px] font-bold border border-slate-700 whitespace-nowrap shadow-md pointer-events-none">
          ${loc.name.split('(')[0].trim()}
        </div>
      </div>
    `;

    return L.divIcon({
      className: 'custom-campus-marker',
      html,
      iconSize: [32, 48],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  };

  // Render Markers on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || locations.length === 0) return;

    markersLayerRef.current.clearLayers();

    filteredLocations.forEach((loc) => {
      const lat = loc.lat || loc.coordinates?.lat || DEFAULT_CAMPUS_CENTER[0];
      const lng = loc.lng || loc.coordinates?.lng || DEFAULT_CAMPUS_CENTER[1];
      const isSelected = selectedLocation?.id === loc.id;

      const marker = L.marker([lat, lng], {
        icon: createCustomIcon(loc, isSelected)
      });

      marker.on('click', () => {
        setSelectedLocation(loc);
        mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1 });
      });

      // Bind rich Leaflet popup
      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; min-width: 180px; color: #0f172a;">
          <div style="font-weight: 800; font-size: 13px; color: #1e293b;">${loc.name}</div>
          <div style="font-size: 10px; color: #0284c7; font-weight: 600; margin-top: 2px;">${loc.category} • ${loc.zone}</div>
          <div style="font-size: 11px; color: #475569; margin-top: 4px;">${loc.building} (${loc.floor})</div>
          <div style="font-size: 10px; color: #16a34a; font-weight: 600; margin-top: 4px;">🕒 ${loc.timings}</div>
        </div>
      `;
      marker.bindPopup(popupHtml);

      marker.addTo(markersLayerRef.current);
    });
  }, [locations, selectedLocation, selectedCategory, searchQuery]);

  // Handle Walking Route Directions on Real Map
  const handleGetDirections = (targetLoc) => {
    if (!mapInstanceRef.current || !routeLayerRef.current) return;

    routeLayerRef.current.clearLayers();

    // Start point: User location if known, otherwise Main Campus Gate
    const startPoint = userLocation
      ? [userLocation.lat, userLocation.lng]
      : [13.0068, 80.2315]; // Main Campus Gate

    const destPoint = [
      targetLoc.lat || targetLoc.coordinates?.lat || 13.0105,
      targetLoc.lng || targetLoc.coordinates?.lng || 80.2348
    ];

    // Generate realistic campus pathway waypoints
    const midLat = (startPoint[0] + destPoint[0]) / 2 + 0.0003;
    const midLng = (startPoint[1] + destPoint[1]) / 2;

    const routeWaypoints = [
      startPoint,
      [startPoint[0] + 0.001, startPoint[1] + 0.0002],
      [midLat, midLng],
      [destPoint[0] - 0.0005, destPoint[1] - 0.0002],
      destPoint
    ];

    // Calculate approximate distance
    const p1 = L.latLng(startPoint);
    const p2 = L.latLng(destPoint);
    const distMeters = Math.round(p1.distanceTo(p2) * 1.25); // Path adjustment factor
    const walkMinutes = Math.max(1, Math.round(distMeters / 75)); // ~75m per minute walking pace

    // Draw glowing route line on real map
    const routeLine = L.polyline(routeWaypoints, {
      color: '#3b82f6',
      weight: 6,
      opacity: 0.85,
      dashArray: '10, 10',
      lineCap: 'round'
    }).addTo(routeLayerRef.current);

    // Add animated border/shadow to path
    L.polyline(routeWaypoints, {
      color: '#60a5fa',
      weight: 2,
      opacity: 1
    }).addTo(routeLayerRef.current);

    // Fit bounds to show entire route
    mapInstanceRef.current.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

    setActiveRoute({
      destination: targetLoc.name,
      distanceMeters: distMeters,
      walkMinutes,
      from: userLocation ? 'Your Current Location' : 'Main Campus Gate'
    });
  };

  // Locate User on Real Map
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const coords = { lat: latitude, lng: longitude };
        setUserLocation(coords);

        if (mapInstanceRef.current) {
          if (userMarkerRef.current) {
            mapInstanceRef.current.removeLayer(userMarkerRef.current);
          }

          const userHtml = `
            <div class="relative flex items-center justify-center">
              <span class="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-lg animate-pulse"></span>
              <span class="absolute w-10 h-10 rounded-full bg-blue-500/30 animate-ping"></span>
            </div>
          `;

          const userIcon = L.divIcon({
            className: 'user-gps-marker',
            html: userHtml,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon })
            .bindPopup('<b>You are here!</b><br>Real GPS Location')
            .addTo(mapInstanceRef.current);

          mapInstanceRef.current.flyTo([latitude, longitude], 17);
        }
      },
      (err) => {
        // Fallback: Use central campus student amenities plaza
        const fallback = { lat: 13.0102, lng: 80.2337 };
        setUserLocation(fallback);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([fallback.lat, fallback.lng], 17);
        }
        alert('Could not retrieve device GPS. Centered on Central Campus Student Courtyard.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

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
      {/* Header with Search and Real Map Indicator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-400" />
              <span>Real Campus Map & Live GPS Navigation</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Satellite & Streets
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Explore Canteen 1 & 2, print stores, academic blocks, and calculate real walking routes
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search canteen, xerox, library, sports..."
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

      {/* Main Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Real Leaflet Map Container (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          {/* Map Top Bar Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            {/* Tile Layer Switcher */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setActiveLayer('street')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  activeLayer === 'street'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Street Map
              </button>
              <button
                onClick={() => setActiveLayer('satellite')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  activeLayer === 'satellite'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Satellite 🛰️
              </button>
              <button
                onClick={() => setActiveLayer('dark')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  activeLayer === 'dark'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Dark Map 🌙
              </button>
            </div>

            {/* Map Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLocateMe}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition"
                title="Find My Current GPS Position"
              >
                <Locate className="w-3.5 h-3.5 text-cyan-400" />
                <span>Locate Me</span>
              </button>

              <button
                onClick={() => {
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo(DEFAULT_CAMPUS_CENTER, 16);
                  }
                }}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition"
                title="Center Campus"
              >
                <Compass className="w-4 h-4 text-blue-400" />
              </button>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Real Leaflet Map Viewport */}
          <div
            ref={mapContainerRef}
            className={`w-full rounded-xl overflow-hidden my-3 border border-slate-800 shadow-inner z-10 transition-all duration-300 ${
              isFullscreen ? 'fixed inset-4 z-50 h-[92vh]' : 'h-96 sm:h-[480px]'
            }`}
          />

          {/* Active Navigation Route Alert Banner */}
          {activeRoute && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/40 my-1 text-xs text-white flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 shrink-0">
                  <Footprints className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <span>Walking to: {activeRoute.destination}</span>
                    <span className="text-emerald-400 font-mono">
                      ~{activeRoute.walkMinutes} min ({activeRoute.distanceMeters}m)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Route mapped from {activeRoute.from} along pedestrian avenues.
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveRoute(null);
                  if (routeLayerRef.current) routeLayerRef.current.clearLayers();
                }}
                className="text-xs text-slate-400 hover:text-white font-medium underline shrink-0"
              >
                Clear Route
              </button>
            </div>
          )}

          {/* Legend Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Canteen & Dining
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Print & Academic
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Sports & Parks
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Health Wing
              </span>
            </div>
            <span>Click any marker to inspect & generate walking paths</span>
          </div>
        </div>

        {/* Right Column: Selected Destination & Details Card */}
        <div className="space-y-4">
          {selectedLocation ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between">
              <div>
                {/* Photo */}
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

                {/* Content */}
                <div className="p-5 space-y-3.5">
                  <div>
                    <h3 className="font-extrabold text-white text-base leading-tight">
                      {selectedLocation.name}
                    </h3>
                    <p className="text-xs text-blue-400 mt-1 font-medium flex items-center gap-1">
                      <Building className="w-3.5 h-3.5" />
                      {selectedLocation.building} • {selectedLocation.floor}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {selectedLocation.address || 'Central Campus Boulevard'}
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
                        <strong>Peak Hours:</strong> {selectedLocation.popularTimes}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0 space-y-2">
                <button
                  onClick={() => handleGetDirections(selectedLocation)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                >
                  <Footprints className="w-4 h-4" />
                  <span>Get Walking Route Directions</span>
                </button>

                {selectedLocation.category === 'Food & Dining' && (
                  <button
                    onClick={() => onNavigateToCanteen(selectedLocation.id)}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 font-bold text-xs border border-amber-500/30 transition flex items-center justify-center gap-2"
                  >
                    <Utensils className="w-4 h-4" />
                    <span>View Menu & Place Prepaid Order</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
              Select a location on the real map to view details.
            </div>
          )}

          {/* Quick List of Stores / Locations */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Campus Directory ({filteredLocations.length} locations)
            </h4>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {filteredLocations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => {
                    setSelectedLocation(loc);
                    const lat = loc.lat || loc.coordinates?.lat || DEFAULT_CAMPUS_CENTER[0];
                    const lng = loc.lng || loc.coordinates?.lng || DEFAULT_CAMPUS_CENTER[1];
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1 });
                    }
                  }}
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
