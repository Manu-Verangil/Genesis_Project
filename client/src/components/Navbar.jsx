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
    <header className="sticky top-0 z-40 bg-[#B0003A] shadow-md border-b border-[#8F002E] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[4rem] py-2 gap-3">
          {/* Logo & Platform Title - Fully Contained Inside Box */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 p-0.5 shadow-sm flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#D4A017]" />
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
              <p className="text-[10px] sm:text-[11px] font-medium text-rose-100/90 leading-tight mt-0.5 truncate max-w-[230px] sm:max-w-md">
                Amrita Vishwa Vidyapeetham, Coimbatore • Food, Navigation & Issues
              </p>
            </div>
          </div>

          {/* Right Action Controls: Voice, Wallet, Notifications, and Role Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Voice Guidance Button */}
            <button
              onClick={onOpenVoice}
              title="Voice Guidance Assistant"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-semibold transition group shadow-sm shrink-0"
            >
              <Mic className="w-3.5 h-3.5 text-[#D4A017] group-hover:scale-110 transition" />
              <span className="hidden sm:inline">Voice Guide</span>
            </button>

            {/* Student Wallet Pill */}
            {currentRole === 'student' && wallet && (
              <button
                onClick={onOpenWallet}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#198754]/30 hover:bg-[#198754]/45 border border-[#198754]/50 text-white text-xs font-bold transition shadow-sm shrink-0"
              >
                <Wallet className="w-3.5 h-3.5 text-[#A3D9B5]" />
                <span>₹{Number(wallet?.balance ?? 0).toFixed(0)}</span>
              </button>
            )}

            {/* Live Notification Bell */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 transition shadow-sm"
                title="Notifications"
              >
                <Bell className="w-4 h-4 shrink-0" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D4A017] text-slate-900 text-[9px] font-black flex items-center justify-center animate-pulse">
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

            {/* Role Switcher Pill - Always visible at top right without overflow */}
            <div className="flex items-center p-0.5 bg-black/25 border border-white/25 rounded-xl shrink-0 shadow-sm">
              <button
                onClick={() => setCurrentRole('student')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  currentRole === 'student'
                    ? 'bg-white text-[#B0003A] shadow-sm font-bold'
                    : 'text-white/80 hover:text-white'
                }`}
                title="Student / User Interface"
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Student</span>
              </button>
              <button
                onClick={() => setCurrentRole('staff')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  currentRole === 'staff'
                    ? 'bg-white text-[#B0003A] shadow-sm font-bold'
                    : 'text-white/80 hover:text-white'
                }`}
                title="Kitchen & Counter Staff Panel"
              >
                <ChefHat className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Staff</span>
              </button>
              <button
                onClick={() => setCurrentRole('admin')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  currentRole === 'admin'
                    ? 'bg-white text-[#B0003A] shadow-sm font-bold'
                    : 'text-white/80 hover:text-white'
                }`}
                title="Campus Admin Panel"
              >
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Sub-Bar (Dedicated Amrita-style Navigation Row) */}
      {currentRole === 'student' && (
        <div className="bg-[#8F002E] border-t border-[#730025] shadow-inner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1 sm:gap-2 py-2 overflow-x-auto scrollbar-thin">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition shrink-0 ${
                      isActive
                        ? 'bg-white text-[#B0003A] font-bold shadow-sm'
                        : 'text-white/85 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                          isActive
                            ? 'bg-[#B0003A]/15 text-[#B0003A]'
                            : 'bg-white/20 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
