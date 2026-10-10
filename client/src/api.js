import { initialData } from './mockData';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// Local storage key for persistent client-side state
const STORAGE_KEY = 'smart_campus_hub_amrita_state_v9';

function getLocalState() {
  try {
    // Clean up older legacy cached versions
    [
      'smart_campus_hub_amrita_state_v1',
      'smart_campus_hub_amrita_state_v2',
      'smart_campus_hub_amrita_state_v5',
      'smart_campus_hub_amrita_state_v6',
      'smart_campus_hub_amrita_state_v7',
      'smart_campus_hub_amrita_state_v8'
    ].forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved);
      // Ensure campusLocations & canteens always stay strictly synced with the latest real GPS coordinates
      state.campusLocations = initialData.campusLocations;
      state.canteens = initialData.canteens;
      if (!state.menuItems || state.menuItems.length < initialData.menuItems.length) {
        state.menuItems = initialData.menuItems;
      }
      return state;
    }
  } catch (e) {
    console.warn('LocalStorage read error:', e);
  }
  const initial = JSON.parse(JSON.stringify(initialData));
  saveLocalState(initial);
  return initial;
}

function saveLocalState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

const handleResponse = async (r) => {
  const contentType = r.headers.get('content-type') || '';
  if (!r.ok) {
    const text = await r.text();
    let errorMessage = `Server error (${r.status}): ${r.statusText || 'Response not OK'}`;
    try {
      const json = JSON.parse(text);
      if (json && json.message) errorMessage = json.message;
    } catch {
      if (text) {
        const cleanText = text.replace(/<[^>]*>?/gm, '').trim();
        if (cleanText) errorMessage = cleanText.substring(0, 200);
      }
    }
    throw new Error(errorMessage);
  }
  if (contentType.includes('application/json')) {
    return r.json();
  }
  const text = await r.text();
  try {
    return JSON.parse(text);
  } catch {
    return { success: true, data: text };
  }
};

// Safe caller: tries backend API, if it fails or returns 404, falls back to rich client data
async function safeCall(fetchPromise, fallbackFn) {
  try {
    const result = await fetchPromise;
    if (result && (result.success !== false || result.data !== undefined)) {
      return result;
    }
  } catch (err) {
    console.info('Using campus offline/client data cache:', err.message);
  }
  return { success: true, data: fallbackFn(getLocalState()) };
}

export const api = {
  // Canteens & Menu
  getCanteens: () =>
    safeCall(
      fetch(`${API_BASE}/canteens`).then(handleResponse),
      (state) => state.canteens
    ),

  updateCrowdLevel: (canteenId, crowdLevel) =>
    safeCall(
      fetch(`${API_BASE}/canteens/${canteenId}/crowd`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crowdLevel }),
      }).then(handleResponse),
      (state) => {
        const canteen = state.canteens.find((c) => c.id === canteenId);
        if (canteen) canteen.crowdLevel = crowdLevel;
        saveLocalState(state);
        return canteen;
      }
    ),

  getMenu: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/menu?${query}` : `${API_BASE}/menu`;
    return safeCall(
      fetch(url).then(handleResponse),
      (state) => {
        let items = state.menuItems;
        if (params.canteenId) items = items.filter((m) => m.canteenId === params.canteenId);
        if (params.category) items = items.filter((m) => m.category === params.category);
        return items;
      }
    );
  },

  addMenuItem: (item) =>
    safeCall(
      fetch(`${API_BASE}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      }).then(handleResponse),
      (state) => {
        const newItem = { id: `m-${Date.now()}`, ...item };
        state.menuItems.push(newItem);
        saveLocalState(state);
        return newItem;
      }
    ),

  updateMenuItem: (id, updates) =>
    safeCall(
      fetch(`${API_BASE}/menu/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).then(handleResponse),
      (state) => {
        const item = state.menuItems.find((m) => m.id === id);
        if (item) Object.assign(item, updates);
        saveLocalState(state);
        return item;
      }
    ),

  notifyMe: (id) =>
    safeCall(
      fetch(`${API_BASE}/menu/${id}/notify-me`, {
        method: 'POST',
      }).then(handleResponse),
      (state) => {
        const item = state.menuItems.find((m) => m.id === id);
        return { message: `Subscribed to restock alerts for ${item ? item.name : 'item'}` };
      }
    ),

  // Orders & Queue
  getOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/orders?${query}` : `${API_BASE}/orders`;
    return safeCall(
      fetch(url).then(handleResponse),
      (state) => {
        let ords = state.orders;
        if (params.canteenId) ords = ords.filter((o) => o.canteenId === params.canteenId);
        return ords;
      }
    );
  },

  getQueue: (canteenId) =>
    safeCall(
      fetch(`${API_BASE}/queue/${canteenId}`).then(handleResponse),
      (state) => {
        const activeOrders = state.orders.filter(
          (o) => o.canteenId === canteenId && ['received', 'cooking', 'ready', 'serving'].includes(o.status)
        );
        const myOrder = state.orders.find((o) => o.canteenId === canteenId && o.isCurrentUser);
        return {
          canteenId,
          totalQueue: activeOrders.length,
          servingTokens: activeOrders.filter((o) => o.status === 'serving').map((o) => o.token),
          readyTokens: activeOrders.filter((o) => o.status === 'ready').map((o) => o.token),
          cookingTokens: activeOrders.filter((o) => o.status === 'cooking').map((o) => o.token),
          currentUserOrder: myOrder || null,
          estimatedWaitMinutes: activeOrders.length * 2,
        };
      }
    ),

  createOrder: (orderData) =>
    safeCall(
      fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      }).then(handleResponse),
      (state) => {
        const canteenCode = orderData.canteenId === 'canteen-2' ? 'C2' : 'C1';
        const num = Math.floor(100 + Math.random() * 900);
        const newOrder = {
          id: `ord-${Date.now()}`,
          token: `${canteenCode}-${num}`,
          status: 'cooking',
          createdAt: new Date().toISOString(),
          isCurrentUser: true,
          estimatedWaitMinutes: 8,
          paymentStatus: 'paid',
          qrCodeData: `CAMPUS_HUB_${canteenCode}_${num}_TOKEN`,
          ...orderData,
        };

        if (orderData.paymentMethod === 'Wallet') {
          state.wallet.balance = Math.max(0, state.wallet.balance - orderData.totalAmount);
          state.wallet.transactions.unshift({
            id: `tx-${Date.now()}`,
            type: 'debit',
            amount: orderData.totalAmount,
            description: `Prepaid Order #${newOrder.token}`,
            timestamp: new Date().toISOString(),
          });
        }

        state.orders.push(newOrder);
        state.notifications.unshift({
          id: `nt-${Date.now()}`,
          title: 'Order Confirmed',
          message: `Order #${newOrder.token} is cooking! Estimated wait ~8 min.`,
          type: 'order',
          timestamp: new Date().toISOString(),
          read: false,
        });

        saveLocalState(state);
        return newOrder;
      }
    ),

  updateOrderStatus: (orderId, status) =>
    safeCall(
      fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then(handleResponse),
      (state) => {
        const ord = state.orders.find((o) => o.id === orderId);
        if (ord) ord.status = status;
        saveLocalState(state);
        return ord;
      }
    ),

  verifyToken: (token, canteenId) =>
    safeCall(
      fetch(`${API_BASE}/orders/verify-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, canteenId }),
      }).then(handleResponse),
      (state) => {
        const ord = state.orders.find(
          (o) => o.token.toUpperCase() === token.toUpperCase() && o.canteenId === canteenId
        );
        if (ord) {
          ord.status = 'collected';
          saveLocalState(state);
          return { verified: true, order: ord };
        }
        return { verified: false, message: 'Invalid token' };
      }
    ),

  // Wallet
  getWallet: () =>
    safeCall(
      fetch(`${API_BASE}/wallet`).then(handleResponse),
      (state) => state.wallet
    ),

  topUpWallet: (amount) =>
    safeCall(
      fetch(`${API_BASE}/wallet/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      }).then(handleResponse),
      (state) => {
        state.wallet.balance += Number(amount);
        state.wallet.transactions.unshift({
          id: `tx-${Date.now()}`,
          type: 'credit',
          amount: Number(amount),
          description: 'Wallet Top-up via UPI',
          timestamp: new Date().toISOString(),
        });
        saveLocalState(state);
        return state.wallet;
      }
    ),

  // Campus Map
  getMapLocations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/map?${query}` : `${API_BASE}/map`;
    return safeCall(
      fetch(url).then(handleResponse),
      (state) => {
        let locs = state.campusLocations;
        if (params.category) locs = locs.filter((l) => l.category === params.category);
        if (params.search) {
          const q = params.search.toLowerCase();
          locs = locs.filter((l) => l.name.toLowerCase().includes(q) || l.description.toLowerCase().includes(q));
        }
        return locs;
      }
    );
  },

  addMapLocation: (loc) =>
    safeCall(
      fetch(`${API_BASE}/map`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loc),
      }).then(handleResponse),
      (state) => {
        const newLoc = { id: `loc-${Date.now()}`, ...loc };
        state.campusLocations.push(newLoc);
        saveLocalState(state);
        return newLoc;
      }
    ),

  updateMapLocation: (id, updates) =>
    safeCall(
      fetch(`${API_BASE}/map/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).then(handleResponse),
      (state) => {
        const loc = state.campusLocations.find((l) => l.id === id);
        if (loc) Object.assign(loc, updates);
        saveLocalState(state);
        return loc;
      }
    ),

  // Lost & Found
  getLostAndFound: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/lost-found?${query}` : `${API_BASE}/lost-found`;
    return safeCall(
      fetch(url).then(handleResponse),
      (state) => {
        let items = state.lostAndFound;
        if (params.type) items = items.filter((i) => i.type === params.type);
        if (params.category) items = items.filter((i) => i.category === params.category);
        return items;
      }
    );
  },

  reportLostFound: (item) => {
    const isFormData = typeof FormData !== 'undefined' && item instanceof FormData;
    return safeCall(
      fetch(`${API_BASE}/lost-found`, {
        method: 'POST',
        headers: isFormData ? {} : { 'Content-Type': 'application/json' },
        body: isFormData ? item : JSON.stringify(item),
      }).then(handleResponse),
      (state) => {
        let title = 'Lost/Found Item';
        let type = 'found';
        let category = 'General';
        let location = 'Campus';
        let description = '';
        let contactInfo = 'student@campus.edu';
        let imageUrl = '';

        if (isFormData) {
          title = item.get('title') || title;
          type = item.get('type') || type;
          category = item.get('category') || category;
          location = item.get('location') || location;
          description = item.get('description') || description;
          contactInfo = item.get('contactInfo') || contactInfo;
          imageUrl = item.get('imageUrl') || '';
        } else if (item && typeof item === 'object') {
          title = item.title || title;
          type = item.type || type;
          category = item.category || category;
          location = item.location || location;
          description = item.description || description;
          contactInfo = item.contactInfo || contactInfo;
          imageUrl = item.imageUrl || '';
        }

        const newItem = {
          id: `lf-${Date.now()}`,
          title,
          type,
          category,
          location,
          description,
          contactInfo,
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1584905066893-7d5c142ba4e1?w=500&auto=format&fit=crop&q=80',
          date: new Date().toISOString(),
          status: 'open',
          claims: [],
        };
        state.lostAndFound.unshift(newItem);
        saveLocalState(state);
        return newItem;
      }
    );
  },

  claimLostFound: (id, claimData) =>
    safeCall(
      fetch(`${API_BASE}/lost-found/${id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(claimData),
      }).then(handleResponse),
      (state) => {
        const item = state.lostAndFound.find((i) => i.id === id);
        if (item) {
          item.claims = item.claims || [];
          item.claims.push({
            id: `claim-${Date.now()}`,
            ...claimData,
            date: new Date().toISOString(),
            status: 'pending',
          });
          saveLocalState(state);
        }
        return item;
      }
    ),

  reviewClaim: (id, claimId, action) =>
    safeCall(
      fetch(`${API_BASE}/lost-found/${id}/claim/${claimId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      }).then(handleResponse),
      (state) => {
        const item = state.lostAndFound.find((i) => i.id === id);
        if (item && item.claims) {
          const claim = item.claims.find((c) => c.id === claimId);
          if (claim) claim.status = action === 'approve' ? 'approved' : 'rejected';
          if (action === 'approve') item.status = 'verified_returned';
          saveLocalState(state);
        }
        return item;
      }
    ),

  // Campus Issues (5-Stage lifecycle)
  getIssues: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/issues?${query}` : `${API_BASE}/issues`;
    return safeCall(
      fetch(url).then(handleResponse),
      (state) => {
        let issues = state.campusIssues;
        if (params.category && params.category !== 'All') {
          issues = issues.filter((i) => i.category?.toLowerCase() === params.category.toLowerCase());
        }
        if (params.status && params.status !== 'All') {
          issues = issues.filter((i) => i.status === params.status);
        }
        if (params.search) {
          const q = params.search.toLowerCase();
          issues = issues.filter(
            (i) =>
              i.title?.toLowerCase().includes(q) ||
              i.description?.toLowerCase().includes(q) ||
              i.location?.toLowerCase().includes(q)
          );
        }
        return issues;
      }
    );
  },

  createIssue: (issue) =>
    safeCall(
      fetch(`${API_BASE}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issue),
      }).then(handleResponse),
      (state) => {
        const count = state.campusIssues.length + 45;
        const ticketNumber = `ISS-2026-${String(count).padStart(3, '0')}`;
        const newIssue = {
          id: `iss-${Date.now()}`,
          ticketNumber,
          currentStageIndex: 1,
          status: 'reported',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          reportedBy: 'Karthik (CS24B001)',
          timeline: [
            {
              stage: 'Report',
              status: 'reported',
              message: 'Issue reported by student with details.',
              timestamp: new Date().toISOString(),
              actor: 'Karthik',
            },
          ],
          ...issue,
        };
        state.campusIssues.unshift(newIssue);
        state.notifications.unshift({
          id: `nt-${Date.now()}`,
          title: `Campus Issue Created (${ticketNumber})`,
          message: `Your issue "${newIssue.title}" was logged and queued for administrative routing.`,
          type: 'issue',
          timestamp: new Date().toISOString(),
          read: false,
        });
        saveLocalState(state);
        return newIssue;
      }
    ),

  updateIssueStage: (id, stageData) =>
    safeCall(
      fetch(`${API_BASE}/issues/${id}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stageData),
      }).then(handleResponse),
      (state) => {
        const issue = state.campusIssues.find((i) => i.id === id);
        if (issue) {
          if (stageData.stageIndex) issue.currentStageIndex = stageData.stageIndex;
          if (stageData.status) issue.status = stageData.status;
          if (stageData.assignedStaff) issue.assignedStaff = stageData.assignedStaff;
          if (stageData.timelineEntry) {
            issue.timeline.push({
              ...stageData.timelineEntry,
              timestamp: new Date().toISOString(),
            });
          }
          issue.updatedAt = new Date().toISOString();
          saveLocalState(state);
        }
        return issue;
      }
    ),

  // Notifications & Stats
  getNotifications: () =>
    safeCall(
      fetch(`${API_BASE}/notifications`).then(handleResponse),
      (state) => state.notifications
    ),

  markNotificationsRead: () =>
    safeCall(
      fetch(`${API_BASE}/notifications/mark-read`, { method: 'POST' }).then(handleResponse),
      (state) => {
        state.notifications.forEach((n) => (n.read = true));
        saveLocalState(state);
        return { success: true };
      }
    ),

  getStats: () =>
    safeCall(
      fetch(`${API_BASE}/stats`).then(handleResponse),
      (state) => ({
        totalCanteens: state.canteens.length,
        totalMenuItems: state.menuItems.length,
        activeOrders: state.orders.filter((o) => ['cooking', 'ready', 'serving'].includes(o.status)).length,
        totalIssues: state.campusIssues.length,
        resolvedIssues: state.campusIssues.filter((i) => i.status === 'resolved').length,
        lostItems: state.lostAndFound.filter((l) => l.type === 'lost').length,
        foundItems: state.lostAndFound.filter((l) => l.type === 'found').length,
      })
    ),
};
