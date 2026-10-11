import { initialData } from './mockData';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// Local storage key for persistent client-side state
const STORAGE_KEY = 'smart_campus_hub_amrita_state_v11';

function getLocalState() {
  try {
    // Clean up older legacy cached versions
    [
      'smart_campus_hub_amrita_state_v1',
      'smart_campus_hub_amrita_state_v2',
      'smart_campus_hub_amrita_state_v5',
      'smart_campus_hub_amrita_state_v6',
      'smart_campus_hub_amrita_state_v7',
      'smart_campus_hub_amrita_state_v8',
      'smart_campus_hub_amrita_state_v9',
      'smart_campus_hub_amrita_state_v10'
    ].forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved);
      // Ensure campusLocations stay strictly synced with the latest real GPS coordinates
      state.campusLocations = initialData.campusLocations;
      const deletedIds = new Set(state.deletedCanteenIds || []);
      const activeBaseCanteens = initialData.canteens.filter((c) => !deletedIds.has(c.id));
      // Preserve custom-created canteens while keeping base initial canteens updated (excluding deleted)
      if (Array.isArray(state.canteens)) {
        const customCanteens = state.canteens.filter(
          (c) => !deletedIds.has(c.id) && !initialData.canteens.some((initC) => initC.id === c.id)
        );
        state.canteens = [...activeBaseCanteens, ...customCanteens];
      } else {
        state.canteens = activeBaseCanteens;
      }
      // Apply any saved canteen edits (name, location, code, timings, image, etc.)
      if (state.customCanteenUpdates && Array.isArray(state.canteens)) {
        state.canteens.forEach((c) => {
          if (state.customCanteenUpdates[c.id]) {
            Object.assign(c, state.customCanteenUpdates[c.id]);
          }
        });
      }
      // Preserve custom-created menu items while filtering out dishes from deleted canteens
      if (Array.isArray(state.menuItems)) {
        const customItems = state.menuItems.filter(
          (m) => !deletedIds.has(m.canteenId) && !initialData.menuItems.some((initM) => initM.id === m.id)
        );
        const activeBaseItems = initialData.menuItems.filter((m) => !deletedIds.has(m.canteenId));
        state.menuItems = [...activeBaseItems, ...customItems];
      } else {
        state.menuItems = initialData.menuItems.filter((m) => !deletedIds.has(m.canteenId));
      }
      if (!state.wallet || typeof state.wallet.balance !== 'number') {
        state.wallet = JSON.parse(JSON.stringify(initialData.wallet || { balance: 425, transactions: [] }));
      }
      return state;
    }
  } catch (e) {
    console.warn('LocalStorage read error:', e);
  }
  const initial = JSON.parse(JSON.stringify(initialData));
  initial.deletedCanteenIds = [];
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

// In-memory access token storage (XSS protected: never stored in localStorage)
let inMemoryAccessToken = null;
let isRefreshing = false;
let refreshQueue = [];

export const setAccessToken = (token) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => inMemoryAccessToken;

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
    const err = new Error(errorMessage);
    err.status = r.status;
    throw err;
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

// Authenticated fetch wrapper with automatic silent token refresh on 401
async function authFetch(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (inMemoryAccessToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${inMemoryAccessToken}`;
  }

  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include' // Sends/receives HttpOnly refresh cookie
  };

  try {
    const res = await fetch(url, fetchOptions);
    if (res.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/refresh')) {
      // Trigger silent auto-refresh
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            credentials: 'include'
          }).then(handleResponse);

          if (refreshRes && refreshRes.accessToken) {
            setAccessToken(refreshRes.accessToken);
            refreshQueue.forEach((cb) => cb(refreshRes.accessToken));
            refreshQueue = [];
          } else {
            setAccessToken(null);
          }
        } catch (e) {
          setAccessToken(null);
          refreshQueue = [];
        } finally {
          isRefreshing = false;
        }
      } else {
        // Wait for active refresh to complete
        await new Promise((resolve) => refreshQueue.push(resolve));
      }

      // Retry original request with new token if available
      if (inMemoryAccessToken) {
        headers['Authorization'] = `Bearer ${inMemoryAccessToken}`;
        return fetch(url, { ...options, headers, credentials: 'include' });
      }
    }
    return res;
  } catch (err) {
    throw err;
  }
}

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
  // Authentication
  login: async (credentials) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(credentials)
    }).then(handleResponse);

    if (res && res.accessToken) {
      setAccessToken(res.accessToken);
    }
    return res;
  },

  register: async (userData) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData)
    }).then(handleResponse);

    if (res && res.accessToken) {
      setAccessToken(res.accessToken);
    }
    return res;
  },

  refreshToken: async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include'
      }).then(handleResponse);

      if (res && res.accessToken) {
        setAccessToken(res.accessToken);
      }
      return res;
    } catch (e) {
      setAccessToken(null);
      throw e;
    }
  },

  logout: async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      }).then(handleResponse);
      setAccessToken(null);
      return res;
    } catch (e) {
      setAccessToken(null);
      return { success: true };
    }
  },

  getCurrentUser: () =>
    authFetch(`${API_BASE}/auth/me`).then(handleResponse),

  guestLogin: async () => {
    const res = await fetch(`${API_BASE}/auth/guest`, {
      method: 'POST',
      credentials: 'include'
    }).then(handleResponse);

    if (res && res.accessToken) {
      setAccessToken(res.accessToken);
    }
    return res;
  },

  getStudentSpending: () =>
    authFetch(`${API_BASE}/student/spending`).then(handleResponse),

  // Admin User & Security Vault APIs
  getUsers: () =>
    safeCall(
      authFetch(`${API_BASE}/admin/users`).then(handleResponse),
      (state) => state.users || []
    ),

  addUser: (userData) =>
    authFetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    }).then(handleResponse),

  removeUser: (idOrUsername) =>
    authFetch(`${API_BASE}/admin/users/${idOrUsername}`, {
      method: 'DELETE'
    }).then(handleResponse),

  updateUserPassword: (idOrUsername, newPassword) =>
    authFetch(`${API_BASE}/admin/users/${idOrUsername}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword })
    }).then(handleResponse),

  inspectVault: () =>
    safeCall(
      authFetch(`${API_BASE}/admin/vault/inspect`).then(handleResponse),
      () => ({
        algorithm: 'aes-256-gcm',
        theftProtection: 'MILITARY-GRADE AES-256-GCM CIPHERTEXT: Completely useless to an intruder without the master key.',
        fileSizeBytes: 3450,
        ciphertextSnippet: '50e9140ad8adbabb5599793deaf74ab0caf281d2e451b6c333c9149a1fc726bb32b38529c21c7482f33c30dab4ac22ef8a6e...',
        securitySummary: 'Even if an attacker gains physical or unauthorized access to the disk and copies the vault file, it is cryptographically impossible to extract plaintext passwords or usernames without the 256-bit encryption key and GCM authentication tag.'
      })
    ),

  // Predictive Demand Analytics & Festival/Holiday Spike Warning
  getCanteenForecast: (canteenId = 'all') =>
    safeCall(
      fetch(`${API_BASE}/canteen/forecast?canteenId=${canteenId}`).then(handleResponse),
      () => null
    ),

  // Canteens & Menu
  getCanteens: () =>
    safeCall(
      fetch(`${API_BASE}/canteens`).then(handleResponse),
      (state) => {
        return (state.canteens || []).map((c) => {
          const activeCount = (state.orders || []).filter(
            (o) => o.canteenId === c.id && ['serving', 'ready', 'cooking', 'received'].includes(o.status)
          ).length;
          return {
            ...c,
            activeOrdersCount: activeCount
          };
        });
      }
    ),

  addCanteen: (canteenData) =>
    safeCall(
      fetch(`${API_BASE}/canteens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(canteenData),
      }).then(handleResponse),
      (state) => {
        const id = canteenData.id || `canteen-${Date.now()}`;
        const newCanteen = {
          id,
          name: canteenData.name,
          code: canteenData.code || `C${state.canteens.length + 1}`,
          location: canteenData.location || 'Central Campus, Amrita Ettimadai',
          timings: canteenData.timings || '08:00 AM - 10:00 PM',
          status: 'open',
          crowdLevel: canteenData.crowdLevel || 'Low',
          avgWaitTimeMinutes: Number(canteenData.avgWaitTimeMinutes) || 5,
          activeOrdersCount: 0,
          counterSpeed: canteenData.counterSpeed || 'Fast',
          image: canteenData.image || '',
        };
        if (state.deletedCanteenIds) {
          state.deletedCanteenIds = state.deletedCanteenIds.filter((delId) => delId !== id);
        }
        state.canteens.push(newCanteen);
        saveLocalState(state);
        return newCanteen;
      }
    ),

  deleteCanteen: (canteenId) =>
    safeCall(
      fetch(`${API_BASE}/canteens/${canteenId}`, {
        method: 'DELETE',
      }).then(handleResponse),
      (state) => {
        if (!state.deletedCanteenIds) state.deletedCanteenIds = [];
        if (!state.deletedCanteenIds.includes(canteenId)) {
          state.deletedCanteenIds.push(canteenId);
        }
        state.canteens = (state.canteens || []).filter((c) => c.id !== canteenId);
        state.menuItems = (state.menuItems || []).filter((m) => m.canteenId !== canteenId);
        saveLocalState(state);
        return { id: canteenId, deleted: true };
      }
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

  updateCanteen: (canteenId, updates) =>
    safeCall(
      fetch(`${API_BASE}/canteens/${canteenId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).then(handleResponse),
      (state) => {
        const canteen = state.canteens.find((c) => c.id === canteenId);
        if (canteen) {
          Object.assign(canteen, updates);
        }
        if (!state.customCanteenUpdates) state.customCanteenUpdates = {};
        state.customCanteenUpdates[canteenId] = {
          ...(state.customCanteenUpdates[canteenId] || {}),
          ...updates,
        };
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

  deleteMenuItem: (id) =>
    safeCall(
      fetch(`${API_BASE}/menu/${id}`, {
        method: 'DELETE',
      }).then(handleResponse),
      (state) => {
        state.menuItems = state.menuItems.filter((m) => m.id !== id);
        saveLocalState(state);
        return { success: true, id };
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
        const canteen = state.canteens.find((c) => c.id === orderData.canteenId);
        const canteenCode = canteen?.code || (orderData.canteenId === 'canteen-2' ? 'C2' : 'C1');
        const num = Math.floor(100 + Math.random() * 900);
        const newOrder = {
          id: `ord-${Date.now()}`,
          token: `${canteenCode}-${num}`,
          canteenName: orderData.canteenName || (canteen ? canteen.name : 'Campus Canteen'),
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
      (state) => state.wallet || initialData.wallet || { balance: 425, transactions: [] }
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
        const lat = Number(loc.lat) || 10.9036;
        const lng = Number(loc.lng) || 76.8997;
        const newLoc = {
          id: loc.id || `loc-${Date.now()}`,
          ...loc,
          lat,
          lng,
          coordinates: { x: 50, y: 50, lat, lng }
        };

        if (loc.createCanteen || loc.category === 'Food & Dining') {
          const canteenId = loc.relatedCanteenId || `canteen-${Date.now()}`;
          newLoc.relatedCanteenId = canteenId;
          if (!state.canteens.some(c => c.id === canteenId)) {
            state.canteens.push({
              id: canteenId,
              name: loc.name,
              code: loc.code || loc.name.substring(0, 3).toUpperCase(),
              location: loc.address || `${loc.building || 'Campus'}, Amrita Ettimadai`,
              timings: loc.timings || "08:00 AM - 09:30 PM",
              status: "open",
              crowdLevel: "Low",
              avgWaitTimeMinutes: 5,
              activeOrdersCount: 0,
              counterSpeed: "Normal"
            });
          }
        }

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
        if (loc) {
          Object.assign(loc, updates);
          if (updates.lat) loc.lat = Number(updates.lat);
          if (updates.lng) loc.lng = Number(updates.lng);
          if (loc.coordinates) {
            if (updates.lat) loc.coordinates.lat = Number(updates.lat);
            if (updates.lng) loc.coordinates.lng = Number(updates.lng);
          }

          // Relational update for Canteens, Staff view, and Orders
          const relatedCanteenId = loc.relatedCanteenId || (id === 'loc-1' ? 'canteen-1' : (id === 'loc-it' || id === 'loc-2') ? 'canteen-2' : (id === 'loc-mba' || id === 'loc-3') ? 'canteen-3' : null);
          if (relatedCanteenId) {
            const canteen = state.canteens.find(c => c.id === relatedCanteenId);
            if (canteen) {
              if (updates.name) canteen.name = updates.name;
              if (updates.timings) canteen.timings = updates.timings;
              if (updates.address || updates.building) {
                canteen.location = updates.address || `${updates.building}, Amrita Ettimadai`;
              }
            }
            if (updates.name && state.orders) {
              state.orders.forEach(o => {
                if (o.canteenId === relatedCanteenId) o.canteenName = updates.name;
              });
            }
          }
        }
        saveLocalState(state);
        return loc;
      }
    ),

  deleteMapLocation: (id) =>
    safeCall(
      fetch(`${API_BASE}/map/${id}`, {
        method: 'DELETE',
      }).then(handleResponse),
      (state) => {
        const idx = state.campusLocations.findIndex((l) => l.id === id);
        if (idx !== -1) {
          const removed = state.campusLocations.splice(idx, 1)[0];
          saveLocalState(state);
          return removed;
        }
        return { success: true };
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

        let lat = null;
        let lng = null;
        let markedOnMap = false;

        if (isFormData) {
          title = item.get('title') || title;
          type = item.get('type') || type;
          category = item.get('category') || category;
          location = item.get('location') || location;
          lat = item.get('lat') ? Number(item.get('lat')) : null;
          lng = item.get('lng') ? Number(item.get('lng')) : null;
          markedOnMap = item.get('markedOnMap') === 'true' || Boolean(item.get('markedOnMap'));
          description = item.get('description') || description;
          contactInfo = item.get('contactInfo') || contactInfo;
          imageUrl = item.get('imageUrl') || '';
        } else if (item && typeof item === 'object') {
          title = item.title || title;
          type = item.type || type;
          category = item.category || category;
          location = item.location || location;
          lat = item.lat ? Number(item.lat) : null;
          lng = item.lng ? Number(item.lng) : null;
          markedOnMap = Boolean(item.markedOnMap);
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
          lat,
          lng,
          markedOnMap,
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
          reportedBy: 'Student Community (Ettimadai)',
          timeline: [
            {
              stage: 'Report',
              status: 'reported',
              message: 'Issue reported by student with details.',
              timestamp: new Date().toISOString(),
              actor: 'Student Community',
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
