import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Search,
  MapPin,
  Plus,
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
  PlusCircle,
  Upload,
  Link,
  Minus,
  Package,
  Flame,
  Store,
  Utensils,
  ChefHat,
  Trash2
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

  // Admin Canteen & Menu Management States
  const [adminSelectedCanteenId, setAdminSelectedCanteenId] = useState(
    canteens?.[0]?.id || 'canteen-1'
  );
  const [canteenFilterCategory, setCanteenFilterCategory] = useState('All');
  const [canteenSearchQuery, setCanteenSearchQuery] = useState('');

  // Modals for Canteen & Dish Operations
  const [isCreateCanteenModalOpen, setIsCreateCanteenModalOpen] = useState(false);
  const [isAddDishModalOpen, setIsAddDishModalOpen] = useState(false);
  const [isEditDishModalOpen, setIsEditDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);

  // Forms
  const [dishForm, setDishForm] = useState({
    name: '',
    category: 'Main Course',
    price: 60,
    prepTimeMinutes: 4,
    stock: 20,
    isVeg: true,
    description: '',
    imageUrl: ''
  });
  const [dishImageMode, setDishImageMode] = useState('upload'); // 'upload' | 'url'
  const adminAddDishFileRef = useRef(null);
  const adminEditDishFileRef = useRef(null);

  const [canteenForm, setCanteenForm] = useState({
    name: '',
    code: '',
    location: '',
    timings: '08:00 AM - 10:00 PM',
    counterSpeed: 'Fast',
    crowdLevel: 'Low',
    avgWaitTimeMinutes: 5,
    seedStarterMenu: true
  });

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

  // Admin image file upload handler
  const handleAdminImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size exceeds 5MB. Please choose a smaller file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setDishForm((prev) => ({ ...prev, imageUrl: loadEvt.target.result }));
    };
    reader.readAsDataURL(file);
  };

  // Open Create Canteen Modal
  const openCreateCanteenModal = () => {
    setCanteenForm({
      name: '',
      code: '',
      location: '',
      timings: '08:00 AM - 10:00 PM',
      counterSpeed: 'Fast',
      crowdLevel: 'Low',
      avgWaitTimeMinutes: 5,
      seedStarterMenu: true
    });
    setIsCreateCanteenModalOpen(true);
  };

  // Save New Canteen / Store Outlet
  const handleSaveNewCanteen = async (e) => {
    e.preventDefault();
    if (!canteenForm.name.trim()) return alert('Please enter a canteen or store name');
    try {
      const canteenId = `canteen-${Date.now()}`;
      const payload = {
        id: canteenId,
        name: canteenForm.name.trim(),
        code: canteenForm.code.trim().toUpperCase() || `C${(canteens || []).length + 1}`,
        location: canteenForm.location.trim() || 'Amrita Campus Quadrangle',
        timings: canteenForm.timings || '08:00 AM - 10:00 PM',
        status: 'open',
        crowdLevel: canteenForm.crowdLevel || 'Low',
        avgWaitTimeMinutes: Number(canteenForm.avgWaitTimeMinutes) || 5,
        activeOrdersCount: 0,
        counterSpeed: canteenForm.counterSpeed || 'Fast'
      };

      const res = await api.addCanteen(payload);
      if (res.success) {
        // Auto-seed starter menu if requested
        if (canteenForm.seedStarterMenu) {
          const starterTemplates = [
            { name: "Kumbakonam Filter Coffee", cat: "Hot Drinks", price: 20, prep: 2, veg: true, img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80", desc: "Fresh decoction chicory brewed coffee with frothy milk." },
            { name: "Special Cardamom Tea", cat: "Hot Drinks", price: 15, prep: 2, veg: true, img: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80", desc: "Aromatic black tea infused with fresh cardamom pods." },
            { name: "Ghee Roast Dosa", cat: "Main Course", price: 70, prep: 4, veg: true, img: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=80", desc: "Crispy crepe roasted in pure cow ghee with coconut chutney & sambar." },
            { name: "Paneer Butter Masala", cat: "Curries", price: 95, prep: 4, veg: true, img: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80", desc: "Soft cottage cheese simmered in rich creamy tomato butter gravy." },
            { name: "South Indian Special Meals", cat: "Main Course", price: 85, prep: 3, veg: true, img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80", desc: "Steamed ponni rice, sambar, rasam, kootu, poriyal, papad & curd." },
            { name: "Veg Fried Rice", cat: "Main Course", price: 110, prep: 5, veg: true, img: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&auto=format&fit=crop&q=80", desc: "Wok-tossed fragrant basmati rice with crunchy seasonal veggies." },
            { name: "Egg Roast Dosa", cat: "Egg Items", price: 65, prep: 4, veg: false, img: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=80", desc: "Crisp dosa layered with spicy egg masala roast & pepper." },
            { name: "Double Egg Omelette", cat: "Egg Items", price: 35, prep: 3, veg: false, img: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=80", desc: "Country-style two-egg fluffy omelette with onions and green chillies." },
            { name: "Crispy Veg Samosa (2 pcs)", cat: "Bakes & Snacks", price: 30, prep: 1, veg: true, img: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=80", desc: "Golden flaky triangles stuffed with spiced cumin potato & peas." },
            { name: "Fresh Lime Soda", cat: "Juices & Milkshakes", price: 30, prep: 2, veg: true, img: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=80", desc: "Chilled sparkling soda with freshly squeezed lime and mint." },
            { name: "Oreo Thickshake", cat: "Juices & Milkshakes", price: 75, prep: 3, veg: true, img: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=500&auto=format&fit=crop&q=80", desc: "Blended vanilla ice cream, whole milk, and crushed Oreo cookies." },
            { name: "Butterscotch Scoop", cat: "Ice Creams", price: 45, prep: 1, veg: true, img: "https://images.unsplash.com/photo-1549395156-e0c1fe6fc7a5?w=500&auto=format&fit=crop&q=80", desc: "Creamy butterscotch ice cream with crunchy praline crunch." }
          ];

          for (const t of starterTemplates) {
            await api.addMenuItem({
              canteenId: canteenId,
              name: t.name,
              category: t.cat,
              price: t.price,
              prepTimeMinutes: t.prep,
              stock: 25,
              isVeg: t.veg,
              description: t.desc,
              imageUrl: t.img,
              popular: true
            });
          }
        }

        setIsCreateCanteenModalOpen(false);
        setAdminSelectedCanteenId(canteenId);
        await fetchAdminData();
        if (onDataUpdated) onDataUpdated();
        alert(`Success! "${payload.name}" has been added with all full facilities (ordering, live queue, stock, staff terminal)!`);
      }
    } catch (err) {
      alert('Error creating canteen: ' + err.message);
    }
  };

  // Open Add Dish Modal
  const openAddDishModal = () => {
    setEditingDish(null);
    setDishImageMode('upload');
    setDishForm({
      name: '',
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

  // Save New Dish
  const handleSaveNewDish = async (e) => {
    e.preventDefault();
    if (!dishForm.name.trim()) return alert('Please enter a dish name');
    try {
      const fallback = dishForm.isVeg
        ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=80';
      const payload = {
        canteenId: adminSelectedCanteenId,
        name: dishForm.name.trim(),
        category: dishForm.category,
        price: Number(dishForm.price),
        stock: Number(dishForm.stock),
        prepTimeMinutes: Number(dishForm.prepTimeMinutes),
        isVeg: dishForm.isVeg,
        description: dishForm.description,
        imageUrl: dishForm.imageUrl?.trim() || fallback,
        popular: false
      };
      const res = await api.addMenuItem(payload);
      if (res.success) {
        setIsAddDishModalOpen(false);
        await fetchAdminData();
        if (onDataUpdated) onDataUpdated();
      }
    } catch (err) {
      alert('Error adding dish: ' + err.message);
    }
  };

  // Open Edit Dish Modal
  const openEditDishModal = (dish) => {
    setEditingDish(dish);
    const isUpload = dish.imageUrl?.startsWith('data:');
    setDishImageMode(isUpload ? 'upload' : (dish.imageUrl ? 'url' : 'upload'));
    setDishForm({
      name: dish.name,
      category: dish.category || 'Main Course',
      price: dish.price,
      prepTimeMinutes: dish.prepTimeMinutes || 4,
      stock: dish.stock,
      isVeg: dish.isVeg,
      description: dish.description || '',
      imageUrl: dish.imageUrl || ''
    });
    setIsEditDishModalOpen(true);
  };

  // Save Edit Dish
  const handleSaveEditDish = async (e) => {
    e.preventDefault();
    if (!editingDish) return;
    try {
      const fallback = dishForm.isVeg
        ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=80';
      const updates = {
        name: dishForm.name.trim(),
        category: dishForm.category,
        price: Number(dishForm.price),
        stock: Number(dishForm.stock),
        prepTimeMinutes: Number(dishForm.prepTimeMinutes),
        isVeg: dishForm.isVeg,
        description: dishForm.description,
        imageUrl: dishForm.imageUrl?.trim() || fallback
      };
      const res = await api.updateMenuItem(editingDish.id, updates);
      if (res.success) {
        setEditingDish(null);
        setIsEditDishModalOpen(false);
        await fetchAdminData();
        if (onDataUpdated) onDataUpdated();
      }
    } catch (err) {
      alert('Error updating dish: ' + err.message);
    }
  };

  // Adjust stock count
  const handleAdjustStock = async (item, delta) => {
    const newStock = Math.max(0, item.stock + delta);
    try {
      const res = await api.updateMenuItem(item.id, { stock: newStock });
      if (res.success) {
        setMenuItems((prev) => prev.map((m) => (m.id === item.id ? { ...m, stock: newStock } : m)));
        if (onDataUpdated) onDataUpdated();
      }
    } catch (err) {
      alert('Error adjusting stock: ' + err.message);
    }
  };

  // Toggle in-stock / out-of-stock
  const handleToggleStock = async (item) => {
    const target = item.stock > 0 ? 0 : 15;
    try {
      const res = await api.updateMenuItem(item.id, { stock: target });
      if (res.success) {
        setMenuItems((prev) => prev.map((m) => (m.id === item.id ? { ...m, stock: target } : m)));
        if (onDataUpdated) onDataUpdated();
      }
    } catch (err) {
      alert('Error toggling stock: ' + err.message);
    }
  };

  // Delete dish from catalog
  const handleDeleteDish = async (item) => {
    if (!window.confirm(`Are you sure you want to remove "${item.name}" from the menu catalog?`)) return;
    try {
      const res = await api.deleteMenuItem(item.id);
      if (res.success) {
        setMenuItems((prev) => prev.filter((m) => m.id !== item.id));
        if (onDataUpdated) onDataUpdated();
      }
    } catch (err) {
      alert('Error deleting dish: ' + err.message);
    }
  };

  // Update Canteen Crowd Level
  const handleUpdateCrowd = async (canteenId, level) => {
    try {
      const res = await api.updateCrowdLevel(canteenId, level);
      if (res.success) {
        fetchAdminData();
        if (onDataUpdated) onDataUpdated();
      }
    } catch (err) {
      alert('Error updating crowd: ' + err.message);
    }
  };

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
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'menu'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Menu Management
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

      {/* TAB 4: CANTEEN & MENU MANAGEMENT (ADMIN) */}
      {activeTab === 'menu' && (
        <div className="space-y-5">
          {/* Top Bar: Canteen Switcher & Action Buttons */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-white">
                      Canteen & Food Outlet Operations
                    </h4>
                    <p className="text-xs text-slate-400">
                      Manage menus across campus canteens or launch new food stores with full ordering facilities.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions: Create Canteen & Add Dish */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={openCreateCanteenModal}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 active:scale-98"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create New Canteen / Store</span>
                </button>

                <button
                  type="button"
                  onClick={openAddDishModal}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs transition shadow-lg shadow-emerald-600/30 flex items-center gap-2 active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Dish to Menu</span>
                </button>
              </div>
            </div>

            {/* Canteen Selector Pills */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Outlets:
              </span>
              {(canteens || []).map((c) => {
                const isSelected = (adminSelectedCanteenId || canteens?.[0]?.id) === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setAdminSelectedCanteenId(c.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                      isSelected
                        ? 'bg-white text-slate-950 shadow-md font-extrabold scale-[1.02]'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <span>{c.name}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                        isSelected ? 'bg-slate-950 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {c.code || (c.id === 'canteen-1' ? 'C1' : c.id === 'canteen-2' ? 'C2' : c.id === 'canteen-3' ? 'C3' : 'IT')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Canteen Status & Crowd Calibrator */}
          {(() => {
            const currentCanteen =
              (canteens || []).find((c) => c.id === (adminSelectedCanteenId || canteens?.[0]?.id)) ||
              (canteens || [])[0];
            if (!currentCanteen) return null;

            const cDishes = menuItems.filter((i) => i.canteenId === currentCanteen.id);
            const inStockCount = cDishes.filter((i) => i.stock > 0).length;
            const outOfStockCount = cDishes.filter((i) => i.stock <= 0).length;

            return (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-base text-white">{currentCanteen.name}</h4>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                        {currentCanteen.status || 'open'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {currentCanteen.location} • Timings: {currentCanteen.timings} • Service: {currentCanteen.counterSpeed || 'Fast'}
                    </p>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Dishes</span>
                      <span className="text-sm font-black font-mono text-white">{cDishes.length}</span>
                    </div>
                    <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">In Stock</span>
                      <span className="text-sm font-black font-mono text-emerald-400">{inStockCount}</span>
                    </div>
                    <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Out of Stock</span>
                      <span className="text-sm font-black font-mono text-rose-400">{outOfStockCount}</span>
                    </div>
                  </div>
                </div>

                {/* Real-Time Crowd Calibration Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Calibrate Live Crowd Level:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {['Low', 'Moderate', 'Busy', 'Rush Hour'].map((lvl) => {
                      const isActive = currentCanteen.crowdLevel === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => handleUpdateCrowd(currentCanteen.id, lvl)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                              : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                          }`}
                        >
                          <span>{lvl}</span>
                          {isActive && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['All', ...categoriesList].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCanteenFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    canteenFilterCategory === cat
                      ? 'bg-indigo-600 text-white font-bold shadow-md'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search dishes..."
                value={canteenSearchQuery}
                onChange={(e) => setCanteenSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Dishes Grid */}
          {(() => {
            const activeId = adminSelectedCanteenId || canteens?.[0]?.id || 'canteen-1';
            const dishes = menuItems.filter((item) => {
              if (item.canteenId !== activeId) return false;
              if (canteenFilterCategory !== 'All' && item.category !== canteenFilterCategory) return false;
              if (canteenSearchQuery) {
                const q = canteenSearchQuery.toLowerCase();
                return item.name.toLowerCase().includes(q) || item.category?.toLowerCase().includes(q);
              }
              return true;
            });

            if (dishes.length === 0) {
              return (
                <div className="py-16 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-3xl">
                  <Package className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
                  <p className="font-bold text-sm text-slate-300">No dishes in this canteen yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Click "+ Add Dish to Menu" to start offering food at this outlet!
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dishes.map((item) => {
                  const isOutOfStock = item.stock <= 0;
                  const isLowStock = item.stock > 0 && item.stock <= 5;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-3xl border transition-all duration-200 shadow-xl flex flex-col justify-between ${
                        isOutOfStock
                          ? 'bg-rose-950/20 border-rose-500/40 ring-1 ring-rose-500/20'
                          : isLowStock
                          ? 'bg-amber-950/20 border-amber-500/40'
                          : 'bg-slate-900/90 border-slate-800/90 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-start gap-3.5">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = item.isVeg
                                ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80'
                                : 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=80';
                            }}
                            className="w-16 h-16 rounded-2xl object-cover border border-slate-800 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1.5 truncate">
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    item.isVeg ? 'bg-emerald-400' : 'bg-rose-400'
                                  }`}
                                />
                                <h4 className="font-bold text-sm text-white truncate">{item.name}</h4>
                              </div>

                              {/* Edit & Delete Action Buttons */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditDishModal(item)}
                                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition"
                                  title="Edit dish details"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDish(item)}
                                  className="p-1 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                                  title="Delete dish"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {item.category} • <span className="font-mono font-bold text-slate-200">₹{item.price}</span>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                  isOutOfStock
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                                    : isLowStock
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                {isOutOfStock ? 'Out of stock' : `${item.stock} in stock`}
                              </span>

                              {/* Quick in/out toggle */}
                              <button
                                type="button"
                                onClick={() => handleToggleStock(item)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition ${
                                  isOutOfStock
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                                    : 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25'
                                }`}
                              >
                                {isOutOfStock ? 'Make In Stock' : 'Mark Out'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stock Quantity Adjuster */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(item, -1)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono font-black text-sm text-white px-2 min-w-[2rem] text-center">
                            {item.stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(item, 1)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(item, 5)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 text-xs font-mono font-bold transition border border-slate-700"
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(item, 15)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 hover:text-white text-emerald-300 text-xs font-mono font-bold transition border border-emerald-500/30"
                          >
                            +15
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* =========================================================================
              MODAL 1: CREATE NEW CANTEEN / STORE OUTLET (ADMIN)
          ========================================================================= */}
          {isCreateCanteenModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-white">
                        Create New Canteen / Store Outlet
                      </h3>
                      <p className="text-xs text-slate-400">
                        Adds a fully functional food court or outlet across campus
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreateCanteenModalOpen(false)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveNewCanteen} className="mt-5 space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Outlet / Canteen Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amrita Fresh Bakery & Juice Lounge"
                      value={canteenForm.name}
                      onChange={(e) => setCanteenForm({ ...canteenForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">Short Badge / Code</label>
                      <input
                        type="text"
                        placeholder="e.g. BK, JL, C4"
                        value={canteenForm.code}
                        onChange={(e) => setCanteenForm({ ...canteenForm, code: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase focus:outline-none focus:border-indigo-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">Counter Speed</label>
                      <select
                        value={canteenForm.counterSpeed}
                        onChange={(e) => setCanteenForm({ ...canteenForm, counterSpeed: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-medium"
                      >
                        <option value="Fast">Fast (~3-5 mins)</option>
                        <option value="Normal">Normal (~8-10 mins)</option>
                        <option value="Express">Express Snack Counter</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Campus Location / Zone *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. South Academic Quad, Adjacent to AB-4"
                      value={canteenForm.location}
                      onChange={(e) => setCanteenForm({ ...canteenForm, location: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">Operating Timings</label>
                      <input
                        type="text"
                        placeholder="08:00 AM - 10:00 PM"
                        value={canteenForm.timings}
                        onChange={(e) => setCanteenForm({ ...canteenForm, timings: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">Initial Crowd Level</label>
                      <select
                        value={canteenForm.crowdLevel}
                        onChange={(e) => setCanteenForm({ ...canteenForm, crowdLevel: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-medium"
                      >
                        <option value="Low">Low</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Busy">Busy</option>
                        <option value="Rush Hour">Rush Hour</option>
                      </select>
                    </div>
                  </div>

                  {/* Starter Menu Checkbox */}
                  <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="seedStarterMenu"
                      checked={canteenForm.seedStarterMenu}
                      onChange={(e) => setCanteenForm({ ...canteenForm, seedStarterMenu: e.target.checked })}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-0"
                    />
                    <label htmlFor="seedStarterMenu" className="cursor-pointer text-slate-200">
                      <span className="font-bold block text-xs">Auto-seed starter campus menu (12 dishes)</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5 leading-relaxed">
                        Instantly populates this new canteen with Filter Coffee, Tea, Samosa, Puff, Dosa, Meals, Juices, and Ice Creams so students can order right away!
                      </span>
                    </label>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateCanteenModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold transition shadow-lg shadow-indigo-600/30"
                    >
                      Launch Canteen / Store
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODAL 2: ADD NEW DISH (ADMIN - WITH SYSTEM FILE UPLOAD & URL)
          ========================================================================= */}
          {isAddDishModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <PlusCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-white">Add New Dish to Menu</h3>
                      <p className="text-xs text-slate-400">
                        Adding dish to{' '}
                        {(canteens || []).find((c) => c.id === adminSelectedCanteenId)?.name || 'Canteen'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddDishModalOpen(false)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveNewDish} className="mt-5 space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Dish Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chettinad Paneer Wrap"
                      value={dishForm.name}
                      onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">Category *</label>
                      <select
                        value={dishForm.category}
                        onChange={(e) => setDishForm({ ...dishForm, category: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-medium"
                      >
                        {categoriesList.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">Price (₹) *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={dishForm.price}
                        onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">Initial Stock Count</label>
                      <input
                        type="number"
                        min="0"
                        value={dishForm.stock}
                        onChange={(e) => setDishForm({ ...dishForm, stock: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">Est. Prep Time (Mins)</label>
                      <input
                        type="number"
                        min="1"
                        value={dishForm.prepTimeMinutes}
                        onChange={(e) => setDishForm({ ...dishForm, prepTimeMinutes: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Food Type</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setDishForm({ ...dishForm, isVeg: true })}
                        className={`flex-1 py-2 rounded-xl font-bold border transition flex items-center justify-center gap-2 ${
                          dishForm.isVeg
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Pure Veg</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDishForm({ ...dishForm, isVeg: false })}
                        className={`flex-1 py-2 rounded-xl font-bold border transition flex items-center justify-center gap-2 ${
                          !dishForm.isVeg
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        <span>Non-Veg</span>
                      </button>
                    </div>
                  </div>

                  {/* Dual Image Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300 font-bold">Dish Image</label>
                      <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setDishImageMode('upload')}
                          className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                            dishImageMode === 'upload'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload from System</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDishImageMode('url')}
                          className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                            dishImageMode === 'url'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Link className="w-3 h-3" />
                          <span>Image URL</span>
                        </button>
                      </div>
                    </div>

                    {dishImageMode === 'upload' ? (
                      <div>
                        <input
                          ref={adminAddDishFileRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAdminImageUpload}
                          className="hidden"
                        />
                        <div
                          onClick={() => adminAddDishFileRef.current?.click()}
                          className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group ${
                            dishForm.imageUrl
                              ? 'border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-950/30'
                              : 'border-slate-800 bg-slate-950/70 hover:border-emerald-500/50 hover:bg-slate-950'
                          }`}
                        >
                          {dishForm.imageUrl ? (
                            <div className="flex items-center gap-3.5 w-full">
                              <img
                                src={dishForm.imageUrl}
                                alt="Selected"
                                className="w-16 h-16 rounded-xl object-cover border border-emerald-500/40 shrink-0 shadow-md"
                              />
                              <div className="text-left flex-1 min-w-0">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                                  ✓ Image Loaded From Device
                                </span>
                                <span className="text-xs text-slate-200 truncate block mt-0.5 font-medium">
                                  Click to choose another photo
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDishForm((prev) => ({ ...prev, imageUrl: '' }));
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition duration-200">
                                <Upload className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-200 text-xs block">
                                  Upload photo from your system / device
                                </span>
                                <span className="text-[11px] text-slate-500 block mt-0.5">
                                  Click here to browse files (PNG, JPG, WEBP up to 5MB)
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Paste direct web image link: https://..."
                            value={dishForm.imageUrl}
                            onChange={(e) => setDishForm({ ...dishForm, imageUrl: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                          />
                          {dishForm.imageUrl && (
                            <img
                              src={dishForm.imageUrl}
                              alt="Preview"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80';
                              }}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-800 shrink-0"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Short Description</label>
                    <textarea
                      rows="2"
                      placeholder="Ingredients, accompaniments..."
                      value={dishForm.description}
                      onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddDishModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold transition shadow-lg shadow-emerald-500/20"
                    >
                      Save Dish to Menu
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODAL 3: EDIT EXISTING DISH (ADMIN)
          ========================================================================= */}
          {isEditDishModalOpen && editingDish && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                      <Edit2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-white">Edit Dish Details</h3>
                      <p className="text-xs text-slate-400">Update pricing, category or quantity</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditDishModalOpen(false);
                      setEditingDish(null);
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditDish} className="mt-5 space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Dish Name</label>
                    <input
                      type="text"
                      required
                      value={dishForm.name}
                      onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">Category</label>
                      <select
                        value={dishForm.category}
                        onChange={(e) => setDishForm({ ...dishForm, category: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-medium"
                      >
                        {categoriesList.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">Price (₹)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={dishForm.price}
                        onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">Available Stock</label>
                      <input
                        type="number"
                        min="0"
                        value={dishForm.stock}
                        onChange={(e) => setDishForm({ ...dishForm, stock: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">Prep Time (Mins)</label>
                      <input
                        type="number"
                        min="1"
                        value={dishForm.prepTimeMinutes}
                        onChange={(e) => setDishForm({ ...dishForm, prepTimeMinutes: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Food Type</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setDishForm({ ...dishForm, isVeg: true })}
                        className={`flex-1 py-2 rounded-xl font-bold border transition flex items-center justify-center gap-2 ${
                          dishForm.isVeg
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Pure Veg</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDishForm({ ...dishForm, isVeg: false })}
                        className={`flex-1 py-2 rounded-xl font-bold border transition flex items-center justify-center gap-2 ${
                          !dishForm.isVeg
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        <span>Non-Veg</span>
                      </button>
                    </div>
                  </div>

                  {/* Dual Image Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300 font-bold">Dish Image</label>
                      <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setDishImageMode('upload')}
                          className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                            dishImageMode === 'upload'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload from System</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDishImageMode('url')}
                          className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                            dishImageMode === 'url'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Link className="w-3 h-3" />
                          <span>Image URL</span>
                        </button>
                      </div>
                    </div>

                    {dishImageMode === 'upload' ? (
                      <div>
                        <input
                          ref={adminEditDishFileRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAdminImageUpload}
                          className="hidden"
                        />
                        <div
                          onClick={() => adminEditDishFileRef.current?.click()}
                          className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group ${
                            dishForm.imageUrl
                              ? 'border-cyan-500/40 bg-cyan-950/20 hover:bg-cyan-950/30'
                              : 'border-slate-800 bg-slate-950/70 hover:border-cyan-500/50 hover:bg-slate-950'
                          }`}
                        >
                          {dishForm.imageUrl ? (
                            <div className="flex items-center gap-3.5 w-full">
                              <img
                                src={dishForm.imageUrl}
                                alt="Selected"
                                className="w-16 h-16 rounded-xl object-cover border border-cyan-500/40 shrink-0 shadow-md"
                              />
                              <div className="text-left flex-1 min-w-0">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 block">
                                  ✓ Dish Photo Selected
                                </span>
                                <span className="text-xs text-slate-200 truncate block mt-0.5 font-medium">
                                  Click to choose another photo
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDishForm((prev) => ({ ...prev, imageUrl: '' }));
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition duration-200">
                                <Upload className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-200 text-xs block">
                                  Upload photo from your system / device
                                </span>
                                <span className="text-[11px] text-slate-500 block mt-0.5">
                                  Click here to browse files (PNG, JPG, WEBP up to 5MB)
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Paste direct web image link: https://..."
                            value={dishForm.imageUrl}
                            onChange={(e) => setDishForm({ ...dishForm, imageUrl: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                          />
                          {dishForm.imageUrl && (
                            <img
                              src={dishForm.imageUrl}
                              alt="Preview"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80';
                              }}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-800 shrink-0"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Short Description</label>
                    <textarea
                      rows="2"
                      value={dishForm.description}
                      onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditDishModalOpen(false);
                        setEditingDish(null);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold transition shadow-lg shadow-cyan-500/20"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
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
    </div>
  );
}
