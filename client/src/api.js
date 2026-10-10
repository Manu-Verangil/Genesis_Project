const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

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

export const api = {
  // Canteens & Menu
  getCanteens: () => fetch(`${API_BASE}/canteens`).then(handleResponse),
  updateCrowdLevel: (canteenId, crowdLevel) =>
    fetch(`${API_BASE}/canteens/${canteenId}/crowd`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crowdLevel }),
    }).then(handleResponse),

  getMenu: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/menu?${query}` : `${API_BASE}/menu`;
    return fetch(url).then(handleResponse);
  },
  addMenuItem: (item) =>
    fetch(`${API_BASE}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }).then(handleResponse),
  updateMenuItem: (id, updates) =>
    fetch(`${API_BASE}/menu/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).then(handleResponse),
  notifyMe: (id) =>
    fetch(`${API_BASE}/menu/${id}/notify-me`, {
      method: 'POST',
    }).then(handleResponse),

  // Orders & Queue
  getOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/orders?${query}` : `${API_BASE}/orders`;
    return fetch(url).then(handleResponse);
  },
  getQueue: (canteenId) => fetch(`${API_BASE}/queue/${canteenId}`).then(handleResponse),
  createOrder: (orderData) =>
    fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    }).then(handleResponse),
  updateOrderStatus: (orderId, status) =>
    fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then(handleResponse),
  verifyToken: (token, canteenId) =>
    fetch(`${API_BASE}/orders/verify-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, canteenId }),
    }).then(handleResponse),

  // Wallet
  getWallet: () => fetch(`${API_BASE}/wallet`).then(handleResponse),
  topUpWallet: (amount) =>
    fetch(`${API_BASE}/wallet/topup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    }).then(handleResponse),

  // Campus Map
  getMapLocations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/map?${query}` : `${API_BASE}/map`;
    return fetch(url).then(handleResponse);
  },
  addMapLocation: (loc) =>
    fetch(`${API_BASE}/map`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loc),
    }).then(handleResponse),
  updateMapLocation: (id, updates) =>
    fetch(`${API_BASE}/map/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).then(handleResponse),

  // Lost & Found
  getLostAndFound: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/lost-found?${query}` : `${API_BASE}/lost-found`;
    return fetch(url).then(handleResponse);
  },
  reportLostFound: (item) => {
    const isFormData = typeof FormData !== 'undefined' && item instanceof FormData;
    return fetch(`${API_BASE}/lost-found`, {
      method: 'POST',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? item : JSON.stringify(item),
    }).then(handleResponse);
  },
  claimLostFound: (id, claimData) =>
    fetch(`${API_BASE}/lost-found/${id}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claimData),
    }).then(handleResponse),
  reviewClaim: (id, claimId, action) =>
    fetch(`${API_BASE}/lost-found/${id}/claim/${claimId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    }).then(handleResponse),

  // Campus Issues (5-Stage lifecycle)
  getIssues: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/issues?${query}` : `${API_BASE}/issues`;
    return fetch(url).then(handleResponse);
  },
  createIssue: (issue) =>
    fetch(`${API_BASE}/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issue),
    }).then(handleResponse),
  updateIssueStage: (id, stageData) =>
    fetch(`${API_BASE}/issues/${id}/stage`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stageData),
    }).then(handleResponse),

  // Notifications & Stats
  getNotifications: () => fetch(`${API_BASE}/notifications`).then(handleResponse),
  markNotificationsRead: () => fetch(`${API_BASE}/notifications/mark-read`, { method: 'POST' }).then(handleResponse),
  getStats: () => fetch(`${API_BASE}/stats`).then(handleResponse),
};
