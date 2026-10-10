import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, Loader2, Smartphone, Scan, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

// UPI VPA to target for the demo QR
const CAMPUS_UPI_VPA = 'amritacampushub@upi';

function SvgQr({ value, size = 180 }) {
  // Minimal deterministic QR-like pattern built from the string hash.
  // NOT a real scannable QR — but looks authentic for demo/hackathon use.
  const modules = 21;
  const cell = Math.floor(size / modules);
  const actualSize = cell * modules;

  // Generate a pseudo-random but deterministic grid from the value string
  const grid = React.useMemo(() => {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
    }

    const result = [];
    for (let row = 0; row < modules; row++) {
      const rowArr = [];
      for (let col = 0; col < modules; col++) {
        // Finder patterns (corners)
        const inFinder =
          (row < 7 && col < 7) ||
          (row < 7 && col >= modules - 7) ||
          (row >= modules - 7 && col < 7);
        if (inFinder) {
          const r = row % 7;
          const c = col % (col < 7 ? 7 : modules - 7 - (col - (modules - 7)));
          const rr = row >= modules - 7 ? row - (modules - 7) : row;
          const cc = col >= modules - 7 ? col - (modules - 7) : col;
          const er = row < 7 ? row : rr;
          const ec = col < 7 ? col : col >= modules - 7 ? cc : c;
          const isOuter = er === 0 || er === 6 || ec === 0 || ec === 6;
          const isCenter = er >= 2 && er <= 4 && ec >= 2 && ec <= 4;
          rowArr.push(isOuter || isCenter ? 1 : 0);
        } else {
          // Pseudo-random data modules
          hash = (Math.imul(hash, 1664525) + 1013904223) | 0;
          rowArr.push((hash >>> 31) ^ ((row + col) % 3 === 0 ? 1 : 0) ? 1 : 0);
        }
      }
      result.push(rowArr);
    }
    return result;
  }, [value]);

  return (
    <svg
      width={actualSize}
      height={actualSize}
      viewBox={`0 0 ${actualSize} ${actualSize}`}
      style={{ display: 'block' }}
    >
      <rect width={actualSize} height={actualSize} fill="white" />
      {grid.map((row, ri) =>
        row.map((on, ci) =>
          on ? (
            <rect
              key={`${ri}-${ci}`}
              x={ci * cell}
              y={ri * cell}
              width={cell}
              height={cell}
              fill="#111"
            />
          ) : null
        )
      )}
    </svg>
  );
}

export function UpiPaymentModal({ isOpen, onClose, cart, cartTotal, canteenName, onConfirm }) {
  const [step, setStep] = useState('qr'); // 'qr' | 'processing' | 'done'
  const [countdown, setCountdown] = useState(5);
  const timerRef = useRef(null);

  const qrValue = `upi://pay?pa=${CAMPUS_UPI_VPA}&pn=Amrita+Campus+Hub&am=${cartTotal}&cu=INR&tn=${encodeURIComponent('Order at ' + canteenName)}`;

  useEffect(() => {
    if (!isOpen) {
      setStep('qr');
      setCountdown(5);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  const handleConfirmPayment = () => {
    setStep('processing');
    let t = 0;
    timerRef.current = setInterval(() => {
      t += 1;
      if (t >= 2) {
        clearInterval(timerRef.current);
        setStep('done');
        // Trigger the actual order creation after the 'done' animation
        setTimeout(() => {
          onConfirm();
        }, 800);
      }
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200">
              <Smartphone className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Pay via UPI</h3>
              <p className="text-[11px] text-slate-500">Scan with any UPI app</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          {step === 'qr' && (
            <div className="flex flex-col items-center gap-4">
              {/* Amount badge */}
              <div className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-3">
                <div>
                  <p className="text-[11px] text-slate-500 font-medium">{canteenName}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {cart.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                  </p>
                </div>
                <span className="font-black text-[#A41034] text-lg font-mono">₹{cartTotal}</span>
              </div>

              {/* QR Code */}
              <div className="relative p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-inner">
                <SvgQr value={qrValue} size={192} />
                {/* Center logo overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-[#A41034] border-4 border-white shadow-md flex items-center justify-center">
                    <span className="text-white font-black text-[10px]">A</span>
                  </div>
                </div>
              </div>

              {/* UPI VPA */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Scan className="w-3.5 h-3.5 text-slate-400" />
                <span>UPI ID: <strong className="text-slate-800 font-mono">{CAMPUS_UPI_VPA}</strong></span>
              </div>

              {/* App logos row */}
              <div className="flex items-center gap-3">
                {[
                  { name: 'GPay', color: '#4285F4', letter: 'G' },
                  { name: 'PhonePe', color: '#5F259F', letter: 'P' },
                  { name: 'Paytm', color: '#00B9F1', letter: 'T' },
                  { name: 'BHIM', color: '#00873D', letter: 'B' },
                ].map((app) => (
                  <div key={app.name} className="flex flex-col items-center gap-1">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm"
                      style={{ backgroundColor: app.color }}
                    >
                      {app.letter}
                    </div>
                    <span className="text-[9px] text-slate-500 font-medium">{app.name}</span>
                  </div>
                ))}
              </div>

              {/* Confirm button */}
              <button
                onClick={handleConfirmPayment}
                className="w-full py-3.5 rounded-2xl bg-[#A41034] hover:bg-[#880E2D] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-[#A41034]/20 transition active:scale-[0.98]"
              >
                <CheckCircle className="w-4 h-4" />
                I've Paid · Confirm Order
              </button>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>
                  Secured by <strong className="text-slate-700">Amrita Campus Pay</strong> · TLS encrypted
                </span>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 rounded-full bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-900 text-sm">Verifying Payment…</p>
                <p className="text-xs text-slate-500 mt-1">Connecting to UPI gateway</p>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="font-black text-emerald-700 text-base">Payment Successful!</p>
                <p className="text-xs text-slate-500 mt-1">Placing your order…</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
