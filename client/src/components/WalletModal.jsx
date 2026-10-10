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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100">Smart Campus Wallet</h3>
              <p className="text-xs text-slate-400">Prepaid orders & zero cash queues</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Card */}
        <div className="my-5 p-5 rounded-2xl bg-gradient-to-br from-emerald-600/30 via-slate-800 to-slate-900 border border-emerald-500/40 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
                Available Student Balance
              </span>
              <div className="text-3xl font-extrabold text-white mt-1">
                ₹{wallet.balance.toFixed(2)}
              </div>
              <p className="text-xs text-slate-300 mt-1">{wallet.studentName}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Instant Pay
            </span>
          </div>
        </div>

        {/* Top Up Form */}
        <form onSubmit={handleTopUp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                className="w-full pl-8 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
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
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-semibold'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
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
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              UPI Auto-Debit
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode('card')}
              className={`flex-1 py-2 text-xs rounded-xl border flex items-center justify-center gap-1.5 transition ${
                paymentMode === 'card'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              RuPay / NetBanking
            </button>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? 'Processing Transaction...' : <><Plus className="w-4 h-4" /> Add Money to Wallet</>}
          </button>

          {successMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </form>

        {/* Recent Transactions */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
            Recent Wallet History
          </h4>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {wallet.transactions?.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-700/30 text-xs"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1 rounded-md ${
                      tx.type === 'credit'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {tx.type === 'credit' ? (
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-200">{tx.description}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-semibold ${
                    tx.type === 'credit' ? 'text-emerald-400' : 'text-slate-300'
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
