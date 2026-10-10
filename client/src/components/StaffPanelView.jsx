import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  CheckCircle,
  Clock,
  QrCode,
  ShieldCheck,
  Plus,
  Minus,
  AlertCircle,
  Bell,
  RefreshCw,
  Sparkles,
  Users,
  Search,
  Check
} from 'lucide-react';
import { api } from '../api';

export function StaffPanelView({ canteens, selectedCanteenId, setSelectedCanteenId, onDataUpdated }) {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tokenInput, setTokenInput] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'stock', 'verify'

  const currentCanteen = canteens.find((c) => c.id === selectedCanteenId) || canteens[0];

  const fetchStaffData = async () => {
    try {
      const [ordersRes, menuRes] = await Promise.all([
        api.getOrders({ canteenId: selectedCanteenId }),
        api.getMenu({ canteenId: selectedCanteenId })
      ]);
      if (ordersRes.success) setOrders(ordersRes.data);
      if (menuRes.success) setMenuItems(menuRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
    const interval = setInterval(fetchStaffData, 5000);
    return () => clearInterval(interval);
  }, [selectedCanteenId]);

  // Update order status (Slide 6: Receive & process orders)
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await api.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        fetchStaffData();
        onDataUpdated();
      }
    } catch (err) {
      alert('Error updating order: ' + err.message);
    }
  };

  // Verify pickup token (Slide 6 & 7: Verify tokens at pickup, single-use check)
  const handleVerifyToken = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    try {
      const res = await api.verifyToken(tokenInput.trim(), selectedCanteenId);
      setVerificationResult(res);
      if (res.success) {
        setTokenInput('');
        fetchStaffData();
        onDataUpdated();
      }
    } catch (err) {
      setVerificationResult({
        success: false,
        message: err.message || 'Verification error'
      });
    }
  };

  // Adjust stock quantity (Slide 6: Update stock)
  const handleAdjustStock = async (item, delta) => {
    const newStock = Math.max(0, item.stock + delta);
    try {
      const res = await api.updateMenuItem(item.id, { stock: newStock });
      if (res.success) {
        setMenuItems((prev) => prev.map((m) => (m.id === item.id ? res.data : m)));
        onDataUpdated();
      }
    } catch (err) {
      alert('Error adjusting stock: ' + err.message);
    }
  };

  // Update crowd level (Slide 4 & 6)
  const handleUpdateCrowd = async (level) => {
    try {
      const res = await api.updateCrowdLevel(selectedCanteenId, level);
      if (res.success) {
        onDataUpdated();
      }
    } catch (err) {
      alert('Error updating crowd: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Staff Header & Canteen Counter Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                <span>Kitchen & Counter Staff Operations Panel</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Slide 6 Staff Role
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Process orders, verify pickup tokens, manage live quantities, and set counter crowd
              </p>
            </div>
          </div>

          {/* Canteen counter toggle */}
          <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl border border-slate-700">
            {canteens.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCanteenId(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedCanteenId === c.id
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Live Crowd Level Controls (Slide 4) */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300 font-semibold">Counter Crowd Status:</span>
          </div>

          <div className="flex items-center gap-2">
            {['Low', 'Moderate', 'Busy', 'Rush Hour'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => handleUpdateCrowd(lvl)}
                className={`px-3 py-1 rounded-lg font-semibold border transition ${
                  currentCanteen?.crowdLevel === lvl
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Staff Function Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Active Kitchen Queue ({orders.filter((o) => o.status !== 'collected').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('verify')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'verify'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Verify Pickup Token (Single-Use Scanner)</span>
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'stock'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Live Stock Management & Restock</span>
        </button>
      </div>

      {/* TAB 1: KITCHEN ORDER PROCESSING QUEUE */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders
              .filter((o) => o.status !== 'collected')
              .map((order) => {
                const isReady = order.status === 'ready';
                const isCooking = order.status === 'cooking';
                const isServing = order.status === 'serving';

                return (
                  <div
                    key={order.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between"
                  >
                    <div>
                      {/* Header with Token & Status */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <span className="text-2xl font-black font-mono text-white tracking-wider">
                          {order.token}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            isServing
                              ? 'bg-emerald-500 text-slate-950 animate-pulse'
                              : isReady
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="text-xs font-bold text-slate-200">{order.studentName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Roll: {order.studentRoll} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="mt-3 space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                        {order.items.map((i, idx) => (
                          <div key={idx} className="flex justify-between text-slate-300 font-medium">
                            <span>
                              {i.name}
                            </span>
                            <span className="font-mono font-bold text-amber-400">×{i.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status Advancement Action Buttons (Slide 6) */}
                    <div className="mt-5 pt-3 border-t border-slate-800 flex gap-2">
                      {isCooking && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'ready')}
                          className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition flex items-center justify-center gap-1 shadow-md shadow-cyan-600/20"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>Mark Ready 🔔</span>
                        </button>
                      )}

                      {isReady && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'serving')}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Now Serving</span>
                        </button>
                      )}

                      {(isServing || isReady) && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'collected')}
                          className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition"
                        >
                          Mark Collected
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          {orders.filter((o) => o.status !== 'collected').length === 0 && (
            <div className="py-16 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
              All incoming food orders have been processed and collected! 🎉
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VERIFY PICKUP TOKEN AT COUNTER (Slide 6 & 7) */}
      {activeTab === 'verify' && (
        <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="text-center pb-4 border-b border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-2">
              <QrCode className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-base text-white">
              Single-Use Pickup Token Scanner
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Verify customer token code at the pickup window. Prevents queue-jumping and duplicate pickups.
            </p>
          </div>

          <form onSubmit={handleVerifyToken} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Enter Token Number (e.g. C1-043 or C1-047)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. C1-047"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-base font-bold placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition shadow-lg shadow-amber-600/30 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify</span>
                </button>
              </div>
            </div>

            {/* Quick Test Token Chips */}
            <div className="flex items-center gap-2 pt-1 text-xs">
              <span className="text-slate-400 text-[11px]">Quick click to verify:</span>
              {['C1-043', 'C1-044', 'C1-047'].map((tok) => (
                <button
                  key={tok}
                  type="button"
                  onClick={() => setTokenInput(tok)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-mono text-xs"
                >
                  {tok}
                </button>
              ))}
            </div>
          </form>

          {/* Verification Result Display */}
          {verificationResult && (
            <div
              className={`mt-5 p-4 rounded-xl border text-xs animate-in fade-in ${
                verificationResult.success
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {verificationResult.success ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h5 className="font-bold text-sm">
                    {verificationResult.success ? 'Verified & Collected!' : 'Verification Failed'}
                  </h5>
                  <p className="mt-1 leading-relaxed">{verificationResult.message}</p>

                  {verificationResult.data && (
                    <div className="mt-3 pt-2 border-t border-emerald-800/60 text-[11px] space-y-1">
                      <div className="font-bold text-white">
                        Student: {verificationResult.data.studentName} ({verificationResult.data.studentRoll})
                      </div>
                      <div className="text-emerald-300 font-mono">
                        Items: {verificationResult.data.items.map((i) => `${i.name} (×${i.quantity})`).join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LIVE STOCK MANAGEMENT & RESTOCK (Slide 6 & 4) */}
      {activeTab === 'stock' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h4 className="font-bold text-sm text-white">Live Kitchen Stock Counter</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Restocking any out-of-stock item automatically triggers the "Back in Stock" notification to waiting students!
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => {
              const isOutOfStock = item.stock <= 0;

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <div className="font-bold text-white leading-tight">{item.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">₹{item.price}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAdjustStock(item, -1)}
                      className="p-1 rounded-md bg-slate-700 text-slate-300 hover:text-white"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded-md min-w-[2.5rem] text-center ${
                        isOutOfStock
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-slate-900 text-white'
                      }`}
                    >
                      {item.stock}
                    </span>

                    <button
                      onClick={() => handleAdjustStock(item, 5)}
                      className="p-1 rounded-md bg-slate-700 text-slate-300 hover:text-white"
                      title="+5 portions"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
