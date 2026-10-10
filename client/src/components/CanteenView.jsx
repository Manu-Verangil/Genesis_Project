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
      if (!item.name.toLowerCase().includes(q) && !item.description.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const categories = ['All', 'Meals', 'Breakfast', 'Snacks', 'Beverages'];

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
        // Trigger celebratory confetti
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

  // Crowd level colors
  const getCrowdBg = (crowd) => {
    switch (crowd) {
      case 'Low':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Moderate':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Busy':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Rush Hour':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Canteen Selector & Real-Time Crowd Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Canteen Switcher Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {canteens.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCanteenId(c.id)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold transition ${
                  selectedCanteenId === c.id
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                <Utensils className="w-4 h-4" />
                <div className="text-left">
                  <div>{c.name}</div>
                  <div className="text-[10px] font-normal opacity-80">{c.location}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Live Crowd & Wait Time Status (Slide 4 requirement) */}
          {currentCanteen && (
            <div className="flex items-center flex-wrap gap-3 bg-slate-800/90 p-3 rounded-xl border border-slate-700/60 text-xs">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400">Crowd Level:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-semibold border ${getCrowdBg(currentCanteen.crowdLevel)}`}>
                  {currentCanteen.crowdLevel}
                </span>
              </div>

              <div className="h-4 w-px bg-slate-700 hidden sm:block" />

              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-400">Avg Wait:</span>
                <span className="font-bold text-white font-mono">
                  ~{currentCanteen.avgWaitTimeMinutes} mins
                </span>
              </div>

              <div className="h-4 w-px bg-slate-700 hidden sm:block" />

              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-slate-400">Active Kitchen Orders:</span>
                <span className="font-bold text-amber-300 font-mono">
                  {currentCanteen.activeOrdersCount || 4}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Veg toggle */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
              vegOnly
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full border border-emerald-500 flex items-center justify-center p-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
            Veg Only
          </button>

          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search items, biryani, coffee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Menu Items + Cart Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Menu Cards (2 Columns on Desktop) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredItems.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
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
                  className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-700 flex flex-col justify-between ${
                    isOutOfStock ? 'border-rose-900/30 opacity-90' : 'border-slate-800'
                  }`}
                >
                  {/* Food Image & Badges */}
                  <div className="relative h-44 w-full bg-slate-800 overflow-hidden group">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                    {/* Veg / Non-Veg badge */}
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-md border border-slate-700 flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full border flex items-center justify-center ${
                          item.isVeg ? 'border-emerald-500' : 'border-rose-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                      </span>
                      <span className="text-[10px] font-semibold text-slate-200">
                        {item.isVeg ? 'Veg' : 'Non-Veg'}
                      </span>
                    </div>

                    {/* Prep time badge */}
                    <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-md border border-slate-700 flex items-center gap-1 text-[10px] text-cyan-300 font-mono">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      ~{item.prepTimeMinutes}m prep
                    </div>

                    {/* Stock status badge (Slide 4: In stock / out of stock, with quantity left) */}
                    <div className="absolute bottom-3 left-3">
                      {isOutOfStock ? (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-500/90 text-white text-[11px] font-bold shadow-md">
                          Out of Stock
                        </span>
                      ) : item.stock <= 5 ? (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/90 text-slate-950 text-[11px] font-bold shadow-md">
                          Only {item.stock} portions left!
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-950/90 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                          {item.stock} in stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Food Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-slate-100 text-sm leading-snug">
                          {item.name}
                        </h4>
                        <span className="font-extrabold text-white font-mono text-base shrink-0">
                          ₹{item.price}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Action Button: Add to Cart OR "Notify Me" (Slide 4) */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-400">
                        {item.category}
                      </span>

                      {isOutOfStock ? (
                        <button
                          onClick={() => handleNotifyMe(item)}
                          disabled={isAlertSet}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                            isAlertSet
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                              : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {isAlertSet ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Alert Active
                            </>
                          ) : (
                            <>
                              <BellRing className="w-3.5 h-3.5" /> Notify Me
                            </>
                          )}
                        </button>
                      ) : inCart ? (
                        <div className="flex items-center gap-2 bg-blue-600/20 border border-blue-500/40 rounded-xl p-1">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-xs text-white px-1.5 font-mono">
                            {inCart.quantity}
                          </span>
                          <button
                            onClick={() => addToCart(item)}
                            className="p-1 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-md shadow-blue-600/20"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Prepaid Cart & Token Checkout (Slide 4 & 7) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-sm text-white">Your Prepaid Cart</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
              {cart.reduce((sum, i) => sum + i.quantity, 0)} items
            </span>
          </div>

          {cart.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              <Utensils className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
              Your tray is empty. Add delicious food from {currentCanteen?.name}!
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {/* Cart items list */}
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/40 text-xs"
                  >
                    <div className="flex-1 mr-2">
                      <div className="font-semibold text-slate-200">{item.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        ₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 rounded-md bg-slate-700 text-slate-300 hover:text-white"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-white px-1 font-mono text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => addToCart(item)}
                        className="p-1 rounded-md bg-slate-700 text-slate-300 hover:text-white"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total & Summary */}
              <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-200">₹{cartTotal}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Platform & Token Fee</span>
                  <span className="font-mono text-emerald-400">₹0 (Free)</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-slate-800">
                  <span>Total Amount</span>
                  <span className="font-mono text-emerald-400 text-base">₹{cartTotal}</span>
                </div>
              </div>

              {/* Payment Mode Selector (Slide 4: Cart, wallet or UPI) */}
              <div className="pt-2">
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Wallet')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition flex flex-col justify-between ${
                      paymentMethod === 'Wallet'
                        ? 'bg-emerald-500/20 border-emerald-500 text-white font-semibold'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] text-slate-300">Campus Wallet</span>
                    <span className="font-bold text-emerald-400 mt-1">
                      ₹{wallet ? wallet.balance.toFixed(0) : '0'} Bal
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition flex flex-col justify-between ${
                      paymentMethod === 'UPI'
                        ? 'bg-blue-600/20 border-blue-500 text-white font-semibold'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] text-slate-300">Fast UPI</span>
                    <span className="font-bold text-blue-400 mt-1">Auto-Confirm</span>
                  </button>
                </div>
              </div>

              {/* Guarantee notice from Slide 7 */}
              <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/30 text-[10px] text-slate-400 leading-relaxed flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Stock reserved at payment.</strong> Instant token issued. Single-use token prevents queue-jumping.
                </span>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  'Issuing Token...'
                ) : (
                  <>
                    <span>Prepay & Get Token (₹{cartTotal})</span>
                    <ArrowRight className="w-4 h-4" />
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
