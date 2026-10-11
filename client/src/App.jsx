import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CanteenView } from './components/CanteenView';
import { LiveQueueView } from './components/LiveQueueView';
import { CampusMapView } from './components/CampusMapView';
import { LostAndFoundView } from './components/LostAndFoundView';
import { CampusIssuesView } from './components/CampusIssuesView';
import { StaffPanelView } from './components/StaffPanelView';
import { AdminPanelView } from './components/AdminPanelView';
import { WalletModal } from './components/WalletModal';
import { VoiceGuidanceModal } from './components/VoiceGuidanceModal';
import { LoginModal } from './components/LoginModal';
import { StudentSpendingWidget } from './components/StudentSpendingWidget';
import { OrderReceiptScreen } from './components/OrderReceiptScreen';
import { Sparkles, User, GraduationCap, ChefHat, Shield, ArrowRight, ArrowLeft, QrCode } from 'lucide-react';
import { api } from './api';

export function App() {
  const [activeTab, setActiveTab] = useState('canteen'); // 'canteen', 'queue', 'map', 'lost-found', 'issues'
  const [currentRole, setCurrentRole] = useState('guest'); // 'guest', 'student', 'faculty', 'staff', 'admin'
  const [selectedCanteenId, setSelectedCanteenId] = useState('canteen-1');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(true); // Must start in logged-out mode!

  // Shared Data
  const [canteens, setCanteens] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Modals
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);

  // Navigation History Stack for "Go Back Option"
  const [navHistory, setNavHistory] = useState([]);

  // Campus Issue Map Redirection & Pinning State
  const [issueDraft, setIssueDraft] = useState(null);
  const [isMarkingIssueOnMap, setIsMarkingIssueOnMap] = useState(false);
  const [focusedIssueOnMap, setFocusedIssueOnMap] = useState(null);

  // Lost & Found Map Redirection & Pinning State
  const [lostFoundDraft, setLostFoundDraft] = useState(null);
  const [isMarkingLostFoundOnMap, setIsMarkingLostFoundOnMap] = useState(false);
  const [focusedLostFoundOnMap, setFocusedLostFoundOnMap] = useState(null);

  const handleNavigate = (newTab, newRole = null) => {
    const userRole = currentUser?.role || 'guest';

    // Strict Role-Based Access Control (RBAC) Hierarchy:
    if ((newTab === 'cook' || newRole === 'cook') && !['cook', 'admin'].includes(userRole)) {
      console.warn(`[RBAC] Access denied: role "${userRole}" cannot access Kitchen Cook terminal.`);
      return;
    }
    if ((newTab === 'staff' || newRole === 'staff') && !['staff', 'admin'].includes(userRole)) {
      console.warn(`[RBAC] Access denied: role "${userRole}" cannot access Counter Staff station.`);
      return;
    }
    if ((newTab === 'overview' || newRole === 'admin') && userRole !== 'admin') {
      console.warn(`[RBAC] Access denied: role "${userRole}" cannot access Campus Admin portal.`);
      return;
    }
    if (newTab === 'spending' && userRole !== 'student' && userRole !== 'admin') {
      console.warn(`[RBAC] Access denied: Spending tracker is restricted to students.`);
      return;
    }

    const targetRole = newRole !== null ? newRole : currentRole;
    if (newTab === activeTab && targetRole === currentRole) return;

    setNavHistory((prev) => [
      ...prev.slice(-20),
      { tab: activeTab, role: currentRole }
    ]);

    setActiveTab(newTab);
    if (newRole !== null && newRole !== currentRole) {
      setCurrentRole(newRole);
    }

    try {
      window.history.pushState({ tab: newTab, role: targetRole }, '', window.location.pathname);
    } catch (e) {}
  };

  const handleGoBack = () => {
    if (isMarkingIssueOnMap) {
      setIsMarkingIssueOnMap(false);
    }
    if (focusedIssueOnMap) {
      setFocusedIssueOnMap(null);
    }
    if (isMarkingLostFoundOnMap) {
      setIsMarkingLostFoundOnMap(false);
    }
    if (focusedLostFoundOnMap) {
      setFocusedLostFoundOnMap(null);
    }

    if (navHistory.length > 0) {
      const prev = navHistory[navHistory.length - 1];
      setNavHistory((h) => h.slice(0, -1));
      setActiveTab(prev.tab);
      setCurrentRole(prev.role);
      try {
        window.history.pushState({ tab: prev.tab, role: prev.role }, '', window.location.pathname);
      } catch (e) {}
    } else {
      // Graceful fallback to default screen
      if (currentRole === 'cook' || currentRole === 'staff' || currentRole === 'admin') {
        const fallbackRole = (currentUser && currentUser.role !== 'cook' && currentUser.role !== 'staff' && currentUser.role !== 'admin')
          ? currentUser.role
          : (currentUser?.role || 'student');
        setCurrentRole(fallbackRole);
        setActiveTab('canteen');
      } else {
        setActiveTab('canteen');
      }
    }
  };

  // Browser popstate back button integration
  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state && e.state.tab) {
        setActiveTab(e.state.tab);
        if (e.state.role) setCurrentRole(e.state.role);
      } else {
        handleGoBack();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navHistory, activeTab, currentRole, currentUser]);

  const getViewTitle = (tab, role) => {
    if (role === 'cook' || tab === 'cook') return 'Kitchen Cook (KDS)';
    if (role === 'staff' || tab === 'staff') return 'Counter Staff';
    if (role === 'admin' || tab === 'overview') return 'Campus Admin';
    switch (tab) {
      case 'canteen':
        return 'Canteen Menu';
      case 'queue':
        return 'Live Queue';
      case 'map':
        return 'Campus Map';
      case 'lost-found':
        return 'Lost & Found';
      case 'issues':
        return 'Campus Issues';
      case 'spending':
        return 'Spending Tracker';
      default:
        return 'Campus Hub';
    }
  };

  const canGoBack = Boolean(
    navHistory.length > 0 ||
    activeTab !== 'canteen' ||
    currentRole === 'cook' ||
    currentRole === 'staff' ||
    currentRole === 'admin'
  );

  const previousViewTitle = navHistory.length > 0
    ? getViewTitle(navHistory[navHistory.length - 1].tab, navHistory[navHistory.length - 1].role)
    : 'Canteen Menu';

  const handleRedirectToMapForIssue = (currentDraft) => {
    setIssueDraft(currentDraft);
    setIsMarkingIssueOnMap(true);
    handleNavigate('map');
  };

  const handleConfirmIssueLocation = (selectedLocInfo) => {
    setIssueDraft((prev) => ({
      ...(prev || {}),
      location: selectedLocInfo.locationName,
      lat: selectedLocInfo.lat,
      lng: selectedLocInfo.lng,
      markedOnMap: true
    }));
    setIsMarkingIssueOnMap(false);
    handleNavigate('issues');
  };

  const handleCancelMarkingIssue = () => {
    setIsMarkingIssueOnMap(false);
    handleNavigate('issues');
  };

  const handleViewIssueOnMap = (issue) => {
    setFocusedIssueOnMap(issue);
    handleNavigate('map');
  };

  const handleRedirectToMapForLostFound = (currentDraft) => {
    setLostFoundDraft(currentDraft);
    setIsMarkingLostFoundOnMap(true);
    handleNavigate('map');
  };

  const handleConfirmLostFoundLocation = (selectedLocInfo) => {
    setLostFoundDraft((prev) => ({
      ...(prev || {}),
      location: selectedLocInfo.locationName,
      lat: selectedLocInfo.lat,
      lng: selectedLocInfo.lng,
      markedOnMap: true
    }));
    setIsMarkingLostFoundOnMap(false);
    handleNavigate('lost-found');
  };

  const handleCancelMarkingLostFound = () => {
    setIsMarkingLostFoundOnMap(false);
    handleNavigate('lost-found');
  };

  const handleViewLostFoundOnMap = (item) => {
    setFocusedLostFoundOnMap(item);
    handleNavigate('map');
  };

  const handleRoleRedirection = (role) => {
    setNavHistory([]);
    if (role === 'faculty') {
      setCurrentRole('faculty');
      setActiveTab('canteen');
    } else if (role === 'student') {
      setCurrentRole('student');
      setActiveTab('canteen');
    } else if (role === 'cook' || role === 'chef') {
      setCurrentRole('cook');
      setActiveTab('cook');
    } else if (role === 'staff') {
      setCurrentRole('staff');
      setActiveTab('staff');
    } else if (role === 'admin') {
      setCurrentRole('admin');
      setActiveTab('overview');
    } else {
      setCurrentRole('guest');
      setActiveTab('canteen');
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    handleRoleRedirection(user.role);
    setIsLoginOpen(false);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {}
    setNavHistory([]);
    setCurrentUser(null);
    setCurrentRole('guest');
    setActiveTab('canteen');
    setIsLoginOpen(true);
  };

  const fetchGlobalData = async () => {
    try {
      const [cRes, mRes, wRes, nRes] = await Promise.all([
        api.getCanteens(),
        api.getMenu(),
        api.getWallet(),
        api.getNotifications()
      ]);
      if (cRes.success) {
        setCanteens(cRes.data);
        setSelectedCanteenId((prev) => {
          if (cRes.data.length > 0 && !cRes.data.some((c) => c.id === prev)) {
            return cRes.data[0].id;
          }
          return prev;
        });
      }
      if (mRes.success) setMenuItems(mRes.data);
      if (wRes.success) setWallet(wRes.data);
      if (nRes.success) setNotifications(nRes.data);
    } catch (err) {
      console.error('Failed fetching campus hub data:', err);
    }
  };

  useEffect(() => {
    fetchGlobalData();
    // User requirement: Application MUST start in logged-out mode with login modal open
    setCurrentUser(null);
    setCurrentRole('guest');
    setIsLoginOpen(true);

    // Live update interval
    const interval = setInterval(fetchGlobalData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleOrderCreated = (order) => {
    fetchGlobalData();
    // Show full-screen order receipt with token and QR code
    setReceiptOrder(order);
  };

  const handleNavigateToCanteen = (canteenLocId) => {
    if (canteenLocId === 'loc-it' || canteenLocId === 'canteen-it' || canteenLocId === 'canteen-2' || canteenLocId === 'loc-2') {
      setSelectedCanteenId('canteen-2');
    } else if (canteenLocId === 'loc-mba' || canteenLocId === 'canteen-mba' || canteenLocId === 'canteen-3' || canteenLocId === 'loc-3') {
      setSelectedCanteenId('canteen-3');
    } else {
      setSelectedCanteenId('canteen-1');
    }
    setActiveTab('canteen');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-slate-800 flex flex-col font-sans selection:bg-[#B0003A] selection:text-white relative overflow-x-hidden">
      {/* Global Shaded Amrita Vishwa Vidyapeetham Emblem Background Watermark */}
      <div className="amrita-watermark-overlay" aria-hidden="true">
        <img
          src="/amrita-logo.svg"
          alt="Amrita Vishwa Vidyapeetham Emblem Watermark"
        />
      </div>

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        wallet={wallet}
        notifications={notifications}
        unreadCount={notifications ? notifications.filter((n) => !n.read).length : 0}
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onRefreshNotifications={fetchGlobalData}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        onGoBack={handleGoBack}
        canGoBack={canGoBack}
        previousViewTitle={previousViewTitle}
        onNavigate={handleNavigate}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 relative z-10">
        {/* Amrita Campus Portal Official Header & Inspiration Banner (Universal for Student, Staff & Admin) */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#B0003A] tracking-tight">
                {currentRole === 'faculty' && 'Smart Campus Hub — Faculty Portal & Priority Services'}
                {currentRole === 'student' && 'Smart Campus Hub — Student & Campus Community'}
                {currentRole === 'cook' && 'Smart Campus Hub — Kitchen Cook & Food Preparation KDS'}
                {currentRole === 'staff' && 'Smart Campus Hub — Counter Staff & Token Verification Station'}
                {currentRole === 'admin' && 'Smart Campus Hub — Central Administration & Campus Analytics'}
                {currentRole === 'guest' && 'Smart Campus Hub — Guest Visitor Access'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Amrita Vishwa Vidyapeetham • Ettimadai Campus, Coimbatore
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#FFF0F4] text-[#B0003A] border border-[#F8C0CE] shadow-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#198754] animate-pulse" />
                Amrita Ettimadai Smart Campus Active
              </span>
            </div>
          </div>

          {/* Inspiration Quote Card from Amrita Portal with Shaded Watermark */}
          <div className="mt-3 bg-white border border-[#E8E3D7] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
            {/* Shaded Amrita Emblem in Card Corner */}
            <img
              src="/amrita-logo.svg"
              alt=""
              aria-hidden="true"
              className="absolute -right-8 -bottom-10 w-56 h-56 opacity-[0.06] pointer-events-none select-none"
            />
            <div className="flex items-start gap-3.5 relative z-10">
              <span className="text-3xl sm:text-4xl text-[#D4A017] font-serif leading-none shrink-0 select-none">“</span>
              <div>
                <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-normal italic">
                  Youngsters need to understand the real purpose of life. They need courage and wisdom to face the challenges of life. Only with that understanding they can become the light of the world. If we care for them responsibly and mold their whole character with love, then the future of the world will be safe
                </p>
                <span className="block mt-1 text-xs font-bold text-[#B0003A]">
                  — Amma (Chancellor, Amrita Vishwa Vidyapeetham)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 md:border-l border-[#E8E3D7] pt-3 md:pt-0 md:pl-4 text-xs relative z-10">
              <div className="text-center px-2">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Portal View</span>
                <span className="font-extrabold text-[#B0003A] text-xs capitalize">
                  {currentRole === 'cook' ? 'Kitchen Cook' : currentRole === 'staff' ? 'Counter Staff' : (currentRole === 'guest' ? 'Guest Visitor' : currentRole)}
                </span>
              </div>
              <div className="h-6 w-px bg-[#E8E3D7]" />
              <div className="text-center px-2">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Campus Hub</span>
                <span className="font-extrabold text-[#198754] text-xs">Online</span>
              </div>
            </div>
          </div>


          {/* Admin-Only Portal Switcher: Only administrators have privilege to preview other role dashboards */}
          {currentUser && currentUser.role === 'admin' && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 bg-[#FFF0F4]/80 border border-[#F8C0CE] rounded-2xl p-2.5 sm:px-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold text-[#B0003A] uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4A017]" />
                  Admin Multi-Role Preview:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => handleNavigate('canteen', 'guest')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                      currentRole === 'guest'
                        ? 'bg-[#B0003A] text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-white hover:text-[#B0003A] border border-[#E8E3D7]'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Guest</span>
                  </button>
                  <button
                    onClick={() => handleNavigate('canteen', 'student')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                      currentRole === 'student'
                        ? 'bg-[#B0003A] text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-white hover:text-[#B0003A] border border-[#E8E3D7]'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Student</span>
                  </button>
                  <button
                    onClick={() => handleNavigate('canteen', 'faculty')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                      currentRole === 'faculty'
                        ? 'bg-[#0D6EFD] text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-white hover:text-[#0D6EFD] border border-[#E8E3D7]'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                    <span>Faculty (Priority)</span>
                  </button>
                  <button
                    onClick={() => handleNavigate('cook', 'cook')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                      currentRole === 'cook' || activeTab === 'cook'
                        ? 'bg-[#FD7E14] text-white shadow-xs ring-2 ring-[#FD7E14]/40'
                        : 'bg-white text-slate-700 hover:bg-white hover:text-[#FD7E14] border border-[#E8E3D7]'
                    }`}
                  >
                    <ChefHat className="w-3.5 h-3.5 text-amber-500" />
                    <span>Kitchen Cook</span>
                  </button>
                  <button
                    onClick={() => handleNavigate('staff', 'staff')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                      currentRole === 'staff' || activeTab === 'staff'
                        ? 'bg-[#0D9488] text-white shadow-xs ring-2 ring-[#0D9488]/40'
                        : 'bg-white text-slate-700 hover:bg-white hover:text-[#0D9488] border border-[#E8E3D7]'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5 text-teal-500" />
                    <span>Counter Staff</span>
                  </button>
                  <button
                    onClick={() => handleNavigate('overview', 'admin')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                      currentRole === 'admin'
                        ? 'bg-[#6F42C1] text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-white hover:text-[#6F42C1] border border-[#E8E3D7]'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Campus Admin</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Guest Visitor Information Banner (No switcher buttons, purely clean visitor portal) */}
          {currentRole === 'guest' && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 bg-[#FAF7F0] border border-[#E8E3D7] rounded-2xl p-2.5 sm:px-4 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-slate-800">
                  Guest Visitor Portal
                </span>
                <span className="text-xs text-slate-500 hidden md:inline">
                  — Access to Canteen Menu & Orders, Live Token Queue, Campus Map, Lost & Found, and Issues.
                </span>
              </div>
              <button
                onClick={() => setIsLoginOpen(true)}
                className="text-xs font-bold text-[#B0003A] hover:underline flex items-center gap-1 ml-auto"
              >
                <span>Login with Amrita University Account</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Universal "Go Back" Navigation Bar */}
        {canGoBack && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-white border border-[#E8E3D7] rounded-2xl p-2.5 sm:px-4 shadow-2xs animate-in fade-in slide-in-from-top-1">
            <button
              type="button"
              onClick={handleGoBack}
              title={`Return to ${previousViewTitle}`}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#FFF0F4] hover:bg-[#B0003A] text-[#B0003A] hover:text-white border border-[#F8C0CE] hover:border-[#B0003A] text-xs font-extrabold transition shadow-2xs group active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Go Back</span>
              <span className="opacity-40">|</span>
              <span className="font-semibold text-slate-600 group-hover:text-rose-100">
                Return to {previousViewTitle}
              </span>
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="hidden sm:inline">Active View:</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 font-bold text-slate-800 capitalize text-[11px]">
                {getViewTitle(activeTab, currentRole)}
              </span>
            </div>
          </div>
        )}

        {/* Student, Faculty, or Guest View */}
        {(currentRole === 'student' || currentRole === 'faculty' || currentRole === 'guest') && activeTab !== 'cook' && activeTab !== 'staff' && (
          <div>
            {/* Faculty VIP Priority Banner */}
            {currentRole === 'faculty' && (
              <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-900 shadow-xs flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-blue-950 flex items-center gap-1.5">
                      <span>Faculty Priority Lane Activated</span>
                      <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-blue-600 text-white uppercase shadow-xs">
                        ⚡ VIP QUEUE
                      </span>
                    </h4>
                    <p className="text-xs text-blue-700 mt-0.5 font-medium">
                      Your orders receive <strong>C1-FAC-*</strong> tokens, 50% accelerated preparation, and jump ahead of regular student queues!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleNavigate('queue')}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs shrink-0"
                >
                  View Priority Queue
                </button>
              </div>
            )}

            {activeTab === 'canteen' && (
              <CanteenView
                canteens={canteens}
                selectedCanteenId={selectedCanteenId}
                setSelectedCanteenId={setSelectedCanteenId}
                menuItems={menuItems}
                wallet={wallet}
                currentUser={currentUser}
                currentRole={currentRole}
                onOrderCreated={handleOrderCreated}
                onOpenWallet={() => setIsWalletOpen(true)}
                onRefreshData={fetchGlobalData}
              />
            )}

            {activeTab === 'queue' && (
              <LiveQueueView
                canteens={canteens}
                selectedCanteenId={selectedCanteenId}
                setSelectedCanteenId={setSelectedCanteenId}
                currentUser={currentUser}
                currentRole={currentRole}
                onNavigateToMenu={() => handleNavigate('canteen')}
                onGoBack={handleGoBack}
              />
            )}

            {activeTab === 'map' && (
              <CampusMapView
                onNavigateToCanteen={handleNavigateToCanteen}
                isMarkingIssueOnMap={isMarkingIssueOnMap}
                onConfirmIssueLocation={handleConfirmIssueLocation}
                onCancelMarkingIssue={handleCancelMarkingIssue}
                focusedIssueOnMap={focusedIssueOnMap}
                onClearFocusedIssue={() => setFocusedIssueOnMap(null)}
                isMarkingLostFoundOnMap={isMarkingLostFoundOnMap}
                onConfirmLostFoundLocation={handleConfirmLostFoundLocation}
                onCancelMarkingLostFound={handleCancelMarkingLostFound}
                focusedLostFoundOnMap={focusedLostFoundOnMap}
                onClearFocusedLostFound={() => setFocusedLostFoundOnMap(null)}
                onGoBack={handleGoBack}
              />
            )}

            {activeTab === 'lost-found' && (
              <LostAndFoundView
                onRedirectToMapForLostFound={handleRedirectToMapForLostFound}
                lostFoundDraft={lostFoundDraft}
                onClearLostFoundDraft={() => setLostFoundDraft(null)}
                onViewItemOnMap={handleViewLostFoundOnMap}
                onGoBack={handleGoBack}
              />
            )}

            {activeTab === 'issues' && (
              <CampusIssuesView
                onRedirectToMapForIssue={handleRedirectToMapForIssue}
                issueDraft={issueDraft}
                onClearIssueDraft={() => setIssueDraft(null)}
                onViewIssueOnMap={handleViewIssueOnMap}
                onGoBack={handleGoBack}
              />
            )}

            {activeTab === 'spending' && <StudentSpendingWidget onGoBack={handleGoBack} />}
          </div>
        )}

        {/* Kitchen Cook View (KDS & Preparation Queue & Ingredients) - Strictly Cook or Admin */}
        {(currentRole === 'cook' || activeTab === 'cook') && (currentUser?.role === 'cook' || currentUser?.role === 'admin') && (
          <StaffPanelView
            currentRole="cook"
            canteens={canteens}
            selectedCanteenId={selectedCanteenId}
            setSelectedCanteenId={setSelectedCanteenId}
            onDataUpdated={fetchGlobalData}
            onGoBack={handleGoBack}
          />
        )}

        {/* Counter Staff View (Token Verification Station & Ready Order Dispatch) - Strictly Staff or Admin */}
        {(currentRole === 'staff' || activeTab === 'staff') && (currentUser?.role === 'staff' || currentUser?.role === 'admin') && activeTab !== 'cook' && (
          <StaffPanelView
            currentRole="staff"
            canteens={canteens}
            selectedCanteenId={selectedCanteenId}
            setSelectedCanteenId={setSelectedCanteenId}
            onDataUpdated={fetchGlobalData}
            onGoBack={handleGoBack}
          />
        )}

        {/* Campus Admin View - Strictly Admin */}
        {currentRole === 'admin' && currentUser?.role === 'admin' && activeTab !== 'cook' && activeTab !== 'staff' && (
          <AdminPanelView
            canteens={canteens}
            onDataUpdated={fetchGlobalData}
            onGoBack={handleGoBack}
          />
        )}
      </main>

      {/* Global Modals */}
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        wallet={wallet}
        onWalletUpdated={(updated) => setWallet(updated)}
      />

      <VoiceGuidanceModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setIsVoiceOpen(false);
        }}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <OrderReceiptScreen
        order={receiptOrder}
        onGoToQueue={() => {
          setReceiptOrder(null);
          setActiveTab('queue');
        }}
        onDismiss={() => {
          setReceiptOrder(null);
          setActiveTab('canteen');
        }}
      />

      {/* Footer in Amrita Brand Style */}
      <footer className="border-t border-[#E8E3D7] bg-white py-6 mt-12 text-center text-xs text-slate-500 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#B0003A]">Amrita Vishwa Vidyapeetham</span>
            <span>•</span>
            <span className="text-slate-600 font-medium">Ettimadai Campus, Coimbatore</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Smart Campus Hub • Genesis Project Hackathon 2026
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
