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
  Sparkles,
  Shield,
  ChefHat,
  User,
  Building
} from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';

export function Navbar({
  activeTab,
  setActiveTab,
  currentRole,
  setCurrentRole,
  wallet,
  notifications,
  unreadCount,
  onOpenWallet,
  onOpenVoice,
  onRefreshNotifications
}) {
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems = [
    { id: 'canteen', label: 'Canteen Menu', icon: Utensils },
    { id: 'queue', label: 'Live Queue & Token', icon: Clock, badge: 'C1-047' },
    { id: 'map', label: 'Campus Map', icon: MapPin },
    { id: 'lost-found', label: 'Lost & Found', icon: Search },
    { id: 'issues', label: 'Campus Issues', icon: AlertTriangle }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#A41034] shadow-md border-b border-[#880E2D] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[4.25rem] py-1.5">
          {/* Logo & Platform Title - Fully Contained Inside Box */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 p-0.5 shadow-sm flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white leading-tight">
                  Smart Campus Hub
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30 shrink-0">
                  Amrita Ettimadai
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-rose-100/90 leading-tight mt-0.5 truncate max-w-[270px] sm:max-w-none">
                Amrita Vishwa Vidyapeetham, Coimbatore • Food, Navigation & Issues
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs (When in Student mode on desktop md+) */}
          {currentRole === 'student' && (
            <nav className="hidden md:flex items-center gap-1 bg-black/15 p-1 rounded-xl border border-white/15">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition relative leading-none ${
                      isActive
                        ? 'bg-white text-[#A41034] font-bold shadow-sm'
                        : 'text-white/85 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                        isActive
                          ? 'bg-[#A41034]/15 text-[#A41034]'
                          : 'bg-white/20 text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Voice Guidance Button */}
            <button
              onClick={onOpenVoice}
              title="Voice Guidance Assistant"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-semibold transition group shadow-sm"
            >
              <Mic className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition" />
              <span className="hidden lg:inline">Voice Guide</span>
            </button>

            {/* Student Wallet Pill */}
            {currentRole === 'student' && wallet && (
              <button
                onClick={onOpenWallet}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-300/40 text-emerald-100 text-xs font-bold transition shadow-sm"
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-300" />
                <span>₹{wallet.balance.toFixed(0)}</span>
              </button>
            )}

            {/* Live Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 transition shadow-sm"
                title="Notifications"
              >
                <Bell className="w-4 h-4 shrink-0" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-900 text-[9px] font-black flex items-center justify-center animate-pulse">
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

            {/* Role Switcher Pill */}
            <div className="flex items-center p-0.5 bg-black/20 border border-white/20 rounded-xl">
              <button
                onClick={() => setCurrentRole('student')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  currentRole === 'student'
                    ? 'bg-white text-[#A41034] shadow-sm font-bold'
                    : 'text-white/80 hover:text-white'
                }`}
                title="Student / User Interface"
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">Student</span>
              </button>
              <button
                onClick={() => setCurrentRole('staff')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  currentRole === 'staff'
                    ? 'bg-white text-[#A41034] shadow-sm font-bold'
                    : 'text-white/80 hover:text-white'
                }`}
                title="Kitchen & Counter Staff Panel"
              >
                <ChefHat className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">Staff</span>
              </button>
              <button
                onClick={() => setCurrentRole('admin')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  currentRole === 'admin'
                    ? 'bg-white text-[#A41034] shadow-sm font-bold'
                    : 'text-white/80 hover:text-white'
                }`}
                title="Campus Admin Panel"
              >
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Navigation Row for Mobile, Tablet & Mid-size viewports */}
        {currentRole === 'student' && (
          <div className="flex md:hidden items-center justify-around py-2 border-t border-[#880E2D] text-[11px] overflow-x-auto gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg shrink-0 font-medium ${
                    isActive ? 'bg-white text-[#A41034] font-bold shadow-sm' : 'text-white/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-white/20 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
