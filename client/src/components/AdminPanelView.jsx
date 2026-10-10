import React, { useState, useEffect } from 'react';
import {
  Shield,
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Search,
  MapPin,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
  Sparkles,
  Users,
  Check
} from 'lucide-react';
import { api } from '../api';

export function AdminPanelView({ canteens, onDataUpdated }) {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'menu', 'issues', 'claims', 'map'
  const [issues, setIssues] = useState([]);
  const [lostFoundItems, setLostFoundItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [mapLocations, setMapLocations] = useState([]);

  // New Menu Item Form
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    canteenId: 'canteen-1',
    category: 'Meals',
    price: 80,
    prepTimeMinutes: 5,
    stock: 20,
    isVeg: true,
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80'
  });

  // New Map Location Form
  const [newMapLoc, setNewMapLoc] = useState({
    name: '',
    category: 'Academic Store',
    building: '',
    floor: 'Ground Floor',
    zone: 'Central Zone',
    timings: '08:30 AM - 06:30 PM',
    contact: 'store@campus.edu',
    description: '',
    lat: 13.0110,
    lng: 80.2340,
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=80'
  });

  const fetchAdminData = async () => {
    try {
      const [statsRes, issuesRes, lfRes, menuRes, mapRes] = await Promise.all([
        api.getStats(),
        api.getIssues(),
        api.getLostAndFound(),
        api.getMenu(),
        api.getMapLocations()
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (issuesRes.success) setIssues(issuesRes.data);
      if (lfRes.success) setLostFoundItems(lfRes.data);
      if (menuRes.success) setMenuItems(menuRes.data);
      if (mapRes.success) setMapLocations(mapRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Advance Issue Stage (Slide 5 & 6)
  const handleAdvanceIssue = async (issueId, stageNum, stageName) => {
    try {
      const note = window.prompt(
        `Enter resolution or progress update note for Stage ${stageNum} (${stageName}):`,
        `Progress logged by Campus Administration.`
      );
      if (note === null) return;

      const res = await api.updateIssueStage(issueId, {
        targetStage: stageNum,
        note
      });
      if (res.success) {
        alert(`Issue updated to Stage ${stageNum}: ${stageName}! Student received live notification.`);
        fetchAdminData();
        onDataUpdated();
      }
    } catch (err) {
      alert('Error updating issue: ' + err.message);
    }
  };

  // Review Lost & Found Claim (Slide 6)
  const handleReviewClaim = async (itemId, claimId, action) => {
    try {
      const res = await api.reviewClaim(itemId, claimId, action);
      if (res.success) {
        alert(`Claim ${action === 'approve' ? 'Approved & Item Handed Over' : 'Rejected'}!`);
        fetchAdminData();
        onDataUpdated();
      }
    } catch (err) {
      alert('Error reviewing claim: ' + err.message);
    }
  };

  // Add new menu item
  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    try {
      const res = await api.addMenuItem(newMenuItem);
      if (res.success) {
        alert('New menu item added successfully!');
        setNewMenuItem({
          name: '',
          canteenId: 'canteen-1',
          category: 'Meals',
          price: 80,
          prepTimeMinutes: 5,
          stock: 20,
          isVeg: true,
          description: '',
          imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80'
        });
        fetchAdminData();
        onDataUpdated();
      }
    } catch (err) {
      alert('Error adding menu item: ' + err.message);
    }
  };

  // Add new map location (Slide 6: Add stores and canteens to map)
  const handleAddMapLoc = async (e) => {
    e.preventDefault();
    try {
      const res = await api.addMapLocation({
        ...newMapLoc,
        lat: parseFloat(newMapLoc.lat),
        lng: parseFloat(newMapLoc.lng),
        coordinates: {
          x: 50,
          y: 50,
          lat: parseFloat(newMapLoc.lat),
          lng: parseFloat(newMapLoc.lng)
        }
      });
      if (res.success) {
        alert('New location successfully pinned to the real campus map!');
        setNewMapLoc({
          name: '',
          category: 'Academic Store',
          building: '',
          floor: 'Ground Floor',
          zone: 'Central Zone',
          timings: '08:30 AM - 06:30 PM',
          contact: 'store@campus.edu',
          description: '',
          lat: 13.0110,
          lng: 80.2340,
          image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=80'
        });
        fetchAdminData();
        onDataUpdated();
      }
    } catch (err) {
      alert('Error adding location: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
              <span>Campus Central Administration & Analytics</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Slide 6 & 11
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Unified governance of food menus, map hubs, lost-and-found claims, and issue resolutions
            </p>
          </div>
        </div>

        {/* Quick KPI stats cards */}
        {stats && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/40">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Revenue</span>
              <div className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
                ₹{stats.totalRevenue}
              </div>
              <span className="text-[10px] text-slate-500">100% cashless via wallet</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/40">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Orders</span>
              <div className="text-xl font-extrabold text-white font-mono mt-1">
                {stats.totalOrders}
              </div>
              <span className="text-[10px] text-cyan-400">{stats.activeOrdersCount} in active prep</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/40">
              <span className="text-[10px] uppercase font-bold text-slate-400">Campus Issues</span>
              <div className="text-xl font-extrabold text-amber-400 font-mono mt-1">
                {stats.openIssuesCount} Open
              </div>
              <span className="text-[10px] text-slate-500">{stats.resolvedIssuesCount} resolved</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/40">
              <span className="text-[10px] uppercase font-bold text-slate-400">Lost Items Open</span>
              <div className="text-xl font-extrabold text-blue-400 font-mono mt-1">
                {stats.openLostFoundCount}
              </div>
              <span className="text-[10px] text-slate-500">Awaiting claim handover</span>
            </div>
          </div>
        )}
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Campus Impact Overview (Slide 11)
        </button>

        <button
          onClick={() => setActiveTab('issues')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'issues'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Resolve Campus Issues ({issues.filter((i) => i.status !== 'resolved').length})
        </button>

        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'claims'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Review Lost & Found Claims
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'menu'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Menu Management
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'map'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Campus Map Hubs ({mapLocations.length})
        </button>
      </div>

      {/* TAB 1: CAMPUS IMPACT OVERVIEW (Slide 11) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h4 className="font-extrabold text-base text-white mb-1">
              Expected Campus Impact & Return on Investment (Slide 11)
            </h4>
            <p className="text-xs text-slate-400 mb-5">
              Measurable outcomes achieved by consolidating food, map, lost items, and issues into Smart Campus Hub:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1.5">
                <span className="text-lg">⏱️</span>
                <h5 className="font-bold text-white text-sm">Saves Student Time</h5>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Eliminates wasted trips when food runs out. Pre-ordering cuts average queue wait time from 18 minutes to zero counter wait.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1.5">
                <span className="text-lg">🥗</span>
                <h5 className="font-bold text-white text-sm">Reduces Food Waste</h5>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Real-time demand tracking shows what dishes are actually being consumed, preventing over-preparation of perishables.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1.5">
                <span className="text-lg">💳</span>
                <h5 className="font-bold text-white text-sm">Cuts Cash Handling</h5>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  100% digital transactions through student campus wallet and UPI. Eliminates tender change delays and cash shrinkage.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1.5">
                <span className="text-lg">🛠️</span>
                <h5 className="font-bold text-white text-sm">Faster Issue Resolution</h5>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  5-stage lifecycle routes problems immediately to facilities teams. Closed tickets remain in audit history for maintenance planning.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1.5">
                <span className="text-lg">🔍</span>
                <h5 className="font-bold text-white text-sm">Organized Lost Belongings</h5>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Replaces scattered WhatsApp messages and paper notices with a verified, single-custody claim recovery registry.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1.5">
                <span className="text-lg">🏛️</span>
                <h5 className="font-bold text-white text-sm">One Unified Platform</h5>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Students, kitchen staff, and university admins operate on a single synchronized dashboard with zero vendor fragmentation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RESOLVE CAMPUS ISSUES */}
      {activeTab === 'issues' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h4 className="font-bold text-sm text-white mb-1">
              Campus Facilities Dispatch & Issue Resolution (Slide 5 & 6)
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Advance tickets through the 5-stage lifecycle. Each transition notifies the student in real time.
            </p>

            <div className="space-y-4">
              {issues.map((iss) => (
                <div
                  key={iss.id}
                  className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-400">{iss.ticketNumber}</span>
                      <span className="font-bold text-white text-sm">{iss.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-700 text-slate-300">
                        {iss.category}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{iss.description}</p>
                    <div className="text-[10px] text-slate-400">
                      Location: {iss.location} • Dept: {iss.department} • Assigned: {iss.assignedStaff}
                    </div>
                  </div>

                  {/* Stage Advancement Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-400 mr-1">
                      Current Stage: <strong>{iss.currentStageIndex}/5</strong>
                    </span>

                    {iss.currentStageIndex < 2 && (
                      <button
                        onClick={() => handleAdvanceIssue(iss.id, 2, 'Route')}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px]"
                      >
                        Advance to Route
                      </button>
                    )}

                    {iss.currentStageIndex === 2 && (
                      <button
                        onClick={() => handleAdvanceIssue(iss.id, 3, 'Act')}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px]"
                      >
                        Advance to Act (Work In Progress)
                      </button>
                    )}

                    {iss.currentStageIndex === 3 && (
                      <button
                        onClick={() => handleAdvanceIssue(iss.id, 4, 'Notify')}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-[11px]"
                      >
                        Advance to Notify
                      </button>
                    )}

                    {iss.currentStageIndex >= 3 && iss.status !== 'resolved' && (
                      <button
                        onClick={() => handleAdvanceIssue(iss.id, 5, 'Resolve')}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px]"
                      >
                        Resolve & Close Ticket
                      </button>
                    )}

                    {iss.status === 'resolved' && (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                        ✓ Resolved
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REVIEW LOST & FOUND CLAIMS */}
      {activeTab === 'claims' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h4 className="font-bold text-sm text-white mb-1">
            Lost & Found Claim Verification (Slide 6)
          </h4>
          <p className="text-xs text-slate-400 mb-4">
            Verify student ownership proof and approve release of belongings
          </p>

          <div className="space-y-4">
            {lostFoundItems
              .filter((i) => i.claims && i.claims.length > 0)
              .map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <h5 className="font-bold text-white text-sm">{item.title}</h5>
                        <p className="text-[11px] text-slate-400">Found at: {item.location}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-700 text-slate-300">
                      {item.status}
                    </span>
                  </div>

                  {/* Claims List */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    {item.claims.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-lg bg-slate-900 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="font-bold text-blue-300">
                            Claimant: {c.claimantName} (Roll: {c.claimantRoll}, Tel: {c.claimantPhone})
                          </div>
                          <p className="text-slate-300 text-[11px] mt-0.5">
                            <strong>Submitted Proof:</strong> "{c.proofDetails}"
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {c.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleReviewClaim(item.id, c.id, 'approve')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                              >
                                Approve & Hand Over
                              </button>
                              <button
                                onClick={() => handleReviewClaim(item.id, c.id, 'reject')}
                                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                                c.status === 'approved'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              Claim {c.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 4: MENU MANAGEMENT */}
      {activeTab === 'menu' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h4 className="font-bold text-sm text-white mb-3">Add New Menu Dish (Slide 6)</h4>
            <form onSubmit={handleAddMenuItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masala Dosa Special"
                  value={newMenuItem.name}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Canteen</label>
                  <select
                    value={newMenuItem.canteenId}
                    onChange={(e) => setNewMenuItem({ ...newMenuItem, canteenId: e.target.value })}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  >
                    <option value="canteen-1">Canteen 1</option>
                    <option value="canteen-2">Canteen 2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={newMenuItem.category}
                    onChange={(e) => setNewMenuItem({ ...newMenuItem, category: e.target.value })}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  >
                    <option value="Meals">Meals</option>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newMenuItem.price}
                    onChange={(e) => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Prep Time (m)</label>
                  <input
                    type="number"
                    required
                    value={newMenuItem.prepTimeMinutes}
                    onChange={(e) =>
                      setNewMenuItem({ ...newMenuItem, prepTimeMinutes: e.target.value })
                    }
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Initial Stock</label>
                  <input
                    type="number"
                    required
                    value={newMenuItem.stock}
                    onChange={(e) => setNewMenuItem({ ...newMenuItem, stock: e.target.value })}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows="2"
                  value={newMenuItem.description}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                  placeholder="Ingredients, accompaniments..."
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/30"
              >
                Add Dish to Menu
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h4 className="font-bold text-sm text-white mb-3">All Active Menu Dishes</h4>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div>
                      <div className="font-bold text-white">{item.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {item.canteenId === 'canteen-1' ? 'Canteen 1' : 'Canteen 2'} • {item.category} • ~{item.prepTimeMinutes}m prep
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-white text-sm">₹{item.price}</div>
                    <div className="text-[10px] text-emerald-400">{item.stock} in stock</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CAMPUS MAP HUBS MANAGEMENT (Slide 6 & 10) */}
      {activeTab === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h4 className="font-bold text-sm text-white mb-1">Add Location to Real Map (Slide 6)</h4>
            <p className="text-[11px] text-slate-400 mb-4">
              Pin new canteens, stationery stores, or labs with real GPS coordinates.
            </p>

            <form onSubmit={handleAddMapLoc} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hub Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mechanical Lab 3D Printing Hub"
                  value={newMapLoc.name}
                  onChange={(e) => setNewMapLoc({ ...newMapLoc, name: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={newMapLoc.category}
                    onChange={(e) => setNewMapLoc({ ...newMapLoc, category: e.target.value })}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  >
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Academic Store">Academic Store</option>
                    <option value="Retail Store">Retail Store</option>
                    <option value="Facilities">Facilities</option>
                    <option value="Medical & Health">Medical & Health</option>
                    <option value="Sports & Recreation">Sports & Recreation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Zone</label>
                  <select
                    value={newMapLoc.zone}
                    onChange={(e) => setNewMapLoc({ ...newMapLoc, zone: e.target.value })}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  >
                    <option value="Central Zone">Central Zone</option>
                    <option value="North Zone">North Zone</option>
                    <option value="West Zone">West Zone</option>
                    <option value="East Zone">East Zone</option>
                    <option value="South Zone">South Zone</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Building</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Science Block C"
                    value={newMapLoc.building}
                    onChange={(e) => setNewMapLoc({ ...newMapLoc, building: e.target.value })}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Floor</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2nd Floor"
                    value={newMapLoc.floor}
                    onChange={(e) => setNewMapLoc({ ...newMapLoc, floor: e.target.value })}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Latitude (GPS)</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newMapLoc.lat}
                    onChange={(e) => setNewMapLoc({ ...newMapLoc, lat: e.target.value })}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Longitude (GPS)</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newMapLoc.lng}
                    onChange={(e) => setNewMapLoc({ ...newMapLoc, lng: e.target.value })}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Operating Hours</label>
                <input
                  type="text"
                  required
                  placeholder="08:30 AM - 06:30 PM"
                  value={newMapLoc.timings}
                  onChange={(e) => setNewMapLoc({ ...newMapLoc, timings: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Services offered, equipment, entry rules..."
                  value={newMapLoc.description}
                  onChange={(e) => setNewMapLoc({ ...newMapLoc, description: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/30"
              >
                Pin Hub on Real Map
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h4 className="font-bold text-sm text-white mb-1">Pinned Campus Facilities ({mapLocations.length})</h4>
            <p className="text-[11px] text-slate-400 mb-4">
              All live POIs visible on the interactive GPS map with walking navigation.
            </p>

            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {mapLocations.map((loc) => (
                <div
                  key={loc.id}
                  className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/40 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={loc.image}
                      alt={loc.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <div className="font-bold text-white text-sm">{loc.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {loc.building} ({loc.floor}) • {loc.category}
                      </div>
                      <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                        GPS: {loc.lat || loc.coordinates?.lat}, {loc.lng || loc.coordinates?.lng}
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-700 text-slate-300">
                    {loc.zone}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
