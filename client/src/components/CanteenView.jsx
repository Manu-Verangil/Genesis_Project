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

export function CanteenView({
  canteens,
  selectedCanteenId,
  setSelectedCanteenId,
  menuItems,
  wallet,
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

    if (paymentMethod === 'Wallet' && wallet && wallet.balance < cartTotal) {
      const confirmTopUp = window.confirm(
        `Insufficient wallet balance (₹${wallet.balance.toFixed(0)} available, order is ₹${cartTotal}). Top up wallet now?`
      );
      if (confirmTopUp) onOpenWallet();
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        canteenId: selectedCanteenId,
        items: cart.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          prepTimeMinutes: i.prepTimeMinutes
        })),
        paymentMethod
      };

      const res = await api.createOrder(orderPayload);
      if (res.success) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });

        setCart([]);
        onOrderCreated(res.data);
      } else {
        alert(res.message || 'Order failed');
      }
    } catch (err) {
      alert('Order placement error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Crowd level monochrome badge
  const getCrowdMonochrome = (crowd) => {
    switch (crowd) {
      case 'Low':
        return 'bg-zinc-900 text-zinc-300 border-zinc-700';
      case 'Moderate':
        return 'bg-zinc-800 text-zinc-100 border-zinc-600 font-bold';
      case 'Busy':
        return 'bg-zinc-800 text-white border-zinc-500 font-extrabold';
      case 'Rush Hour':
        return 'bg-white text-black border-white font-black shadow-sm';
      default:
        return 'bg-zinc-900 text-zinc-400 border-zinc-800';
    }
  };

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Canteen Selector & Real-Time Crowd Header */}
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md">
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
                      ? 'bg-white text-black border-white shadow-xl shadow-white/10 font-bold scale-[1.01]'
                      : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  <Utensils className={`w-4 h-4 shrink-0 ${isSelected ? 'text-black' : 'text-zinc-400'}`} />
                  <div className="text-left flex flex-col justify-center">
                    <div className="font-bold text-xs sm:text-sm whitespace-nowrap leading-tight">{c.name}</div>
                    <div className={`text-[10px] font-medium leading-tight mt-0.5 whitespace-nowrap ${isSelected ? 'text-zinc-800' : 'text-zinc-500'}`}>
                      {c.location}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Live Crowd & Wait Time Status */}
          {currentCanteen && (
            <div className="flex items-center flex-wrap gap-3 bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800 text-xs">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-400">Crowd Level:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-semibold border ${getCrowdMonochrome(currentCanteen.crowdLevel)}`}>
                  {currentCanteen.crowdLevel}
                </span>
              </div>

              <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-zinc-300" />
                <span className="text-zinc-400">Avg Wait:</span>
                <span className="font-bold text-white font-mono">
                  ~{currentCanteen.avgWaitTimeMinutes} mins
                </span>
              </div>

              <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-zinc-300" />
                <span className="text-zinc-400">Active Kitchen Orders:</span>
                <span className="font-bold text-white font-mono">
                  {currentCanteen.activeOrdersCount || 3}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

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
                    ? 'bg-white text-black shadow-md shadow-white/10 font-extrabold'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800/80'
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
                ? 'bg-white text-black border-white shadow-sm font-bold'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full border flex items-center justify-center p-0.5 ${
                vegOnly ? 'border-black' : 'border-zinc-500'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${vegOnly ? 'bg-black' : 'bg-zinc-500'}`} />
            </span>
            <span>Veg Only</span>
          </button>

          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search items, biryani, coffee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Menu Items + Cart Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Menu Cards (2 Columns on Desktop) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredItems.length === 0 ? (
            <div className="col-span-full py-16 text-center text-zinc-400 bg-zinc-950 border border-zinc-800 rounded-3xl">
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
                  className={`bg-zinc-950 border rounded-3xl overflow-hidden transition-all duration-300 hover:border-zinc-500/80 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-black/70 group ${
                    isOutOfStock ? 'border-zinc-800/60 opacity-80' : 'border-zinc-800/90'
                  }`}
                >
                  {/* Food Image & Badges */}
                  <div className="relative h-44 w-full bg-zinc-900 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = item.isVeg
                          ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'
                          : 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format&fit=crop&q=80';
                      }}
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-105 filter brightness-95 group-hover:brightness-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent" />

                    {/* Veg / Non-Veg badge */}
                    <div className="absolute top-3 left-3 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-zinc-700/80 flex items-center gap-1.5 shadow-md">
                      <span
                        className={`w-2.5 h-2.5 rounded-full border flex items-center justify-center ${
                          item.isVeg ? 'border-zinc-300' : 'border-zinc-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.isVeg ? 'bg-zinc-200' : 'bg-zinc-400'
                          }`}
                        />
                      </span>
                      <span className="text-[10px] font-extrabold text-zinc-200 tracking-wider">
                        {item.isVeg ? 'VEG' : 'NON-VEG'}
                      </span>
                    </div>

                    {/* Prep time badge */}
                    <div className="absolute top-3 right-3 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-zinc-800 flex items-center gap-1 text-[10px] text-zinc-300 font-mono shadow-md">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>~{item.prepTimeMinutes}m</span>
                    </div>

                    {/* Stock status badge */}
                    <div className="absolute bottom-3 left-3">
                      {isOutOfStock ? (
                        <span className="px-2.5 py-1 rounded-lg bg-black/90 text-zinc-400 border border-zinc-800 text-[11px] font-bold shadow-md">
                          Out of Stock
                        </span>
                      ) : item.stock <= 5 ? (
                        <span className="px-2.5 py-1 rounded-lg bg-white text-black text-[11px] font-extrabold shadow-lg">
                          Only {item.stock} left
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-zinc-900/90 text-zinc-200 text-[10px] font-semibold border border-zinc-700/80 backdrop-blur-md">
                          {item.stock} in stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Food Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-extrabold text-white text-sm leading-snug group-hover:text-zinc-100">
                          {item.name}
                        </h4>
                        <span className="font-extrabold text-white font-mono text-base shrink-0">
                          ₹{item.price}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed font-normal">
                        {item.description}
                      </p>
                    </div>

                    {/* Action Button: Add to Cart OR "Notify Me" */}
                    <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                        {item.category}
                      </span>

                      {isOutOfStock ? (
                        <button
                          onClick={() => handleNotifyMe(item)}
                          disabled={isAlertSet}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                            isAlertSet
                              ? 'bg-zinc-800 text-white border border-zinc-700 cursor-default'
                              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700'
                          }`}
                        >
                          {isAlertSet ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white" /> Alert Set
                            </>
                          ) : (
                            <>
                              <BellRing className="w-3.5 h-3.5 text-zinc-400" /> Notify Me
                            </>
                          )}
                        </button>
                      ) : inCart ? (
                        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-xl p-1">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-xs text-white px-1.5 font-mono">
                            {inCart.quantity}
                          </span>
                          <button
                            onClick={() => addToCart(item)}
                            className="p-1 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-extrabold transition shadow-md active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5 text-black" /> Add
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
        <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl p-5 shadow-2xl backdrop-blur-md sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-white" />
              <h3 className="font-extrabold text-sm text-white">Your Prepaid Cart</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white text-black font-mono font-bold">
              {cart.reduce((sum, i) => sum + i.quantity, 0)} items
            </span>
          </div>

          {cart.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              <Utensils className="w-8 h-8 mx-auto text-zinc-700 mb-2 opacity-50" />
              Your tray is empty. Add delicious food from {currentCanteen?.name}!
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {/* Cart items list */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-xs"
                  >
                    <div className="flex-1 mr-2">
                      <div className="font-bold text-white">{item.name}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        ₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold text-white px-1 text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => addToCart(item)}
                        className="p-1 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total & Summary */}
              <div className="pt-3 border-t border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-zinc-200">₹{cartTotal}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Platform & Token Fee</span>
                  <span className="font-mono text-zinc-200">₹0 (Free)</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-zinc-800">
                  <span>Total Amount</span>
                  <span className="font-mono text-white text-base font-black">₹{cartTotal}</span>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Wallet')}
                    className={`p-2.5 rounded-2xl border text-left text-xs transition flex flex-col justify-between ${
                      paymentMethod === 'Wallet'
                        ? 'bg-white text-black border-white font-extrabold shadow-md'
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className={`text-[10px] ${paymentMethod === 'Wallet' ? 'text-zinc-800' : 'text-zinc-400'}`}>
                      Campus Wallet
                    </span>
                    <span className={`font-black mt-1 ${paymentMethod === 'Wallet' ? 'text-black' : 'text-zinc-200'}`}>
                      ₹{wallet ? wallet.balance.toFixed(0) : '0'} Bal
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-2.5 rounded-2xl border text-left text-xs transition flex flex-col justify-between ${
                      paymentMethod === 'UPI'
                        ? 'bg-white text-black border-white font-extrabold shadow-md'
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className={`text-[10px] ${paymentMethod === 'UPI' ? 'text-zinc-800' : 'text-zinc-400'}`}>
                      Fast UPI
                    </span>
                    <span className={`font-black mt-1 ${paymentMethod === 'UPI' ? 'text-black' : 'text-zinc-200'}`}>
                      Auto-Confirm
                    </span>
                  </button>
                </div>
              </div>

              {/* Guarantee notice */}
              <div className="p-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-[10px] text-zinc-400 leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-300 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-zinc-200">Stock reserved at payment.</strong> Instant token issued. Single-use token prevents queue-jumping.
                </span>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-white hover:bg-zinc-200 text-black font-black text-xs transition shadow-xl shadow-white/10 active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  'Issuing Token...'
                ) : (
                  <>
                    <span>Prepay & Get Token (₹{cartTotal})</span>
                    <ArrowRight className="w-4 h-4 text-black" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
