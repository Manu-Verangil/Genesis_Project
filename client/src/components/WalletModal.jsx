import React, { useState } from 'react';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, X, CheckCircle, ShieldCheck, Smartphone } from 'lucide-react';
import { api } from '../api';

const TOPUP_UPI_VPA = 'amritacampushub@upi';

function TopupQr({ amount, size = 140 }) {
  const value = `upi://pay?pa=${TOPUP_UPI_VPA}&pn=Amrita+Campus+Hub&am=${amount}&cu=INR&tn=Wallet+Top-up`;
  const modules = 21;
  const cell = Math.floor(size / modules);
  const actualSize = cell * modules;

  const grid = React.useMemo(() => {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
    }
    const result = [];
    for (let row = 0; row < modules; row++) {
      const rowArr = [];
      for (let col = 0; col < modules; col++) {
        const inFinder = (row < 7 && col < 7) || (row < 7 && col >= modules - 7) || (row >= modules - 7 && col < 7);
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
  }, [value]);

  return (
    <svg width={actualSize} height={actualSize} viewBox={`0 0 ${actualSize} ${actualSize}`} style={{ display: 'block' }}>
      <rect width={actualSize} height={actualSize} fill="white" />
      {grid.map((row, ri) =>
        row.map((on, ci) =>
          on ? <rect key={`${ri}-${ci}`} x={ci * cell} y={ri * cell} width={cell} height={cell} fill="#111" /> : null
        )
      )}
    </svg>
  );
}

export function WalletModal({ isOpen, onClose, wallet, onWalletUpdated }) {
  const [topUpAmount, setTopUpAmount] = useState('200');
  const [paymentMode, setPaymentMode] = useState('upi'); // 'upi' or 'card'
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen || !wallet) return null;

  const handleTopUp = async (e) => {
    e.preventDefault();
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) return;

    setIsProcessing(true);
    try {
      const res = await api.topUpWallet(topUpAmount);
      if (res.success) {
        setSuccessMessage(`₹${topUpAmount} credited successfully to campus wallet!`);
        onWalletUpdated(res.data);
        setTimeout(() => {
          setSuccessMessage('');
          setTopUpAmount('200');
        }, 2500);
      }
    } catch (err) {
      alert('Top up failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white border border-[#E8E3D7] rounded-2xl shadow-2xl p-6 overflow-hidden text-slate-800">        <div className="flex items-center justify-between pb-4 border-b border-[#E8E3D7]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FFF0F4] text-[#B0003A] border border-[#F8C0CE]">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Smart Campus Wallet</h3>
              <p className="text-xs text-slate-500">Prepaid orders & zero cash queues</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Card */}
        <div className="my-5 p-5 rounded-2xl bg-[#B0003A] text-white shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-[#F8C0CE]">
                Available Student Balance
              </span>
              <div className="text-3xl font-extrabold text-white mt-1 font-mono">
                ₹{Number(wallet?.balance ?? 0).toFixed(2)}
              </div>
              <p className="text-xs text-[#FFF0F4] mt-1">{wallet.studentName}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-semibold border border-white/30 flex items-center gap-1 backdrop-blur-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4A017]" /> Instant Pay
            </span>
          </div>
        </div>

        {/* Top Up Form */}
        <form onSubmit={handleTopUp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Instant Top-up Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                min="10"
                step="10"
                required
                className="w-full pl-8 pr-4 py-2.5 bg-white border border-[#E8E3D7] rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#B0003A] shadow-xs"
              />
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="flex gap-2">
            {['100', '200', '500', '1000'].map((amt) => (
              <button
                type="button"
                key={amt}
                onClick={() => setTopUpAmount(amt)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition ${
                  topUpAmount === amt
                    ? 'bg-[#FFF0F4] text-[#B0003A] border-[#B0003A] font-bold shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-[#E8E3D7] hover:bg-slate-100'
                }`}
              >
                +₹{amt}
              </button>
            ))}
          </div>

          {/* Mode Selection */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setPaymentMode('upi')}
              className={`flex-1 py-2 text-xs rounded-xl border flex items-center justify-center gap-1.5 transition ${
                paymentMode === 'upi'
                  ? 'bg-[#FFF0F4] border-[#B0003A] text-[#B0003A] font-bold'
                  : 'bg-slate-50 border-[#E8E3D7] text-slate-600 hover:text-slate-900'
              }`}
            >
              UPI Auto-Debit
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode('card')}
              className={`flex-1 py-2 text-xs rounded-xl border flex items-center justify-center gap-1.5 transition ${
                paymentMode === 'card'
                  ? 'bg-[#FFF0F4] border-[#B0003A] text-[#B0003A] font-bold'
                  : 'bg-slate-50 border-[#E8E3D7] text-slate-600 hover:text-slate-900'
              }`}
            >
              RuPay / NetBanking
            </button>
          </div>

          {/* UPI QR — shown when UPI mode is selected */}
          {paymentMode === 'upi' && topUpAmount && parseFloat(topUpAmount) > 0 && (
            <div className="flex flex-col items-center gap-2 py-2">
              <p className="text-[11px] text-slate-500 font-semibold">
                Scan to add <strong className="text-[#B0003A]">₹{topUpAmount}</strong> to wallet
              </p>
              <div className="p-2.5 bg-white border-2 border-[#E8E3D7] rounded-xl shadow-inner inline-block">
                <TopupQr amount={topUpAmount} size={140} />
              </div>
              <p className="text-[10px] text-slate-400 font-mono">{TOPUP_UPI_VPA}</p>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((n) => (
                  <span key={n} className="px-2 py-0.5 rounded-full bg-slate-100 border border-[#E8E3D7] font-medium">
                    {n}
                  </span>
                ))}
              </div>
            </div>
          )}

          {paymentMode === 'card' && (
            <div className="p-3 bg-slate-50 border border-[#E8E3D7] rounded-xl text-xs text-slate-500 text-center">
              <Smartphone className="w-5 h-5 mx-auto mb-1 text-slate-400" />
              NetBanking / RuPay redirect will open in the bank's secure portal.
            </div>
          )}

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-2.5 rounded-xl bg-[#B0003A] hover:bg-[#8F002E] text-white font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? 'Processing Transaction...' : <><Plus className="w-4 h-4" /> Add Money to Wallet</>}
          </button>

          {successMessage && (
            <div className="p-2.5 rounded-xl bg-[#E8F5E9] border border-[#A3D9B5] text-[#198754] text-xs flex items-center gap-2 animate-in fade-in font-medium">
              <CheckCircle className="w-4 h-4 shrink-0 text-[#198754]" />
              <span>{successMessage}</span>
            </div>
          )}
        </form>

        {/* Recent Transactions */}
        <div className="mt-5 pt-4 border-t border-[#E8E3D7]">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
            Recent Wallet History
          </h4>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {wallet.transactions?.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-[#E8E3D7] text-xs"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1 rounded-md ${
                      tx.type === 'credit'
                        ? 'bg-[#E8F5E9] text-[#198754]'
                        : 'bg-[#FFF0F4] text-[#B0003A]'
                    }`}
                  >
                    {tx.type === 'credit' ? (
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{tx.description}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-semibold font-mono ${
                    tx.type === 'credit' ? 'text-[#198754]' : 'text-slate-700'
                  }`}
                >
                  {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
