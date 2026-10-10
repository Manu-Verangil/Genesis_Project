import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  Clock,
  QrCode,
  Utensils,
  ChevronRight,
  Receipt,
  Wallet,
  Smartphone,
  ShieldCheck,
  Download,
} from 'lucide-react';

function TokenQR({ token, size = 120 }) {
  // Same deterministic SVG QR as the UPI modal but smaller
  const modules = 17;
  const cell = Math.floor(size / modules);
  const actualSize = cell * modules;

  const grid = React.useMemo(() => {
    const val = `CAMPUS_TOKEN_${token}`;
    let hash = 0;
    for (let i = 0; i < val.length; i++) {
      hash = (Math.imul(31, hash) + val.charCodeAt(i)) | 0;
    }
    const result = [];
    for (let row = 0; row < modules; row++) {
      const rowArr = [];
      for (let col = 0; col < modules; col++) {
        const inFinder =
          (row < 7 && col < 7) ||
          (row < 7 && col >= modules - 7) ||
          (row >= modules - 7 && col < 7);
        if (inFinder) {
          const er = row < 7 ? row : row - (modules - 7);
          const ec = col < 7 ? col : col - (modules - 7);
          const isOuter = er === 0 || er === 6 || ec === 0 || ec === 6;
          const isCenter = er >= 2 && er <= 4 && ec >= 2 && ec <= 4;
          rowArr.push(isOuter || isCenter ? 1 : 0);
        } else {
          hash = (Math.imul(hash, 1664525) + 1013904223) | 0;
          rowArr.push((hash >>> 31) ^ ((row + col) % 3 === 0 ? 1 : 0) ? 1 : 0);
        }
      }
      result.push(rowArr);
    }
    return result;
  }, [token]);

  return (
    <svg width={actualSize} height={actualSize} viewBox={`0 0 ${actualSize} ${actualSize}`} style={{ display: 'block' }}>
      <rect width={actualSize} height={actualSize} fill="white" />
      {grid.map((row, ri) =>
        row.map((on, ci) =>
          on ? (
            <rect key={`${ri}-${ci}`} x={ci * cell} y={ri * cell} width={cell} height={cell} fill="#111" />
          ) : null
        )
      )}
    </svg>
  );
}

export function OrderReceiptScreen({ order, onGoToQueue, onDismiss }) {
  const [redirectCountdown, setRedirectCountdown] = useState(8);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!order) return;
    // Tiny delay so animation triggers
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, [order]);

  useEffect(() => {
    if (!order) return;
    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onGoToQueue();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [order, onGoToQueue]);

  if (!order) return null;

  const paymentMethodLabel = order.paymentMethod === 'UPI' ? 'UPI Pay' : 'Campus Wallet';
  const PaymentIcon = order.paymentMethod === 'UPI' ? Smartphone : Wallet;

  const txId = `TXN${String(Date.now()).slice(-10).toUpperCase()}`;
  const placedAt = order.createdAt
    ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div
        className={`relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ${visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
      >
        {/* Success Header */}
        <div className="relative bg-[#A41034] p-6 text-white overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute top-8 -right-2 w-16 h-16 rounded-full bg-white/10" />

          <div className="relative flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-rose-200 uppercase tracking-wider">Order Confirmed ✓</p>
              <h2 className="text-2xl font-black mt-1 font-mono tracking-tight">{order.token}</h2>
              <p className="text-xs text-rose-100 mt-0.5">{order.canteenName}</p>
            </div>
          </div>

          {/* Wait time pill */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-white/20 border border-white/30 rounded-full px-3 py-1 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" />
              ~{order.estimatedWaitMinutes || 8} min estimated
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 border border-white/30 rounded-full px-3 py-1 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Prepaid & Secured
            </div>
          </div>
        </div>

        {/* QR + Receipt Body */}
        <div className="p-5 space-y-4">
          {/* QR + Token section */}
          <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-xs">
              <TokenQR token={order.token} size={80} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5" /> Pickup Token QR
              </p>
              <p className="font-black text-3xl text-[#A41034] font-mono mt-1 leading-none">
                {order.token}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Show this token at the counter</p>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5" /> Order Items
            </p>
            <div className="space-y-1.5">
              {(order.items || []).map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100 last:border-b-0">
                  <span className="text-slate-700 font-medium">
                    {item.name}{' '}
                    <span className="text-slate-400 font-normal">×{item.quantity}</span>
                  </span>
                  <span className="font-mono font-bold text-slate-800">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bill Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5 text-xs">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5" /> Payment Summary
            </p>
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-mono">₹{order.totalAmount}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Platform Fee</span>
              <span className="font-mono font-bold">₹0 (Free)</span>
            </div>
            <div className="flex justify-between font-black text-slate-900 text-sm pt-1.5 border-t border-slate-200">
              <span>Total Paid</span>
              <span className="font-mono text-[#A41034]">₹{order.totalAmount}</span>
            </div>

            {/* Payment method row */}
            <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-200 text-slate-500">
              <PaymentIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Paid via <strong className="text-slate-700">{paymentMethodLabel}</strong></span>
              <span className="ml-auto text-[10px] text-slate-400 font-mono">{txId}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Placed at {placedAt}</div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-2">
            <button
              onClick={onGoToQueue}
              className="w-full py-3 rounded-2xl bg-[#A41034] hover:bg-[#880E2D] text-white font-black text-sm flex items-center justify-center gap-2 transition shadow-md shadow-[#A41034]/20 active:scale-[0.98]"
            >
              Track Live Queue <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onDismiss}
              className="w-full py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Save Receipt & Order More
            </button>
          </div>

          {/* Auto-redirect countdown */}
          <p className="text-center text-[11px] text-slate-400">
            Auto-redirecting to Live Queue in{' '}
            <span className="font-black text-[#A41034]">{redirectCountdown}s</span>…
          </p>
        </div>
      </div>
    </div>
  );
}
