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
    <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-400" />
          <h4 className="font-bold text-sm text-white">Campus Live Alerts</h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition"
          >
            Mark all read
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
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
                    ? 'bg-slate-800/40 border-slate-800 text-slate-300'
                    : 'bg-slate-800 border-blue-500/40 text-white shadow-sm'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      isStock
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isOrder
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-rose-500/20 text-rose-400'
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
                      <span className="font-semibold text-slate-100">{n.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-300 mt-1 leading-relaxed text-[11px]">{n.message}</p>
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
