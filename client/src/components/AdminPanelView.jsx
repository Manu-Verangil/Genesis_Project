import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { api } from '../api';

export function AdminPanelView({ canteens, onDataUpdated }) {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'menu', 'issues', 'claims', 'map'
  const [issues, setIssues] = useState([]);
  const [lostFoundItems, setLostFoundItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [mapLocations, setMapLocations] = useState([]);

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
    category: 'Academic Store',
    building: '',
    floor: 'Ground Floor',
    zone: 'Central Zone',
    timings: '08:30 AM - 06:30 PM',
    contact: 'store@campus.edu',
    description: '',
    lat: 13.0110,
    lng: 80.2340,
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=80'
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

  // Add new map location (Slide 6: Add stores and canteens to map)
  const handleAddMapLoc = async (e) => {
    e.preventDefault();
    try {
      const res = await api.addMapLocation({
        ...newMapLoc,
        lat: parseFloat(newMapLoc.lat),
        lng: parseFloat(newMapLoc.lng),
        coordinates: {
          x: 50,
          y: 50,
          lat: parseFloat(newMapLoc.lat),
          lng: parseFloat(newMapLoc.lng)
        }
      });
      if (res.success) {
        alert('New location successfully pinned to the real campus map!');
        setNewMapLoc({
          name: '',
          category: 'Academic Store',
          building: '',
          floor: 'Ground Floor',
          zone: 'Central Zone',
          timings: '08:30 AM - 06:30 PM',
          contact: 'store@campus.edu',
          description: '',
          lat: 13.0110,
          lng: 80.2340,
          image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=80'
        });
        fetchAdminData();
        onDataUpdated();
      }
    } catch (err) {
      alert('Error adding location: ' + err.message);
    }
  };

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
                        className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                          isFiltered
                            ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <Utensils className="w-3 h-3" />
                        <span>{isFiltered ? 'Viewing Menu' : 'Manage Dishes'}</span>
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

      {/* TAB 5: CAMPUS MAP HUBS MANAGEMENT (Slide 6 & 10) */}
      {activeTab === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h4 className="font-bold text-sm text-white mb-1">Add Location to Campus Map</h4>
            <p className="text-[11px] text-slate-400 mb-4">
              Pin new canteens, stationery stores, or labs with real GPS coordinates.
            </p>

            <form onSubmit={handleAddMapLoc} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hub Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mechanical Lab 3D Printing Hub"
                  value={newMapLoc.name}
                  onChange={(e) => setNewMapLoc({ ...newMapLoc, name: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={newMapLoc.category}
                    onChange={(e) => setNewMapLoc({ ...newMapLoc, category: e.target.value })}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  >
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Academic Store">Academic Store</option>
                    <option value="Retail Store">Retail Store</option>
                    <option value="Facilities">Facilities</option>
                    <option value="Medical & Health">Medical & Health</option>
                    <option value="Sports & Recreation">Sports & Recreation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Zone</label>
                  <select
                    value={newMapLoc.zone}
                    onChange={(e) => setNewMapLoc({ ...newMapLoc, zone: e.target.value })}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  >
                    <option value="Central Zone">Central Zone</option>
                    <option value="North Zone">North Zone</option>
                    <option value="West Zone">West Zone</option>
                    <option value="East Zone">East Zone</option>
                    <option value="South Zone">South Zone</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Building</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Science Block C"
                    value={newMapLoc.building}
                    onChange={(e) => setNewMapLoc({ ...newMapLoc, building: e.target.value })}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Floor</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2nd Floor"
                    value={newMapLoc.floor}
                    onChange={(e) => setNewMapLoc({ ...newMapLoc, floor: e.target.value })}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Latitude (GPS)</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newMapLoc.lat}
                    onChange={(e) => setNewMapLoc({ ...newMapLoc, lat: e.target.value })}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Longitude (GPS)</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newMapLoc.lng}
                    onChange={(e) => setNewMapLoc({ ...newMapLoc, lng: e.target.value })}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Operating Hours</label>
                <input
                  type="text"
                  required
                  placeholder="08:30 AM - 06:30 PM"
                  value={newMapLoc.timings}
                  onChange={(e) => setNewMapLoc({ ...newMapLoc, timings: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Services offered, equipment, entry rules..."
                  value={newMapLoc.description}
                  onChange={(e) => setNewMapLoc({ ...newMapLoc, description: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/30"
              >
                Pin Hub on Real Map
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h4 className="font-bold text-sm text-white mb-1">Pinned Campus Facilities ({mapLocations.length})</h4>
            <p className="text-[11px] text-slate-400 mb-4">
              All live POIs visible on the interactive GPS map with walking navigation.
            </p>

            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {mapLocations.map((loc) => (
                <div
                  key={loc.id}
                  className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/40 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={loc.image}
                      alt={loc.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <div className="font-bold text-white text-sm">{loc.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {loc.building} ({loc.floor}) • {loc.category}
                      </div>
                      <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                        GPS: {loc.lat || loc.coordinates?.lat}, {loc.lng || loc.coordinates?.lng}
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-700 text-slate-300">
                    {loc.zone}
                  </span>
                </div>
              ))}
            </div>
          </div>
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
