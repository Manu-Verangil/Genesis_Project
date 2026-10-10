import React, { useState } from 'react';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, X, CheckCircle, ShieldCheck } from 'lucide-react';
import { api } from '../api';

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
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden text-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 text-[#A41034] border border-rose-200">
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
        <div className="my-5 p-5 rounded-2xl bg-[#A41034] text-white shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-rose-200">
                Available Student Balance
              </span>
              <div className="text-3xl font-extrabold text-white mt-1 font-mono">
                ₹{wallet.balance.toFixed(2)}
              </div>
              <p className="text-xs text-rose-100 mt-1">{wallet.studentName}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-semibold border border-white/30 flex items-center gap-1 backdrop-blur-xs">
              <ShieldCheck className="w-3.5 h-3.5" /> Instant Pay
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
                className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#A41034] shadow-xs"
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
                    ? 'bg-rose-50 text-[#A41034] border-[#A41034] font-bold shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
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
                  ? 'bg-rose-50 border-[#A41034] text-[#A41034] font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              UPI Auto-Debit
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode('card')}
              className={`flex-1 py-2 text-xs rounded-xl border flex items-center justify-center gap-1.5 transition ${
                paymentMode === 'card'
                  ? 'bg-rose-50 border-[#A41034] text-[#A41034] font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              RuPay / NetBanking
            </button>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-2.5 rounded-xl bg-[#A41034] hover:bg-[#880E2D] text-white font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? 'Processing Transaction...' : <><Plus className="w-4 h-4" /> Add Money to Wallet</>}
          </button>

          {successMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in font-medium">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}
        </form>

        {/* Recent Transactions */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
            Recent Wallet History
          </h4>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {wallet.transactions?.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1 rounded-md ${
                      tx.type === 'credit'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-[#A41034]'
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
                    tx.type === 'credit' ? 'text-emerald-700' : 'text-slate-700'
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
