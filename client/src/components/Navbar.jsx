import React, { useState } from 'react';
import {
  Utensils,
  Clock,
  MapPin,
  Search,
  AlertTriangle,
  Wallet,
  Bell,
  Mic,
  Shield,
  User,
  ChefHat,
  Sparkles,
  Layers
} from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';

export function Navbar({
  activeTab,
  setActiveTab,
  currentRole,
  setCurrentRole,
  wallet,
  notifications,
  onOpenWallet,
  onOpenVoice,
  onRefreshNotifications
}) {
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems = [
    { id: 'canteen', label: 'Canteen Menu', icon: Utensils },
    { id: 'queue', label: 'Live Queue & Token', icon: Clock, badge: 'C1-047' },
    { id: 'map', label: 'Campus Map', icon: MapPin },
    { id: 'lost-found', label: 'Lost & Found', icon: Search },
    { id: 'issues', label: 'Campus Issues', icon: AlertTriangle }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-purple-100 to-indigo-200 bg-clip-text text-transparent">
                  Smart Campus Hub
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Amrita Ettimadai
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Amrita Vishwa Vidyapeetham, Coimbatore • Food, Navigation & Issues
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs (When in Student mode) */}
          {currentRole === 'student' && (
            <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition relative ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-750'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Voice Guidance Button */}
            <button
              onClick={onOpenVoice}
              title="Voice Guidance Assistant"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-blue-600/20 text-slate-300 hover:text-blue-300 border border-slate-700 hover:border-blue-500/40 text-xs font-medium transition group"
            >
              <Mic className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition" />
              <span className="hidden lg:inline">Voice Guide</span>
            </button>

            {/* Student Wallet Pill */}
            {currentRole === 'student' && wallet && (
              <button
                onClick={onOpenWallet}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>₹{wallet.balance.toFixed(0)}</span>
              </button>
            )}

            {/* Live Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
              <NotificationDropdown
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                notifications={notifications}
                onNotificationsUpdated={onRefreshNotifications}
              />
            </div>

            {/* Role Switcher Pill (Slide 6: 3 Interfaces, One Platform) */}
            <div className="flex items-center p-0.5 bg-slate-800 border border-slate-700 rounded-xl">
              <button
                onClick={() => setCurrentRole('student')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  currentRole === 'student'
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Student / User Interface"
              >
                <User className="w-3 h-3" />
                <span className="hidden sm:inline">Student</span>
              </button>
              <button
                onClick={() => setCurrentRole('staff')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  currentRole === 'staff'
                    ? 'bg-amber-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Kitchen & Counter Staff Panel"
              >
                <ChefHat className="w-3 h-3" />
                <span className="hidden sm:inline">Staff</span>
              </button>
              <button
                onClick={() => setCurrentRole('admin')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  currentRole === 'admin'
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Campus Admin Panel"
              >
                <Shield className="w-3 h-3" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        {currentRole === 'student' && (
          <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800 text-[11px] overflow-x-auto gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg shrink-0 font-medium ${
                    isActive ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
