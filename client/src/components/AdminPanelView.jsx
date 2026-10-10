import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Shield,
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Search,
  MapPin,
  Plus,
  Minus,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
  Sparkles,
  Users,
  Check,
  Building,
  Image as ImageIcon,
  Camera,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Filter,
  Eye,
  X,
  Edit,
  Edit2,
  Trash2,
  PlusCircle,
  Upload,
  Link,
  Package,
  Utensils,
  Store,
  Flame,
  DollarSign,
  Tag,
  RefreshCw,
  Phone,
  Crosshair,
  Activity,
  Compass,
  ChevronRight,
  Info,
  ChefHat
} from 'lucide-react';
import { api } from '../api';

const AMRITA_CAMPUS_CENTER = [10.9036, 76.8997];
const AMRITA_CAMPUS_BOUNDS = [
  [10.8950, 76.8900],
  [10.9120, 76.9090]
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

const AMRITA_GPS_PRESETS = [
  { label: 'Central Plaza', lat: 10.9036, lng: 76.8997 },
  { label: 'School of Engg (AB-1)', lat: 10.9005, lng: 76.9029 },
  { label: 'ECE & Sci (AB-2)', lat: 10.9043, lng: 76.8986 },
  { label: 'CSE & Law (AB-3)', lat: 10.9063, lng: 76.8978 },
  { label: 'AI Center (AB-4)', lat: 10.9056, lng: 76.8974 },
  { label: 'Main Canteen 1', lat: 10.9001, lng: 76.9037 },
  { label: 'IT Canteen (AB-3)', lat: 10.9049, lng: 76.8981 },
  { label: 'Girls Hostels', lat: 10.9030, lng: 76.8998 },
  { label: 'Boys Hostels', lat: 10.9025, lng: 76.8962 },
  { label: 'Central Library', lat: 10.9039, lng: 76.8992 },
  { label: 'Olympic Pool', lat: 10.9063, lng: 76.8989 },
  { label: 'Health Clinic', lat: 10.9012, lng: 76.8972 },
  { label: 'Shopping & Xerox', lat: 10.9021, lng: 76.8986 },
  { label: 'Main Entrance Gate', lat: 10.8980, lng: 76.9003 }
];

export function AdminPanelView({ canteens, onDataUpdated }) {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'menu', 'issues', 'claims', 'map'
  const [issues, setIssues] = useState([]);
  const [lostFoundItems, setLostFoundItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [mapLocations, setMapLocations] = useState([]);

  // Map & Establishment Editor State
  const [editingMapLoc, setEditingMapLoc] = useState(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [searchMapQuery, setSearchMapQuery] = useState('');
  const [selectedMapCategory, setSelectedMapCategory] = useState('All');
  const [clickedMapCoord, setClickedMapCoord] = useState(null);
  const [isAddingNewLoc, setIsAddingNewLoc] = useState(false);

  const adminMapContainerRef = useRef(null);
  const adminMapInstanceRef = useRef(null);
  const adminMarkersGroupRef = useRef(null);

  // Issue Filtering & Lightbox States
  const [issueSearch, setIssueSearch] = useState('');
  const [issueStatusFilter, setIssueStatusFilter] = useState('All');
  const [issuePriorityFilter, setIssuePriorityFilter] = useState('All');
  const [adminLightboxImage, setAdminLightboxImage] = useState(null);
  const [expandedIssueHistoryId, setExpandedIssueHistoryId] = useState(null);

  // Menu & Canteen Admin States
  const [adminCanteenFilter, setAdminCanteenFilter] = useState('All');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState('All');
  const [adminMenuSearch, setAdminMenuSearch] = useState('');
  const [isAddDishModalOpen, setIsAddDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [isAddCanteenModalOpen, setIsAddCanteenModalOpen] = useState(false);
  const [dishImageMode, setDishImageMode] = useState('upload'); // 'upload' | 'url'
  const adminDishFileInputRef = useRef(null);
  const adminEditDishFileInputRef = useRef(null);

  const categoriesList = [
    'Main Course',
    'Curries',
    "Today's Special",
    'Egg Items',
    'Bakes & Snacks',
    'Hot Drinks',
    'Juices & Milkshakes',
    'Ice Creams'
  ];

  // Dish Form State (for Add & Edit)
  const [dishForm, setDishForm] = useState({
    name: '',
    canteenId: canteens[0]?.id || 'canteen-1',
    category: 'Main Course',
    price: 60,
    prepTimeMinutes: 4,
    stock: 20,
    isVeg: true,
    description: '',
    imageUrl: ''
  });

  // Canteen / Store Creation Form State
  const [canteenForm, setCanteenForm] = useState({
    name: '',
    code: '',
    location: '',
    timings: '08:00 AM - 10:00 PM',
    crowdLevel: 'Low',
    avgWaitTimeMinutes: 5,
    counterSpeed: 'Fast',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=80'
  });

  // New Map Location Form
  const [newMapLoc, setNewMapLoc] = useState({
    name: '',
    category: 'Food & Dining',
    building: '',
    floor: 'Ground Floor',
    zone: 'Central Campus',
    timings: '08:00 AM - 09:30 PM',
    contact: 'Extension 2401',
    description: '',
    lat: 10.9036,
    lng: 76.8997,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80',
    relatedCanteenId: '',
    createCanteen: true
  });

  const fetchAdminData = async () => {
    try {
      const [statsRes, issuesRes, lfRes, menuRes, mapRes] = await Promise.all([
        api.getStats(),
        api.getIssues(),
        api.getLostAndFound(),
        api.getMenu(),
        api.getMapLocations()
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (issuesRes.success) setIssues(issuesRes.data);
      if (lfRes.success) setLostFoundItems(lfRes.data);
      if (menuRes.success) setMenuItems(menuRes.data);
      if (mapRes.success) setMapLocations(mapRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Advance Issue Stage (Slide 5 & 6)
  const handleAdvanceIssue = async (issueId, stageNum, stageName) => {
    try {
      const note = window.prompt(
        `Enter resolution or progress update note for Stage ${stageNum} (${stageName}):`,
        `Progress logged by Campus Administration.`
      );
      if (note === null) return;

      const res = await api.updateIssueStage(issueId, {
        targetStage: stageNum,
        note
      });
      if (res.success) {
        alert(`Issue updated to Stage ${stageNum}: ${stageName}! Student received live notification.`);
        fetchAdminData();
        onDataUpdated();
      }
    } catch (err) {
      alert('Error updating issue: ' + err.message);
    }
  };

  // Review Lost & Found Claim (Slide 6)
  const handleReviewClaim = async (itemId, claimId, action) => {
    try {
      const res = await api.reviewClaim(itemId, claimId, action);
      if (res.success) {
        alert(`Claim ${action === 'approve' ? 'Approved & Item Handed Over' : 'Rejected'}!`);
        fetchAdminData();
        onDataUpdated();
      }
    } catch (err) {
      alert('Error reviewing claim: ' + err.message);
    }
  };

  // Handle dish file upload from local system
  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size exceeds 5MB. Please choose a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setDishForm((prev) => ({ ...prev, imageUrl: loadEvent.target.result }));
    };
    reader.readAsDataURL(file);
  };

  // Open Add Dish Modal
  const openAddDishModal = () => {
    setEditingDish(null);
    setDishImageMode('upload');
    setDishForm({
      name: '',
      canteenId: adminCanteenFilter !== 'All' ? adminCanteenFilter : canteens[0]?.id || 'canteen-1',
      category: 'Main Course',
      price: 60,
      prepTimeMinutes: 4,
      stock: 20,
      isVeg: true,
      description: '',
      imageUrl: ''
    });
    setIsAddDishModalOpen(true);
  };

  // Open Edit Dish Modal
  const openEditDishModal = (item) => {
    setEditingDish(item);
    const isDataImg = item.imageUrl && item.imageUrl.startsWith('data:');
    setDishImageMode(isDataImg ? 'upload' : (item.imageUrl ? 'url' : 'upload'));
    setDishForm({
      name: item.name,
      canteenId: item.canteenId,
      category: item.category || 'Main Course',
      price: item.price,
      prepTimeMinutes: item.prepTimeMinutes || 4,
      stock: item.stock,
      isVeg: item.isVeg,
      description: item.description || '',
      imageUrl: item.imageUrl || ''
    });
  };

  // Save Dish (Add or Edit)
  const handleSaveDish = async (e) => {
    e.preventDefault();
    if (!dishForm.name.trim()) return alert('Please enter dish name');

    const defaultFallback = dishForm.isVeg
      ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=80';

    try {
      if (editingDish) {
        const updates = {
          name: dishForm.name.trim(),
          canteenId: dishForm.canteenId,
          category: dishForm.category,
          price: Number(dishForm.price),
          stock: Number(dishForm.stock),
          prepTimeMinutes: Number(dishForm.prepTimeMinutes),
          isVeg: dishForm.isVeg,
          description: dishForm.description,
          imageUrl: dishForm.imageUrl?.trim() || defaultFallback
        };
        const res = await api.updateMenuItem(editingDish.id, updates);
        if (res.success) {
          setEditingDish(null);
          fetchAdminData();
          onDataUpdated();
        }
      } else {
        const payload = {
          ...dishForm,
          name: dishForm.name.trim(),
          price: Number(dishForm.price),
          stock: Number(dishForm.stock),
          prepTimeMinutes: Number(dishForm.prepTimeMinutes),
          imageUrl: dishForm.imageUrl?.trim() || defaultFallback,
          popular: false
        };
        const res = await api.addMenuItem(payload);
        if (res.success) {
          setIsAddDishModalOpen(false);
          fetchAdminData();
          onDataUpdated();
        }
      }
    } catch (err) {
      alert('Error saving dish: ' + err.message);
    }
  };

  // Adjust stock count
  const handleAdjustStock = async (item, delta) => {
    const newStock = Math.max(0, item.stock + delta);
    try {
      const res = await api.updateMenuItem(item.id, { stock: newStock });
      if (res.success) {
        setMenuItems((prev) => prev.map((m) => (m.id === item.id ? { ...m, stock: newStock } : m)));
        onDataUpdated();
      }
    } catch (err) {
      alert('Error updating stock: ' + err.message);
    }
  };

  // Toggle in-stock / out-of-stock instantly
  const handleToggleStockStatus = async (item) => {
    const targetStock = item.stock > 0 ? 0 : 15;
    try {
      const res = await api.updateMenuItem(item.id, { stock: targetStock });
      if (res.success) {
        setMenuItems((prev) => prev.map((m) => (m.id === item.id ? { ...m, stock: targetStock } : m)));
        onDataUpdated();
      }
    } catch (err) {
      alert('Error toggling stock: ' + err.message);
    }
  };

  // Delete dish from menu
  const handleDeleteDish = async (item) => {
    if (!window.confirm(`Are you sure you want to remove "${item.name}" from the menu?`)) return;
    try {
      const res = await api.deleteMenuItem(item.id);
      if (res.success) {
        setMenuItems((prev) => prev.filter((m) => m.id !== item.id));
        onDataUpdated();
      }
    } catch (err) {
      alert('Error deleting dish: ' + err.message);
    }
  };

  // Update Canteen Crowd Level
  const handleUpdateCanteenCrowd = async (canteenId, level) => {
    try {
      const res = await api.updateCrowdLevel(canteenId, level);
      if (res.success) {
        onDataUpdated();
        fetchAdminData();
      }
    } catch (err) {
      alert('Error updating crowd: ' + err.message);
    }
  };

  // Create New Canteen / Store
  const handleCreateCanteen = async (e) => {
    e.preventDefault();
    if (!canteenForm.name.trim()) return alert('Please enter outlet name');

    try {
      const slugCode = canteenForm.code.trim().toUpperCase() || `C${canteens.length + 1}`;
      const payload = {
        name: canteenForm.name.trim(),
        code: slugCode,
        location: canteenForm.location.trim() || 'Central Amenities Quad, Amrita Ettimadai',
        timings: canteenForm.timings.trim() || '08:00 AM - 10:00 PM',
        crowdLevel: canteenForm.crowdLevel || 'Low',
        avgWaitTimeMinutes: Number(canteenForm.avgWaitTimeMinutes) || 5,
        counterSpeed: canteenForm.counterSpeed || 'Fast',
        image: canteenForm.image || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=80'
      };

      const res = await api.addCanteen(payload);
      if (res.success) {
        alert(`🎉 New Dining Outlet "${payload.name}" successfully created and activated! It is now available across the student menu, staff station terminal, and admin management.`);
        setIsAddCanteenModalOpen(false);
        setCanteenForm({
          name: '',
          code: '',
          location: '',
          timings: '08:00 AM - 10:00 PM',
          crowdLevel: 'Low',
          avgWaitTimeMinutes: 5,
          counterSpeed: 'Fast',
          image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=80'
        });
        onDataUpdated();
        fetchAdminData();
      }
    } catch (err) {
      alert('Error creating canteen: ' + err.message);
    }
  };

  // Delete Canteen / Store
  const handleDeleteCanteen = async (canteen) => {
    if (canteens.length <= 1) {
      alert('Cannot delete the only remaining canteen. Campus requires at least one active dining facility.');
      return;
    }

    const dishCount = menuItems.filter((m) => m.canteenId === canteen.id).length;
    const confirmMsg = `Are you sure you want to permanently delete "${canteen.name}"?\n\nThis will remove the outlet from student ordering, staff stations, and delete its ${dishCount} associated menu dishes.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.deleteCanteen(canteen.id);
      if (res.success) {
        alert(`Outlet "${canteen.name}" and its menu dishes have been removed.`);
        if (adminCanteenFilter === canteen.id) {
          setAdminCanteenFilter('All');
        }
        onDataUpdated();
        fetchAdminData();
      }
    } catch (err) {
      alert('Error deleting canteen: ' + err.message);
    }
  };

  // Filtered menu dishes for Admin panel
  const filteredAdminMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (adminCanteenFilter !== 'All' && item.canteenId !== adminCanteenFilter) return false;
      if (adminCategoryFilter !== 'All' && item.category !== adminCategoryFilter) return false;
      if (adminMenuSearch) {
        const q = adminMenuSearch.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q) || item.category?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [menuItems, adminCanteenFilter, adminCategoryFilter, adminMenuSearch]);

  // Helper to create category marker divIcon
  const createAdminMarkerIcon = (loc) => {
    let iconChar = '🏛️';
    let bgClass = 'bg-slate-700 text-white';

    if (loc.category === 'Food & Dining') {
      iconChar = '🍽️';
      bgClass = 'bg-amber-500 text-slate-950 font-bold';
    } else if (loc.category === 'Medical & Health') {
      iconChar = '🏥';
      bgClass = 'bg-rose-500 text-white font-bold';
    } else if (loc.category === 'Academic Store' || loc.category === 'Retail Store') {
      iconChar = '📚';
      bgClass = 'bg-teal-500 text-white font-bold';
    } else if (loc.category === 'Academic & Labs') {
      iconChar = '🎓';
      bgClass = 'bg-cyan-500 text-white font-bold';
    } else if (loc.category === 'Hostels & Living') {
      iconChar = '🛏️';
      bgClass = 'bg-indigo-500 text-white font-bold';
    } else if (loc.category === 'Sports & Recreation') {
      iconChar = '🏊';
      bgClass = 'bg-emerald-500 text-white font-bold';
    }

    const html = `
      <div class="relative group cursor-pointer flex flex-col items-center">
        <div class="w-8 h-8 rounded-full border-2 border-slate-900 shadow-xl flex items-center justify-center text-xs transition duration-200 ${bgClass} hover:scale-125">
          <span>${iconChar}</span>
        </div>
        <div class="mt-1 px-2 py-0.5 rounded bg-slate-950/95 text-white text-[9px] font-bold border border-slate-700 whitespace-nowrap shadow-md pointer-events-none max-w-[130px] truncate">
          ${loc.name.split('(')[0].trim()}
        </div>
      </div>
    `;

    return L.divIcon({
      className: 'admin-campus-marker',
      html,
      iconSize: [32, 48],
      iconAnchor: [16, 24],
      popupAnchor: [0, -24]
    });
  };

  const handleOpenEditModal = (loc) => {
    const lat = loc.lat || loc.coordinates?.lat || AMRITA_CAMPUS_CENTER[0];
    const lng = loc.lng || loc.coordinates?.lng || AMRITA_CAMPUS_CENTER[1];
    setEditingMapLoc({
      ...loc,
      lat,
      lng,
      relatedCanteenId: loc.relatedCanteenId || (loc.id === 'loc-1' ? 'canteen-1' : loc.id === 'loc-2' ? 'canteen-2' : loc.id === 'loc-3' ? 'canteen-3' : loc.id === 'loc-it' ? 'canteen-it' : '')
    });
    setIsAddingNewLoc(false);
    setIsMapModalOpen(true);
    if (adminMapInstanceRef.current) {
      adminMapInstanceRef.current.flyTo([lat, lng], 17.5, { duration: 0.8 });
    }
  };

  const handleOpenAddModal = (presetCoord = null) => {
    const defaultLat = presetCoord ? presetCoord.lat : (clickedMapCoord ? clickedMapCoord.lat : AMRITA_CAMPUS_CENTER[0]);
    const defaultLng = presetCoord ? presetCoord.lng : (clickedMapCoord ? clickedMapCoord.lng : AMRITA_CAMPUS_CENTER[1]);
    setEditingMapLoc({
      id: `loc_${Date.now()}`,
      name: '',
      category: 'Food & Dining',
      building: '',
      floor: 'Ground Floor',
      zone: 'Central Campus',
      timings: '08:00 AM - 09:30 PM',
      contact: 'Extension 2401',
      description: '',
      lat: defaultLat,
      lng: defaultLng,
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80',
      relatedCanteenId: '',
      createCanteen: true
    });
    setIsAddingNewLoc(true);
    setIsMapModalOpen(true);
  };

  const handleSaveMapLoc = async (e) => {
    e.preventDefault();
    if (!editingMapLoc) return;

    try {
      const lat = parseFloat(editingMapLoc.lat);
      const lng = parseFloat(editingMapLoc.lng);

      if (isNaN(lat) || isNaN(lng)) {
        alert('Please enter valid numeric latitude and longitude coordinates.');
        return;
      }

      const payload = {
        ...editingMapLoc,
        lat,
        lng,
        coordinates: {
          x: editingMapLoc.coordinates?.x || 50,
          y: editingMapLoc.coordinates?.y || 50,
          lat,
          lng
        }
      };

      if (isAddingNewLoc) {
        const res = await api.addMapLocation(payload);
        if (res.success) {
          alert(`Successfully pinned "${payload.name}" to the campus map!`);
          setIsMapModalOpen(false);
          setEditingMapLoc(null);
          await fetchAdminData();
          if (onDataUpdated) onDataUpdated();
        } else {
          alert('Failed to add establishment: ' + (res.message || 'Unknown error'));
        }
      } else {
        const res = await api.updateMapLocation(editingMapLoc.id, payload);
        if (res.success) {
          const isDining = payload.category === 'Food & Dining' || payload.relatedCanteenId;
          alert(
            `Establishment "${payload.name}" successfully updated!` +
            (isDining ? '\n⚡ Synchronized with Staff Operations and Student Canteen views.' : '')
          );
          setIsMapModalOpen(false);
          setEditingMapLoc(null);
          await fetchAdminData();
          if (onDataUpdated) onDataUpdated();
        } else {
          alert('Failed to update establishment: ' + (res.message || 'Unknown error'));
        }
      }
    } catch (err) {
      alert('Error saving establishment: ' + err.message);
    }
  };

  const handleDeleteMapLoc = async (loc) => {
    if (!window.confirm(`Are you sure you want to delete "${loc.name}" from the campus map?`)) {
      return;
    }
    try {
      const res = await api.deleteMapLocation(loc.id);
      if (res.success) {
        alert(`"${loc.name}" removed from the campus map.`);
        await fetchAdminData();
        if (onDataUpdated) onDataUpdated();
      } else {
        alert('Failed to delete establishment: ' + (res.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Error deleting establishment: ' + err.message);
    }
  };

  // Initialize Admin Leaflet Map
  useEffect(() => {
    if (activeTab !== 'map' || !adminMapContainerRef.current) return;

    if (adminMapInstanceRef.current) {
      adminMapInstanceRef.current.remove();
      adminMapInstanceRef.current = null;
    }

    const map = L.map(adminMapContainerRef.current, {
      center: AMRITA_CAMPUS_CENTER,
      zoom: 16.5,
      minZoom: 15.2,
      maxZoom: 19,
      maxBounds: AMRITA_CAMPUS_BOUNDS,
      maxBoundsViscosity: 1.0,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO &copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Draw Official Amrita Compound Boundary Perimeter
    L.polygon(AMRITA_COMPOUND_PERIMETER, {
      color: '#8b5cf6',
      weight: 3,
      opacity: 0.85,
      fillColor: '#8b5cf6',
      fillOpacity: 0.06,
      dashArray: '8, 6'
    }).addTo(map);

    // Map Click to capture or update coordinates
    map.on('click', (e) => {
      const lat = parseFloat(e.latlng.lat.toFixed(6));
      const lng = parseFloat(e.latlng.lng.toFixed(6));
      setClickedMapCoord({ lat, lng });
    });

    const markersGroup = L.featureGroup().addTo(map);
    adminMarkersGroupRef.current = markersGroup;
    adminMapInstanceRef.current = map;

    return () => {
      if (adminMapInstanceRef.current) {
        adminMapInstanceRef.current.remove();
        adminMapInstanceRef.current = null;
      }
    };
  }, [activeTab]);

  // Re-render markers when locations or filters change
  useEffect(() => {
    if (!adminMapInstanceRef.current || !adminMarkersGroupRef.current) return;

    adminMarkersGroupRef.current.clearLayers();

    const filtered = mapLocations.filter((loc) => {
      if (selectedMapCategory !== 'All' && loc.category !== selectedMapCategory) {
        return false;
      }
      if (searchMapQuery) {
        const q = searchMapQuery.toLowerCase();
        if (
          !loc.name.toLowerCase().includes(q) &&
          !loc.building?.toLowerCase().includes(q) &&
          !loc.description?.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });

    filtered.forEach((loc) => {
      const lat = loc.lat || loc.coordinates?.lat || AMRITA_CAMPUS_CENTER[0];
      const lng = loc.lng || loc.coordinates?.lng || AMRITA_CAMPUS_CENTER[1];

      const marker = L.marker([lat, lng], {
        icon: createAdminMarkerIcon(loc)
      });

      marker.on('click', () => {
        handleOpenEditModal(loc);
      });

      marker.bindTooltip(
        `<div style="font-size:11px; font-weight:bold; color:#f8fafc;">${loc.name}</div><div style="font-size:10px; color:#818cf8;">${loc.category} • ${loc.building}</div><div style="font-size:9px; color:#38bdf8; margin-top:2px;">Click to Edit Establishment</div>`,
        { direction: 'top', offset: [0, -20] }
      );

      marker.addTo(adminMarkersGroupRef.current);
    });
  }, [activeTab, mapLocations, selectedMapCategory, searchMapQuery]);

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
              <span>Campus Central Administration & Analytics</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Administration
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Unified governance of food menus, map hubs, lost-and-found claims, and issue resolutions
            </p>
          </div>
        </div>

        {/* Quick KPI stats cards */}
        {stats && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/40">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Revenue</span>
              <div className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
                ₹{stats.totalRevenue}
              </div>
              <span className="text-[10px] text-slate-500">100% cashless via wallet</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/40">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Orders</span>
              <div className="text-xl font-extrabold text-white font-mono mt-1">
                {stats.totalOrders}
              </div>
              <span className="text-[10px] text-cyan-400">{stats.activeOrdersCount} in active prep</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/40">
              <span className="text-[10px] uppercase font-bold text-slate-400">Campus Issues</span>
              <div className="text-xl font-extrabold text-amber-400 font-mono mt-1">
                {stats.openIssuesCount} Open
              </div>
              <span className="text-[10px] text-slate-500">{stats.resolvedIssuesCount} resolved</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/40">
              <span className="text-[10px] uppercase font-bold text-slate-400">Lost Items Open</span>
              <div className="text-xl font-extrabold text-blue-400 font-mono mt-1">
                {stats.openLostFoundCount}
              </div>
              <span className="text-[10px] text-slate-500">Awaiting claim handover</span>
            </div>
          </div>
        )}
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Impact Overview & Analytics
        </button>

        <button
          onClick={() => setActiveTab('issues')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'issues'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Resolve Campus Issues ({issues.filter((i) => i.status !== 'resolved').length})
        </button>

        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'claims'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Review Lost & Found Claims
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'menu'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Canteens & Menu Governance</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/60 font-mono">
            {canteens.length} Outlets
          </span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'map'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Campus Map Hubs ({mapLocations.length})
        </button>
      </div>

      {/* TAB 1: CAMPUS IMPACT OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h4 className="font-extrabold text-base text-white mb-1">
              Expected Campus Impact & Analytics
            </h4>
            <p className="text-xs text-slate-400 mb-5">
              Measurable outcomes achieved by consolidating food, map, lost items, and issues into Smart Campus Hub:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1.5">
                <span className="text-lg">⏱️</span>
                <h5 className="font-bold text-white text-sm">Saves Student Time</h5>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Eliminates wasted trips when food runs out. Pre-ordering cuts average queue wait time from 18 minutes to zero counter wait.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1.5">
                <span className="text-lg">🥗</span>
                <h5 className="font-bold text-white text-sm">Reduces Food Waste</h5>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Real-time demand tracking shows what dishes are actually being consumed, preventing over-preparation of perishables.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1.5">
                <span className="text-lg">💳</span>
                <h5 className="font-bold text-white text-sm">Cuts Cash Handling</h5>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  100% digital transactions through student campus wallet and UPI. Eliminates tender change delays and cash shrinkage.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1.5">
                <span className="text-lg">🛠️</span>
                <h5 className="font-bold text-white text-sm">Faster Issue Resolution</h5>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  5-stage lifecycle routes problems immediately to facilities teams. Closed tickets remain in audit history for maintenance planning.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1.5">
                <span className="text-lg">🔍</span>
                <h5 className="font-bold text-white text-sm">Organized Lost Belongings</h5>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Replaces scattered WhatsApp messages and paper notices with a verified, single-custody claim recovery registry.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1.5">
                <span className="text-lg">🏛️</span>
                <h5 className="font-bold text-white text-sm">One Unified Platform</h5>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Students, kitchen staff, and university admins operate on a single synchronized dashboard with zero vendor fragmentation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RESOLVE CAMPUS ISSUES */}
      {activeTab === 'issues' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h4 className="font-extrabold text-base text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span>Campus Facilities Dispatch & Issue Resolution</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time ticket triage, photo evidence inspection, and 5-stage lifecycle dispatching
                </p>
              </div>

              {/* Quick Issue Counts */}
              <div className="flex items-center gap-2 text-[11px]">
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                  {issues.filter((i) => i.priority === 'Critical' && i.status !== 'resolved').length} Critical Open
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                  {issues.filter((i) => i.status !== 'resolved').length} Total Active
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  {issues.filter((i) => i.status === 'resolved').length} Resolved
                </span>
              </div>
            </div>

            {/* Filter and Search Bar for Admin */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 pb-4 border-b border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search ticket #, student, title, location..."
                  value={issueSearch}
                  onChange={(e) => setIssueSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <select
                  value={issueStatusFilter}
                  onChange={(e) => setIssueStatusFilter(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="open">Active / Unresolved Tickets</option>
                  <option value="reported">Stage 1: Newly Reported (Pending Route)</option>
                  <option value="in_progress">Stage 2-4: Routed & In Progress</option>
                  <option value="resolved">Stage 5: Resolved & Closed</option>
                </select>
              </div>

              <div>
                <select
                  value={issuePriorityFilter}
                  onChange={(e) => setIssuePriorityFilter(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="All">All Priorities</option>
                  <option value="Critical">Critical Priority (Immediate Hazards)</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>
            </div>

            {/* Issue List */}
            <div className="mt-4 space-y-4">
              {issues
                .filter((iss) => {
                  if (issueStatusFilter === 'open' && iss.status === 'resolved') return false;
                  if (issueStatusFilter === 'resolved' && iss.status !== 'resolved') return false;
                  if (issueStatusFilter === 'reported' && iss.status !== 'reported') return false;
                  if (issueStatusFilter === 'in_progress' && !['routed', 'in_progress'].includes(iss.status)) return false;
                  if (issuePriorityFilter !== 'All' && iss.priority !== issuePriorityFilter) return false;
                  if (issueSearch.trim()) {
                    const q = issueSearch.toLowerCase();
                    if (
                      !iss.ticketNumber?.toLowerCase().includes(q) &&
                      !iss.title?.toLowerCase().includes(q) &&
                      !iss.description?.toLowerCase().includes(q) &&
                      !iss.location?.toLowerCase().includes(q) &&
                      !iss.reportedBy?.toLowerCase().includes(q)
                    ) {
                      return false;
                    }
                  }
                  return true;
                })
                .map((iss) => {
                  const isResolved = iss.status === 'resolved';
                  const isTimelineExpanded = expandedIssueHistoryId === iss.id;

                  const getPriorityBadgeClass = (p) => {
                    switch (p) {
                      case 'Critical':
                        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 ring-2 ring-rose-500/20 animate-pulse';
                      case 'High':
                        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
                      case 'Medium':
                        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                      default:
                        return 'bg-slate-700 text-slate-300 border-slate-600';
                    }
                  };

                  return (
                    <div
                      key={iss.id}
                      className={`p-5 rounded-2xl bg-slate-800/60 border transition-all ${
                        iss.priority === 'Critical' && !isResolved
                          ? 'border-rose-500/40 shadow-lg shadow-rose-950/20'
                          : 'border-slate-700/60'
                      }`}
                    >
                      {/* Top Meta Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700/40 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-sm text-blue-400">
                            {iss.ticketNumber}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadgeClass(
                              iss.priority
                            )}`}
                          >
                            {iss.priority} Priority
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-700/80 text-slate-300 border border-slate-600/50">
                            {iss.category}
                          </span>
                          {iss.photoUrl && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              <ImageIcon className="w-3 h-3" /> Photo Proof
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-500" />
                            {iss.reportedBy}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {new Date(iss.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Content Grid: Left Details + Right Photo */}
                      <div className="mt-3.5 grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Left Details (2 cols on lg) */}
                        <div className="lg:col-span-2 space-y-3">
                          <div>
                            <h5 className="font-bold text-white text-base leading-snug">{iss.title}</h5>
                            <p className="mt-1.5 text-slate-300 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800 leading-relaxed">
                              {iss.description}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
                            <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800">
                              <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">Location</span>
                              <span className="flex items-center gap-1 font-medium">
                                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                <span className="truncate">{iss.location}</span>
                              </span>
                            </div>

                            <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800">
                              <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">Assigned Department</span>
                              <span className="flex items-center gap-1 font-medium">
                                <Building className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span className="truncate">{iss.department}</span>
                              </span>
                            </div>

                            <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800">
                              <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">Responsible Staff</span>
                              <span className="flex items-center gap-1 font-medium">
                                <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span className="truncate">{iss.assignedStaff}</span>
                              </span>
                            </div>
                          </div>

                          {/* 5-Stage Stepper Progress Tracker */}
                          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                            <div className="flex items-center justify-between mb-1.5 text-[10px] font-bold">
                              <span className="text-slate-400">Resolution Progress</span>
                              <span className={isResolved ? 'text-emerald-400' : 'text-blue-400'}>
                                Stage {iss.currentStageIndex}/5: {
                                  ['Reported', 'Routed', 'Work In Progress', 'Notified', 'Resolved'][iss.currentStageIndex - 1] || 'In Progress'
                                }
                              </span>
                            </div>
                            <div className="grid grid-cols-5 gap-1.5">
                              {['1. Report', '2. Route', '3. Act', '4. Notify', '5. Resolve'].map((stLabel, sIdx) => {
                                const stepNum = sIdx + 1;
                                const isDone = stepNum <= iss.currentStageIndex;
                                const isCurrent = stepNum === iss.currentStageIndex;

                                return (
                                  <div
                                    key={stepNum}
                                    className={`py-1 text-center rounded text-[10px] font-bold transition ${
                                      isCurrent
                                        ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                                        : isDone
                                        ? 'bg-emerald-600/80 text-white'
                                        : 'bg-slate-800 text-slate-500'
                                    }`}
                                  >
                                    {stLabel}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Right Photo Column */}
                        <div className="lg:col-span-1 flex flex-col justify-between">
                          {iss.photoUrl ? (
                            <div className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-1 flex flex-col h-full justify-between">
                              <div className="flex items-center justify-between p-1.5 text-[11px] font-bold text-slate-300">
                                <span className="flex items-center gap-1">
                                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Attached Photo</span>
                                </span>
                                <span className="text-[10px] text-indigo-400">Click to view</span>
                              </div>
                              <div
                                onClick={() => setAdminLightboxImage(iss.photoUrl)}
                                className="relative rounded-lg overflow-hidden h-36 bg-slate-900 cursor-pointer"
                              >
                                <img
                                  src={iss.photoUrl}
                                  alt={iss.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                />
                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                  <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 text-white text-[11px] font-bold flex items-center gap-1 shadow-md">
                                    <Maximize2 className="w-3.5 h-3.5" /> Full Photo
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setAdminLightboxImage(iss.photoUrl)}
                                className="mt-2 w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-400" /> Inspect Evidence Photo
                              </button>
                            </div>
                          ) : (
                            <div className="h-full rounded-xl border border-dashed border-slate-700/70 p-4 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                              <Camera className="w-6 h-6 mb-1 text-slate-600" />
                              <span className="font-semibold text-slate-400">No Photo Attached</span>
                              <span className="text-[10px] text-slate-500 mt-0.5">Student submitted text-only report</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Bar & Timeline Toggle */}
                      <div className="mt-4 pt-3.5 border-t border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <button
                          type="button"
                          onClick={() => setExpandedIssueHistoryId(isTimelineExpanded ? null : iss.id)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition"
                        >
                          {isTimelineExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          <span>{isTimelineExpanded ? 'Hide Timeline History' : `View Full Timeline (${iss.timeline?.length || 1} logged updates)`}</span>
                        </button>

                        {/* Dispatch Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          {iss.currentStageIndex < 2 && (
                            <button
                              onClick={() => handleAdvanceIssue(iss.id, 2, 'Route')}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shadow-blue-600/30"
                            >
                              Dispatch to Route (Stage 2)
                            </button>
                          )}

                          {iss.currentStageIndex === 2 && (
                            <button
                              onClick={() => handleAdvanceIssue(iss.id, 3, 'Act')}
                              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition shadow-md shadow-amber-600/30"
                            >
                              Dispatch to Act / In Progress (Stage 3)
                            </button>
                          )}

                          {iss.currentStageIndex === 3 && (
                            <button
                              onClick={() => handleAdvanceIssue(iss.id, 4, 'Notify')}
                              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-md shadow-cyan-600/30"
                            >
                              Send Progress Alert to Student (Stage 4)
                            </button>
                          )}

                          {iss.currentStageIndex >= 3 && iss.status !== 'resolved' && (
                            <button
                              onClick={() => handleAdvanceIssue(iss.id, 5, 'Resolve')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-600/30"
                            >
                              ✓ Resolve & Close Ticket (Stage 5)
                            </button>
                          )}

                          {iss.status === 'resolved' && (
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Ticket Resolved & Closed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expandable History Drawer */}
                      {isTimelineExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-700/40 space-y-2 animate-in fade-in">
                          <h6 className="font-bold text-slate-300 text-[11px]">Audit Log & Activity History:</h6>
                          <div className="space-y-2 border-l-2 border-slate-700 ml-2 pl-3">
                            {(iss.timeline || []).map((step, idx) => (
                              <div key={idx} className="relative text-[11px]">
                                <span className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-800" />
                                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                                  <div className="flex items-center justify-between text-slate-300 font-semibold">
                                    <span>Stage: {step.stage} • Logged by: {step.actor}</span>
                                    <span className="text-[10px] text-slate-400">
                                      {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-slate-400 mt-0.5 text-[10px]">{step.message}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

              {issues.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-800/40 rounded-xl">
                  No campus issues found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REVIEW LOST & FOUND CLAIMS */}
      {activeTab === 'claims' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h4 className="font-bold text-sm text-white mb-1">
            Lost & Found Claim Verification
          </h4>
          <p className="text-xs text-slate-400 mb-4">
            Verify student ownership proof and approve release of belongings
          </p>

          <div className="space-y-4">
            {lostFoundItems
              .filter((i) => i.claims && i.claims.length > 0)
              .map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <h5 className="font-bold text-white text-sm">{item.title}</h5>
                        <p className="text-[11px] text-slate-400">Found at: {item.location}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-700 text-slate-300">
                      {item.status}
                    </span>
                  </div>

                  {/* Claims List */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    {item.claims.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-lg bg-slate-900 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="font-bold text-blue-300">
                            Claimant: {c.claimantName} (Roll: {c.claimantRoll}, Tel: {c.claimantPhone})
                          </div>
                          <p className="text-slate-300 text-[11px] mt-0.5">
                            <strong>Submitted Proof:</strong> "{c.proofDetails}"
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {c.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleReviewClaim(item.id, c.id, 'approve')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                              >
                                Approve & Hand Over
                              </button>
                              <button
                                onClick={() => handleReviewClaim(item.id, c.id, 'reject')}
                                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                                c.status === 'approved'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              Claim {c.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 4: CANTEENS & MENU GOVERNANCE */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          {/* SECTION A: REGISTERED CAMPUS DINING OUTLETS & REAL-TIME CROWD CALIBRATION */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                    <Store className="w-5 h-5" />
                  </span>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Registered Dining Outlets & Campus Stores
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {canteens.length} Active Outlets
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Manage active dining halls, kiosks, and food courts. Calibrate live kitchen crowd load, wait times, and launch new food stores.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddCanteenModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Register New Canteen / Store</span>
                </button>
              </div>
            </div>

            {/* Outlets Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {canteens.map((c) => {
                const outletDishCount = menuItems.filter((m) => m.canteenId === c.id).length;
                const isFiltered = adminCanteenFilter === c.id;
                return (
                  <div
                    key={c.id}
                    className={`rounded-2xl border p-4 transition-all duration-200 relative flex flex-col justify-between ${
                      isFiltered
                        ? 'bg-slate-800/90 border-indigo-500/80 shadow-lg shadow-indigo-500/10'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-mono font-black text-amber-400">
                            {c.code || (c.id === 'canteen-1' ? 'C1' : c.id === 'canteen-2' ? 'C2' : c.id === 'canteen-3' ? 'C3' : 'CT')}
                          </span>
                          <div>
                            <h4 className="font-bold text-sm text-white line-clamp-1">{c.name}</h4>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              <span className="line-clamp-1">{c.location || 'Campus Quad'}</span>
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteCanteen(c)}
                          title={`Delete ${c.name}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 my-3 text-[11px] bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <div>
                          <div className="text-slate-400 text-[10px]">Catalog Dishes</div>
                          <div className="font-bold text-slate-200">{outletDishCount} items</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px]">Avg Wait Time</div>
                          <div className="font-bold text-slate-200">{c.avgWaitTimeMinutes || 5} mins</div>
                        </div>
                      </div>

                      {/* Live Crowd Level Switcher */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mb-1.5">
                          <span>Live Crowd Status</span>
                          <span
                            className={`font-bold uppercase px-1.5 py-0.5 rounded text-[10px] ${
                              c.crowdLevel === 'Rush Hour' || c.crowdLevel === 'High'
                                ? 'bg-rose-500/20 text-rose-300'
                                : c.crowdLevel === 'Busy' || c.crowdLevel === 'Moderate'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {c.crowdLevel || 'Low'}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          {['Low', 'Moderate', 'Busy', 'Rush Hour'].map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => handleUpdateCanteenCrowd(c.id, lvl)}
                              className={`py-1 rounded-lg text-[9px] font-bold transition ${
                                (c.crowdLevel || 'Low') === lvl
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                              }`}
                            >
                              {lvl === 'Rush Hour' ? 'Rush' : lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAdminCanteenFilter(isFiltered ? 'All' : c.id);
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                          isFiltered
                            ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <Utensils className="w-3 h-3" />
                        <span>{isFiltered ? 'Viewing Menu' : 'Manage Dishes'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCanteen(c)}
                        title={`Delete ${c.name}`}
                        className="py-1.5 px-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-[11px] font-bold transition flex items-center justify-center gap-1 border border-rose-500/30 shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION B: DISHES CATALOG & STAFF ACCESS POWERS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            {/* Header & Main Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-amber-400" />
                  <span>Menu Dishes Catalog & Kitchen Stock Governance</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Full staff access equipped: adjust stock quantities (-1, +1, +5, +15), instant in/out-of-stock toggles, upload dish images, edit pricing, or remove items.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={openAddDishModal}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Add Dish to Menu</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="space-y-3 mb-6 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
              {/* Outlet Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                  Outlet:
                </span>
                <button
                  type="button"
                  onClick={() => setAdminCanteenFilter('All')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                    adminCanteenFilter === 'All'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  All Outlets ({menuItems.length})
                </button>
                {canteens.map((c) => {
                  const count = menuItems.filter((m) => m.canteenId === c.id).length;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setAdminCanteenFilter(c.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                        adminCanteenFilter === c.id
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {c.name} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Category & Search Filter */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                    Category:
                  </span>
                  {['All', ...categoriesList].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setAdminCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition ${
                        adminCategoryFilter === cat
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Search Input */}
                <div className="relative min-w-[220px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search dish or ingredient..."
                    value={adminMenuSearch}
                    onChange={(e) => setAdminMenuSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  {adminMenuSearch && (
                    <button
                      type="button"
                      onClick={() => setAdminMenuSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Results Count Strip */}
            <div className="flex items-center justify-between text-xs text-slate-400 mb-4 px-1">
              <div>
                Showing <span className="font-bold text-white">{filteredAdminMenuItems.length}</span> dishes matching active filters
              </div>
              {filteredAdminMenuItems.length === 0 && (
                <div className="text-amber-400 text-xs">No menu dishes found for this filter combination.</div>
              )}
            </div>

            {/* Dishes Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAdminMenuItems.map((item) => {
                const canteenObj = canteens.find((c) => c.id === item.canteenId);
                const isOutOfStock = Number(item.stock) <= 0;
                const isLowStock = !isOutOfStock && Number(item.stock) <= 5;

                return (
                  <div
                    key={item.id}
                    className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition shadow-lg group relative"
                  >
                    <div>
                      {/* Top Row: Image + Details */}
                      <div className="flex items-start gap-3.5">
                        <div className="relative shrink-0">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-20 h-20 rounded-xl object-cover bg-slate-900 border border-slate-800"
                          />
                          <span
                            className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-950 flex items-center justify-center text-[8px] font-bold ${
                              item.isVeg ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                            }`}
                            title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                          >
                            ●
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-bold text-sm text-white truncate" title={item.name}>
                              {item.name}
                            </h4>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-amber-300 border border-slate-700">
                              {canteenObj?.name || item.canteenId}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-800/80 text-slate-300">
                              {item.category}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <span className="font-mono font-bold text-white text-sm">₹{item.price}</span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              ~{item.prepTimeMinutes || 4}m prep
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Description if any */}
                      {item.description && (
                        <p className="text-[11px] text-slate-400 mt-2.5 line-clamp-2 leading-relaxed bg-slate-900/40 p-2 rounded-lg border border-slate-800/50">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Controls & Stock Management */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2.5">
                      {/* Stock Status & Instant Toggle */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              isOutOfStock
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : isLowStock
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {isOutOfStock ? 'Sold Out' : `${item.stock} in stock`}
                          </span>
                        </div>

                        {/* Instant In/Out-of-Stock Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleStockStatus(item)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                            isOutOfStock
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-slate-800 hover:bg-rose-900/40 text-rose-400 hover:text-rose-300 border border-slate-700'
                          }`}
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>{isOutOfStock ? 'Restock (+15)' : 'Mark Out of Stock'}</span>
                        </button>
                      </div>

                      {/* Stock Adjustment Buttons (-1, +1, +5, +15) */}
                      <div className="flex items-center justify-between gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 font-semibold px-1">Adjust:</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={Number(item.stock) <= 0}
                            onClick={() => handleAdjustStock(item, -1)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-[11px] font-bold transition"
                            title="Decrease by 1"
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(item, 1)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition"
                            title="Increase by 1"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(item, 5)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition"
                            title="Increase by 5"
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(item, 15)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono text-[11px] font-bold transition"
                            title="Batch restock 15 portions"
                          >
                            +15
                          </button>
                        </div>
                      </div>

                      {/* Edit & Delete Action Buttons */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => openEditDishModal(item)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700/60"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Edit Dish</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDish(item)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold transition flex items-center gap-1.5 border border-rose-500/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CAMPUS MAP & ESTABLISHMENTS STUDIO (Slide 6 & 10) */}
      {activeTab === 'map' && (
        <div className="space-y-6">
          {/* Header & Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-400" />
                <h4 className="font-extrabold text-base text-white">Campus Map & Establishment Management</h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Live Relational Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Edit, relocate, or establish stores, clinics, canteens, academic blocks, and hostels across the 400-acre Amrita Ettimadai campus compound.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleOpenAddModal()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Pin New Establishment</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter Chips */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { id: 'All', label: 'All Establishments' },
                { id: 'Food & Dining', label: '🍽️ Food & Dining' },
                { id: 'Medical & Health', label: '🏥 Medical & Health' },
                { id: 'Academic Store', label: '📚 Stores & Xerox' },
                { id: 'Academic & Labs', label: '🎓 Academic & Labs' },
                { id: 'Hostels & Living', label: '🛏️ Hostels' },
                { id: 'Sports & Recreation', label: '🏊 Sports' },
                { id: 'Facilities', label: '🏛️ Facilities' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedMapCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedMapCategory === cat.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700/80 border border-slate-700/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search establishments..."
                value={searchMapQuery}
                onChange={(e) => setSearchMapQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Split View: Interactive Map & Establishments List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Compound Leaflet Map */}
            <div className="lg:col-span-7 space-y-3">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white">Interactive Amrita Compound Map</span>
                    <span className="text-[10px] text-slate-400 font-mono">(Locked to 400-Acre Perimeter)</span>
                  </div>
                  <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    Click pin to edit
                  </span>
                </div>

                {/* Leaflet Container */}
                <div
                  ref={adminMapContainerRef}
                  className="w-full h-[480px] rounded-xl overflow-hidden border border-slate-800 shadow-inner relative z-0"
                />

                {/* Map Bottom Bar: Click capture or hint */}
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  {clickedMapCoord ? (
                    <div className="flex items-center gap-2 text-cyan-300 font-mono text-[11px]">
                      <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      <span>
                        Map Pin Picked: {clickedMapCoord.lat}, {clickedMapCoord.lng}
                      </span>
                      <button
                        onClick={() => handleOpenAddModal(clickedMapCoord)}
                        className="ml-2 px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 text-[10px] font-bold"
                      >
                        + Pin Here
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-slate-500" />
                      <span>Click anywhere inside the purple Amrita compound to capture coordinates or click any marker to edit.</span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (adminMapInstanceRef.current) {
                        adminMapInstanceRef.current.flyTo(AMRITA_CAMPUS_CENTER, 16.5, { duration: 0.8 });
                      }
                    }}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset Campus View
                  </button>
                </div>

                {/* Quick Landmark Preset Jumps */}
                <div className="mt-3 pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                    Quick Landmark Navigator:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
                    {AMRITA_GPS_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => {
                          if (adminMapInstanceRef.current) {
                            adminMapInstanceRef.current.flyTo([p.lat, p.lng], 18, { duration: 0.8 });
                          }
                        }}
                        className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-[10px] text-slate-300 hover:text-white border border-slate-700/60 transition"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Pinned Campus Establishments Cards */}
            <div className="lg:col-span-5 space-y-3">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-sm text-white">Campus Establishments</h4>
                    <p className="text-[11px] text-slate-400">
                      Showing {
                        mapLocations.filter((loc) => {
                          if (selectedMapCategory !== 'All' && loc.category !== selectedMapCategory) return false;
                          if (searchMapQuery) {
                            const q = searchMapQuery.toLowerCase();
                            return (
                              loc.name.toLowerCase().includes(q) ||
                              loc.building?.toLowerCase().includes(q) ||
                              loc.description?.toLowerCase().includes(q)
                            );
                          }
                          return true;
                        }).length
                      } establishments on campus
                    </p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                  {mapLocations
                    .filter((loc) => {
                      if (selectedMapCategory !== 'All' && loc.category !== selectedMapCategory) return false;
                      if (searchMapQuery) {
                        const q = searchMapQuery.toLowerCase();
                        return (
                          loc.name.toLowerCase().includes(q) ||
                          loc.building?.toLowerCase().includes(q) ||
                          loc.description?.toLowerCase().includes(q)
                        );
                      }
                      return true;
                    })
                    .map((loc) => {
                      const isDining = loc.category === 'Food & Dining' || loc.relatedCanteenId;
                      const isMedical = loc.category === 'Medical & Health';
                      const isStore = loc.category === 'Academic Store' || loc.category === 'Retail Store';
                      const isAcademic = loc.category === 'Academic & Labs';
                      const isHostel = loc.category === 'Hostels & Living';

                      let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
                      if (isDining) badgeColor = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
                      else if (isMedical) badgeColor = 'bg-rose-500/10 text-rose-300 border-rose-500/30';
                      else if (isStore) badgeColor = 'bg-teal-500/10 text-teal-300 border-teal-500/30';
                      else if (isAcademic) badgeColor = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
                      else if (isHostel) badgeColor = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';

                      return (
                        <div
                          key={loc.id}
                          className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 hover:border-slate-600 transition space-y-2 text-xs"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <img
                                src={loc.image}
                                alt={loc.name}
                                className="w-12 h-12 rounded-xl object-cover border border-slate-700/80 shrink-0"
                              />
                              <div>
                                <h5 className="font-bold text-white text-sm line-clamp-1">{loc.name}</h5>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeColor}`}>
                                    {loc.category}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {loc.building} ({loc.floor})
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Relational Canteen Link Indicator */}
                          {isDining && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px]">
                              <Utensils className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>
                                Relational Sync: Staff Kitchen Active ({loc.relatedCanteenId || 'Canteen'})
                              </span>
                            </div>
                          )}

                          {/* Timings and Contact info */}
                          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                            <div className="flex items-center gap-1 truncate">
                              <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{loc.timings || '08:00 AM - 09:30 PM'}</span>
                            </div>
                            <div className="flex items-center gap-1 truncate">
                              <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{loc.contact || 'Campus Ext'}</span>
                            </div>
                          </div>

                          {/* Monospace GPS Coordinates */}
                          <div className="text-[10px] font-mono text-cyan-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800 flex items-center justify-between">
                            <span>GPS: {loc.lat || loc.coordinates?.lat}, {loc.lng || loc.coordinates?.lng}</span>
                            <span className="text-slate-500 font-sans">{loc.zone}</span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => {
                                const lat = loc.lat || loc.coordinates?.lat;
                                const lng = loc.lng || loc.coordinates?.lng;
                                if (adminMapInstanceRef.current && lat && lng) {
                                  adminMapInstanceRef.current.flyTo([lat, lng], 18, { duration: 0.8 });
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 border border-slate-700/60 transition"
                            >
                              <Crosshair className="w-3 h-3 text-cyan-400" />
                              <span>Locate</span>
                            </button>

                            <button
                              onClick={() => handleOpenEditModal(loc)}
                              className="px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold flex items-center gap-1 transition"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Edit Details</span>
                            </button>

                            <button
                              onClick={() => handleDeleteMapLoc(loc)}
                              className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] transition"
                              title="Delete establishment"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>

          {/* EDIT & PIN ESTABLISHMENT MODAL (Slide 6 Relational Updates) */}
          {isMapModalOpen && editingMapLoc && (
            <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      {isAddingNewLoc ? <Plus className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-white">
                        {isAddingNewLoc ? 'Pin New Campus Establishment' : 'Edit Establishment Details'}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Configuring location, hours, and relational options across campus systems
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsMapModalOpen(false);
                      setEditingMapLoc(null);
                    }}
                    className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveMapLoc} className="space-y-4 text-xs">
                  {/* Name */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Establishment Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Main Canteen 1 or Health Clinic & Dispensary"
                      value={editingMapLoc.name || ''}
                      onChange={(e) => setEditingMapLoc({ ...editingMapLoc, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Category & Zone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Category *</label>
                      <select
                        value={editingMapLoc.category || 'Food & Dining'}
                        onChange={(e) => setEditingMapLoc({ ...editingMapLoc, category: e.target.value })}
                        className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Food & Dining">Food & Dining (Canteens & Cafes)</option>
                        <option value="Medical & Health">Medical & Health (Clinic & Dispensary)</option>
                        <option value="Academic Store">Academic Store (Books & Xerox)</option>
                        <option value="Retail Store">Retail Store (Supermarket & General)</option>
                        <option value="Academic & Labs">Academic & Labs (AB1, AB2, AB3, AB4)</option>
                        <option value="Hostels & Living">Hostels & Living (Boys & Girls)</option>
                        <option value="Sports & Recreation">Sports & Recreation (Pool, Gym, Grounds)</option>
                        <option value="Facilities">Facilities (Library, ATM, Security)</option>
                        <option value="Administration">Administration (Dean Office, Admissions)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Campus Zone *</label>
                      <select
                        value={editingMapLoc.zone || 'Central Campus'}
                        onChange={(e) => setEditingMapLoc({ ...editingMapLoc, zone: e.target.value })}
                        className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Central Campus">Central Campus</option>
                        <option value="North Campus">North Campus</option>
                        <option value="South-Central Campus">South-Central Campus</option>
                        <option value="East Academic">East Academic</option>
                        <option value="North-West Academic">North-West Academic</option>
                        <option value="Hostel Zone">Hostel Zone</option>
                        <option value="Main Gate Area">Main Gate Area</option>
                      </select>
                    </div>
                  </div>

                  {/* Building & Floor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Building *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Academic Block 3 or North Sports Pavilion"
                        value={editingMapLoc.building || ''}
                        onChange={(e) => setEditingMapLoc({ ...editingMapLoc, building: e.target.value })}
                        className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Floor *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ground Floor or Floors 1 to 4"
                        value={editingMapLoc.floor || ''}
                        onChange={(e) => setEditingMapLoc({ ...editingMapLoc, floor: e.target.value })}
                        className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Timings & Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Operating Hours *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 08:00 AM - 09:30 PM"
                        value={editingMapLoc.timings || ''}
                        onChange={(e) => setEditingMapLoc({ ...editingMapLoc, timings: e.target.value })}
                        className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Contact Details</label>
                      <input
                        type="text"
                        placeholder="e.g. Extension 2401 or clinic@campus.edu"
                        value={editingMapLoc.contact || ''}
                        onChange={(e) => setEditingMapLoc({ ...editingMapLoc, contact: e.target.value })}
                        className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* RELATIONAL CANTEEN SYNC SECTION */}
                  {(editingMapLoc.category === 'Food & Dining' || editingMapLoc.relatedCanteenId) && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2.5">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <Utensils className="w-4 h-4 text-amber-400" />
                        <span>⚡ Relational Canteen & Staff Operations Synchronization</span>
                      </div>
                      <p className="text-[11px] text-amber-200/90 leading-relaxed">
                        Renaming this establishment or updating its location/timings will automatically propagate to:
                        <br />• <strong>Staff Kitchen Panel</strong>: Active canteen dropdown selector & kitchen queues
                        <br />• <strong>Student Canteen View</strong>: Canteen tab switcher, header banner & active order tokens
                      </p>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                          Relational Canteen Mapping
                        </label>
                        <select
                          value={editingMapLoc.relatedCanteenId || ''}
                          onChange={(e) => setEditingMapLoc({ ...editingMapLoc, relatedCanteenId: e.target.value })}
                          className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                        >
                          <option value="">-- Standalone / Unlinked Dining Hub --</option>
                          {canteens.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.id})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* MEDICAL & HEALTH INFO */}
                  {editingMapLoc.category === 'Medical & Health' && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <Activity className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>
                        Campus Clinic entries are highlighted with 24/7 emergency response beacons on student maps.
                      </span>
                    </div>
                  )}

                  {/* STORE INFO */}
                  {(editingMapLoc.category === 'Academic Store' || editingMapLoc.category === 'Retail Store') && (
                    <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs flex items-center gap-2">
                      <Store className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>
                        Stationery, xerox & textbook stores are searchable by academic materials on student map search.
                      </span>
                    </div>
                  )}

                  {/* GPS COORDINATES & PRESETS */}
                  <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Crosshair className="w-4 h-4 text-cyan-400" />
                        <span>Precise GPS Coordinates</span>
                      </span>
                      {clickedMapCoord && (
                        <button
                          type="button"
                          onClick={() => setEditingMapLoc({
                            ...editingMapLoc,
                            lat: clickedMapCoord.lat,
                            lng: clickedMapCoord.lng
                          })}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold underline flex items-center gap-1"
                        >
                          Use Map Clicked ({clickedMapCoord.lat}, {clickedMapCoord.lng})
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1 text-[11px]">Latitude (GPS)</label>
                        <input
                          type="number"
                          step="0.000001"
                          required
                          value={editingMapLoc.lat || ''}
                          onChange={(e) => setEditingMapLoc({ ...editingMapLoc, lat: e.target.value })}
                          className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1 text-[11px]">Longitude (GPS)</label>
                        <input
                          type="number"
                          step="0.000001"
                          required
                          value={editingMapLoc.lng || ''}
                          onChange={(e) => setEditingMapLoc({ ...editingMapLoc, lng: e.target.value })}
                          className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    {/* Quick Landmark Preset Buttons */}
                    <div className="pt-2 border-t border-slate-700/60">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">
                        One-Click Coordinate Snapping:
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {AMRITA_GPS_PRESETS.map((p) => (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => setEditingMapLoc({
                              ...editingMapLoc,
                              lat: p.lat,
                              lng: p.lng
                            })}
                            className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700 transition"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Description & Services</label>
                    <textarea
                      rows="2"
                      placeholder="Services offered, specialties, student access details..."
                      value={editingMapLoc.description || ''}
                      onChange={(e) => setEditingMapLoc({ ...editingMapLoc, description: e.target.value })}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Image URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={editingMapLoc.image || ''}
                      onChange={(e) => setEditingMapLoc({ ...editingMapLoc, image: e.target.value })}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Modal Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMapModalOpen(false);
                        setEditingMapLoc(null);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold transition shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isAddingNewLoc ? 'Pin Establishment to Map' : 'Save & Synchronize Changes'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lightbox Image Preview Modal for Admin */}
      {adminLightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setAdminLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-amber-400" />
                Issue Evidence Photo — High-Resolution Inspection
              </span>
              <button
                onClick={() => setAdminLightboxImage(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 flex items-center justify-center bg-slate-950 rounded-xl overflow-hidden mt-3">
              <img
                src={adminLightboxImage}
                alt="Admin high-res evidence inspect"
                className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
      {/* MODAL 1: REGISTER NEW CANTEEN / STORE */}
      {isAddCanteenModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsAddCanteenModalOpen(false)}
        >
          <div
            className="relative max-w-xl w-full bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Store className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-white">Register New Canteen or Store</h3>
                  <p className="text-[11px] text-slate-400">
                    Instantly activates across Student Menu, Kitchen KDS, and Admin controls.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCanteenModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCanteen} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Canteen / Store Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Canteen 4 (PG Diner) or Nescafe Kiosk"
                    value={canteenForm.name}
                    onChange={(e) => setCanteenForm({ ...canteenForm, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Badge Code</label>
                  <input
                    type="text"
                    placeholder="e.g. C4 or NES"
                    value={canteenForm.code}
                    onChange={(e) => setCanteenForm({ ...canteenForm, code: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white uppercase placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Campus Location</label>
                <input
                  type="text"
                  placeholder="e.g. Academic Block 3 Ground Floor, Near Tech Quad"
                  value={canteenForm.location}
                  onChange={(e) => setCanteenForm({ ...canteenForm, location: e.target.value })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={canteenForm.timings}
                    onChange={(e) => setCanteenForm({ ...canteenForm, timings: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Initial Crowd</label>
                  <select
                    value={canteenForm.crowdLevel}
                    onChange={(e) => setCanteenForm({ ...canteenForm, crowdLevel: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Busy">Busy</option>
                    <option value="Rush Hour">Rush Hour</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Avg Wait (mins)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={canteenForm.avgWaitTimeMinutes}
                    onChange={(e) =>
                      setCanteenForm({ ...canteenForm, avgWaitTimeMinutes: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Cover Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={canteenForm.image}
                  onChange={(e) => setCanteenForm({ ...canteenForm, image: e.target.value })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCanteenModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create & Launch Outlet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD DISH TO MENU */}
      {isAddDishModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsAddDishModalOpen(false)}
        >
          <div
            className="relative max-w-xl w-full bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <Utensils className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-white">Add New Food Item to Menu</h3>
                  <p className="text-[11px] text-slate-400">
                    Specify outlet, category, pricing, kitchen prep time, and upload photo.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDishModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Canteen / Outlet *</label>
                  <select
                    value={dishForm.canteenId}
                    onChange={(e) => setDishForm({ ...dishForm, canteenId: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    {canteens.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category *</label>
                  <select
                    value={dishForm.category}
                    onChange={(e) => setDishForm({ ...dishForm, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paneer Butter Masala Combo or Cold Coffee Shake"
                  value={dishForm.name}
                  onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={dishForm.price}
                    onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Prep Time (mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={dishForm.prepTimeMinutes}
                    onChange={(e) => setDishForm({ ...dishForm, prepTimeMinutes: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={dishForm.stock}
                    onChange={(e) => setDishForm({ ...dishForm, stock: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Diet Classification */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Diet Type</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDishForm({ ...dishForm, isVeg: true })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                      dishForm.isVeg
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span>Pure Vegetarian</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDishForm({ ...dishForm, isVeg: false })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                      !dishForm.isVeg
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span>Non-Vegetarian</span>
                  </button>
                </div>
              </div>

              {/* Dish Image Source (Upload vs URL) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-300 font-semibold">Dish Photo</label>
                  <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setDishImageMode('upload')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                        dishImageMode === 'upload'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Upload className="w-2.5 h-2.5" />
                      <span>Upload File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDishImageMode('url')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                        dishImageMode === 'url'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Link className="w-2.5 h-2.5" />
                      <span>Image URL</span>
                    </button>
                  </div>
                </div>

                {dishImageMode === 'upload' ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={adminDishFileInputRef}
                      onChange={handleImageFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => adminDishFileInputRef.current?.click()}
                      className="flex-1 py-3 px-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-800/60 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4 text-indigo-400" />
                      <span>Choose Image from Computer</span>
                    </button>
                    {dishForm.imageUrl && (
                      <div className="relative shrink-0">
                        <img
                          src={dishForm.imageUrl}
                          alt="Dish preview"
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                        />
                        <button
                          type="button"
                          onClick={() => setDishForm({ ...dishForm, imageUrl: '' })}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      type="url"
                      placeholder="Paste image URL (https://...)"
                      value={dishForm.imageUrl}
                      onChange={(e) => setDishForm({ ...dishForm, imageUrl: e.target.value })}
                      className="flex-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    {dishForm.imageUrl && (
                      <img
                        src={dishForm.imageUrl}
                        alt="Preview"
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description / Ingredients</label>
                <textarea
                  rows="2"
                  value={dishForm.description}
                  onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                  placeholder="Ingredients, accompaniments, allergens..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddDishModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Dish to Menu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT DISH MODAL */}
      {editingDish && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setEditingDish(null)}
        >
          <div
            className="relative max-w-xl w-full bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-white">Edit Dish: {editingDish.name}</h3>
                  <p className="text-[11px] text-slate-400">
                    Update pricing, category, kitchen prep time, photo, or stock availability.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDish(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Canteen / Outlet *</label>
                  <select
                    value={dishForm.canteenId}
                    onChange={(e) => setDishForm({ ...dishForm, canteenId: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    {canteens.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category *</label>
                  <select
                    value={dishForm.category}
                    onChange={(e) => setDishForm({ ...dishForm, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  value={dishForm.name}
                  onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={dishForm.price}
                    onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Prep Time (mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={dishForm.prepTimeMinutes}
                    onChange={(e) => setDishForm({ ...dishForm, prepTimeMinutes: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Stock Count</label>
                  <input
                    type="number"
                    min="0"
                    value={dishForm.stock}
                    onChange={(e) => setDishForm({ ...dishForm, stock: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Diet Classification */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Diet Type</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDishForm({ ...dishForm, isVeg: true })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                      dishForm.isVeg
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span>Pure Vegetarian</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDishForm({ ...dishForm, isVeg: false })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                      !dishForm.isVeg
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span>Non-Vegetarian</span>
                  </button>
                </div>
              </div>

              {/* Dish Image Source (Upload vs URL) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-300 font-semibold">Dish Photo</label>
                  <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setDishImageMode('upload')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                        dishImageMode === 'upload'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Upload className="w-2.5 h-2.5" />
                      <span>Upload File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDishImageMode('url')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                        dishImageMode === 'url'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Link className="w-2.5 h-2.5" />
                      <span>Image URL</span>
                    </button>
                  </div>
                </div>

                {dishImageMode === 'upload' ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={adminEditDishFileInputRef}
                      onChange={handleImageFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => adminEditDishFileInputRef.current?.click()}
                      className="flex-1 py-3 px-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-amber-500 bg-slate-800/60 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span>Choose New Image from Computer</span>
                    </button>
                    {dishForm.imageUrl && (
                      <div className="relative shrink-0">
                        <img
                          src={dishForm.imageUrl}
                          alt="Dish preview"
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                        />
                        <button
                          type="button"
                          onClick={() => setDishForm({ ...dishForm, imageUrl: '' })}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      type="url"
                      placeholder="Paste image URL (https://...)"
                      value={dishForm.imageUrl}
                      onChange={(e) => setDishForm({ ...dishForm, imageUrl: e.target.value })}
                      className="flex-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    {dishForm.imageUrl && (
                      <img
                        src={dishForm.imageUrl}
                        alt="Preview"
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description / Ingredients</label>
                <textarea
                  rows="2"
                  value={dishForm.description}
                  onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                  placeholder="Ingredients, accompaniments..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingDish(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 transition flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
