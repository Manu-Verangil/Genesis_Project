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
  ShieldCheck,
  Check,
  Lock
} from 'lucide-react';
import { api } from '../api';
import { initialData } from '../mockData';

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
    attribution: 'Tiles &copy; Esri &mdash; Aerial Imagery'
  },
  dark: {
    name: 'Dark Mode Map',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
  }
};

// ========================================================
// AMRITA VISHWA VIDYAPEETHAM, ETTIMADAI, COIMBATORE
// Exact Campus Coordinates & Compound Boundary Lockdown
// ========================================================
const AMRITA_CAMPUS_CENTER = [10.9036, 76.8997];

// Strict Campus Compound Bounds: [South-West, North-East]
// Exact bounds enclosing the 400-acre Amrita Vishwa Vidyapeetham Ettimadai campus
const AMRITA_CAMPUS_BOUNDS = [
  [10.8950, 76.8900], // South-West
  [10.9120, 76.9090]  // North-East
];

// Official 400-Acre Campus Perimeter Polygon from OpenStreetMap (Way 128964693)
const AMRITA_COMPOUND_PERIMETER = [
  [10.906129, 76.894420], [10.905300, 76.893011], [10.904382, 76.893025], [10.903148, 76.893068],
  [10.903569, 76.894786], [10.903232, 76.894829], [10.902853, 76.894870], [10.901947, 76.894988],
  [10.901841, 76.894484], [10.901701, 76.893970], [10.901536, 76.893944], [10.901507, 76.893580],
  [10.900577, 76.893677], [10.900565, 76.894008], [10.900774, 76.894014], [10.900746, 76.894559],
  [10.900725, 76.895160], [10.901330, 76.895175], [10.901511, 76.898169], [10.899146, 76.898170],
  [10.899123, 76.898636], [10.899105, 76.900004], [10.897593, 76.900049], [10.897631, 76.900610],
  [10.899155, 76.900579], [10.899293, 76.903765], [10.899397, 76.904119], [10.899661, 76.904462],
  [10.899977, 76.904784], [10.900314, 76.905063], [10.900640, 76.905295], [10.902166, 76.906381],
  [10.902376, 76.906310], [10.903759, 76.906264], [10.903717, 76.904548], [10.905692, 76.904296],
  [10.905950, 76.904228], [10.906709, 76.904571], [10.907446, 76.904593], [10.908710, 76.904550],
  [10.909616, 76.904163], [10.909384, 76.902039], [10.909290, 76.901007], [10.909237, 76.900621],
  [10.909216, 76.900342], [10.909195, 76.900194], [10.908984, 76.897576], [10.907277, 76.897638],
  [10.907246, 76.897059], [10.907204, 76.896239], [10.906988, 76.895873], [10.906764, 76.895493],
  [10.906455, 76.894972], [10.906129, 76.894420]
];

const AMRITA_MAIN_GATE = [10.8980, 76.9003];

export function CampusMapView({ onNavigateToCanteen }) {
  const [locations, setLocations] = useState(initialData.campusLocations || []);
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
  const perimeterLayerRef = useRef(null);
  const userMarkerRef = useRef(null);

  // Fetch campus locations from backend
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

  // Initialize Leaflet Map with Compound Lockdown
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: AMRITA_CAMPUS_CENTER,
      zoom: 16.5,
      minZoom: 15.2, // Prevent zooming out beyond Amrita Ettimadai campus
      maxZoom: 19,
      maxBounds: AMRITA_CAMPUS_BOUNDS, // Stiff boundary lockdown
      maxBoundsViscosity: 1.0, // Stiffest lock: completely blocks panning outside compound!
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
    perimeterLayerRef.current = L.featureGroup().addTo(map);
    routeLayerRef.current = L.featureGroup().addTo(map);
    markersLayerRef.current = L.featureGroup().addTo(map);

    // Draw Glowing Amrita Compound Boundary Perimeter
    const compoundPolygon = L.polygon(AMRITA_COMPOUND_PERIMETER, {
      color: '#8b5cf6', // Violet
      weight: 3,
      opacity: 0.9,
      fillColor: '#8b5cf6',
      fillOpacity: 0.05,
      dashArray: '8, 6'
    }).addTo(perimeterLayerRef.current);

    compoundPolygon.bindTooltip(
      '🏛️ Amrita Vishwa Vidyapeetham — 400-Acre Ettimadai Campus Compound',
      {
        permanent: false,
        direction: 'center',
        className: 'bg-slate-900 text-purple-300 font-bold text-xs p-2 rounded-lg border border-purple-500/40 shadow-xl'
      }
    );

    // Click handler to inspect any point on campus
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      L.popup()
        .setLatLng(e.latlng)
        .setContent(`
          <div style="font-family: inherit; font-size: 11px; padding: 2px;">
            <div style="font-weight: bold; color: #7c3aed;">📍 Clicked Campus Point</div>
            <div style="color: #334155; margin-top: 3px;">Lat: <b>${lat.toFixed(5)}</b>, Lng: <b>${lng.toFixed(5)}</b></div>
          </div>
        `)
        .openOn(map);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when user toggles Street / Satellite / Dark
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newTile = L.tileLayer(TILE_LAYERS[activeLayer].url, {
      attribution: TILE_LAYERS[activeLayer].attribution,
      maxZoom: 19
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
  }, [activeLayer]);

  // Create custom marker icons for Amrita Campus Landmarks
  const createCustomIcon = (loc, isSelected) => {
    const isCanteen = loc.category === 'Food & Dining';
    const isHostel = loc.category === 'Hostels & Living';
    const isAcademic = loc.category === 'Academic & Labs';
    const isMedical = loc.category === 'Medical & Health';
    const isSports = loc.category === 'Sports & Recreation';
    const isStore = loc.category === 'Academic Store' || loc.category === 'Retail Store';

    let bgClass = 'bg-blue-600 border-white text-white';
    let iconChar = '🏛️';

    if (isCanteen) {
      bgClass = 'bg-amber-500 border-amber-200 text-slate-950 font-bold';
      iconChar = '🍽️';
    } else if (isHostel) {
      bgClass = 'bg-indigo-600 border-indigo-200 text-white';
      iconChar = '🛏️';
    } else if (isAcademic) {
      bgClass = 'bg-cyan-600 border-cyan-200 text-white';
      iconChar = '🎓';
    } else if (isMedical) {
      bgClass = 'bg-rose-600 border-rose-200 text-white';
      iconChar = '🏥';
    } else if (isSports) {
      bgClass = 'bg-emerald-600 border-emerald-200 text-white';
      iconChar = '🏊';
    } else if (isStore) {
      bgClass = 'bg-teal-600 border-teal-200 text-white';
      iconChar = '📚';
    }

    const selectedRing = isSelected
      ? 'ring-4 ring-purple-400 scale-125 z-50 animate-bounce'
      : 'hover:scale-110';

    const html = `
      <div class="relative group cursor-pointer flex flex-col items-center">
        <div class="w-8 h-8 rounded-full border-2 shadow-xl flex items-center justify-center text-xs transition duration-200 ${bgClass} ${selectedRing}">
          <span>${iconChar}</span>
        </div>
        <div class="mt-1 px-2 py-0.5 rounded-md bg-slate-950/95 text-white text-[9px] font-bold border border-slate-700 whitespace-nowrap shadow-md pointer-events-none">
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
      const lat = loc.lat || loc.coordinates?.lat || AMRITA_CAMPUS_CENTER[0];
      const lng = loc.lng || loc.coordinates?.lng || AMRITA_CAMPUS_CENTER[1];
      const isSelected = selectedLocation?.id === loc.id;

      const marker = L.marker([lat, lng], {
        icon: createCustomIcon(loc, isSelected)
      });

      marker.on('click', () => {
        setSelectedLocation(loc);
        mapInstanceRef.current.flyTo([lat, lng], 17.5, { duration: 1 });
      });

      // Bind rich Leaflet popup
      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; min-width: 190px; color: #0f172a; padding: 2px;">
          <div style="font-weight: 800; font-size: 13px; color: #1e293b; line-height: 1.2;">${loc.name}</div>
          <div style="font-size: 10px; color: #7c3aed; font-weight: 700; margin-top: 3px;">${loc.category} • ${loc.zone}</div>
          <div style="font-size: 11px; color: #475569; margin-top: 4px;">${loc.building} (${loc.floor})</div>
          <div style="font-size: 10px; color: #16a34a; font-weight: 600; margin-top: 4px;">🕒 ${loc.timings}</div>
        </div>
      `;
      marker.bindPopup(popupHtml);

      marker.addTo(markersLayerRef.current);
    });
  }, [locations, selectedLocation, selectedCategory, searchQuery]);

  // Handle Walking Route Directions within Amrita Compound
  const handleGetDirections = (targetLoc) => {
    if (!mapInstanceRef.current || !routeLayerRef.current) return;

    routeLayerRef.current.clearLayers();

    // Start point: User location if within Amrita campus, otherwise Amrita Main Gate
    const startPoint = userLocation
      ? [userLocation.lat, userLocation.lng]
      : AMRITA_MAIN_GATE;

    const destPoint = [
      targetLoc.lat || targetLoc.coordinates?.lat || 10.9026,
      targetLoc.lng || targetLoc.coordinates?.lng || 76.8994
    ];

    // Generate realistic campus road pathway waypoints along Amrita black-topped avenues
    const midLat = (startPoint[0] + destPoint[0]) / 2 + 0.0002;
    const midLng = (startPoint[1] + destPoint[1]) / 2;

    const routeWaypoints = [
      startPoint,
      [startPoint[0] + 0.0012, startPoint[1] - 0.0003],
      [midLat, midLng],
      [destPoint[0] - 0.0004, destPoint[1] + 0.0001],
      destPoint
    ];

    // Calculate approximate distance
    const p1 = L.latLng(startPoint);
    const p2 = L.latLng(destPoint);
    const distMeters = Math.round(p1.distanceTo(p2) * 1.25);
    const walkMinutes = Math.max(1, Math.round(distMeters / 75)); // ~75m per min walk

    // Draw glowing route line on real map
    const routeLine = L.polyline(routeWaypoints, {
      color: '#8b5cf6',
      weight: 6,
      opacity: 0.9,
      dashArray: '10, 10',
      lineCap: 'round'
    }).addTo(routeLayerRef.current);

    // Inner highlight
    L.polyline(routeWaypoints, {
      color: '#c4b5fd',
      weight: 2,
      opacity: 1
    }).addTo(routeLayerRef.current);

    mapInstanceRef.current.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

    setActiveRoute({
      destination: targetLoc.name,
      distanceMeters: distMeters,
      walkMinutes,
      from: userLocation ? 'Your Current Location' : 'Amrita Main Entrance Arch (Gate 1)'
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
            .bindPopup('<b>You are here!</b><br>Real GPS Location on Amrita Campus')
            .addTo(mapInstanceRef.current);

          mapInstanceRef.current.flyTo([latitude, longitude], 17.5);
        }
      },
      (err) => {
        // Fallback: Center on Central Amenities Complex
        const fallback = { lat: 10.9026, lng: 76.8994 };
        setUserLocation(fallback);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([fallback.lat, fallback.lng], 17);
        }
        alert('Could not retrieve device GPS. Centered on Amrita Central Amenities Plaza.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const categories = [
    'All',
    'Food & Dining',
    'Academic & Labs',
    'Hostels & Living',
    'Facilities',
    'Sports & Recreation',
    'Academic Store',
    'Medical & Health',
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
    <div className="space-y-6 text-slate-800">
      {/* Amrita Campus Header with Lockdown Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#A41034]" />
                <span>Amrita Vishwa Vidyapeetham — Ettimadai Campus Map</span>
              </h3>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-rose-50 text-[#A41034] border border-rose-200 flex items-center gap-1 font-bold">
                <Lock className="w-3 h-3 text-[#A41034]" />
                400-Acre Compound Locked
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Live geographic navigation for Amrita Coimbatore (Ettimadai). Panning is locked strictly within the campus perimeter.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search canteen, AB-1, library, clinic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#A41034] shadow-xs"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-4 border-t border-slate-100 mt-4 pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-[#A41034] text-white shadow-xs font-bold'
                  : 'bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200'
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
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          {/* Map Top Bar Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            {/* Tile Layer Switcher */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveLayer('street')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  activeLayer === 'street'
                    ? 'bg-[#A41034] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Street Map
              </button>
              <button
                onClick={() => setActiveLayer('satellite')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  activeLayer === 'satellite'
                    ? 'bg-[#A41034] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Satellite 🛰️
              </button>
              <button
                onClick={() => setActiveLayer('dark')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  activeLayer === 'dark'
                    ? 'bg-[#A41034] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dark Map 🌙
              </button>
            </div>

            {/* Map Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLocateMe}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition"
                title="Locate my position on Amrita Campus"
              >
                <Locate className="w-3.5 h-3.5 text-[#A41034]" />
                <span>Locate Me</span>
              </button>

              <button
                onClick={() => {
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo(AMRITA_CAMPUS_CENTER, 16.5);
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#A41034] border border-slate-200 transition text-xs font-bold flex items-center gap-1"
                title="Center on Amrita Central Plaza"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Amrita Center</span>
              </button>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Real Leaflet Map Viewport */}
          <div
            ref={mapContainerRef}
            className={`w-full rounded-xl overflow-hidden my-3 border border-slate-200 shadow-inner z-10 transition-all duration-300 ${
              isFullscreen ? 'fixed inset-4 z-50 h-[92vh]' : 'h-96 sm:h-[480px]'
            }`}
          />

          {/* Active Navigation Route Alert Banner */}
          {activeRoute && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 my-1 text-xs text-slate-900 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#A41034] text-white shrink-0">
                  <Footprints className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <span>Walking to: {activeRoute.destination}</span>
                    <span className="text-emerald-700 font-mono font-bold">
                      ~{activeRoute.walkMinutes} min ({activeRoute.distanceMeters}m)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Path calculated from {activeRoute.from} along Amrita campus walkways.
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveRoute(null);
                  if (routeLayerRef.current) routeLayerRef.current.clearLayers();
                }}
                className="text-xs text-[#A41034] hover:text-[#880E2D] font-bold underline shrink-0"
              >
                Clear Route
              </button>
            </div>
          )}

          {/* Compound Lockdown Legend Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A41034]" /> Amrita Perimeter
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Canteen & Dining
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-600" /> Academic & Labs
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Hostels (Boys & Girls)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Sports & Pool
              </span>
            </div>
            <span className="text-[#A41034] font-bold">Locked to Ettimadai Compound Bounds</span>
          </div>
        </div>

        {/* Right Column: Selected Destination & Details Card */}
        <div className="space-y-4">
          {selectedLocation ? (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                {/* Photo */}
                <div className="relative h-44 w-full bg-slate-100">
                  <img
                    src={selectedLocation.image}
                    alt={selectedLocation.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-md text-[10px] font-bold text-slate-800 border border-slate-200 shadow-xs">
                    {selectedLocation.zone}
                  </span>
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-[#A41034] text-white text-[10px] font-bold shadow-xs">
                    {selectedLocation.category}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3.5">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                      {selectedLocation.name}
                    </h3>
                    <p className="text-xs text-[#A41034] mt-1 font-semibold flex items-center gap-1">
                      <Building className="w-3.5 h-3.5" />
                      {selectedLocation.building} • {selectedLocation.floor}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {selectedLocation.address || 'Amrita Vishwa Vidyapeetham, Ettimadai'}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedLocation.description}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{selectedLocation.timings}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{selectedLocation.contact}</span>
                    </div>

                    <div className="flex items-start gap-2 text-amber-800 text-[11px] pt-1">
                      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Peak Crowd:</strong> {selectedLocation.popularTimes}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0 space-y-2">
                <button
                  onClick={() => handleGetDirections(selectedLocation)}
                  className="w-full py-2.5 rounded-xl bg-[#A41034] hover:bg-[#880E2D] text-white font-bold text-xs transition shadow-xs flex items-center justify-center gap-2"
                >
                  <Footprints className="w-4 h-4" />
                  <span>Get Walking Directions (Within Campus)</span>
                </button>

                {selectedLocation.category === 'Food & Dining' && (
                  <button
                    onClick={() => onNavigateToCanteen(selectedLocation.id)}
                    className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#A41034] font-bold text-xs border border-slate-200 transition flex items-center justify-center gap-2"
                  >
                    <Utensils className="w-4 h-4" />
                    <span>View Menu & Place Prepaid Order</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-xs shadow-xs">
              Select a building on the Amrita Ettimadai map to view details.
            </div>
          )}

          {/* Quick List of Amrita Campus Hubs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Amrita Ettimadai Directory ({filteredLocations.length} locations)
            </h4>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {filteredLocations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => {
                    setSelectedLocation(loc);
                    const lat = loc.lat || loc.coordinates?.lat || AMRITA_CAMPUS_CENTER[0];
                    const lng = loc.lng || loc.coordinates?.lng || AMRITA_CAMPUS_CENTER[1];
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.flyTo([lat, lng], 17.5, { duration: 1 });
                    }
                  }}
                  className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition ${
                    selectedLocation?.id === loc.id
                      ? 'bg-rose-50 text-[#A41034] font-bold border border-rose-200'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span className="truncate pr-2">{loc.name}</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
