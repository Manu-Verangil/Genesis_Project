const API_BASE = '/api';

export const api = {
  // Canteens & Menu
  getCanteens: () => fetch(`${API_BASE}/canteens`).then((r) => r.json()),
  updateCrowdLevel: (canteenId, crowdLevel) =>
    fetch(`${API_BASE}/canteens/${canteenId}/crowd`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crowdLevel }),
    }).then((r) => r.json()),

  getMenu: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/menu?${query}`).then((r) => r.json());
  },
  addMenuItem: (item) =>
    fetch(`${API_BASE}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }).then((r) => r.json()),
  updateMenuItem: (id, updates) =>
    fetch(`${API_BASE}/menu/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).then((r) => r.json()),
  notifyMe: (id) =>
    fetch(`${API_BASE}/menu/${id}/notify-me`, {
      method: 'POST',
    }).then((r) => r.json()),

  // Orders & Queue
  getOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/orders?${query}`).then((r) => r.json());
  },
  getQueue: (canteenId) => fetch(`${API_BASE}/queue/${canteenId}`).then((r) => r.json()),
  createOrder: (orderData) =>
    fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    }).then((r) => r.json()),
  updateOrderStatus: (orderId, status) =>
    fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then((r) => r.json()),
  verifyToken: (token, canteenId) =>
    fetch(`${API_BASE}/orders/verify-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, canteenId }),
    }).then((r) => r.json()),

  // Wallet
  getWallet: () => fetch(`${API_BASE}/wallet`).then((r) => r.json()),
  topUpWallet: (amount) =>
    fetch(`${API_BASE}/wallet/topup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    }).then((r) => r.json()),

  // Campus Map
  getMapLocations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/map?${query}`).then((r) => r.json());
  },
  addMapLocation: (loc) =>
    fetch(`${API_BASE}/map`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loc),
    }).then((r) => r.json()),
  updateMapLocation: (id, updates) =>
    fetch(`${API_BASE}/map/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).then((r) => r.json()),

  // Lost & Found
  getLostAndFound: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/lost-found?${query}`).then((r) => r.json());
  },
  reportLostFound: (item) =>
    fetch(`${API_BASE}/lost-found`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }).then((r) => r.json()),
  claimLostFound: (id, claimData) =>
    fetch(`${API_BASE}/lost-found/${id}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claimData),
    }).then((r) => r.json()),
  reviewClaim: (id, claimId, action) =>
    fetch(`${API_BASE}/lost-found/${id}/claim/${claimId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    }).then((r) => r.json()),

  // Campus Issues (5-Stage lifecycle)
  getIssues: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/issues?${query}`).then((r) => r.json());
  },
  createIssue: (issue) =>
    fetch(`${API_BASE}/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issue),
    }).then((r) => r.json()),
  updateIssueStage: (id, stageData) =>
    fetch(`${API_BASE}/issues/${id}/stage`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stageData),
    }).then((r) => r.json()),

  // Notifications & Stats
  getNotifications: () => fetch(`${API_BASE}/notifications`).then((r) => r.json()),
  markNotificationsRead: () => fetch(`${API_BASE}/notifications/mark-read`, { method: 'POST' }).then((r) => r.json()),
  getStats: () => fetch(`${API_BASE}/stats`).then((r) => r.json()),
};
