import React, { useState } from 'react';
import {
  Utensils,
  Clock,
  Flame,
  Plus,
  Minus,
  ShoppingBag,
  BellRing,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../api';
import { UpiPaymentModal } from './UpiPaymentModal';
import { CanteenRushMeter } from './CanteenRushMeter';

export function CanteenView({
  canteens,
  selectedCanteenId,
  setSelectedCanteenId,
  menuItems,
  wallet,
  currentUser,
  currentRole,
  onOrderCreated,
  onOpenWallet,
  onRefreshData
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Wallet');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notifyState, setNotifyState] = useState({}); // itemId -> boolean
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);

  const currentCanteen = canteens.find((c) => c.id === selectedCanteenId) || canteens[0];

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    if (item.canteenId !== selectedCanteenId) return false;
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (vegOnly && !item.isVeg) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!item.name.toLowerCase().includes(q) && !item.description?.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const categories = [
    'All',
    'Main Course',
    'Curries',
    "Today's Special",
    'Egg Items',
    'Bakes & Snacks',
    'Hot Drinks',
    'Juices & Milkshakes',
    'Ice Creams'
  ];

  const addToCart = (item) => {
    if (item.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) {
          alert(`Only ${item.stock} portions available in kitchen!`);
          return prev;
        }
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing.quantity === 1) {
        return prev.filter((i) => i.id !== itemId);
      }
      return prev.map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i));
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleNotifyMe = async (item) => {
    try {
      const res = await api.notifyMe(item.id);
      setNotifyState((prev) => ({ ...prev, [item.id]: true }));
      alert(`Alert set! You will receive a live notification as soon as "${item.name}" is restocked.`);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'Wallet' && Number(wallet?.balance ?? 0) < cartTotal) {
      const availableBal = Number(wallet?.balance ?? 0).toFixed(0);
      const confirmTopUp = window.confirm(
        `Insufficient wallet balance (₹${availableBal} available, order is ₹${cartTotal}). Top up wallet now?`
      );
      if (confirmTopUp) onOpenWallet();
      return;
    }

    // For UPI — open the QR payment modal first; order is submitted after user confirms
    if (paymentMethod === 'UPI') {
      setIsUpiModalOpen(true);
      return;
    }

    // Wallet payment — submit directly
    await submitOrder();
  };

  const submitOrder = async () => {
    setIsSubmitting(true);
    try {
      const isFaculty = currentRole === 'faculty' || currentUser?.role === 'faculty';
      const orderPayload = {
        canteenId: selectedCanteenId,
        items: cart.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          prepTimeMinutes: i.prepTimeMinutes
        })),
        paymentMethod,
        totalAmount: cartTotal,
        canteenName: currentCanteen?.name || 'Campus Canteen',
        isFaculty: isFaculty,
        customerRole: isFaculty ? 'faculty' : (currentUser?.role || (currentRole === 'guest' ? 'guest' : 'student')),
        customerName: currentUser?.name || (isFaculty ? 'Dr. Balakrishnan P (Faculty)' : (currentRole === 'guest' ? 'Guest Visitor' : 'You (Karthik)'))
      };

      const res = await api.createOrder(orderPayload);
      if (res.success) {
        confetti({
          particleCount: 90,
          spread: 65,
          origin: { y: 0.5 }
        });

        setCart([]);
        onOrderCreated(res.data);
        if (onRefreshData) onRefreshData();
      } else {
        alert(res.message || 'Order failed');
      }
    } catch (err) {
      alert('Order placement error: ' + err.message);
    } finally {
      setIsSubmitting(false);
      setIsUpiModalOpen(false);
    }
  };



  // Crowd level badge
  const getCrowdMonochrome = (crowd) => {
    switch (crowd) {
      case 'Low':
        return 'bg-[#E8F5E9] text-[#198754] border-[#A3D9B5] font-bold';
      case 'Moderate':
        return 'bg-[#EBF3FE] text-[#0D6EFD] border-[#A2C8FD] font-bold';
      case 'Busy':
        return 'bg-[#FFF2E6] text-[#FD7E14] border-[#FECB9F] font-bold';
      case 'Rush Hour':
        return 'bg-[#FCE8E6] text-[#DC3545] border-[#F5B0A9] font-extrabold';
      default:
        return 'bg-slate-100 text-slate-600 border-[#E8E3D7]';
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Canteen Selector & Real-Time Crowd Header */}
      <div className="bg-white border border-[#E8E3D7] rounded-3xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Canteen Switcher Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {canteens.map((c) => {
              const isSelected = selectedCanteenId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCanteenId(c.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border text-sm font-semibold transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#B0003A] text-white border-[#B0003A] shadow-md font-bold scale-[1.01]'
                      : 'bg-slate-50 text-slate-700 border-[#E8E3D7] hover:text-slate-900 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Utensils className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  <div className="text-left flex flex-col justify-center">
                    <div className="font-bold text-xs sm:text-sm whitespace-nowrap leading-tight">{c.name}</div>
                    <div className={`text-[10px] font-normal leading-tight mt-0.5 whitespace-nowrap ${isSelected ? 'text-[#FFF0F4]' : 'text-slate-500'}`}>
                      {c.location}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Live Crowd & Wait Time Status */}
          {currentCanteen && (
            <div className="flex items-center flex-wrap gap-3 bg-slate-50 p-3 rounded-2xl border border-[#E8E3D7] text-xs">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="text-slate-500">Crowd Level:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-semibold border ${getCrowdMonochrome(currentCanteen.crowdLevel)}`}>
                  {currentCanteen.crowdLevel}
                </span>
              </div>

              <div className="h-4 w-px bg-[#E8E3D7] hidden sm:block" />

              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="text-slate-500">Avg Wait:</span>
                <span className="font-bold text-[#B0003A] font-mono">
                  ~{currentCanteen.avgWaitTimeMinutes} mins
                </span>
              </div>

              <div className="h-4 w-px bg-[#E8E3D7] hidden sm:block" />

              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#FD7E14]" />
                <span className="text-slate-500">Active Kitchen Orders:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {currentCanteen.activeOrdersCount || 3}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Rush-Hour Peak Meter & Popular Times */}
      <CanteenRushMeter
        selectedCanteenId={selectedCanteenId}
        canteenName={currentCanteen?.name}
        currentCanteen={currentCanteen}
        onRefreshData={onRefreshData}
      />

      {/* Search & Category Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#B0003A] text-white shadow-sm font-bold'
                    : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-[#E8E3D7]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search & Veg toggle */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
              vegOnly
                ? 'bg-[#E8F5E9] text-[#198754] border-[#A3D9B5] font-bold shadow-xs'
                : 'bg-white text-slate-700 border-[#E8E3D7] hover:text-slate-900'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full border flex items-center justify-center p-0.5 ${
                vegOnly ? 'border-[#198754]' : 'border-slate-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${vegOnly ? 'bg-[#198754]' : 'bg-slate-400'}`} />
            </span>
            <span>Veg Only</span>
          </button>

          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search items, biryani, coffee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E8E3D7] rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#B0003A] font-medium shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Menu Items + Cart Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Menu Cards (2 Columns on Desktop) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredItems.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 bg-white border border-[#E8E3D7] rounded-3xl shadow-xs">
              No menu items match your search or filter criteria.
            </div>
          ) : (
            filteredItems.map((item) => {
              const inCart = cart.find((i) => i.id === item.id);
              const isOutOfStock = item.stock <= 0;
              const isAlertSet = notifyState[item.id];

              return (
                <div
                  key={item.id}
                  className={`bg-white border rounded-3xl overflow-hidden transition-all duration-300 hover:border-[#B0003A]/40 flex flex-col justify-between shadow-xs hover:shadow-md group ${
                    isOutOfStock ? 'border-[#E8E3D7] opacity-75' : 'border-[#E8E3D7]'
                  }`}
                >
                  {/* Food Image & Badges */}
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = item.isVeg
                          ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'
                          : 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format&fit=crop&q=80';
                      }}
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />

                    {/* Veg / Non-Veg badge */}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#E8E3D7] flex items-center gap-1.5 shadow-xs">
                      <span
                        className={`w-2.5 h-2.5 rounded-full border flex items-center justify-center ${
                          item.isVeg ? 'border-[#198754]' : 'border-[#DC3545]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.isVeg ? 'bg-[#198754]' : 'bg-[#DC3545]'
                          }`}
                        />
                      </span>
                      <span className={`text-[10px] font-black tracking-wider ${item.isVeg ? 'text-[#198754]' : 'text-[#DC3545]'}`}>
                        {item.isVeg ? 'VEG' : 'NON-VEG'}
                      </span>
                    </div>

                    {/* Prep time badge */}
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#E8E3D7] flex items-center gap-1 text-[10px] text-slate-700 font-mono shadow-xs">
                      <Clock className="w-3 h-3 text-[#B0003A]" />
                      <span>~{item.prepTimeMinutes}m</span>
                    </div>

                    {/* Stock status badge */}
                    <div className="absolute bottom-3 left-3">
                      {isOutOfStock ? (
                        <span className="px-2.5 py-1 rounded-lg bg-[#DC3545] text-white text-[11px] font-bold shadow-md">
                          Out of Stock
                        </span>
                      ) : item.stock <= 5 ? (
                        <span className="px-2.5 py-1 rounded-lg bg-[#FD7E14] text-white text-[11px] font-extrabold shadow-xs">
                          Only {item.stock} left
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-white/95 text-slate-800 text-[10px] font-semibold border border-[#E8E3D7] backdrop-blur-md shadow-xs">
                          <span className="text-[#198754] font-bold">●</span> {item.stock} in stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Food Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-extrabold text-slate-900 text-sm leading-snug group-hover:text-[#B0003A] transition">
                          {item.name}
                        </h4>
                        <span className="font-extrabold text-[#B0003A] font-mono text-base shrink-0">
                          ₹{item.price}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed font-normal">
                        {item.description}
                      </p>
                    </div>

                    {/* Action Button: Add to Cart OR "Notify Me" */}
                    <div className="mt-4 pt-3 border-t border-[#E8E3D7] flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        {item.category}
                      </span>

                      {isOutOfStock ? (
                        <button
                          onClick={() => handleNotifyMe(item)}
                          disabled={isAlertSet}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                            isAlertSet
                              ? 'bg-slate-100 text-slate-700 border border-[#E8E3D7] cursor-default'
                              : 'bg-[#FFF0F4] hover:bg-[#F8C0CE] text-[#B0003A] border border-[#F8C0CE]'
                          }`}
                        >
                          {isAlertSet ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#198754]" /> Alert Set
                            </>
                          ) : (
                            <>
                              <BellRing className="w-3.5 h-3.5 text-[#B0003A]" /> Notify Me
                            </>
                          )}
                        </button>
                      ) : inCart ? (
                        <div className="flex items-center gap-2 bg-slate-100 border border-[#E8E3D7] rounded-xl p-1">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 rounded-lg bg-white text-slate-700 hover:bg-slate-200 transition shadow-xs"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-xs text-slate-900 px-1.5 font-mono">
                            {inCart.quantity}
                          </span>
                          <button
                            onClick={() => addToCart(item)}
                            className="p-1 rounded-lg bg-white text-slate-700 hover:bg-slate-200 transition shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#B0003A] hover:bg-[#8F002E] text-white text-xs font-extrabold transition shadow-xs active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5 text-white" /> Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Prepaid Cart & Token Checkout */}
        <div className="bg-white border border-[#E8E3D7] rounded-3xl p-5 shadow-xs sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E3D7]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#B0003A]" />
              <h3 className="font-extrabold text-sm text-slate-900">Your Prepaid Cart</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFF0F4] text-[#B0003A] border border-[#F8C0CE] font-mono font-bold">
              {cart.reduce((sum, i) => sum + i.quantity, 0)} items
            </span>
          </div>

          {cart.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Utensils className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-50" />
              Your tray is empty. Add delicious food from {currentCanteen?.name}!
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {/* Cart items list */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-[#E8E3D7] text-xs"
                  >
                    <div className="flex-1 mr-2">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        ₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 rounded-lg bg-white border border-[#E8E3D7] text-slate-600 hover:text-slate-900"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold text-slate-900 px-1 text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => addToCart(item)}
                        className="p-1 rounded-lg bg-white border border-[#E8E3D7] text-slate-600 hover:text-slate-900"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total & Summary */}
              <div className="pt-3 border-t border-[#E8E3D7] space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-700">₹{cartTotal}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Platform & Token Fee</span>
                  <span className="font-mono text-[#198754] font-bold">₹0 (Free)</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-[#E8E3D7]">
                  <span>Total Amount</span>
                  <span className="font-mono text-[#B0003A] text-base font-black">₹{cartTotal}</span>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Wallet')}
                    className={`p-2.5 rounded-2xl border text-left text-xs transition flex flex-col justify-between ${
                      paymentMethod === 'Wallet'
                        ? 'bg-[#FFF0F4] text-[#B0003A] border-[#B0003A] font-extrabold shadow-xs'
                        : 'bg-slate-50 border-[#E8E3D7] text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className={`text-[10px] ${paymentMethod === 'Wallet' ? 'text-[#B0003A]' : 'text-slate-500'}`}>
                      Campus Wallet
                    </span>
                    <span className={`font-black mt-1 ${paymentMethod === 'Wallet' ? 'text-[#B0003A]' : 'text-slate-800'}`}>
                      ₹{Number(wallet?.balance ?? 0).toFixed(0)} Bal
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-2.5 rounded-2xl border text-left text-xs transition flex flex-col justify-between ${
                      paymentMethod === 'UPI'
                        ? 'bg-[#FFF0F4] text-[#B0003A] border-[#B0003A] font-extrabold shadow-xs'
                        : 'bg-slate-50 border-[#E8E3D7] text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className={`text-[10px] ${paymentMethod === 'UPI' ? 'text-[#B0003A]' : 'text-slate-500'}`}>
                      Fast UPI
                    </span>
                    <span className={`font-black mt-1 ${paymentMethod === 'UPI' ? 'text-[#B0003A]' : 'text-slate-800'}`}>
                      Auto-Confirm
                    </span>
                  </button>
                </div>
              </div>

              {/* Faculty Priority Queue Indicator */}
              {(currentRole === 'faculty' || currentUser?.role === 'faculty') && (
                <div className="p-2.5 rounded-2xl bg-[#EBF3FF] border border-[#B6D4FE] text-[#0D6EFD] text-xs flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded-md bg-[#0D6EFD] text-white text-[9px] font-black uppercase shadow-xs">⚡ VIP</span>
                  <span className="font-semibold text-[11px] text-blue-900">
                    Faculty Priority Lane Active: Express C1-FAC token with 50% accelerated preparation!
                  </span>
                </div>
              )}

              {/* Guarantee notice */}
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-[#E8E3D7] text-[10px] text-slate-500 leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#198754] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-800">Stock reserved at payment.</strong> Instant token issued. Single-use token prevents queue-jumping.
                </span>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-[#B0003A] hover:bg-[#8F002E] text-white font-black text-xs transition shadow-md shadow-[#B0003A]/20 active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  'Issuing Token...'
                ) : paymentMethod === 'UPI' ? (
                  <>
                    <span>Pay ₹{cartTotal} via UPI</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                ) : (
                  <>
                    <span>Prepay & Get Token (₹{cartTotal})</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* UPI Payment QR Modal */}
      <UpiPaymentModal
        isOpen={isUpiModalOpen}
        onClose={() => setIsUpiModalOpen(false)}
        cart={cart}
        cartTotal={cartTotal}
        canteenName={currentCanteen?.name || 'Campus Canteen'}
        onConfirm={submitOrder}
      />
    </div>
  );
}
