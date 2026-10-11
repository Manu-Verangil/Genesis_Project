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
  Lock,
  ArrowRightLeft,
  Flame,
  Route as RouteIcon,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { api } from '../api';
import { initialData } from '../mockData';
import {
  CAMPUS_LANDMARKS,
  calculateCampusRoute,
  calculateHaversineDistance,
  WALKING_SPEED_METERS_PER_MIN
} from '../data/campusRouting';

// Tile Layer Configurations
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
// Campus Center & Strict Boundary Lockdown
// ========================================================
const AMRITA_CAMPUS_CENTER = [10.9036, 76.8997];

const AMRITA_CAMPUS_BOUNDS = [
  [10.8950, 76.8900], // South-West
  [10.9120, 76.9090]  // North-East
];

// Official 400-Acre Campus Perimeter Polygon
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

export function CampusMapView({
  onNavigateToCanteen,
  isMarkingIssueOnMap = false,
  onConfirmIssueLocation,
  onCancelMarkingIssue,
  focusedIssueOnMap = null,
  onClearFocusedIssue,
  isMarkingLostFoundOnMap = false,
  onConfirmLostFoundLocation,
  onCancelMarkingLostFound,
  focusedLostFoundOnMap = null,
  onClearFocusedLostFound
}) {
  const isAnyMarkingMode = isMarkingIssueOnMap || isMarkingLostFoundOnMap;
  const [locations, setLocations] = useState(initialData.campusLocations || CAMPUS_LANDMARKS);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLayer, setActiveLayer] = useState('street');
  const [userLocation, setUserLocation] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Issue Location Marking State
  const [pinnedIssueLocation, setPinnedIssueLocation] = useState(null);

  // Routing State
  const [originId, setOriginId] = useState('loc-gate');
  const [destinationId, setDestinationId] = useState('loc-1');
  const [activeRoute, setActiveRoute] = useState(null);
  const [showStepDetails, setShowStepDetails] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const perimeterLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const issueMarkerRef = useRef(null);
  const focusedIssueMarkerRef = useRef(null);

  // Fetch campus locations from backend or fallback to CAMPUS_LANDMARKS
  useEffect(() => {
    api.getMapLocations()
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setLocations(res.data);
          setSelectedLocation(res.data[0]);
        } else {
          setSelectedLocation(CAMPUS_LANDMARKS[0]);
        }
      })
      .catch(() => {
        setSelectedLocation(CAMPUS_LANDMARKS[0]);
      });
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: AMRITA_CAMPUS_CENTER,
      zoom: 16.5,
      minZoom: 15.2,
      maxZoom: 19,
      maxBounds: AMRITA_CAMPUS_BOUNDS,
      maxBoundsViscosity: 1.0,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tileLayer = L.tileLayer(TILE_LAYERS[activeLayer].url, {
      attribution: TILE_LAYERS[activeLayer].attribution,
      maxZoom: 19
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    perimeterLayerRef.current = L.featureGroup().addTo(map);
    routeLayerRef.current = L.featureGroup().addTo(map);
    markersLayerRef.current = L.featureGroup().addTo(map);

    // Compound boundary polygon
    const compoundPolygon = L.polygon(AMRITA_COMPOUND_PERIMETER, {
      color: '#A41034',
      weight: 3,
      opacity: 0.9,
      fillColor: '#A41034',
      fillOpacity: 0.04,
      dashArray: '8, 6'
    }).addTo(perimeterLayerRef.current);

    compoundPolygon.bindTooltip(
      '🏛️ Amrita Vishwa Vidyapeetham — 400-Acre Ettimadai Campus Boundary',
      {
        permanent: false,
        direction: 'center',
        className: 'bg-slate-900 text-rose-300 font-bold text-xs p-2 rounded-lg border border-rose-500/40 shadow-xl'
      }
    );

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Tile layer switch
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newTile = L.tileLayer(TILE_LAYERS[activeLayer].url, {
      attribution: TILE_LAYERS[activeLayer].attribution,
      maxZoom: 19
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
  }, [activeLayer]);

  // Marker Icon Generator
  const createCustomIcon = (loc, isSelected, isOrigin, isDest) => {
    let bgClass = 'bg-[#0D6EFD] text-white border-white';
    let iconChar = '🏛️';

    if (loc.category === 'Food & Dining') {
      bgClass = 'bg-amber-500 text-slate-950 border-amber-200 font-bold';
      iconChar = '🍽️';
    } else if (loc.category === 'Academic Store' || loc.category === 'Retail Store') {
      bgClass = 'bg-teal-600 text-white border-teal-200';
      iconChar = '📚';
    } else if (loc.category === 'Academic & Labs') {
      bgClass = 'bg-cyan-700 text-white border-cyan-200';
      iconChar = '🎓';
    } else if (loc.category === 'Hostels & Living') {
      bgClass = 'bg-indigo-600 text-white border-indigo-200';
      iconChar = '🛏️';
    } else if (loc.category === 'Medical & Health') {
      bgClass = 'bg-rose-600 text-white border-rose-200';
      iconChar = '🏥';
    } else if (loc.category === 'Sports & Recreation') {
      bgClass = 'bg-emerald-600 text-white border-emerald-200';
      iconChar = '🏊';
    }

    let ringClass = '';
    if (isDest) {
      ringClass = 'ring-4 ring-rose-500 scale-125 z-50 animate-bounce';
    } else if (isOrigin) {
      ringClass = 'ring-4 ring-emerald-500 scale-125 z-50';
    } else if (isSelected) {
      ringClass = 'ring-4 ring-[#A41034] scale-110 z-40';
    } else {
      ringClass = 'hover:scale-110';
    }

    const shortTitle = loc.name.split('(')[0].trim();

    const html = `
      <div class="relative group cursor-pointer flex flex-col items-center">
        <div class="w-8 h-8 rounded-full border-2 shadow-xl flex items-center justify-center text-xs transition duration-200 ${bgClass} ${ringClass}">
          <span>${iconChar}</span>
        </div>
        <div class="mt-1 px-2 py-0.5 rounded-md bg-slate-950/90 text-white text-[9px] font-bold border border-slate-700 whitespace-nowrap shadow-md pointer-events-none">
          ${shortTitle}
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

  // Render Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    filteredLocations.forEach((loc) => {
      const lat = loc.lat || loc.coords?.[0] || loc.coordinates?.lat || AMRITA_CAMPUS_CENTER[0];
      const lng = loc.lng || loc.coords?.[1] || loc.coordinates?.lng || AMRITA_CAMPUS_CENTER[1];
      const isSelected = selectedLocation?.id === loc.id;
      const isOrigin = originId === loc.id;
      const isDest = destinationId === loc.id;

      const marker = L.marker([lat, lng], {
        icon: createCustomIcon(loc, isSelected, isOrigin, isDest)
      });

      marker.on('click', () => {
        if (isAnyMarkingMode) {
          setPinnedIssueLocation({
            name: `${loc.name} (${loc.building || loc.category})`,
            lat,
            lng,
            nearestLandmark: loc.name
          });
          mapInstanceRef.current.flyTo([lat, lng], 17.5, { duration: 0.8 });
          return;
        }
        setSelectedLocation(loc);
        setDestinationId(loc.id);
        mapInstanceRef.current.flyTo([lat, lng], 17.5, { duration: 1 });
      });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; min-width: 190px; color: #0f172a; padding: 2px;">
          <div style="font-weight: 800; font-size: 13px; color: #A41034; line-height: 1.2;">${loc.name}</div>
          <div style="font-size: 10px; color: #64748b; font-weight: 700; margin-top: 3px;">${loc.category} • ${loc.zone || 'Ettimadai'}</div>
          <div style="font-size: 11px; color: #334155; margin-top: 4px;">${loc.building || 'Campus Facility'}</div>
          <div style="font-size: 10px; color: #16a34a; font-weight: 600; margin-top: 4px;">🕒 ${loc.timings || 'Open for campus community'}</div>
        </div>
      `;
      marker.bindPopup(popupHtml);
      marker.addTo(markersLayerRef.current);
    });
  }, [locations, selectedLocation, selectedCategory, searchQuery, originId, destinationId, isAnyMarkingMode]);

  // Route Calculation and Rendering
  const handleCalculateRoute = (srcId = originId, dstId = destinationId) => {
    if (!srcId || !dstId) return;

    const customCoords = srcId === 'current-location' && userLocation ? [userLocation.lat, userLocation.lng] : null;
    const route = calculateCampusRoute(srcId, dstId, customCoords);

    if (route && route.success) {
      setActiveRoute(route);

      if (mapInstanceRef.current && routeLayerRef.current) {
        routeLayerRef.current.clearLayers();

        // Outer glowing route polyline
        const glowLine = L.polyline(route.pathCoords, {
          color: '#A41034',
          weight: 6,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(routeLayerRef.current);

        // Inner glowing dashes
        L.polyline(route.pathCoords, {
          color: '#ffffff',
          weight: 2,
          opacity: 0.95,
          dashArray: '8, 8',
          lineCap: 'round'
        }).addTo(routeLayerRef.current);

        // Origin marker pin
        const startIcon = L.divIcon({
          className: 'route-start-pin',
          html: '<div style="background:#16a34a;color:#fff;width:24px;height:24px;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;box-shadow:0 3px 6px rgba(0,0,0,0.35);">A</div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        L.marker(route.pathCoords[0], { icon: startIcon })
          .bindTooltip(`Origin: ${route.originName}`, { direction: 'top' })
          .addTo(routeLayerRef.current);

        // Destination marker pin
        const endIcon = L.divIcon({
          className: 'route-end-pin',
          html: '<div style="background:#A41034;color:#fff;width:24px;height:24px;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;box-shadow:0 3px 6px rgba(0,0,0,0.35);">B</div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        L.marker(route.pathCoords[route.pathCoords.length - 1], { icon: endIcon })
          .bindTooltip(`Destination: ${route.destinationName}`, { direction: 'top' })
          .addTo(routeLayerRef.current);

        mapInstanceRef.current.fitBounds(glowLine.getBounds(), { padding: [55, 55], maxZoom: 18 });
      }
    }
  };

  // Map Click Listener to Mark Place of Issue
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isAnyMarkingMode) {
      const container = map.getContainer();
      if (container) container.style.cursor = 'crosshair';

      const handleMapClick = (e) => {
        const { lat, lng } = e.latlng;

        // Find nearest landmark to compute an intuitive location title
        let nearest = null;
        let minDist = Infinity;
        (locations || CAMPUS_LANDMARKS).forEach((l) => {
          const lLat = l.lat || l.coords?.[0] || l.coordinates?.lat;
          const lLng = l.lng || l.coords?.[1] || l.coordinates?.lng;
          if (lLat && lLng) {
            const d = Math.hypot(lat - lLat, lng - lLng);
            if (d < minDist) {
              minDist = d;
              nearest = l;
            }
          }
        });

        let locationLabel = '';
        if (nearest && minDist < 0.0018) {
          locationLabel = `Near ${nearest.name} (${nearest.building || nearest.category || 'Amrita Campus'})`;
        } else {
          locationLabel = `Amrita Campus Spot [${lat.toFixed(4)}, ${lng.toFixed(4)}]`;
        }

        setPinnedIssueLocation({
          name: locationLabel,
          lat,
          lng,
          nearestLandmark: nearest ? nearest.name : null
        });
      };

      map.on('click', handleMapClick);

      return () => {
        if (container) container.style.cursor = '';
        map.off('click', handleMapClick);
      };
    } else {
      const container = map.getContainer();
      if (container) container.style.cursor = '';
    }
  }, [isAnyMarkingMode, locations]);

  // Render Pinned Issue Marker on Leaflet Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (issueMarkerRef.current) {
      map.removeLayer(issueMarkerRef.current);
      issueMarkerRef.current = null;
    }

    if (pinnedIssueLocation) {
      const issueIcon = L.divIcon({
        className: 'issue-pinned-marker',
        html: `
          <div class="relative flex flex-col items-center">
            <div class="w-10 h-10 rounded-full bg-rose-600 text-white border-2 border-white shadow-2xl flex items-center justify-center animate-bounce ring-4 ring-rose-400/50">
              <span class="text-base">📍</span>
            </div>
            <div class="mt-1 px-2.5 py-0.5 rounded-lg bg-slate-950 text-white text-[10px] font-extrabold border border-rose-500 whitespace-nowrap shadow-xl">
              Place of Issue
            </div>
          </div>
        `,
        iconSize: [40, 54],
        iconAnchor: [20, 46],
        popupAnchor: [0, -46]
      });

      const marker = L.marker([pinnedIssueLocation.lat, pinnedIssueLocation.lng], {
        icon: issueIcon,
        zIndexOffset: 1500
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #0f172a; padding: 2px;">
          <div style="font-weight: 800; font-size: 13px; color: #dc2626; line-height: 1.2;">📍 Marked Place of Issue</div>
          <div style="font-size: 11px; color: #334155; margin-top: 4px; font-weight: 600;">${pinnedIssueLocation.name}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 3px;">Coordinates: ${pinnedIssueLocation.lat.toFixed(5)}, ${pinnedIssueLocation.lng.toFixed(5)}</div>
        </div>
      `).openPopup();

      issueMarkerRef.current = marker;
    }
  }, [pinnedIssueLocation]);

  // Fly to focused issue if navigating from Issue List
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !focusedIssueOnMap) return;

    let targetCoords = null;
    if (focusedIssueOnMap.lat && focusedIssueOnMap.lng) {
      targetCoords = [focusedIssueOnMap.lat, focusedIssueOnMap.lng];
    } else {
      const match = (locations || CAMPUS_LANDMARKS).find((l) =>
        focusedIssueOnMap.location?.toLowerCase().includes(l.name.toLowerCase()) ||
        focusedIssueOnMap.location?.toLowerCase().includes((l.building || '').toLowerCase())
      );
      if (match) {
        targetCoords = [
          match.lat || match.coords?.[0] || match.coordinates?.lat,
          match.lng || match.coords?.[1] || match.coordinates?.lng
        ];
      } else {
        targetCoords = AMRITA_CAMPUS_CENTER;
      }
    }

    if (targetCoords && targetCoords[0] && targetCoords[1]) {
      map.flyTo(targetCoords, 18, { duration: 1.2 });

      if (focusedIssueMarkerRef.current) {
        map.removeLayer(focusedIssueMarkerRef.current);
      }

      const icon = L.divIcon({
        className: 'focused-issue-marker',
        html: `
          <div class="relative flex flex-col items-center">
            <div class="w-9 h-9 rounded-full bg-rose-600 text-white border-2 border-white shadow-xl flex items-center justify-center animate-pulse">
              <span class="text-sm">⚠️</span>
            </div>
            <div class="mt-1 px-2 py-0.5 rounded-md bg-slate-950 text-white text-[10px] font-bold border border-rose-400 whitespace-nowrap shadow-md">
              ${(focusedIssueOnMap.title || 'Campus Issue').slice(0, 20)}
            </div>
          </div>
        `,
        iconSize: [36, 48],
        iconAnchor: [18, 40]
      });

      const marker = L.marker(targetCoords, { icon, zIndexOffset: 1200 }).addTo(map);
      marker.bindPopup(`
        <div style="font-size: 12px; color: #0f172a; padding: 2px;">
          <strong style="color: #A41034;">⚠️ ${focusedIssueOnMap.title}</strong>
          <p style="margin-top: 3px; font-size: 11px;">${focusedIssueOnMap.location}</p>
          <span style="font-size: 10px; color: #64748b;">Status: ${focusedIssueOnMap.status || 'Reported'}</span>
        </div>
      `).openPopup();

      focusedIssueMarkerRef.current = marker;
    }
  }, [focusedIssueOnMap, locations]);

  // Fly to focused lost & found item if navigating from Lost & Found
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !focusedLostFoundOnMap) return;

    let targetCoords = null;
    if (focusedLostFoundOnMap.lat && focusedLostFoundOnMap.lng) {
      targetCoords = [focusedLostFoundOnMap.lat, focusedLostFoundOnMap.lng];
    } else {
      const match = (locations || CAMPUS_LANDMARKS).find((l) =>
        focusedLostFoundOnMap.location?.toLowerCase().includes(l.name.toLowerCase()) ||
        focusedLostFoundOnMap.location?.toLowerCase().includes((l.building || '').toLowerCase())
      );
      if (match) {
        targetCoords = [
          match.lat || match.coords?.[0] || match.coordinates?.lat,
          match.lng || match.coords?.[1] || match.coordinates?.lng
        ];
      } else {
        targetCoords = AMRITA_CAMPUS_CENTER;
      }
    }

    if (targetCoords && targetCoords[0] && targetCoords[1]) {
      map.flyTo(targetCoords, 18, { duration: 1.2 });

      if (focusedIssueMarkerRef.current) {
        map.removeLayer(focusedIssueMarkerRef.current);
      }

      const icon = L.divIcon({
        className: 'focused-lf-marker',
        html: `
          <div class="relative flex flex-col items-center">
            <div class="w-9 h-9 rounded-full bg-emerald-600 text-white border-2 border-white shadow-xl flex items-center justify-center animate-pulse">
              <span class="text-sm">🔍</span>
            </div>
            <div class="mt-1 px-2 py-0.5 rounded-md bg-slate-950 text-white text-[10px] font-bold border border-emerald-400 whitespace-nowrap shadow-md">
              ${(focusedLostFoundOnMap.title || 'Lost & Found').slice(0, 20)}
            </div>
          </div>
        `,
        iconSize: [36, 48],
        iconAnchor: [18, 40]
      });

      const marker = L.marker(targetCoords, { icon, zIndexOffset: 1200 }).addTo(map);
      marker.bindPopup(`
        <div style="font-size: 12px; color: #0f172a; padding: 2px;">
          <strong style="color: #059669;">🔍 ${focusedLostFoundOnMap.title}</strong>
          <p style="margin-top: 3px; font-size: 11px;">${focusedLostFoundOnMap.location}</p>
          <span style="font-size: 10px; color: #64748b;">Type: ${focusedLostFoundOnMap.type === 'lost' ? 'Reported Lost' : 'Found (Claimable)'}</span>
        </div>
      `).openPopup();

      focusedIssueMarkerRef.current = marker;
    }
  }, [focusedLostFoundOnMap, locations]);

  // Quick Shortcut Handler
  const handleShortcutSelect = (destKey) => {
    setDestinationId(destKey);
    const destLoc = CAMPUS_LANDMARKS.find((l) => l.id === destKey);
    if (destLoc) setSelectedLocation(destLoc);
    handleCalculateRoute(originId, destKey);
  };

  // Swap Origin and Destination
  const handleSwapLocations = () => {
    if (originId === 'current-location') {
      alert('Cannot swap when starting from live GPS location.');
      return;
    }
    const temp = originId;
    setOriginId(destinationId);
    setDestinationId(temp);
    handleCalculateRoute(destinationId, temp);
  };

  // Clear Active Route
  const handleClearRoute = () => {
    setActiveRoute(null);
    if (routeLayerRef.current) {
      routeLayerRef.current.clearLayers();
    }
  };

  // GPS Locate User
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
        setOriginId('current-location');

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

        // Recalculate route if destination is active
        if (destinationId) {
          handleCalculateRoute('current-location', destinationId);
        }
      },
      () => {
        const fallback = { lat: 10.9026, lng: 76.8994 };
        setUserLocation(fallback);
        setOriginId('current-location');
        alert('Could not retrieve device GPS. Set origin to Central Amenities Plaza.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const categories = [
    'All',
    'Food & Dining',
    'Academic Store',
    'Academic & Labs',
    'Facilities',
    'Hostels & Living',
    'Sports & Recreation',
    'Medical & Health',
    'Administration'
  ];

  const filteredLocations = locations.filter((loc) => {
    if (selectedCategory !== 'All' && loc.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !loc.name.toLowerCase().includes(q) &&
        !loc.description?.toLowerCase().includes(q) &&
        !loc.building?.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  // Shortcut items list
  const shortcutPills = [
    { label: 'Canteen 1 (Main)', id: 'loc-1', icon: '🍽️' },
    { label: 'Canteen 2 (IT)', id: 'loc-it', icon: '🍔' },
    { label: 'MBA Canteen', id: 'loc-mba', icon: '☕' },
    { label: 'Stationery & Xerox', id: 'loc-xerox', icon: '📚' },
    { label: 'Central Library', id: 'loc-lib', icon: '📖' },
    { label: 'Academic Block 1', id: 'loc-ab1', icon: '🎓' },
    { label: 'Academic Block 3', id: 'loc-ab3', icon: '💻' },
    { label: 'Amrita Health Clinic', id: 'loc-clinic', icon: '🏥' },
    { label: 'Main Entrance Gate', id: 'loc-gate', icon: '🚪' }
  ];

  return (
    <div className="space-y-5 text-slate-800">

      {/* Top Banner when marking location on map */}
      {isAnyMarkingMode && (
        <div className="bg-gradient-to-r from-rose-700 via-[#A41034] to-red-800 text-white p-4 sm:p-5 rounded-3xl shadow-lg border border-rose-300/40 animate-in fade-in slide-in-from-top-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shrink-0">
                <MapPin className="w-6 h-6 text-amber-200 animate-bounce" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                  <span>
                    {isMarkingLostFoundOnMap
                      ? 'Mark Place on Campus Map (Lost & Found)'
                      : 'Mark Place of Issue on Campus Map'}
                  </span>
                  {pinnedIssueLocation && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs">
                      Spot Marked
                    </span>
                  )}
                </h3>
                <p className="text-rose-100 text-xs mt-0.5">
                  {pinnedIssueLocation
                    ? `Marked: "${pinnedIssueLocation.name}". Click "Confirm Spot & Return" or tap another spot to change.`
                    : isMarkingLostFoundOnMap
                    ? 'Click anywhere on the map or tap any building marker to drop a pin where the item was lost or found.'
                    : 'Click anywhere on the map or tap any building marker to drop a pin at the location.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {pinnedIssueLocation && (
                <button
                  type="button"
                  onClick={() => {
                    if (isMarkingLostFoundOnMap && onConfirmLostFoundLocation) {
                      onConfirmLostFoundLocation({
                        locationName: pinnedIssueLocation.name,
                        lat: pinnedIssueLocation.lat,
                        lng: pinnedIssueLocation.lng
                      });
                    } else if (onConfirmIssueLocation) {
                      onConfirmIssueLocation({
                        locationName: pinnedIssueLocation.name,
                        lat: pinnedIssueLocation.lat,
                        lng: pinnedIssueLocation.lng
                      });
                    }
                  }}
                  className="px-4 py-2 bg-white text-[#A41034] hover:bg-rose-50 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5 active:scale-95"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Confirm Spot & Return</span>
                </button>
              )}
              <button
                type="button"
                onClick={isMarkingLostFoundOnMap ? onCancelMarkingLostFound : onCancelMarkingIssue}
                className="px-3.5 py-2 bg-black/30 hover:bg-black/50 text-white rounded-xl font-semibold text-xs transition active:scale-95"
              >
                Cancel & Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewing focused issue alert banner */}
      {focusedIssueOnMap && !isAnyMarkingMode && (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-700 flex items-center justify-between shadow-md animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Viewing Campus Issue: <strong className="text-rose-300">{focusedIssueOnMap.title}</strong> at <em>{focusedIssueOnMap.location}</em>
            </span>
          </div>
          <button
            type="button"
            onClick={onClearFocusedIssue}
            className="text-xs text-slate-300 hover:text-white px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Viewing focused lost & found item alert banner */}
      {focusedLostFoundOnMap && !isAnyMarkingMode && (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-700 flex items-center justify-between shadow-md animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Viewing Lost & Found Item: <strong className="text-emerald-300">{focusedLostFoundOnMap.title}</strong> at <em>{focusedLostFoundOnMap.location}</em>
            </span>
          </div>
          <button
            type="button"
            onClick={onClearFocusedLostFound}
            className="text-xs text-slate-300 hover:text-white px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Header & Search Bar */}
      <div className="bg-white border border-[#E8E3D7] rounded-3xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#A41034]" />
                <span>Amrita Vishwa Vidyapeetham — Ettimadai Campus Map</span>
              </h3>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#FFF0F4] text-[#A41034] border border-[#F8C0CE] flex items-center gap-1 font-bold">
                <Lock className="w-3 h-3 text-[#A41034]" />
                Point-to-Point Walking Routing
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Interactive pedestrian navigation with real walking distances in meters and estimated walking times across the 400-acre campus.
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search canteen, Xerox, AB-1, clinic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-[#E8E3D7] rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#A41034] focus:ring-1 focus:ring-[#A41034]"
            />
          </div>
        </div>

        {/* Quick Shortcut Pills */}
        <div className="mt-4 pt-3 border-t border-[#E8E3D7]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Quick-Tap Campus Destinations
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {shortcutPills.map((pill) => (
              <button
                key={pill.id}
                onClick={() => handleShortcutSelect(pill.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 shadow-2xs shrink-0 ${
                  destinationId === pill.id
                    ? 'bg-[#A41034] text-white shadow-sm'
                    : 'bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-[#A41034] border border-[#E8E3D7]'
                }`}
              >
                <span>{pill.icon}</span>
                <span>{pill.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 border-t border-[#E8E3D7] mt-3 pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-[#A41034] text-white font-bold shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:text-slate-900 border border-[#E8E3D7]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Point-to-Point Routing Control Bar */}
      <div className="bg-white border border-[#E8E3D7] rounded-3xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <RouteIcon className="w-4 h-4 text-[#A41034]" />
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
            Point-to-Point Route Planner
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Origin Selector */}
          <div className="sm:col-span-5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
              Starting From (Origin A)
            </label>
            <div className="relative">
              <select
                value={originId}
                onChange={(e) => setOriginId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-[#E8E3D7] rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#A41034]"
              >
                {userLocation && (
                  <option value="current-location">📍 Your Current Location (GPS)</option>
                )}
                {CAMPUS_LANDMARKS.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="sm:col-span-1 flex justify-center pt-2 sm:pt-4">
            <button
              type="button"
              onClick={handleSwapLocations}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Swap Origin and Destination"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Destination Selector */}
          <div className="sm:col-span-5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A41034] mb-1">
              Heading To (Destination B)
            </label>
            <div className="relative">
              <select
                value={destinationId}
                onChange={(e) => {
                  setDestinationId(e.target.value);
                  const destLoc = CAMPUS_LANDMARKS.find((l) => l.id === e.target.value);
                  if (destLoc) setSelectedLocation(destLoc);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-[#E8E3D7] rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#A41034]"
              >
                {CAMPUS_LANDMARKS.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Button */}
          <div className="sm:col-span-1 flex justify-center pt-2 sm:pt-4">
            <button
              type="button"
              onClick={() => handleCalculateRoute(originId, destinationId)}
              className="w-full sm:w-auto px-4 py-2 bg-[#A41034] hover:bg-[#8F002E] text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>Route</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Map Viewport (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-[#E8E3D7] rounded-3xl p-4 shadow-sm flex flex-col justify-between">
          
          {/* Map Top Bar Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E8E3D7]">
            {/* Tile Layer Switcher */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-[#E8E3D7]">
              <button
                onClick={() => setActiveLayer('street')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                  activeLayer === 'street'
                    ? 'bg-[#A41034] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Street Map
              </button>
              <button
                onClick={() => setActiveLayer('satellite')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                  activeLayer === 'satellite'
                    ? 'bg-[#A41034] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Satellite 🛰️
              </button>
              <button
                onClick={() => setActiveLayer('dark')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                  activeLayer === 'dark'
                    ? 'bg-[#A41034] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dark Map 🌙
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLocateMe}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-[#E8E3D7] text-xs font-semibold transition"
                title="Locate my position on campus"
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
                className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#A41034] border border-[#E8E3D7] transition text-xs font-bold flex items-center gap-1"
                title="Center on Amrita Central Plaza"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Center</span>
              </button>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-[#E8E3D7] transition"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Leaflet Map Container */}
          <div
            ref={mapContainerRef}
            className={`w-full rounded-2xl overflow-hidden my-3 border border-[#E8E3D7] shadow-inner z-10 transition-all duration-300 ${
              isFullscreen ? 'fixed inset-4 z-50 h-[92vh]' : 'h-96 sm:h-[480px]'
            }`}
          />

          {/* Active Route Summary Bar */}
          {activeRoute && (
            <div className="p-4 rounded-2xl bg-[#FFF0F4] border border-[#F8C0CE] my-1 text-xs text-slate-900 animate-in fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#A41034] text-white shrink-0 mt-0.5">
                    <Footprints className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-[#A41034]">
                        {activeRoute.originName} ➔ {activeRoute.destinationName}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-mono font-bold text-[11px]">
                        {activeRoute.formattedDistance}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[11px]">
                        {activeRoute.formattedTime}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-slate-600 mt-1 font-medium">
                      <span>🚶 ~{activeRoute.estimatedSteps} steps</span>
                      <span>🔥 ~{activeRoute.caloriesBurnedKcal} kcal burned</span>
                    </div>

                    {/* Step details toggle */}
                    {activeRoute.stepInstructions && activeRoute.stepInstructions.length > 0 && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => setShowStepDetails(!showStepDetails)}
                          className="text-[11px] font-bold text-[#A41034] hover:underline flex items-center gap-1"
                        >
                          <span>{showStepDetails ? 'Hide route steps' : 'View turn-by-turn guidance'}</span>
                          {showStepDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {showStepDetails && (
                          <div className="mt-2 space-y-1 pl-2 border-l-2 border-[#A41034]/40 text-[11px] text-slate-700 font-medium">
                            {activeRoute.stepInstructions.map((step, idx) => (
                              <div key={idx} className="flex items-start gap-1.5">
                                <span className="font-bold text-[#A41034] shrink-0">{idx + 1}.</span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleClearRoute}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition"
                  title="Clear Route"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Map Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E8E3D7] text-[11px] text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Canteen & Food
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" /> Stationery & Stores
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-700" /> Academic & Labs
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Hostels
              </span>
            </div>
            <span className="text-[#A41034] font-bold">Amrita Ettimadai Compound Bounds</span>
          </div>
        </div>

        {/* Right Column: Selected Destination Details Card */}
        <div className="space-y-4">
          {/* Location Marking Card if in marking mode */}
          {isAnyMarkingMode && (
            <div className="bg-white border-2 border-rose-500 rounded-3xl p-5 shadow-md">
              <div className="flex items-center gap-2 pb-3 border-b border-[#E8E3D7]">
                <div className="p-2 rounded-xl bg-rose-100 text-[#A41034]">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    {isMarkingLostFoundOnMap ? 'Lost & Found Location' : 'Place of Issue'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {isMarkingLostFoundOnMap
                      ? 'Selected spot where item was lost or found'
                      : 'Selected location for reporting'}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {pinnedIssueLocation ? (
                  <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-base">📍</span>
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          {pinnedIssueLocation.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Coordinates: {pinnedIssueLocation.lat.toFixed(5)}, {pinnedIssueLocation.lng.toFixed(5)}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (isMarkingLostFoundOnMap && onConfirmLostFoundLocation) {
                          onConfirmLostFoundLocation({
                            locationName: pinnedIssueLocation.name,
                            lat: pinnedIssueLocation.lat,
                            lng: pinnedIssueLocation.lng
                          });
                        } else if (onConfirmIssueLocation) {
                          onConfirmIssueLocation({
                            locationName: pinnedIssueLocation.name,
                            lat: pinnedIssueLocation.lat,
                            lng: pinnedIssueLocation.lng
                          });
                        }
                      }}
                      className="w-full py-2.5 px-4 bg-[#A41034] hover:bg-[#8F002E] text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-300" />
                      <span>
                        {isMarkingLostFoundOnMap
                          ? 'Confirm & Return to Item Report'
                          : 'Confirm & Return to Issue'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPinnedIssueLocation(null)}
                      className="w-full py-1.5 text-center text-[11px] text-rose-600 hover:text-rose-800 font-semibold"
                    >
                      Clear Pin & Choose Another Spot
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center space-y-1">
                    <p className="text-xs font-bold text-slate-700">No Spot Marked Yet</p>
                    <p className="text-[11px] text-slate-500">
                      Click anywhere on the interactive map or tap any building marker to set the location.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={isMarkingLostFoundOnMap ? onCancelMarkingLostFound : onCancelMarkingIssue}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition"
                >
                  Cancel & Return to Form
                </button>
              </div>
            </div>
          )}

          {selectedLocation ? (
            <div className="bg-white border border-[#E8E3D7] rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between">
              <div>
                {/* Photo */}
                <div className="relative h-44 w-full bg-slate-100">
                  <img
                    src={selectedLocation.image || 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=500&auto=format&fit=crop&q=80'}
                    alt={selectedLocation.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-white/90 backdrop-blur-md text-[10px] font-bold text-slate-800 border border-[#E8E3D7] shadow-xs">
                    {selectedLocation.zone || 'Campus'}
                  </span>
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-[#A41034] text-white text-[10px] font-bold shadow-xs">
                    {selectedLocation.category}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                      {selectedLocation.name}
                    </h3>
                    <p className="text-xs text-[#A41034] mt-1 font-semibold flex items-center gap-1">
                      <Building className="w-3.5 h-3.5" />
                      {selectedLocation.building || 'Amrita Campus'} • {selectedLocation.floor || 'Ground'}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {selectedLocation.description}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-[#E8E3D7] text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{selectedLocation.timings || '08:00 AM - 08:00 PM'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{selectedLocation.contact || 'Extension 2400'}</span>
                    </div>

                    {selectedLocation.popularTimes && (
                      <div className="flex items-start gap-2 text-amber-700 text-[11px] pt-1">
                        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>Peak Hours:</strong> {selectedLocation.popularTimes}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0 space-y-2">
                <button
                  onClick={() => {
                    setDestinationId(selectedLocation.id);
                    handleCalculateRoute(originId, selectedLocation.id);
                  }}
                  className="w-full py-2.5 rounded-2xl bg-[#A41034] hover:bg-[#8F002E] text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-2"
                >
                  <Footprints className="w-4 h-4" />
                  <span>Navigate Here (Calculate Walking Route)</span>
                </button>

                {selectedLocation.category === 'Food & Dining' && (
                  <button
                    onClick={() => onNavigateToCanteen && onNavigateToCanteen(selectedLocation.relatedCanteenId || selectedLocation.id)}
                    className="w-full py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Utensils className="w-4 h-4" />
                    <span>View Menu & Place Food Order</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E8E3D7] rounded-3xl p-6 text-center text-slate-500 text-xs shadow-sm">
              Select any building or canteen marker on the map to view details and calculate walking paths.
            </div>
          )}

          {/* Directory List */}
          <div className="bg-white border border-[#E8E3D7] rounded-3xl p-4 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Campus Directory ({filteredLocations.length} locations)
            </h4>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {filteredLocations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => {
                    setSelectedLocation(loc);
                    setDestinationId(loc.id);
                    const lat = loc.lat || loc.coords?.[0] || loc.coordinates?.lat || AMRITA_CAMPUS_CENTER[0];
                    const lng = loc.lng || loc.coords?.[1] || loc.coordinates?.lng || AMRITA_CAMPUS_CENTER[1];
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.flyTo([lat, lng], 17.5, { duration: 1 });
                    }
                  }}
                  className={`w-full text-left p-2.5 rounded-2xl text-xs flex items-center justify-between transition ${
                    selectedLocation?.id === loc.id
                      ? 'bg-[#FFF0F4] text-[#A41034] font-bold border border-[#F8C0CE]'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-[#E8E3D7]'
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

export default CampusMapView;
