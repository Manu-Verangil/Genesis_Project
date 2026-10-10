import React, { useState } from 'react';
import { Shield, User, ChefHat, Lock, AlertCircle, Sparkles, ArrowRight, X, UserCheck, Check } from 'lucide-react';
import { api } from '../api';

export function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestSubmitting, setIsGuestSubmitting] = useState(false);

  if (!isOpen) return null;

  const rolePerks = [
    {
      role: 'student',
      title: 'Student Portal',
      perk: 'Fast order tokening, live wait-time tracking, campus guide & personal spending tracker',
      icon: User,
      activeColor: 'ring-2 ring-[#A41034] border-[#A41034] bg-rose-100/90 text-[#A41034] shadow-md scale-[1.02]',
      normalColor: 'border-rose-200 bg-rose-50/80 text-[#A41034] hover:bg-rose-100/70 hover:scale-[1.01]'
    },
    {
      role: 'staff',
      title: 'Kitchen & Staff',
      perk: 'Kitchen Display System (KDS), order status progress controls & live stock toggling',
      icon: ChefHat,
      activeColor: 'ring-2 ring-amber-600 border-amber-600 bg-amber-100/90 text-amber-950 shadow-md scale-[1.02]',
      normalColor: 'border-amber-200 bg-amber-50/80 text-amber-900 hover:bg-amber-100/70 hover:scale-[1.01]'
    },
    {
      role: 'admin',
      title: 'Campus Admin',
      perk: 'Master inventory control, campus facility map updates & lost & found moderation',
      icon: Shield,
      activeColor: 'ring-2 ring-purple-600 border-purple-600 bg-purple-100/90 text-purple-950 shadow-md scale-[1.02]',
      normalColor: 'border-purple-200 bg-purple-50/80 text-purple-900 hover:bg-purple-100/70 hover:scale-[1.01]'
    },
    {
      role: 'guest',
      title: 'Guest Visitor',
      perk: 'Instant 1-click access to browse canteens, map & lost belongings with throw-away session',
      icon: UserCheck,
      activeColor: 'ring-2 ring-emerald-600 border-emerald-600 bg-emerald-100/90 text-emerald-950 shadow-md scale-[1.02]',
      normalColor: 'border-emerald-200 bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100/70 hover:scale-[1.01]'
    }
  ];

  const handleCardClick = (item) => {
    setSelectedRole(item.role);
    setErrorMessage('');
    if (item.role === 'guest') {
      handleGuestLogin();
    }
    // Zero credentials displayed or prefilled into inputs
  };

  const handleGuestLogin = async () => {
    setErrorMessage('');
    setIsGuestSubmitting(true);
    try {
      const res = await api.guestLogin();
      if (res.success && res.user) {
        onLoginSuccess(res.user);
        if (onClose) onClose();
      } else {
        setErrorMessage(res.message || 'Failed to initiate guest session');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to initiate guest session');
    } finally {
      setIsGuestSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Please enter both username/email and password');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.login({ identifier: identifier.trim(), password: password.trim() });
      if (res.success && res.user) {
        onLoginSuccess(res.user);
        if (onClose) onClose();
      } else {
        setErrorMessage(res.message || 'Invalid credentials');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4A0516]/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white border border-rose-100 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 my-8 text-slate-800">
        
        {/* Top Header Bar in Official Amrita Crimson */}
        <div className="bg-[#A41034] -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 p-6 mb-6 text-white flex items-center justify-between border-b border-[#880E2D]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 p-0.5 shadow-sm flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white leading-tight">Smart Campus Hub Portal</h3>
              <p className="text-xs text-rose-100/90 font-medium">Amrita Vishwa Vidyapeetham • Ettimadai Campus</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* System Capabilities & Animated Role Selectors */}
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#A41034] mb-2">
            Select Target Role Capability (Click card to select role)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rolePerks.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedRole === item.role;
              return (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleCardClick(item)}
                  className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-300 transform active:scale-95 flex items-start gap-3 relative overflow-hidden select-none ${
                    isSelected
                      ? `${item.activeColor} ring-2 shadow-lg`
                      : `${item.normalColor} hover:-translate-y-0.5 shadow-sm hover:shadow-md`
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 transition-colors duration-200 ${
                    isSelected ? 'bg-[#A41034] text-white shadow-sm' : 'bg-white/70 text-slate-700'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="w-full">
                    <div className="font-bold text-xs flex items-center justify-between gap-1">
                      <span className="truncate">{item.title}</span>
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#A41034] text-white uppercase shadow-sm animate-in zoom-in-75 duration-200 shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" /> Selected
                        </span>
                      ) : item.role === 'guest' ? (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-600 text-white uppercase shrink-0">1-Click</span>
                      ) : (
                        <span className="text-[9px] font-semibold text-slate-400 group-hover:text-slate-600 transition shrink-0">Select</span>
                      )}
                    </div>
                    <p className="text-[10px] opacity-90 leading-relaxed mt-1 font-normal">{item.perk}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prominent Guest Login Button */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={isGuestSubmitting}
            className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-[0.99]"
          >
            <UserCheck className="w-4 h-4" />
            <span>{isGuestSubmitting ? 'Launching Guest Session...' : 'Continue as Guest (1-Time Throw-Away Access)'}</span>
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-[#A41034] text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-[#A41034] shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Secure Credentials Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Username or Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Enter your campus username or email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#A41034] focus:ring-1 focus:ring-[#A41034] transition font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#A41034] focus:ring-1 focus:ring-[#A41034] transition font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-[#A41034] font-semibold"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-2xl bg-[#A41034] hover:bg-[#8B0D2A] text-white font-bold text-xs transition shadow-lg shadow-[#A41034]/25 flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In with Credentials</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
