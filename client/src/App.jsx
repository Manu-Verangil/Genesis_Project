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
import { api } from './api';

export function App() {
  const [activeTab, setActiveTab] = useState('canteen'); // 'canteen', 'queue', 'map', 'lost-found', 'issues'
  const [currentRole, setCurrentRole] = useState('student'); // 'student', 'staff', 'admin'
  const [selectedCanteenId, setSelectedCanteenId] = useState('canteen-1');

  // Shared Data
  const [canteens, setCanteens] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Modals
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

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
    // Live update interval
    const interval = setInterval(fetchGlobalData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleOrderCreated = (order) => {
    fetchGlobalData();
    // Switch smoothly to the Live Queue tab to track the new token
    setActiveTab('queue');
  };

  const handleNavigateToCanteen = (canteenLocId) => {
    if (canteenLocId === 'loc-2' || canteenLocId === 'canteen-2') {
      setSelectedCanteenId('canteen-2');
    } else if (canteenLocId === 'loc-3' || canteenLocId === 'canteen-3') {
      setSelectedCanteenId('canteen-3');
    } else if (canteenLocId === 'loc-it' || canteenLocId === 'canteen-it') {
      setSelectedCanteenId('canteen-it');
    } else {
      setSelectedCanteenId('canteen-1');
    }
    setActiveTab('canteen');
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-slate-800 flex flex-col font-sans selection:bg-[#A41034] selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        wallet={wallet}
        notifications={notifications}
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onRefreshNotifications={fetchGlobalData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        {/* Student View */}
        {currentRole === 'student' && (
          <div>
            {/* Amrita Student Portal Official Welcome Header & Inspiration Banner */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#A41034] tracking-tight">
                    Welcome! MANU V ( CB.PS.I5DAS23120 )
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Amrita Vishwa Vidyapeetham • Ettimadai Campus, Coimbatore
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-[#A41034] border border-rose-200 shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Amrita Ettimadai Smart Campus Active
                  </span>
                </div>
              </div>

              {/* Inspiration Quote Card from Amrita Portal */}
              <div className="mt-3 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <span className="text-3xl sm:text-4xl text-amber-500 font-serif leading-none shrink-0 select-none">“</span>
                  <div>
                    <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-normal italic">
                      Youngsters need to understand the real purpose of life. They need courage and wisdom to face the challenges of life. Only with that understanding they can become the light of the world. If we care for them responsibly and mold their whole character with love, then the future of the world will be safe
                    </p>
                    <span className="block mt-1 text-xs font-bold text-[#A41034]">
                      — Amma (Chancellor, Amrita Vishwa Vidyapeetham)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4 text-xs">
                  <div className="text-center px-2">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Status</span>
                    <span className="font-extrabold text-[#A41034] text-xs">Connected</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200" />
                  <div className="text-center px-2">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Campus Hub</span>
                    <span className="font-extrabold text-emerald-700 text-xs">Online</span>
                  </div>
                </div>
              </div>
            </div>

            {activeTab === 'canteen' && (
              <CanteenView
                canteens={canteens}
                selectedCanteenId={selectedCanteenId}
                setSelectedCanteenId={setSelectedCanteenId}
                menuItems={menuItems}
                wallet={wallet}
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
                onNavigateToMenu={() => setActiveTab('canteen')}
              />
            )}

            {activeTab === 'map' && (
              <CampusMapView onNavigateToCanteen={handleNavigateToCanteen} />
            )}

            {activeTab === 'lost-found' && <LostAndFoundView />}

            {activeTab === 'issues' && <CampusIssuesView />}
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

      {/* Footer in Amrita Brand Style */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#A41034]">Amrita Vishwa Vidyapeetham</span>
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
