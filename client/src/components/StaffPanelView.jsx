import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ArrowLeft,
  TrendingUp,
  SlidersHorizontal,
  Edit2,
  PlusCircle,
  X,
  Save,
  Tag,
  DollarSign,
  Upload,
  Link,
  Image as ImageIcon,
  Zap,
  Trash2
} from 'lucide-react';
import { api } from '../api';

export function StaffPanelView({ canteens, selectedCanteenId, setSelectedCanteenId, onDataUpdated, currentRole = 'staff', onGoBack }) {
  const isCook = currentRole === 'cook';
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tokenInput, setTokenInput] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(isCook ? 'orders' : 'stock');

  useEffect(() => {
    setActiveTab(isCook ? 'orders' : 'stock');
    if (!isCook) {
      setOrderStatusFilter('ready');
    } else {
      setOrderStatusFilter('all');
    }
  }, [currentRole, isCook]);

  // Queue sub-filters
  const [orderStatusFilter, setOrderStatusFilter] = useState('all'); // 'all', 'cooking', 'ready', 'serving'
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Stock sub-filters
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockCategoryFilter, setStockCategoryFilter] = useState('All');

  // Modals for Staff Menu Editing & Creation
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [imageSourceMode, setImageSourceMode] = useState('upload'); // 'upload' or 'url'
  const addFileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

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

  // Delete menu item (Staff only)
  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to remove "${item.name}" from the menu?`)) return;
    try {
      const res = await api.deleteMenuItem(item.id);
      if (res && res.success) {
        setMenuItems((prev) => prev.filter((m) => m.id !== item.id));
        if (onDataUpdated) onDataUpdated();
      }
    } catch (err) {
      alert('Error deleting item: ' + err.message);
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

  // Handle image file upload from local system
  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size exceeds 5MB. Please choose a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setItemForm((prev) => ({ ...prev, imageUrl: loadEvent.target.result }));
    };
    reader.readAsDataURL(file);
  };

  // Open Edit Modal for an item
  const openEditModal = (item) => {
    setEditingItem(item);
    const isUploadedData = item.imageUrl && item.imageUrl.startsWith('data:');
    setImageSourceMode(isUploadedData ? 'upload' : (item.imageUrl ? 'url' : 'upload'));
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
    setImageSourceMode('upload');
    setItemForm({
      name: '',
      category: 'Main Course',
      price: 60,
      prepTimeMinutes: 4,
      stock: 20,
      isVeg: true,
      description: '',
      imageUrl: ''
    });
    setIsAddModalOpen(true);
  };

  // Save Add Item Form
  const handleSaveNewItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name.trim()) return alert('Please enter a dish name');
    try {
      const defaultFallback = itemForm.isVeg
        ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=80';
      const payload = {
        ...itemForm,
        imageUrl: itemForm.imageUrl?.trim() || defaultFallback,
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
      const defaultFallback = itemForm.isVeg
        ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=80';
      const updates = {
        name: itemForm.name,
        category: itemForm.category,
        price: Number(itemForm.price),
        stock: Number(itemForm.stock),
        prepTimeMinutes: Number(itemForm.prepTimeMinutes),
        isVeg: itemForm.isVeg,
        description: itemForm.description,
        imageUrl: itemForm.imageUrl?.trim() || defaultFallback
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
    const list = activeOrders.filter((order) => {
      if (orderStatusFilter === 'faculty_priority') {
        return order.isPriority || order.isFaculty;
      }
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

    return [...list].sort((a, b) => {
      const aPri = a.isPriority || a.isFaculty;
      const bPri = b.isPriority || b.isFaculty;
      if (aPri && !bPri) return -1;
      if (!aPri && bPri) return 1;
      return 0;
    });
  }, [activeOrders, orderStatusFilter, orderSearchQuery]);

  // Operational metrics
  const stats = useMemo(() => {
    const cookingCount = activeOrders.filter((o) => o.status === 'cooking').length;
    const readyCount = activeOrders.filter((o) => o.status === 'ready').length;
    const servingCount = activeOrders.filter((o) => o.status === 'serving').length;
    const priorityCount = activeOrders.filter((o) => o.isPriority || o.isFaculty).length;
    const lowStockCount = menuItems.filter((i) => i.stock <= 5).length;
    return {
      activeTotal: activeOrders.length,
      cooking: cookingCount,
      ready: readyCount,
      serving: servingCount,
      priority: priorityCount,
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
          OPERATIONAL CONTROL HEADER & STATION SWITCHER (Amrita Campus Theme)
      ========================================================================= */}
      <div className="bg-white border border-[#E8E3D7] rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
              isCook
                ? 'bg-[#FFF2E6] border border-[#FECB9F] text-[#FD7E14]'
                : 'bg-[#F0FDFA] border border-[#99F6E4] text-[#0D9488]'
            }`}>
              {isCook ? <ChefHat className="w-6 h-6" /> : <QrCode className="w-6 h-6 text-[#0D9488]" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-extrabold text-[#B0003A] tracking-tight">
                  {isCook ? 'Kitchen Cook Portal — Food Preparation (KDS) 👨‍🍳' : 'Counter Staff Portal — Menu Management & Dispatch 🏷️'}
                </h2>
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border ${
                  isCook
                    ? 'bg-[#FFF2E6] border-[#FECB9F] text-[#FD7E14]'
                    : 'bg-[#F0FDFA] border-[#99F6E4] text-[#0D9488]'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-[#198754] animate-pulse" />
                  <span>{isCook ? 'KITCHEN COOK TERMINAL' : 'COUNTER STAFF STATION'}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed font-medium">
                {isCook
                  ? 'Real-time food preparation stage controls (Cooking ➔ Food Ready ➔ Serving) and kitchen crowd pace calibration.'
                  : 'Edit canteen menu & dish pricing, manage live stock inventory, verify pickup tokens, and dispatch ready orders.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-center">
            <div className="bg-[#FAF7F0] p-1.5 rounded-2xl border border-[#E8E3D7] flex items-center gap-1 shadow-inner">
              {canteens.map((c) => {
                const isSelected = selectedCanteenId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCanteenId(c.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[#B0003A] text-white shadow-sm font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>{c.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#E8E3D7] text-slate-700'
                      }`}
                    >
                      {c.code || (c.id === 'canteen-1' ? 'MAIN' : c.id === 'canteen-2' ? 'IT' : 'MBA')}
                    </span>
                  </button>
                );
              })}
            </div>

            {onGoBack && (
              <button
                type="button"
                onClick={onGoBack}
                title="Return to Campus Hub"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition shadow-xs active:scale-95 shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Go Back</span>
              </button>
            )}

            <button
              onClick={() => fetchStaffData(true)}
              disabled={isRefreshing}
              title="Manual Data Sync"
              className="p-2.5 rounded-2xl bg-[#FAF7F0] hover:bg-[#E8E3D7] text-slate-700 border border-[#E8E3D7] transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#B0003A]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Real-Time Crowd Flow Calibrator */}
        <div className="mt-5 pt-4 border-t border-[#E8E3D7]/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg border ${
              isCook ? 'bg-[#FFF2E6] border-[#FECB9F] text-[#FD7E14]' : 'bg-[#FFF0F4] border-[#F8C0CE] text-[#B0003A]'
            }`}>
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800">
                {isCook ? 'Kitchen Rush / Crowd Flow Control' : 'Counter Crowd Level Calibrator'}
              </span>
              <p className="text-[11px] text-slate-500 font-medium">
                {isCook
                  ? 'Set kitchen rush pace (Low, Moderate, Busy, Rush Hour) to dynamically calibrate student wait-time ETA'
                  : 'Calibrates dynamic rush multipliers for student wait-time ETA predictions'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { level: 'Low', hint: '1.0× Speed' },
              { level: 'Moderate', hint: '1.2× Speed' },
              { level: 'Busy', hint: '1.5× Rush' },
              { level: 'Rush Hour', hint: '2.0× Rush' }
            ].map(({ level, hint }) => {
              const isActive = currentCanteen?.crowdLevel === level;
              return (
                <button
                  key={level}
                  onClick={() => handleUpdateCrowd(level)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#B0003A] text-white border-[#B0003A] font-bold shadow-sm'
                      : 'bg-[#FAF7F0] text-slate-700 border-[#E8E3D7] hover:bg-[#E8E3D7]'
                  }`}
                >
                  <span>{level}</span>
                  <span
                    className={`text-[10px] font-mono px-1 rounded ${
                      isActive ? 'bg-white/20 text-white font-bold' : 'text-slate-400'
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
        <div className="bg-white border border-[#E8E3D7] rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total In Kitchen
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">
              {stats.activeTotal}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Pending collection</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FAF7F0] text-slate-600 border border-[#E8E3D7] flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E8E3D7] rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Cooking / Prep
            </div>
            <div className="text-2xl font-black font-mono text-[#FD7E14] mt-0.5">
              {stats.cooking}
            </div>
            <div className="text-[10px] text-[#FD7E14] mt-0.5 font-medium">In preparation</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFF2E6] border border-[#FECB9F] text-[#FD7E14] flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E8E3D7] rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Ready At Counter
            </div>
            <div className="text-2xl font-black font-mono text-[#198754] mt-0.5">
              {stats.ready + stats.serving}
            </div>
            <div className="text-[10px] text-[#198754] mt-0.5 font-medium">Awaiting pickup</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] border border-[#A3D9B5] text-[#198754] flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E8E3D7] rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Menu Items
            </div>
            <div className="text-2xl font-black font-mono text-[#0D6EFD] mt-0.5">
              {menuItems.length}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
              {stats.lowStock > 0 ? `${stats.lowStock} low stock` : 'Active on counter'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EBF3FE] border border-[#A2C8FD] text-[#0D6EFD] flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          PRIMARY NAVIGATION TABS
      ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E3D7] pb-3">
        <div className="flex items-center gap-2">
          {isCook ? (
            <>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                  activeTab === 'orders'
                    ? 'bg-[#B0003A] text-white shadow-sm font-extrabold'
                    : 'bg-white text-slate-700 hover:bg-[#FAF7F0] border border-[#E8E3D7]'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>🍳 Kitchen Cooking Queue (KDS)</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-[#FAF7F0] text-slate-700'
                  }`}
                >
                  {activeOrders.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('stock')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                  activeTab === 'stock'
                    ? 'bg-[#B0003A] text-white shadow-sm font-extrabold'
                    : 'bg-white text-slate-700 hover:bg-[#FAF7F0] border border-[#E8E3D7]'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>📦 Kitchen Ingredients & Stock</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === 'stock' ? 'bg-white/20 text-white' : 'bg-[#FAF7F0] text-slate-700'
                  }`}
                >
                  {menuItems.length}
                </span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('verify')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                  activeTab === 'verify'
                    ? 'bg-[#0D9488] text-white shadow-sm font-extrabold'
                    : 'bg-white text-slate-700 hover:bg-[#FAF7F0] border border-[#E8E3D7]'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>🏷️ Pickup Token Scanner & Dispatch</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === 'verify' ? 'bg-white/20 text-white' : 'bg-[#FAF7F0] text-slate-700'
                  }`}
                >
                  Verify
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('orders');
                  setOrderStatusFilter('ready');
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                  activeTab === 'orders'
                    ? 'bg-[#0D9488] text-white shadow-sm font-extrabold'
                    : 'bg-white text-slate-700 hover:bg-[#FAF7F0] border border-[#E8E3D7]'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>🛎️ Ready for Pickup Callboard</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-[#FAF7F0] text-slate-700'
                  }`}
                >
                  {stats.ready + stats.serving}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('stock')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                  activeTab === 'stock'
                    ? 'bg-[#0D9488] text-white shadow-sm font-extrabold'
                    : 'bg-white text-slate-700 hover:bg-[#FAF7F0] border border-[#E8E3D7]'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>📋 Counter Items & Snacks</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === 'stock' ? 'bg-white/20 text-white' : 'bg-[#FAF7F0] text-slate-700'
                  }`}
                >
                  {menuItems.length}
                </span>
              </button>
            </>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-slate-500 font-medium">
          <span className="w-2 h-2 rounded-full bg-[#198754] animate-ping" />
          <span>Polling: 4s</span>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: KITCHEN ORDER DISPLAY (KDS)
      ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E8E3D7] rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All Active', count: activeOrders.length },
                { id: 'faculty_priority', label: '⚡ Faculty VIP', count: stats.priority },
                { id: 'cooking', label: 'Cooking', count: stats.cooking },
                { id: 'ready', label: 'Ready', count: stats.ready },
                { id: 'serving', label: 'Serving', count: stats.serving }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setOrderStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                    orderStatusFilter === f.id
                      ? f.id === 'faculty_priority'
                        ? 'bg-blue-600 text-white shadow-sm font-bold'
                        : 'bg-[#B0003A] text-white shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-[#FAF7F0]'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    orderStatusFilter === f.id
                      ? 'bg-white/20 text-white'
                      : f.id === 'faculty_priority' && f.count > 0
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-[#FAF7F0] text-slate-600'
                  }`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search token, student or item..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#B0003A] focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => {
              const isCooking = order.status === 'cooking';
              const isReady = order.status === 'ready';
              const isServing = order.status === 'serving';
              const isPriority = order.isPriority || order.isFaculty;

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md bg-white ${
                    isPriority
                      ? 'border-blue-400 ring-2 ring-blue-400/40 bg-blue-50/20'
                      : isServing
                      ? 'border-[#0D6EFD]/50 ring-1 ring-[#0D6EFD]/20 bg-[#EBF3FE]/30'
                      : isReady
                      ? 'border-[#198754]/50 ring-1 ring-[#198754]/20 bg-[#E8F5E9]/30'
                      : isCooking
                      ? 'border-[#FD7E14]/50 ring-1 ring-[#FD7E14]/20 bg-[#FFF2E6]/30'
                      : 'border-[#E8E3D7]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#E8E3D7]/60">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black font-mono text-[#B0003A] tracking-wider">
                          {order.token}
                        </span>
                        {isPriority && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-600 text-white uppercase shadow-xs flex items-center gap-1 animate-pulse">
                            <Zap className="w-2.5 h-2.5 fill-white" />
                            <span>VIP</span>
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-600 bg-[#FAF7F0] px-2 py-0.5 rounded-md border border-[#E8E3D7] font-semibold">
                          {getElapsedMinutes(order.createdAt)}
                        </span>
                      </div>

                      <div
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 ${
                          isServing
                            ? 'bg-[#EBF3FE] text-[#0D6EFD] border border-[#A2C8FD]'
                            : isReady
                            ? 'bg-[#E8F5E9] text-[#198754] border border-[#A3D9B5]'
                            : 'bg-[#FFF2E6] text-[#FD7E14] border border-[#FECB9F]'
                        }`}
                      >
                        {isServing && <span className="w-1.5 h-1.5 rounded-full bg-[#0D6EFD] animate-pulse" />}
                        {isReady && <Bell className="w-3 h-3 text-[#198754]" />}
                        {isCooking && <Flame className="w-3 h-3 text-[#FD7E14]" />}
                        <span>{order.status}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <div className="font-bold text-slate-800">{order.studentName}</div>
                      <div className="text-[10px] text-slate-500 font-mono font-medium">
                        Roll: {order.studentRoll}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#E8E3D7]/60 space-y-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Kitchen Items ({order.items.reduce((s, i) => s + i.quantity, 0)} total):
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-[#FAF7F0] border border-[#E8E3D7] px-2.5 py-1.5 rounded-lg text-xs"
                          >
                            <span className="font-semibold text-slate-800 truncate pr-2">
                              {item.name}
                            </span>
                            <span className="font-mono font-black text-[#B0003A] shrink-0">
                              ×{item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-[#E8E3D7]/60 flex items-center gap-2">
                    {isCook ? (
                      /* COOK ACTIONS */
                      <>
                        {order.status === 'received' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'cooking')}
                            className="flex-1 py-2.5 rounded-xl bg-[#FD7E14] hover:bg-[#e46a07] active:scale-98 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Flame className="w-4 h-4" />
                            <span>Start Cooking 🍳</span>
                          </button>
                        )}

                        {isCooking && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'ready')}
                            className="flex-1 py-2.5 rounded-xl bg-[#198754] hover:bg-[#146c43] active:scale-98 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Bell className="w-4 h-4" />
                            <span>Mark Ready & Plated 🛎️</span>
                          </button>
                        )}

                        {(isReady || isServing) && (
                          <div className="flex-1 py-2 rounded-xl bg-[#E8F5E9] border border-[#A3D9B5] text-[#198754] text-xs font-bold text-center flex items-center justify-center gap-1.5">
                            <CheckCircle className="w-4 h-4" />
                            <span>Plated • Awaiting Counter Dispatch</span>
                          </div>
                        )}
                      </>
                    ) : (
                      /* COUNTER STAFF ACTIONS */
                      <>
                        {order.status === 'received' && (
                          <div className="flex-1 py-2 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] text-slate-500 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Waiting for Kitchen to Cook</span>
                          </div>
                        )}

                        {isCooking && (
                          <div className="flex-1 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                            <span>Kitchen is Cooking Dish...</span>
                          </div>
                        )}

                        {isReady && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'serving')}
                              className="flex-1 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0f766e] active:scale-98 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Hand Over / Call Token 🏷️</span>
                            </button>
                            <button
                              onClick={() => {
                                setTokenInput(order.token);
                                setActiveTab('verify');
                              }}
                              className="p-2.5 rounded-xl bg-[#FAF7F0] hover:bg-[#E8E3D7] text-slate-700 border border-[#E8E3D7] transition"
                              title="Verify token at pickup scanner"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {isServing && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'collected')}
                            className="flex-1 py-2.5 rounded-xl bg-[#198754] hover:bg-[#146c43] active:scale-98 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <CheckCheck className="w-4 h-4" />
                            <span>Complete Handover ✅</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredOrders.length === 0 && (
            <div className="py-16 text-center bg-white border border-[#E8E3D7] rounded-2xl p-8 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-[#E8F5E9] border border-[#A3D9B5] text-[#198754] flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Kitchen Queue Is Caught Up!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
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
          <div className="bg-white border border-[#E8E3D7] rounded-2xl p-6 sm:p-7 shadow-sm relative overflow-hidden">
            <div className="text-center pb-5 border-b border-[#E8E3D7]/60">
              <div className="w-12 h-12 rounded-xl bg-[#FFF0F4] border border-[#F8C0CE] text-[#B0003A] flex items-center justify-center mx-auto mb-3 shadow-sm">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-[#B0003A]">
                Single-Use Pickup Token Verification Window
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto font-medium">
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
                    className="flex-1 px-4 py-3 bg-[#FAF7F0] border-2 border-[#E8E3D7] rounded-xl text-slate-900 font-mono text-lg font-bold tracking-widest placeholder-slate-400 focus:outline-none focus:border-[#B0003A] focus:bg-white transition"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-[#B0003A] hover:bg-[#8F002E] text-white font-extrabold text-xs transition shadow-sm flex items-center gap-2 active:scale-98"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Pass</span>
                  </button>
                </div>
              </div>

              {activeOrders.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] text-slate-500 font-semibold mb-2 flex items-center justify-between">
                    <span>Quick Click (Active in Queue):</span>
                    <span className="text-[10px] text-slate-400">Click to fill</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeOrders.slice(0, 6).map((ord) => (
                      <button
                        key={ord.id}
                        type="button"
                        onClick={() => setTokenInput(ord.token)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                          ord.status === 'ready' || ord.status === 'serving'
                            ? 'bg-[#FFF0F4] border-[#F8C0CE] text-[#B0003A] hover:bg-[#FFF0F4]/80'
                            : 'bg-[#FAF7F0] border-[#E8E3D7] text-slate-600 hover:text-slate-900 hover:bg-[#E8E3D7]'
                        }`}
                      >
                        <span>{ord.token}</span>
                        <span className="text-[9px] font-sans font-medium opacity-75">
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
                    ? 'bg-[#E8F5E9] border-[#A3D9B5] text-[#198754] shadow-sm'
                    : 'bg-[#FCE8E6] border-[#F5B0A9] text-[#DC3545] shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                      verificationResult.success
                        ? 'bg-[#E8F5E9] text-[#198754]'
                        : 'bg-[#FCE8E6] text-[#DC3545]'
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
                      <span className="text-[10px] font-mono opacity-70">
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed opacity-90 font-medium">
                      {verificationResult.message}
                    </p>

                    {verificationResult.data && (
                      <div className="mt-4 pt-3 border-t border-[#A3D9B5]/80 space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white p-2.5 rounded-xl border border-[#A3D9B5]">
                            <span className="text-[10px] text-[#198754] block font-bold">Student</span>
                            <span className="font-bold text-slate-900">
                              {verificationResult.data.studentName}
                            </span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-[#A3D9B5]">
                            <span className="text-[10px] text-[#198754] block font-bold">Roll Number</span>
                            <span className="font-mono font-bold text-slate-900">
                              {verificationResult.data.studentRoll}
                            </span>
                          </div>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-[#A3D9B5]">
                          <span className="text-[10px] text-[#198754] block mb-1 font-bold">
                            Dispatched Items:
                          </span>
                          <div className="font-semibold text-slate-800">
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
          <div className="bg-white border border-[#E8E3D7] rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#B0003A]" />
                  <span>Live Kitchen Stock & Menu Editor</span>
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#FFF0F4] text-[#B0003A] border border-[#F8C0CE]">
                  {filteredMenuItems.length} Items Listed
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Staff can adjust real-time stock, update item details, or add new items directly to the canteen menu!
              </p>
            </div>

            {/* Actions: Add New Item Button, Category Filter & Search */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={openAddModal}
                className="px-4 py-2 rounded-xl bg-[#B0003A] hover:bg-[#8F002E] text-white font-extrabold text-xs transition shadow-sm flex items-center gap-1.5 active:scale-98"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Item to Menu</span>
              </button>

              <div className="relative min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter dishes..."
                  value={stockSearchQuery}
                  onChange={(e) => setStockSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#B0003A] focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 bg-white p-2 rounded-2xl border border-[#E8E3D7] shadow-sm">
            {stockCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setStockCategoryFilter(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                  stockCategoryFilter === cat
                    ? 'bg-[#B0003A] text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#FAF7F0]'
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
                  className={`p-4 rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between bg-white ${
                    isOutOfStock
                      ? 'border-[#F5B0A9] bg-[#FCE8E6]/20'
                      : isLowStock
                      ? 'border-[#FECB9F] bg-[#FFF2E6]/20'
                      : 'border-[#E8E3D7]'
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
                        className="w-16 h-16 rounded-xl object-cover border border-[#E8E3D7] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                item.isVeg ? 'bg-[#198754]' : 'bg-[#DC3545]'
                              }`}
                            />
                            <h4 className="font-bold text-sm text-slate-900 truncate">{item.name}</h4>
                          </div>

                          {/* Quick Edit Item Button */}
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1 rounded-lg bg-[#FAF7F0] hover:bg-[#E8E3D7] text-slate-600 hover:text-[#B0003A] transition shrink-0"
                            title="Edit dish details & price"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                          {item.category} • <span className="font-mono font-bold text-[#B0003A]">₹{item.price}</span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              isOutOfStock
                                ? 'bg-[#FCE8E6] text-[#DC3545] border border-[#F5B0A9]'
                                : isLowStock
                                ? 'bg-[#FFF2E6] text-[#FD7E14] border border-[#FECB9F]'
                                : 'bg-[#E8F5E9] text-[#198754] border border-[#A3D9B5]'
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
                                ? 'bg-[#E8F5E9] text-[#198754] border-[#A3D9B5] hover:bg-[#E8F5E9]/80'
                                : 'bg-[#FCE8E6] text-[#DC3545] border-[#F5B0A9] hover:bg-[#FCE8E6]/80'
                            }`}
                          >
                            {isOutOfStock ? 'Make In Stock' : 'Mark Out'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stock Quantity Adjuster & Quick Batch Buttons */}
                  <div className="mt-4 pt-3 border-t border-[#E8E3D7]/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 bg-[#FAF7F0] p-1 rounded-xl border border-[#E8E3D7]">
                      <button
                        onClick={() => handleAdjustStock(item, -1)}
                        title="Reduce 1"
                        className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-700 transition shadow-sm"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="font-mono font-black text-sm text-slate-900 px-2.5 min-w-[2.5rem] text-center">
                        {item.stock}
                      </span>

                      <button
                        onClick={() => handleAdjustStock(item, 1)}
                        title="Add 1"
                        className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-700 transition shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAdjustStock(item, 5)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#FAF7F0] hover:bg-[#B0003A] hover:text-white text-slate-700 text-xs font-mono font-bold transition border border-[#E8E3D7]"
                        title="Restock +5 portions"
                      >
                        +5
                      </button>
                      <button
                        onClick={() => handleAdjustStock(item, 15)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#FFF0F4] hover:bg-[#B0003A] hover:text-white text-[#B0003A] text-xs font-mono font-bold transition border border-[#F8C0CE]"
                        title="Restock +15 portions"
                      >
                        +15
                      </button>
                    </div>
                  </div>

                  {/* Prominent Edit Dish Details Button */}
                  <div className="mt-3 pt-2.5 border-t border-[#E8E3D7]/60">
                    <button
                      onClick={() => openEditModal(item)}
                      className="w-full py-1.5 px-3 rounded-xl bg-[#FAF7F0] hover:bg-[#E8E3D7] text-[#B0003A] text-xs font-bold transition flex items-center justify-center gap-1.5 border border-[#E8E3D7] shadow-sm"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#B0003A]" />
                      <span>Edit Dish Name & Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredMenuItems.length === 0 && (
            <div className="py-16 text-center text-slate-500 bg-white border border-[#E8E3D7] rounded-2xl text-xs shadow-sm">
              No menu items found matching the selected filter.
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW FOOD ITEM TO MENU (STAFF)
      ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-[#E8E3D7] rounded-3xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E3D7]/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#FFF0F4] border border-[#F8C0CE] text-[#B0003A]">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#B0003A]">Add New Dish to Menu</h3>
                  <p className="text-xs text-slate-500 font-medium">Adding to {currentCanteen?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl bg-[#FAF7F0] hover:bg-[#E8E3D7] text-slate-500 hover:text-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Dish Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mushroom Fried Rice"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#B0003A] focus:bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Category *</label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] text-slate-900 focus:outline-none focus:border-[#B0003A] focus:bg-white font-medium"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Price (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] text-slate-900 font-mono font-bold focus:outline-none focus:border-[#B0003A] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Initial Stock Count</label>
                  <input
                    type="number"
                    min="0"
                    value={itemForm.stock}
                    onChange={(e) => setItemForm({ ...itemForm, stock: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] text-slate-900 font-mono focus:outline-none focus:border-[#B0003A] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Est. Prep Time (Mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={itemForm.prepTimeMinutes}
                    onChange={(e) => setItemForm({ ...itemForm, prepTimeMinutes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] text-slate-900 font-mono focus:outline-none focus:border-[#B0003A] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Food Type</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setItemForm({ ...itemForm, isVeg: true })}
                    className={`flex-1 py-2 rounded-xl font-bold border transition flex items-center justify-center gap-2 ${
                      itemForm.isVeg
                        ? 'bg-[#E8F5E9] border-[#A3D9B5] text-[#198754]'
                        : 'bg-[#FAF7F0] border-[#E8E3D7] text-slate-600'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#198754]" />
                    <span>Pure Veg</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setItemForm({ ...itemForm, isVeg: false })}
                    className={`flex-1 py-2 rounded-xl font-bold border transition flex items-center justify-center gap-2 ${
                      !itemForm.isVeg
                        ? 'bg-[#FCE8E6] border-[#F5B0A9] text-[#DC3545]'
                        : 'bg-[#FAF7F0] border-[#E8E3D7] text-slate-600'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#DC3545]" />
                    <span>Non-Veg</span>
                  </button>
                </div>
              </div>

              {/* Dish Photo: Upload from System OR Web URL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-bold">Dish Image</label>
                  <div className="flex items-center bg-[#FAF7F0] p-0.5 rounded-xl border border-[#E8E3D7] text-[11px]">
                    <button
                      type="button"
                      onClick={() => setImageSourceMode('upload')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                        imageSourceMode === 'upload'
                          ? 'bg-white text-[#B0003A] border border-[#E8E3D7] shadow-sm font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload from System</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageSourceMode('url')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                        imageSourceMode === 'url'
                          ? 'bg-white text-[#B0003A] border border-[#E8E3D7] shadow-sm font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Link className="w-3 h-3" />
                      <span>Image URL</span>
                    </button>
                  </div>
                </div>

                {imageSourceMode === 'upload' ? (
                  <div>
                    <input
                      ref={addFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                    <div
                      onClick={() => addFileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group ${
                        itemForm.imageUrl
                          ? 'border-[#A3D9B5] bg-[#E8F5E9]/30'
                          : 'border-[#E8E3D7] bg-[#FAF7F0] hover:border-[#B0003A] hover:bg-[#FFF0F4]/30'
                      }`}
                    >
                      {itemForm.imageUrl ? (
                        <div className="flex items-center gap-3.5 w-full">
                          <img
                            src={itemForm.imageUrl}
                            alt="Selected"
                            className="w-16 h-16 rounded-xl object-cover border border-[#A3D9B5] shrink-0 shadow-sm"
                          />
                          <div className="text-left flex-1 min-w-0">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#198754] block">
                              ✓ Image Loaded From System
                            </span>
                            <span className="text-xs text-slate-800 truncate block mt-0.5 font-medium">
                              Click to choose another photo
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              PNG, JPG, WEBP (Max 5MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemForm((prev) => ({ ...prev, imageUrl: '' }));
                            }}
                            className="p-1.5 rounded-lg bg-[#FAF7F0] hover:bg-[#FCE8E6] text-slate-500 hover:text-[#DC3545] transition"
                            title="Remove uploaded image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="p-3 rounded-2xl bg-[#FFF0F4] text-[#B0003A] group-hover:scale-110 transition duration-200">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 text-xs block">
                              Upload photo from your system / device
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
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
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Paste web image link: https://..."
                          value={itemForm.imageUrl}
                          onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#B0003A] focus:bg-white font-mono text-[11px]"
                        />
                      </div>
                      {itemForm.imageUrl && (
                        <img
                          src={itemForm.imageUrl}
                          alt="Preview"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80';
                          }}
                          className="w-10 h-10 rounded-xl object-cover border border-[#E8E3D7] shrink-0"
                        />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Paste a direct web URL to an image file.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Short Description</label>
                <textarea
                  rows="2"
                  placeholder="Freshly prepared with..."
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#B0003A] focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-[#E8E3D7]/60 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#FAF7F0] text-slate-700 hover:bg-[#E8E3D7] font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#B0003A] hover:bg-[#8F002E] text-white font-extrabold transition shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-[#E8E3D7] rounded-3xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E3D7]/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#FFF0F4] border border-[#F8C0CE] text-[#B0003A]">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#B0003A]">Edit Dish Details</h3>
                  <p className="text-xs text-slate-500 font-medium">Update pricing, category or quantity</p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-2 rounded-xl bg-[#FAF7F0] hover:bg-[#E8E3D7] text-slate-500 hover:text-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditItem} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Dish Name</label>
                <input
                  type="text"
                  required
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] text-slate-900 font-medium focus:outline-none focus:border-[#B0003A] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Category</label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] text-slate-900 focus:outline-none focus:border-[#B0003A] focus:bg-white font-medium"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] text-slate-900 font-mono font-bold focus:outline-none focus:border-[#B0003A] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Available Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={itemForm.stock}
                    onChange={(e) => setItemForm({ ...itemForm, stock: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] text-slate-900 font-mono font-bold focus:outline-none focus:border-[#B0003A] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Prep Time (Mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={itemForm.prepTimeMinutes}
                    onChange={(e) => setItemForm({ ...itemForm, prepTimeMinutes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] text-slate-900 font-mono focus:outline-none focus:border-[#B0003A] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Food Type</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setItemForm({ ...itemForm, isVeg: true })}
                    className={`flex-1 py-2 rounded-xl font-bold border transition flex items-center justify-center gap-2 ${
                      itemForm.isVeg
                        ? 'bg-[#E8F5E9] border-[#A3D9B5] text-[#198754]'
                        : 'bg-[#FAF7F0] border-[#E8E3D7] text-slate-600'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#198754]" />
                    <span>Pure Veg</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setItemForm({ ...itemForm, isVeg: false })}
                    className={`flex-1 py-2 rounded-xl font-bold border transition flex items-center justify-center gap-2 ${
                      !itemForm.isVeg
                        ? 'bg-[#FCE8E6] border-[#F5B0A9] text-[#DC3545]'
                        : 'bg-[#FAF7F0] border-[#E8E3D7] text-slate-600'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#DC3545]" />
                    <span>Non-Veg</span>
                  </button>
                </div>
              </div>

              {/* Dish Photo: Upload from System OR Web URL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-bold">Dish Image</label>
                  <div className="flex items-center bg-[#FAF7F0] p-0.5 rounded-xl border border-[#E8E3D7] text-[11px]">
                    <button
                      type="button"
                      onClick={() => setImageSourceMode('upload')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                        imageSourceMode === 'upload'
                          ? 'bg-white text-[#B0003A] border border-[#E8E3D7] shadow-sm font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload from System</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageSourceMode('url')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                        imageSourceMode === 'url'
                          ? 'bg-white text-[#B0003A] border border-[#E8E3D7] shadow-sm font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Link className="w-3 h-3" />
                      <span>Image URL</span>
                    </button>
                  </div>
                </div>

                {imageSourceMode === 'upload' ? (
                  <div>
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                    <div
                      onClick={() => editFileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group ${
                        itemForm.imageUrl
                          ? 'border-[#A3D9B5] bg-[#E8F5E9]/30'
                          : 'border-[#E8E3D7] bg-[#FAF7F0] hover:border-[#B0003A] hover:bg-[#FFF0F4]/30'
                      }`}
                    >
                      {itemForm.imageUrl ? (
                        <div className="flex items-center gap-3.5 w-full">
                          <img
                            src={itemForm.imageUrl}
                            alt="Selected"
                            className="w-16 h-16 rounded-xl object-cover border border-[#A3D9B5] shrink-0 shadow-sm"
                          />
                          <div className="text-left flex-1 min-w-0">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#198754] block">
                              ✓ Dish Photo Selected
                            </span>
                            <span className="text-xs text-slate-800 truncate block mt-0.5 font-medium">
                              Click to choose another photo
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              PNG, JPG, WEBP (Max 5MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemForm((prev) => ({ ...prev, imageUrl: '' }));
                            }}
                            className="p-1.5 rounded-lg bg-[#FAF7F0] hover:bg-[#FCE8E6] text-slate-500 hover:text-[#DC3545] transition"
                            title="Remove uploaded image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="p-3 rounded-2xl bg-[#FFF0F4] text-[#B0003A] group-hover:scale-110 transition duration-200">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 text-xs block">
                              Upload new photo from your system / device
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
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
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Paste web image link: https://..."
                          value={itemForm.imageUrl}
                          onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] text-slate-900 focus:outline-none focus:border-[#B0003A] focus:bg-white font-mono text-[11px]"
                        />
                      </div>
                      {itemForm.imageUrl && (
                        <img
                          src={itemForm.imageUrl}
                          alt="Preview"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80';
                          }}
                          className="w-10 h-10 rounded-xl object-cover border border-[#E8E3D7] shrink-0"
                        />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Paste a direct web URL to an image file.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5 text-xs">Description & Ingredients</label>
                <textarea
                  rows="2"
                  placeholder="Ingredients, accompaniments, spices..."
                  value={itemForm.description || ''}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#B0003A] font-medium text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#E8E3D7]/60 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-[#FAF7F0] text-slate-700 hover:bg-[#E8E3D7] font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#B0003A] hover:bg-[#8F002E] text-white font-extrabold transition shadow-sm"
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
