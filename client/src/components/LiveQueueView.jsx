import React, { useState, useEffect } from 'react';
import {
  Clock,
  QrCode,
  Flame,
  CheckCircle,
  AlertCircle,
  ChefHat,
  Bell,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { api } from '../api';

export function LiveQueueView({ canteens, selectedCanteenId, setSelectedCanteenId, onNavigateToMenu }) {
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQueue = async () => {
    try {
      const res = await api.getQueue(selectedCanteenId);
      if (res.success) {
        setQueueData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // Auto-refresh queue every 5 seconds to simulate real-time live synchronization!
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [selectedCanteenId]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchQueue();
  };

  const currentCanteen = canteens.find((c) => c.id === selectedCanteenId) || canteens[0];

  return (
    <div className="space-y-6">
      {/* Canteen Selector & Live Queue Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {canteens.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCanteenId(c.id)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition ${
                  selectedCanteenId === c.id
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Feed Active
            </span>
            <button
              onClick={handleManualRefresh}
              className={`p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition ${
                refreshing ? 'animate-spin text-blue-400' : ''
              }`}
              title="Refresh queue"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Queue Board (Slide 8) + Live Wait-Time Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Live Token Display Board matching Slide 8 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <span>Live Token Queue Board</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Live Token Engine
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time kitchen status & queue sequence for {currentCanteen?.name}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Synchronizing kitchen queue...
              </div>
            ) : !queueData ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No active orders in this canteen right now.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {/* 1. SERVING (Slide 8: C1-043 SERVING) */}
                {queueData.serving && queueData.serving.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Now Serving At Pickup Counter
                    </span>
                    <div className="mt-1.5 space-y-2">
                      {queueData.serving.map((o) => (
                        <div
                          key={o.id}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 shadow-lg shadow-emerald-950/50 text-white"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-black font-mono tracking-wider text-emerald-300">
                              {o.token}
                            </span>
                            <div>
                              <div className="text-xs font-bold text-emerald-200">
                                {o.studentName}
                              </div>
                              <div className="text-[10px] text-emerald-400/80">
                                {o.items.map((i) => `${i.name} (${i.quantity})`).join(', ')}
                              </div>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-slate-950 tracking-wide uppercase animate-pulse">
                            SERVING
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. READY (Slide 8: C1-044 READY) */}
                {queueData.ready && queueData.ready.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                      Ready For Collection (Please Proceed to Counter)
                    </span>
                    <div className="mt-1.5 space-y-2">
                      {queueData.ready.map((o) => (
                        <div
                          key={o.id}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-white"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-black font-mono tracking-wider text-cyan-300">
                              {o.token}
                            </span>
                            <div>
                              <div className="text-xs font-bold text-cyan-200">{o.studentName}</div>
                              <div className="text-[10px] text-cyan-400/80">
                                {o.items.map((i) => `${i.name} (${i.quantity})`).join(', ')}
                              </div>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                            READY
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. COOKING (Slide 8: C1-045, C1-046, C1-047 YOU) */}
                {queueData.cooking && queueData.cooking.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Cooking In Kitchen
                    </span>
                    <div className="mt-1.5 space-y-2">
                      {queueData.cooking.map((o) => {
                        const isYou = o.isCurrentUser;
                        return (
                          <div
                            key={o.id}
                            className={`flex items-center justify-between p-3.5 rounded-xl text-white transition ${
                              isYou
                                ? 'bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border-2 border-blue-400 shadow-xl shadow-blue-900/50 pulse-glow'
                                : 'bg-slate-800/60 border border-slate-700/60'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`text-xl font-black font-mono tracking-wider ${
                                  isYou ? 'text-blue-300' : 'text-slate-200'
                                }`}
                              >
                                {o.token}
                              </span>
                              <div>
                                <div className="text-xs font-bold flex items-center gap-1.5">
                                  <span>{o.studentName}</span>
                                  {isYou && (
                                    <span className="px-2 py-0.2 rounded-full bg-blue-500 text-white text-[9px] font-extrabold uppercase">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {o.items.map((i) => `${i.name} (${i.quantity})`).join(', ')}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {isYou && (
                                <div className="text-right">
                                  <span className="text-sm font-extrabold text-blue-300 font-mono">
                                    ~{o.estimatedWaitMinutes} min
                                  </span>
                                  <div className="text-[9px] text-blue-400 font-medium">
                                    estimated wait
                                  </div>
                                </div>
                              )}
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                                  isYou
                                    ? 'bg-blue-500/20 text-blue-200 border border-blue-400/50'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                COOKING
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Wait-time Engine Card (Exact Breakdown from Slide 8) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Zap className="w-4 h-4 text-amber-400" />
              <h4 className="font-bold text-sm text-white">
                How Live Wait-Time Prediction Works
              </h4>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/50 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-blue-400">
                  <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>Input Variables</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Orders ahead, item complexity (e.g. Biryani takes longer than tea), staff count on counter, and time of day.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/50 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-indigo-400">
                  <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>Dynamic ETA</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Wait = sum of prep times ahead, adjusted by kitchen throughput and rush-hour factor ({currentCanteen?.crowdLevel === 'Rush Hour' ? '1.5x' : '1.0x'}).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/50 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px]">
                    3
                  </span>
                  <span>Live Updates</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Every order status change recalculates the ETA instantly. Alerts triggered automatically at "2 orders away".
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Single-use Token & QR Pass for YOUR order */}
        <div className="space-y-6">
          {queueData?.myOrder ? (
            <div className="bg-gradient-to-b from-blue-900/40 via-slate-900 to-slate-900 border-2 border-blue-500/60 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider shadow">
                YOUR ACTIVE PASS
              </div>

              <div className="text-center pt-2 pb-4">
                <span className="text-xs uppercase font-semibold text-blue-300 tracking-wider">
                  Pickup Token
                </span>
                <div className="text-4xl font-black font-mono text-white mt-1 tracking-wider text-shadow">
                  {queueData.myOrder.token}
                </div>
                <p className="text-xs text-slate-300 mt-1">{queueData.myOrder.canteenName}</p>
              </div>

              {/* Dynamic Live Wait Card from Slide 8 */}
              <div className="p-4 rounded-xl bg-slate-800/90 border border-blue-500/30 text-center my-3">
                <div className="text-2xl font-black text-cyan-300 font-mono">
                  ~{queueData.estimatedWait || queueData.myOrder.estimatedWaitMinutes} min
                </div>
                <div className="text-xs font-semibold text-slate-300 mt-0.5">
                  estimated wait
                </div>
                <div className="text-[11px] text-amber-400 mt-1 font-medium">
                  {queueData.ordersAhead || 4} orders ahead of you
                </div>
              </div>

              {/* QR Code Graphic (Slide 4: Unique token or QR per order, used once) */}
              <div className="flex flex-col items-center justify-center my-4 p-4 rounded-xl bg-white text-slate-950">
                <div className="w-36 h-36 border-4 border-slate-950 p-2 flex items-center justify-center relative">
                  {/* Generated QR visual pattern */}
                  <div className="grid grid-cols-6 grid-rows-6 gap-1 w-full h-full p-1 bg-slate-100">
                    <div className="bg-slate-950 col-span-2 row-span-2" />
                    <div className="bg-slate-950 col-start-5 col-span-2 row-span-2" />
                    <div className="bg-slate-950 row-start-5 col-span-2 row-span-2" />
                    <div className="bg-slate-950 col-start-3 row-start-3" />
                    <div className="bg-slate-950 col-start-4 row-start-4" />
                    <div className="bg-slate-950 col-start-4 row-start-2" />
                    <div className="bg-slate-950 col-start-3 row-start-5" />
                    <div className="bg-slate-950 col-start-5 row-start-4" />
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-800 mt-2">
                  SCAN AT COUNTER
                </span>
                <span className="text-[9px] text-slate-500">Single-use encrypted token</span>
              </div>

              {/* Order Items */}
              <div className="pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-400 text-[11px]">Items in Order:</span>
                <ul className="mt-1 space-y-1">
                  {queueData.myOrder.items.map((i, idx) => (
                    <li key={idx} className="flex justify-between text-slate-200">
                      <span>
                        {i.name} × {i.quantity}
                      </span>
                      <span className="font-mono text-slate-400">₹{i.price * i.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Paid via {queueData.myOrder.paymentMethod}</span>
                <span className="font-bold text-emerald-400">₹{queueData.myOrder.totalAmount}</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-xl">
              <QrCode className="w-12 h-12 mx-auto text-slate-600 mb-3 opacity-60" />
              <h4 className="font-bold text-white text-sm">No Active Pickup Token</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Order food in advance to get your digital queue pass, track live wait times, and skip the physical counter rush!
              </p>
              <button
                onClick={onNavigateToMenu}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition inline-flex items-center gap-1.5"
              >
                <span>Browse Live Menu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Guaranteed Anti-Queue Jumping Policy (Slide 7) */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Fair Queue & Token Policy</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              • Each token is valid <strong>once</strong> and for one designated canteen counter.
              <br />
              • Unclaimed orders expire after 20 minutes of ready status.
              <br />
              • Auto-refund is credited back to wallet if kitchen runs out of stock.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
