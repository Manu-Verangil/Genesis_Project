import React, { useState, useEffect } from 'react';
import { Wallet, ShieldCheck, ShoppingBag, Calendar, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../api';

export function StudentSpendingWidget() {
  const [spendingData, setSpendingData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSpending = async () => {
    setLoading(true);
    try {
      const res = await api.getStudentSpending();
      if (res.success && res.data) {
        setSpendingData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch student spending stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpending();
  }, []);

  const history = spendingData?.spendingHistory || [];
  const totalSpent = spendingData?.totalSpentAmount || 0;
  const orderCount = spendingData?.orderCount || history.length || 0;
  const avgOrderVal = orderCount > 0 ? (totalSpent / orderCount).toFixed(0) : 0;

  return (
    <div className="space-y-5">
      {/* Privacy Guard Assurance Banner */}
      <div className="bg-[#E8F5E9] border border-[#A3D9B5] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#198754]/20 text-[#198754] shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-[#198754] text-sm">Privacy Guard Active</h4>
            <p className="text-[#198754]/90 text-[11px] mt-0.5">
              Only high-level non-sensitive purchase metrics (Order ID, Total, Date) are recorded. Zero banking credentials, card numbers, or UPI PINs are collected.
            </p>
          </div>
        </div>
        <button
          onClick={fetchSpending}
          className="px-3 py-1.5 rounded-xl bg-[#198754] hover:bg-[#146c43] text-white font-semibold text-[11px] transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E8E3D7] rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-[#EBF3FE] text-[#0D6EFD] border border-[#A2C8FD] shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Spent</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-0.5 block">₹{totalSpent}</span>
          </div>
        </div>

        <div className="bg-white border border-[#E8E3D7] rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-[#FFF0F4] text-[#B0003A] border border-[#F8C0CE] shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Orders Placed</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-0.5 block">{orderCount}</span>
          </div>
        </div>

        <div className="bg-white border border-[#E8E3D7] rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-[#FFF2E6] text-[#FD7E14] border border-[#FECB9F] shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Avg Order Value</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-0.5 block">₹{avgOrderVal}</span>
          </div>
        </div>
      </div>

      {/* Spending History Table */}
      <div className="bg-white border border-[#E8E3D7] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E3D7]/60">
          <h3 className="font-extrabold text-sm text-[#B0003A] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#B0003A]" />
            <span>Order Spending History</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-500">{history.length} Record(s)</span>
        </div>

        {history.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No order spending recorded yet. Place a canteen order to see your aggregate spending breakdown.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-[#FAF7F0] text-[11px] text-slate-500 uppercase font-semibold border-b border-[#E8E3D7]">
                <tr>
                  <th className="py-2.5 px-3">Token / Order ID</th>
                  <th className="py-2.5 px-3">Canteen</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E3D7]/60">
                {history.map((item, idx) => (
                  <tr key={item.orderId || idx} className="hover:bg-[#FAF7F0] transition">
                    <td className="py-3 px-3 font-mono text-[#0D6EFD] font-bold">
                      #{item.token || item.orderId?.substring(0, 8)}
                    </td>
                    <td className="py-3 px-3 text-slate-900 font-semibold">{item.canteenName || 'Campus Canteen'}</td>
                    <td className="py-3 px-3 text-slate-500">
                      {item.date ? new Date(item.date).toLocaleString() : 'Recent'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{item.itemsCount || 1} Item(s)</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#198754]">
                      ₹{item.orderTotal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
