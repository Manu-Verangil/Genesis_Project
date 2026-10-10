import React, { useState, useEffect, useMemo } from 'react';
import {
  ChefHat,
  CheckCircle,
  Clock,
  QrCode,
  ShieldCheck,
  Plus,
  Minus,
  AlertCircle,
  AlertTriangle,
  Bell,
  RefreshCw,
  Sparkles,
  Users,
  Search,
  Check,
  Filter,
  CheckCheck,
  Flame,
  Package,
  Layers,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  Edit2,
  PlusCircle,
  X,
  Save,
  Tag,
  DollarSign
} from 'lucide-react';
import { api } from '../api';

export function StaffPanelView({ canteens, selectedCanteenId, setSelectedCanteenId, onDataUpdated }) {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tokenInput, setTokenInput] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'verify', 'stock'

  // Queue sub-filters
  const [orderStatusFilter, setOrderStatusFilter] = useState('all'); // 'all', 'cooking', 'ready', 'serving'
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Stock sub-filters
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockCategoryFilter, setStockCategoryFilter] = useState('All');

  // Modals for Staff Menu Editing & Creation
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [itemForm, setItemForm] = useState({
    name: '',
    category: 'Main Course',
    price: 60,
    prepTimeMinutes: 4,
    stock: 20,
    isVeg: true,
    description: '',
    imageUrl: ''
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

  const currentCanteen = canteens.find((c) => c.id === selectedCanteenId) || canteens[0];

  const fetchStaffData = async (showLoading = false) => {
    if (showLoading) setIsRefreshing(true);
    try {
      const [ordersRes, menuRes] = await Promise.all([
        api.getOrders({ canteenId: selectedCanteenId }),
        api.getMenu({ canteenId: selectedCanteenId })
      ]);
      if (ordersRes.success) setOrders(ordersRes.data);
      if (menuRes.success) setMenuItems(menuRes.data);
    } catch (err) {
      console.error('Failed to fetch staff data:', err);
    } finally {
      setLoading(false);
      if (showLoading) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStaffData(true);
    const interval = setInterval(() => fetchStaffData(false), 4000);
    return () => clearInterval(interval);
  }, [selectedCanteenId]);

  // Update order status
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await api.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        fetchStaffData(false);
        if (onDataUpdated) onDataUpdated();
      }
    } catch (err) {
      alert('Error updating order: ' + err.message);
    }
  };

  // Verify pickup token
  const handleVerifyToken = async (e) => {
    if (e) e.preventDefault();
    const cleanToken = tokenInput.trim().toUpperCase();
    if (!cleanToken) return;

    try {
      const res = await api.verifyToken(cleanToken, selectedCanteenId);
      setVerificationResult(res);
      if (res.success) {
        setTokenInput('');
        fetchStaffData(false);
        if (onDataUpdated) onDataUpdated();
      }
    } catch (err) {
      setVerificationResult({
        success: false,
        message: err.message || 'Token verification failed. Check code or canteen counter.'
      });
    }
  };

  // Adjust stock quantity
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

  // Toggle in-stock / out-of-stock instantly
  const handleToggleStockStatus = async (item) => {
    const targetStock = item.stock > 0 ? 0 : 15;
    try {
      const res = await api.updateMenuItem(item.id, { stock: targetStock });
      if (res.success) {
        setMenuItems((prev) => prev.map((m) => (m.id === item.id ? { ...m, stock: targetStock } : m)));
        if (onDataUpdated) onDataUpdated();
      }
    } catch (err) {
      alert('Error toggling stock: ' + err.message);
    }
  };

  // Update crowd level
  const handleUpdateCrowd = async (level) => {
    try {
      const res = await api.updateCrowdLevel(selectedCanteenId, level);
      if (res.success) {
        if (onDataUpdated) onDataUpdated();
      }
    } catch (err) {
      alert('Error updating crowd: ' + err.message);
    }
  };

  // Open Edit Modal for an item
  const openEditModal = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      category: item.category || 'Main Course',
      price: item.price,
      prepTimeMinutes: item.prepTimeMinutes || 4,
      stock: item.stock,
      isVeg: item.isVeg,
      description: item.description || '',
      imageUrl: item.imageUrl || ''
    });
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditingItem(null);
    setItemForm({
      name: '',
      category: 'Main Course',
      price: 60,
      prepTimeMinutes: 4,
      stock: 20,
      isVeg: true,
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80'
    });
    setIsAddModalOpen(true);
  };

  // Save Add Item Form
  const handleSaveNewItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name.trim()) return alert('Please enter a dish name');
    try {
      const payload = {
        ...itemForm,
        canteenId: selectedCanteenId,
        price: Number(itemForm.price),
        stock: Number(itemForm.stock),
        prepTimeMinutes: Number(itemForm.prepTimeMinutes),
        popular: false
      };
      const res = await api.addMenuItem(payload);
      if (res.success) {
        setIsAddModalOpen(false);
        fetchStaffData(true);
        if (onDataUpdated) onDataUpdated();
      }
    } catch (err) {
      alert('Error adding dish: ' + err.message);
    }
  };

  // Save Edit Item Form
  const handleSaveEditItem = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const updates = {
        name: itemForm.name,
        category: itemForm.category,
        price: Number(itemForm.price),
        stock: Number(itemForm.stock),
        prepTimeMinutes: Number(itemForm.prepTimeMinutes),
        isVeg: itemForm.isVeg,
        description: itemForm.description,
        imageUrl: itemForm.imageUrl
      };
      const res = await api.updateMenuItem(editingItem.id, updates);
      if (res.success) {
        setEditingItem(null);
        fetchStaffData(true);
        if (onDataUpdated) onDataUpdated();
      }
    } catch (err) {
      alert('Error updating dish: ' + err.message);
    }
  };

  // Filtered orders
  const activeOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'collected');
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return activeOrders.filter((order) => {
      if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) return false;
      if (orderSearchQuery) {
        const query = orderSearchQuery.toLowerCase();
        const matchesToken = order.token?.toLowerCase().includes(query);
        const matchesName = order.studentName?.toLowerCase().includes(query);
        const matchesRoll = order.studentRoll?.toLowerCase().includes(query);
        const matchesItems = order.items?.some((i) => i.name.toLowerCase().includes(query));
        return matchesToken || matchesName || matchesRoll || matchesItems;
      }
      return true;
    });
  }, [activeOrders, orderStatusFilter, orderSearchQuery]);

  // Operational metrics
  const stats = useMemo(() => {
    const cookingCount = activeOrders.filter((o) => o.status === 'cooking').length;
    const readyCount = activeOrders.filter((o) => o.status === 'ready').length;
    const servingCount = activeOrders.filter((o) => o.status === 'serving').length;
    const lowStockCount = menuItems.filter((i) => i.stock <= 5).length;
    return {
      activeTotal: activeOrders.length,
      cooking: cookingCount,
      ready: readyCount,
      serving: servingCount,
      lowStock: lowStockCount
    };
  }, [activeOrders, menuItems]);

  // Filtered menu items for stock view
  const stockCategories = useMemo(() => {
    const cats = new Set(['All']);
    categoriesList.forEach((c) => cats.add(c));
    menuItems.forEach((item) => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats);
  }, [menuItems]);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (stockCategoryFilter !== 'All' && item.category !== stockCategoryFilter) return false;
      if (stockSearchQuery) {
        const q = stockSearchQuery.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.category?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [menuItems, stockCategoryFilter, stockSearchQuery]);

  const getElapsedMinutes = (dateString) => {
    if (!dateString) return 'Just now';
    const diff = Math.floor((new Date() - new Date(dateString)) / 60000);
    if (diff <= 0) return 'Just now';
    if (diff === 1) return '1 min ago';
    return `${diff} mins ago`;
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
          OPERATIONAL CONTROL HEADER & STATION SWITCHER
      ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/5">
              <ChefHat className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Canteen Kitchen & Counter Operations
                </h2>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE KDS TERMINAL</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                Real-time kitchen order dispatch, single-use token verification window, live stock quantities, and instant menu item management.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-center">
            <div className="bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 shadow-inner flex items-center gap-1">
              {canteens.map((c) => {
                const isSelected = selectedCanteenId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCanteenId(c.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 scale-[1.02]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <span>{c.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                        isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {c.id === 'canteen-1' ? 'C1' : 'C2'}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => fetchStaffData(true)}
              disabled={isRefreshing}
              title="Manual Data Sync"
              className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Real-Time Crowd Flow Calibrator */}
        <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-200">Current Counter Crowd Level</span>
              <p className="text-[11px] text-slate-500">
                Calibrates dynamic rush multipliers for student wait-time ETA predictions
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { level: 'Low', hint: '1.0× Speed', color: 'emerald' },
              { level: 'Moderate', hint: '1.2× Speed', color: 'sky' },
              { level: 'Busy', hint: '1.5× Rush', color: 'amber' },
              { level: 'Rush Hour', hint: '2.0× Rush', color: 'rose' }
            ].map(({ level, hint, color }) => {
              const isActive = currentCanteen?.crowdLevel === level;
              return (
                <button
                  key={level}
                  onClick={() => handleUpdateCrowd(level)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    isActive
                      ? color === 'emerald'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-md shadow-emerald-500/20'
                        : color === 'sky'
                        ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold shadow-md shadow-sky-500/20'
                        : color === 'amber'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                        : 'bg-rose-500 text-slate-950 border-rose-400 font-bold shadow-md shadow-rose-500/20'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <span>{level}</span>
                  <span
                    className={`text-[10px] font-mono px-1 rounded ${
                      isActive ? 'bg-black/20 text-slate-950 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {hint}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          OPERATIONAL METRICS RIBBON
      ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-lg backdrop-blur-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total In Kitchen
            </div>
            <div className="text-2xl font-black font-mono text-white mt-0.5">
              {stats.activeTotal}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Pending collection</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-lg backdrop-blur-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Cooking / Prep
            </div>
            <div className="text-2xl font-black font-mono text-amber-400 mt-0.5">
              {stats.cooking}
            </div>
            <div className="text-[10px] text-amber-400/70 mt-0.5 font-medium">In preparation</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-lg backdrop-blur-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Ready At Counter
            </div>
            <div className="text-2xl font-black font-mono text-cyan-400 mt-0.5">
              {stats.ready + stats.serving}
            </div>
            <div className="text-[10px] text-cyan-400/70 mt-0.5 font-medium">Awaiting pickup</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-lg backdrop-blur-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Menu Items
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">
              {menuItems.length}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
              {stats.lowStock > 0 ? `${stats.lowStock} low stock` : 'Active on counter'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          PRIMARY NAVIGATION TABS
      ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
              activeTab === 'orders'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25 font-extrabold'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Active Kitchen Queue</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'orders' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {activeOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('verify')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
              activeTab === 'verify'
                ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-slate-950 shadow-lg shadow-cyan-500/25 font-extrabold'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Pickup Token Scanner</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'verify' ? 'bg-slate-950 text-cyan-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Verify
            </span>
          </button>

          <button
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
              activeTab === 'stock'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/25 font-extrabold'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Menu & Live Stock Management</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'stock' ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {menuItems.length}
            </span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>Polling: 4s</span>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: KITCHEN ORDER DISPLAY (KDS)
      ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All Active', count: activeOrders.length },
                { id: 'cooking', label: 'Cooking', count: stats.cooking },
                { id: 'ready', label: 'Ready', count: stats.ready },
                { id: 'serving', label: 'Serving', count: stats.serving }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setOrderStatusFilter(f.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                    orderStatusFilter === f.id
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-950/60 text-slate-300">
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search token, student or item..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => {
              const isCooking = order.status === 'cooking';
              const isReady = order.status === 'ready';
              const isServing = order.status === 'serving';

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between shadow-xl ${
                    isServing
                      ? 'bg-gradient-to-b from-emerald-950/30 via-slate-900 to-slate-900 border-emerald-500/40 ring-1 ring-emerald-500/20'
                      : isReady
                      ? 'bg-gradient-to-b from-cyan-950/30 via-slate-900 to-slate-900 border-cyan-500/40'
                      : 'bg-slate-900/90 border-slate-800/90 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black font-mono text-white tracking-wider">
                          {order.token}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md">
                          {getElapsedMinutes(order.createdAt)}
                        </span>
                      </div>

                      <div
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 ${
                          isServing
                            ? 'bg-emerald-500 text-slate-950 font-black animate-pulse'
                            : isReady
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {isServing && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                        {isReady && <Bell className="w-3 h-3" />}
                        {isCooking && <Flame className="w-3 h-3" />}
                        <span>{order.status}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <div className="font-bold text-slate-200">{order.studentName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Roll: {order.studentRoll}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/70 space-y-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Kitchen Items ({order.items.reduce((s, i) => s + i.quantity, 0)} total):
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-slate-950/50 px-2.5 py-1.5 rounded-lg text-xs"
                          >
                            <span className="font-semibold text-slate-200 truncate pr-2">
                              {item.name}
                            </span>
                            <span className="font-mono font-black text-amber-400 shrink-0">
                              ×{item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center gap-2">
                    {isCooking && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'ready')}
                        className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-98 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-600/20"
                      >
                        <Bell className="w-4 h-4" />
                        <span>Mark Ready For Pickup</span>
                      </button>
                    )}

                    {isReady && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'serving')}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Hand Over / Serving</span>
                        </button>
                        <button
                          onClick={() => {
                            setTokenInput(order.token);
                            setActiveTab('verify');
                          }}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                          title="Verify token at pickup scanner"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {isServing && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'collected')}
                        className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-emerald-700 active:scale-98 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <CheckCheck className="w-4 h-4 text-emerald-400" />
                        <span>Complete & Collected</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredOrders.length === 0 && (
            <div className="py-20 text-center bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-xl">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">Kitchen Queue Is Caught Up!</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No orders waiting in this status filter. New student orders placed online will appear here automatically.
              </p>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: VERIFY PICKUP TOKEN
      ========================================================================= */}
      {activeTab === 'verify' && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-7 shadow-2xl relative overflow-hidden">
            <div className="text-center pb-5 border-b border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-cyan-500/10">
                <QrCode className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-white">
                Single-Use Pickup Token Verification Window
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Verify the student's digital token or QR code at pickup. Instantly prevents queue jumping and double collections.
              </p>
            </div>

            <form onSubmit={handleVerifyToken} className="mt-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Enter Token Code (e.g. C1-043, C1-047)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. C1-047"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                    className="flex-1 px-4 py-3.5 bg-slate-950 border-2 border-slate-800 rounded-2xl text-white font-mono text-lg font-bold tracking-widest placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition shadow-inner"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs transition shadow-lg shadow-cyan-500/25 flex items-center gap-2 active:scale-98"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Pass</span>
                  </button>
                </div>
              </div>

              {activeOrders.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] text-slate-400 font-semibold mb-2 flex items-center justify-between">
                    <span>Quick Click (Active in Queue):</span>
                    <span className="text-[10px] text-slate-500">Click to fill</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeOrders.slice(0, 6).map((ord) => (
                      <button
                        key={ord.id}
                        type="button"
                        onClick={() => setTokenInput(ord.token)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                          ord.status === 'ready' || ord.status === 'serving'
                            ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>{ord.token}</span>
                        <span className="text-[9px] font-sans font-medium opacity-70">
                          ({ord.status})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>

            {verificationResult && (
              <div
                className={`mt-6 p-5 rounded-2xl border text-xs transition-all duration-300 ${
                  verificationResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100 shadow-xl shadow-emerald-950/30'
                    : 'bg-rose-950/40 border-rose-500/50 text-rose-100 shadow-xl shadow-rose-950/30'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                      verificationResult.success
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {verificationResult.success ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm">
                        {verificationResult.success
                          ? 'Token Verified & Order Handed Over! 🎉'
                          : 'Token Verification Failed'}
                      </h4>
                      <span className="text-[10px] font-mono opacity-60">
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed opacity-90">
                      {verificationResult.message}
                    </p>

                    {verificationResult.data && (
                      <div className="mt-4 pt-3 border-t border-emerald-800/60 space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-emerald-900/30 p-2 rounded-lg">
                            <span className="text-[10px] text-emerald-300 block">Student</span>
                            <span className="font-bold text-white">
                              {verificationResult.data.studentName}
                            </span>
                          </div>
                          <div className="bg-emerald-900/30 p-2 rounded-lg">
                            <span className="text-[10px] text-emerald-300 block">Roll Number</span>
                            <span className="font-mono font-bold text-white">
                              {verificationResult.data.studentRoll}
                            </span>
                          </div>
                        </div>

                        <div className="bg-emerald-900/20 p-2.5 rounded-lg">
                          <span className="text-[10px] text-emerald-300 block mb-1">
                            Dispatched Items:
                          </span>
                          <div className="font-semibold text-emerald-200">
                            {verificationResult.data.items
                              .map((i) => `${i.name} (×${i.quantity})`)
                              .join(', ')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: MENU & LIVE STOCK MANAGEMENT (STAFF CAN ADD & EDIT ITEMS)
      ========================================================================= */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          {/* Header Controls: Categories, Search, and Add Item Button */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-400" />
                  <span>Live Kitchen Stock & Menu Editor</span>
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {filteredMenuItems.length} Items Listed
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Staff can adjust real-time stock, update item details, or add new items directly to the canteen menu!
              </p>
            </div>

            {/* Actions: Add New Item Button, Category Filter & Search */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={openAddModal}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 active:scale-98"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Item to Menu</span>
              </button>

              <div className="relative min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter dishes..."
                  value={stockSearchQuery}
                  onChange={(e) => setStockSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/60 p-2 rounded-2xl border border-slate-800/80">
            {stockCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setStockCategoryFilter(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                  stockCategoryFilter === cat
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMenuItems.map((item) => {
              const isOutOfStock = item.stock <= 0;
              const isLowStock = item.stock > 0 && item.stock <= 5;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 shadow-lg flex flex-col justify-between ${
                    isOutOfStock
                      ? 'bg-rose-950/20 border-rose-500/40 ring-1 ring-rose-500/20'
                      : isLowStock
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-slate-900/90 border-slate-800/80 hover:border-slate-700'
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
                        className="w-16 h-16 rounded-xl object-cover border border-slate-800 shrink-0"
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

                          {/* Quick Edit Item Button */}
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition shrink-0"
                            title="Edit dish details & price"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
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
                            {isOutOfStock ? (
                              <>
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span>Out of stock</span>
                              </>
                            ) : isLowStock ? (
                              <>
                                <AlertCircle className="w-2.5 h-2.5" />
                                <span>Low: {item.stock} left</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-2.5 h-2.5" />
                                <span>In stock ({item.stock})</span>
                              </>
                            )}
                          </span>

                          {/* Instant In/Out toggle */}
                          <button
                            onClick={() => handleToggleStockStatus(item)}
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

                  {/* Stock Quantity Adjuster & Quick Batch Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                      <button
                        onClick={() => handleAdjustStock(item, -1)}
                        title="Reduce 1"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="font-mono font-black text-sm text-white px-2.5 min-w-[2.5rem] text-center">
                        {item.stock}
                      </span>

                      <button
                        onClick={() => handleAdjustStock(item, 1)}
                        title="Add 1"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAdjustStock(item, 5)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 text-xs font-mono font-bold transition border border-slate-700"
                        title="Restock +5 portions"
                      >
                        +5
                      </button>
                      <button
                        onClick={() => handleAdjustStock(item, 15)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 hover:text-white text-emerald-300 text-xs font-mono font-bold transition border border-emerald-500/30"
                        title="Restock +15 portions"
                      >
                        +15
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredMenuItems.length === 0 && (
            <div className="py-16 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-3xl text-xs">
              No menu items found matching the selected filter.
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW FOOD ITEM TO MENU (STAFF)
      ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Add New Dish to Menu</h3>
                  <p className="text-xs text-slate-400">Adding to {currentCanteen?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Dish Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mushroom Fried Rice"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Category *</label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
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
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
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
                    value={itemForm.stock}
                    onChange={(e) => setItemForm({ ...itemForm, stock: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Est. Prep Time (Mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={itemForm.prepTimeMinutes}
                    onChange={(e) => setItemForm({ ...itemForm, prepTimeMinutes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Food Type</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setItemForm({ ...itemForm, isVeg: true })}
                    className={`flex-1 py-2 rounded-xl font-bold border transition flex items-center justify-center gap-2 ${
                      itemForm.isVeg
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Pure Veg</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setItemForm({ ...itemForm, isVeg: false })}
                    className={`flex-1 py-2 rounded-xl font-bold border transition flex items-center justify-center gap-2 ${
                      !itemForm.isVeg
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span>Non-Veg</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Image URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={itemForm.imageUrl}
                  onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Short Description</label>
                <textarea
                  rows="2"
                  placeholder="Freshly prepared with..."
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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
          MODAL: EDIT EXISTING FOOD ITEM (STAFF)
      ========================================================================= */}
      {editingItem && (
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
                onClick={() => setEditingItem(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditItem} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Dish Name</label>
                <input
                  type="text"
                  required
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Category</label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
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
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
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
                    value={itemForm.stock}
                    onChange={(e) => setItemForm({ ...itemForm, stock: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Prep Time (Mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={itemForm.prepTimeMinutes}
                    onChange={(e) => setItemForm({ ...itemForm, prepTimeMinutes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Food Type</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setItemForm({ ...itemForm, isVeg: true })}
                    className={`flex-1 py-2 rounded-xl font-bold border transition flex items-center justify-center gap-2 ${
                      itemForm.isVeg
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Pure Veg</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setItemForm({ ...itemForm, isVeg: false })}
                    className={`flex-1 py-2 rounded-xl font-bold border transition flex items-center justify-center gap-2 ${
                      !itemForm.isVeg
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span>Non-Veg</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Image URL</label>
                <input
                  type="text"
                  value={itemForm.imageUrl}
                  onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
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
  );
}
