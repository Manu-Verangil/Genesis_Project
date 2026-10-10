import React from 'react';
import { Bell, Check, Sparkles, Utensils, AlertTriangle, X } from 'lucide-react';
import { api } from '../api';

export function NotificationDropdown({ isOpen, onClose, notifications, onNotificationsUpdated }) {
  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationsRead();
      onNotificationsUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2 text-slate-800">
      <div className="flex items-center justify-between pb-3 border-b border-[#E8E3D7]">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#B0003A]" />
          <h4 className="font-bold text-sm text-slate-900">Campus Live Alerts</h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            className="text-[11px] text-[#B0003A] hover:text-[#8F002E] font-semibold transition"
          >
            Mark all read
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No active notifications right now.
          </div>
        ) : (
          notifications.map((n) => {
            const isOrder = n.type === 'order';
            const isStock = n.type === 'stock';
            const isIssue = n.type === 'issue';

            return (
              <div
                key={n.id}
                className={`p-3 rounded-xl border text-xs transition ${
                  n.read
                    ? 'bg-slate-50 border-[#E8E3D7] text-slate-600'
                    : 'bg-[#FFF0F4] border-[#F8C0CE] text-slate-900 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      isStock
                        ? 'bg-[#E8F5E9] text-[#198754]'
                        : isOrder
                        ? 'bg-[#FFF2E6] text-[#FD7E14]'
                        : 'bg-[#FFF0F4] text-[#B0003A]'
                    }`}
                  >
                    {isStock ? (
                      <Sparkles className="w-3.5 h-3.5" />
                    ) : isOrder ? (
                      <Utensils className="w-3.5 h-3.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{n.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">{n.message}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
