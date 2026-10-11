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
import { Sparkles, User, GraduationCap, ChefHat, Shield, ArrowRight } from 'lucide-react';
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

  const handleRoleRedirection = (role) => {
    if (role === 'faculty') {
      setCurrentRole('faculty');
      setActiveTab('canteen');
    } else if (role === 'student') {
      setCurrentRole('student');
      setActiveTab('canteen');
    } else if (role === 'staff') {
      setCurrentRole('staff');
    } else if (role === 'admin') {
      setCurrentRole('admin');
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
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 relative z-10">
        {/* Amrita Campus Portal Official Header & Inspiration Banner (Universal for Student, Staff & Admin) */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#B0003A] tracking-tight">
                {currentRole === 'faculty' && 'Smart Campus Hub — Faculty Portal & VIP Priority Services ⚡'}
                {currentRole === 'student' && 'Smart Campus Hub — Student & Campus Community'}
                {currentRole === 'staff' && 'Smart Campus Hub — Canteen Kitchen Staff & Counter Operations 🍳'}
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
                <span className="font-extrabold text-[#B0003A] text-xs capitalize">{currentRole}</span>
              </div>
              <div className="h-6 w-px bg-[#E8E3D7]" />
              <div className="text-center px-2">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Campus Hub</span>
                <span className="font-extrabold text-[#198754] text-xs">Online</span>
              </div>
            </div>
          </div>

          {/* Quick Portal Switcher (Instant 1-Click access to Canteen Staff Dashboard, Faculty VIP, Student, Admin) */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 bg-[#FFF0F4]/80 border border-[#F8C0CE] rounded-2xl p-2.5 sm:px-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-extrabold text-[#B0003A] uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-[#D4A017]" />
                Switch Campus Dashboard:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => { setCurrentRole('student'); setActiveTab('canteen'); }}
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
                  onClick={() => { setCurrentRole('faculty'); setActiveTab('canteen'); }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    currentRole === 'faculty'
                      ? 'bg-[#0D6EFD] text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-white hover:text-[#0D6EFD] border border-[#E8E3D7]'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                  <span>Faculty (VIP Priority ⚡)</span>
                </button>
                <button
                  onClick={() => setCurrentRole('staff')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    currentRole === 'staff'
                      ? 'bg-[#FD7E14] text-white shadow-xs ring-2 ring-[#FD7E14]/40'
                      : 'bg-white text-slate-700 hover:bg-white hover:text-[#FD7E14] border border-[#E8E3D7]'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5 text-amber-500" />
                  <span>🍳 Canteen Staff Dashboard</span>
                </button>
                <button
                  onClick={() => setCurrentRole('admin')}
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
            {!currentUser && (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="text-xs font-bold text-[#B0003A] hover:underline flex items-center gap-1 ml-auto"
              >
                <span>Login with Password</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Student, Faculty, or Guest View */}
        {(currentRole === 'student' || currentRole === 'faculty' || currentRole === 'guest') && (
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
                  onClick={() => setActiveTab('queue')}
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
                onNavigateToMenu={() => setActiveTab('canteen')}
              />
            )}

            {activeTab === 'map' && (
              <CampusMapView onNavigateToCanteen={handleNavigateToCanteen} />
            )}

            {activeTab === 'lost-found' && <LostAndFoundView />}

            {activeTab === 'issues' && <CampusIssuesView />}

            {activeTab === 'spending' && <StudentSpendingWidget />}
          </div>
        )}

        {/* Staff View (Kitchen & Pickup Counter) */}
        {currentRole === 'staff' && (
          <StaffPanelView
            canteens={canteens}
            selectedCanteenId={selectedCanteenId}
            setSelectedCanteenId={setSelectedCanteenId}
            onDataUpdated={fetchGlobalData}
          />
        )}

        {/* Campus Admin View */}
        {currentRole === 'admin' && (
          <AdminPanelView canteens={canteens} onDataUpdated={fetchGlobalData} />
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
