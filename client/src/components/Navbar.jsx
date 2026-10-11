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
  LogOut,
  LogIn,
  QrCode,
  ArrowLeft
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
  onRefreshNotifications,
  currentUser,
  onOpenLogin,
  onLogout,
  onGoBack,
  canGoBack,
  previousViewTitle,
  onNavigate
}) {
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems = [
    { id: 'canteen', label: 'Canteen Menu', icon: Utensils },
    {
      id: 'queue',
      label: currentRole === 'faculty' ? '⚡ Faculty Priority Queue' : 'Live Queue & Token',
      icon: Clock,
      badge: currentRole === 'faculty' ? 'C1-FAC-042' : 'C1-047'
    },
    {
      id: 'cook',
      label: 'Kitchen Cook (KDS)',
      icon: ChefHat,
      badge: currentRole === 'cook' ? 'Active' : 'Chef KDS'
    },
    {
      id: 'staff',
      label: 'Counter Staff',
      icon: QrCode,
      badge: currentRole === 'staff' ? 'Active' : 'Dispatch'
    },
    { id: 'map', label: 'Campus Map', icon: MapPin },
    { id: 'lost-found', label: 'Lost & Found', icon: Search },
    { id: 'issues', label: 'Campus Issues', icon: AlertTriangle },
    ...(currentUser && currentUser.role === 'student'
      ? [{ id: 'spending', label: 'Spending Tracker', icon: Wallet }]
      : [])
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#B0003A] shadow-md border-b border-[#8F002E] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[4rem] py-2 gap-3">
          {/* Logo, Platform Title & Go Back Option */}
          <div className="flex items-center gap-3 shrink-0">
            {canGoBack && onGoBack && (
              <button
                type="button"
                onClick={onGoBack}
                title={`Go back to ${previousViewTitle || 'previous view'}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white text-white hover:text-[#B0003A] border border-white/30 text-xs font-black transition shadow-sm shrink-0 active:scale-95 group"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span className="font-extrabold hidden xs:inline sm:inline">Go Back</span>
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 p-1 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/amrita-logo.svg" alt="Amrita Vishwa Vidyapeetham" className="w-8 h-8 object-contain brightness-0 invert" />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white leading-tight">
                  Smart Campus Hub
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30 shrink-0">
                  Amrita Ettimadai
                </span>
                {currentRole === 'faculty' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500 text-white border border-blue-400 shrink-0 shadow-xs animate-pulse">
                    ⚡ Priority VIP
                  </span>
                )}
                {currentRole === 'guest' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/25 text-amber-200 border border-amber-300/40 shrink-0">
                    Guest Visitor
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-rose-100/90 leading-tight mt-0.5 truncate max-w-[230px] sm:max-w-md">
                Amrita Vishwa Vidyapeetham, Coimbatore • Food, Navigation & Issues
              </p>
            </div>
          </div>

          {/* Right Action Controls: Voice, Cook/Staff Switches, Wallet, Notifications, Auth User */}
          <div className="flex items-center gap-2 shrink-0">
            {currentRole === 'cook' ? (
              <button
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('canteen', 'student');
                  } else {
                    setCurrentRole('student');
                    setActiveTab('canteen');
                  }
                }}
                title="Return to Student Menu"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/30 hover:bg-amber-500/40 border border-amber-300/40 text-amber-200 text-xs font-bold transition shadow-xs shrink-0"
              >
                <ChefHat className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Cook Station (Exit)</span>
              </button>
            ) : currentRole === 'staff' ? (
              <button
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('canteen', 'student');
                  } else {
                    setCurrentRole('student');
                    setActiveTab('canteen');
                  }
                }}
                title="Return to Student Menu"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-teal-500/30 hover:bg-teal-500/40 border border-teal-300/40 text-teal-200 text-xs font-bold transition shadow-xs shrink-0"
              >
                <QrCode className="w-3.5 h-3.5 text-teal-300" />
                <span className="hidden sm:inline">Counter Station (Exit)</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('cook', 'cook');
                    } else {
                      setCurrentRole('cook');
                      setActiveTab('cook');
                    }
                  }}
                  title="Switch to Kitchen Cook Portal"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 border border-amber-300/40 text-amber-200 text-xs font-bold transition shadow-xs shrink-0"
                >
                  <ChefHat className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">Cook 👨‍🍳</span>
                </button>
                <button
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('staff', 'staff');
                    } else {
                      setCurrentRole('staff');
                      setActiveTab('staff');
                    }
                  }}
                  title="Switch to Counter Staff Portal"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-500/25 hover:bg-teal-500/40 border border-teal-300/40 text-teal-200 text-xs font-bold transition shadow-xs shrink-0"
                >
                  <QrCode className="w-3.5 h-3.5 text-teal-300" />
                  <span className="hidden sm:inline">Staff 🏷️</span>
                </button>
              </div>
            )}

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
            {(currentRole === 'student' || currentRole === 'faculty') && wallet && (
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

            {/* Logged in User Profile or Login Button */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 pl-1 shrink-0">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-white leading-none">
                    {currentUser.role === 'guest' ? 'Guest Visitor' : currentUser.name}
                  </span>
                  <span className="text-[10px] font-mono text-amber-300 uppercase leading-tight">
                    {currentUser.role === 'guest' ? 'Visitor Session' : `${currentUser.role} (${currentUser.username})`}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-600/40 hover:bg-rose-600/60 border border-rose-300/40 text-rose-100 text-xs font-semibold transition shadow-sm"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition shrink-0"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Sub-Bar (Dedicated Amrita-style Navigation Row) */}
      {(currentRole === 'student' || currentRole === 'faculty' || currentRole === 'guest' || currentRole === 'cook' || currentRole === 'staff') && (
        <div className="bg-[#8F002E] border-t border-[#730025] shadow-inner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1 sm:gap-2 py-2 overflow-x-auto scrollbar-thin">
              {canGoBack && onGoBack && (
                <button
                  type="button"
                  onClick={onGoBack}
                  title={`Go back to ${previousViewTitle || 'previous view'}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-white/20 hover:bg-white text-white hover:text-[#B0003A] border border-white/40 shadow-xs transition shrink-0 active:scale-95 group mr-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                  <span>Back</span>
                </button>
              )}
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id || (item.id === 'cook' && currentRole === 'cook') || (item.id === 'staff' && currentRole === 'staff');
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'cook') {
                        if (onNavigate) onNavigate('cook', 'cook');
                        else {
                          setCurrentRole('cook');
                          setActiveTab('cook');
                        }
                      } else if (item.id === 'staff') {
                        if (onNavigate) onNavigate('staff', 'staff');
                        else {
                          setCurrentRole('staff');
                          setActiveTab('staff');
                        }
                      } else {
                        const nextRole = ((currentRole === 'cook' || currentRole === 'staff') && currentUser?.role !== currentRole)
                          ? 'student'
                          : currentRole;
                        if (onNavigate) {
                          onNavigate(item.id, nextRole);
                        } else {
                          if (nextRole !== currentRole) setCurrentRole(nextRole);
                          setActiveTab(item.id);
                        }
                      }
                    }}
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
