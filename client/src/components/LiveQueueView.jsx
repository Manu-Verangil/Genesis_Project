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
    <div className="space-y-6 text-slate-800">
      {/* Canteen Selector & Live Queue Header */}
      <div className="bg-white border border-[#E8E3D7] rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {canteens.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCanteenId(c.id)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition ${
                  selectedCanteenId === c.id
                    ? 'bg-[#B0003A] text-white border-[#B0003A] shadow-sm font-bold'
                    : 'bg-slate-50 text-slate-700 border-[#E8E3D7] hover:bg-slate-100'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#198754] animate-pulse" />
              Live Feed Active
            </span>
            <button
              onClick={handleManualRefresh}
              className={`p-2 rounded-xl bg-slate-50 border border-[#E8E3D7] text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition ${
                refreshing ? 'animate-spin text-[#B0003A]' : ''
              }`}
              title="Refresh queue"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Queue Board + Live Wait-Time Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Live Token Display Board */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#E8E3D7] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E3D7]">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <span>Live Token Queue Board</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#FFF0F4] text-[#B0003A] border border-[#F8C0CE] font-bold">
                    Live Token Engine
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time kitchen status & queue sequence for {currentCanteen?.name}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Synchronizing kitchen queue...
              </div>
            ) : !queueData ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No active orders in this canteen right now.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {/* 1. SERVING (Success / Vegetarian - Green #198754) */}
                {queueData.serving && queueData.serving.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#198754]">
                      Now Serving At Pickup Counter
                    </span>
                    <div className="mt-1.5 space-y-2">
                      {queueData.serving.map((o) => (
                        <div
                          key={o.id}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-[#E8F5E9] border border-[#A3D9B5] text-slate-900 shadow-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-black font-mono tracking-wider text-[#198754]">
                              {o.token}
                            </span>
                            <div>
                              <div className="text-xs font-bold text-slate-900">
                                {o.studentName}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {o.items.map((i) => `${i.name} (${i.quantity})`).join(', ')}
                              </div>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-[#198754] text-white tracking-wide uppercase animate-pulse shadow-xs">
                            SERVING
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. READY (Information - Blue #0D6EFD) */}
                {queueData.ready && queueData.ready.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D6EFD]">
                      Ready For Collection (Please Proceed to Counter)
                    </span>
                    <div className="mt-1.5 space-y-2">
                      {queueData.ready.map((o) => (
                        <div
                          key={o.id}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-[#EBF3FE] border border-[#A2C8FD] text-slate-900 shadow-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-black font-mono tracking-wider text-[#0D6EFD]">
                              {o.token}
                            </span>
                            <div>
                              <div className="text-xs font-bold text-slate-900">{o.studentName}</div>
                              <div className="text-[10px] text-slate-500">
                                {o.items.map((i) => `${i.name} (${i.quantity})`).join(', ')}
                              </div>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0D6EFD] text-white uppercase shadow-xs">
                            READY
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. COOKING (Warning - Orange #FD7E14) */}
                {queueData.cooking && queueData.cooking.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FD7E14]">
                      Cooking In Kitchen
                    </span>
                    <div className="mt-1.5 space-y-2">
                      {queueData.cooking.map((o) => {
                        const isYou = o.isCurrentUser;
                        return (
                          <div
                            key={o.id}
                            className={`flex items-center justify-between p-3.5 rounded-xl text-slate-900 transition ${
                              isYou
                                ? 'bg-[#FFF0F4] border-2 border-[#B0003A] shadow-xs'
                                : 'bg-[#FFF2E6] border border-[#FECB9F]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`text-xl font-black font-mono tracking-wider ${
                                  isYou ? 'text-[#B0003A]' : 'text-[#FD7E14]'
                                }`}
                              >
                                {o.token}
                              </span>
                              <div>
                                <div className="text-xs font-bold flex items-center gap-1.5">
                                  <span>{o.studentName}</span>
                                  {isYou && (
                                    <span className="px-2 py-0.5 rounded-full bg-[#B0003A] text-white text-[9px] font-extrabold uppercase">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {o.items.map((i) => `${i.name} (${i.quantity})`).join(', ')}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {isYou && (
                                <div className="text-right">
                                  <span className="text-sm font-extrabold text-[#B0003A] font-mono">
                                    ~{o.estimatedWaitMinutes} min
                                  </span>
                                  <div className="text-[9px] text-[#B0003A] font-medium">
                                    estimated wait
                                  </div>
                                </div>
                              )}
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                                  isYou
                                    ? 'bg-[#FFF0F4] text-[#B0003A] border border-[#F8C0CE] font-bold'
                                    : 'bg-[#FD7E14] text-white'
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

          {/* Wait-time Engine Card */}
          <div className="bg-white border border-[#E8E3D7] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E8E3D7]">
              <Zap className="w-4 h-4 text-[#B0003A]" />
              <h4 className="font-bold text-sm text-slate-900">
                How Live Wait-Time Prediction Works
              </h4>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-[#E8E3D7] space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#B0003A]">
                  <span className="w-4 h-4 rounded-full bg-[#FFF0F4] text-[#B0003A] flex items-center justify-center text-[10px] font-bold">
                    1
                  </span>
                  <span>Input Variables</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Orders ahead, item complexity (e.g. Biryani takes longer than tea), staff count on counter, and time of day.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-[#E8E3D7] space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                    2
                  </span>
                  <span>Dynamic ETA</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Wait = sum of prep times ahead, adjusted by kitchen throughput and rush-hour factor ({currentCanteen?.crowdLevel === 'Rush Hour' ? '1.5x' : '1.0x'}).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-[#E8E3D7] space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#198754]">
                  <span className="w-4 h-4 rounded-full bg-[#E8F5E9] text-[#198754] flex items-center justify-center text-[10px] font-bold">
                    3
                  </span>
                  <span>Live Updates</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Every order status change recalculates the ETA instantly. Alerts triggered automatically at "2 orders away".
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Single-use Token & QR Pass for YOUR order */}
        <div className="space-y-6">
          {queueData?.myOrder ? (
            <div className="bg-[#B0003A] text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#8F002E] text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider shadow-xs">
                YOUR ACTIVE PASS
              </div>

              <div className="text-center pt-2 pb-4">
                <span className="text-xs uppercase font-semibold text-[#F8C0CE] tracking-wider">
                  Pickup Token
                </span>
                <div className="text-4xl font-black font-mono text-white mt-1 tracking-wider">
                  {queueData.myOrder.token}
                </div>
                <p className="text-xs text-[#FFF0F4] mt-1">{queueData.myOrder.canteenName}</p>
              </div>

              {/* Dynamic Live Wait Card */}
              <div className="p-4 rounded-xl bg-white/10 border border-white/20 text-center my-3 backdrop-blur-xs">
                <div className="text-2xl font-black text-white font-mono">
                  ~{queueData.estimatedWait || queueData.myOrder.estimatedWaitMinutes} min
                </div>
                <div className="text-xs font-semibold text-[#FFF0F4] mt-0.5">
                  estimated wait
                </div>
                <div className="text-[11px] text-[#D4A017] mt-1 font-bold">
                  {queueData.ordersAhead || 4} orders ahead of you
                </div>
              </div>

              {/* QR Code Graphic */}
              <div className="flex flex-col items-center justify-center my-4 p-4 rounded-xl bg-white text-slate-900 shadow-sm">
                <div className="w-36 h-36 border-4 border-slate-900 p-2 flex items-center justify-center relative">
                  <div className="grid grid-cols-6 grid-rows-6 gap-1 w-full h-full p-1 bg-slate-50">
                    <div className="bg-slate-900 col-span-2 row-span-2" />
                    <div className="bg-slate-900 col-start-5 col-span-2 row-span-2" />
                    <div className="bg-slate-900 row-start-5 col-span-2 row-span-2" />
                    <div className="bg-slate-900 col-start-3 row-start-3" />
                    <div className="bg-slate-900 col-start-4 row-start-4" />
                    <div className="bg-slate-900 col-start-4 row-start-2" />
                    <div className="bg-slate-900 col-start-3 row-start-5" />
                    <div className="bg-slate-900 col-start-5 row-start-4" />
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-800 mt-2">
                  SCAN AT COUNTER
                </span>
                <span className="text-[9px] text-slate-500">Single-use encrypted token</span>
              </div>

              {/* Order Items */}
              <div className="pt-2 border-t border-rose-300/30 text-xs">
                <span className="text-[#F8C0CE] text-[11px]">Items in Order:</span>
                <ul className="mt-1 space-y-1">
                  {queueData.myOrder.items.map((i, idx) => (
                    <li key={idx} className="flex justify-between text-white">
                      <span>
                        {i.name} × {i.quantity}
                      </span>
                      <span className="font-mono text-[#F8C0CE]">₹{i.price * i.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 pt-3 border-t border-rose-300/30 flex items-center justify-between text-[11px] text-[#F8C0CE]">
                <span>Paid via {queueData.myOrder.paymentMethod}</span>
                <span className="font-bold text-white text-sm">₹{queueData.myOrder.totalAmount}</span>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E8E3D7] rounded-2xl p-6 text-center shadow-xs">
              <QrCode className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h4 className="font-bold text-slate-900 text-sm">No Active Pickup Token</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Order food in advance to get your digital queue pass, track live wait times, and skip the physical counter rush!
              </p>
              <button
                onClick={onNavigateToMenu}
                className="mt-4 px-4 py-2 rounded-xl bg-[#B0003A] hover:bg-[#8F002E] text-white text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-xs"
              >
                <span>Browse Live Menu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Guaranteed Anti-Queue Jumping Policy */}
          <div className="p-4 rounded-xl bg-white border border-[#E8E3D7] text-xs space-y-2 shadow-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-[#198754]" />
              <span>Fair Queue & Token Policy</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
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
