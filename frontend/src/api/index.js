import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// ============================================
// AUTH API
// ============================================

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  // Admin: Get all users (admin only)
  getAllUsers: () => api.get('/admin/users'),
  getUserById: (userId) => api.get(`/admin/users/${userId}`),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  updateUserStatus: (userId, status) => api.patch(`/admin/users/${userId}/status`, { status }),
};

// ============================================
// ACCOUNTS API
// ============================================

export const accountsAPI = {
  // User endpoints
  create: (data) => api.post('/accounts', data),
  getAll: () => api.get('/accounts'),
  getOne: (id) => api.get(`/accounts/${id}`),
  getBalance: (id) => api.get(`/accounts/${id}/balance`),
  close: (id) => api.delete(`/accounts/${id}`),
  checkExists: (accountNumber) => api.get(`/accounts/check/${accountNumber}`),
  
  // Admin endpoints
  adminGetAll: () => api.get('/admin/accounts'),
  adminGetOne: (accountId) => api.get(`/admin/accounts/${accountId}`),
  adminUpdateStatus: (accountId, status) => api.patch(`/admin/accounts/${accountId}/status`, { status }),
  adminDelete: (accountId) => api.delete(`/admin/accounts/${accountId}`),
};

// ============================================
// TRANSACTIONS API
// ============================================

export const transactionsAPI = {
  // User endpoints
  //deposit: (data) => api.post('/transactions/deposit', data),
  //withdraw: (data) => api.post('/transactions/withdraw', data),
  //transfer: (data) => api.post('/transactions/transfer', data), // Legacy (internal + external with pending)
  getHistory: (accountId, params) => api.get(`/transactions/history/${accountId}`, { params }),
  getByReference: (referenceId) => api.get(`/transactions/reference/${referenceId}`),
  
  // New OTP-based external transfer flow
  initiateTransfer: (data) => api.post('/transactions/transfer/initiate', data),
  verifyTransfer: (data) => api.post('/transactions/transfer/verify', data),
  
  // Admin endpoints
  adminGetAll: (params) => api.get('/admin/transactions', { params }),
  adminGetById: (txId) => api.get(`/admin/transactions/${txId}`),
  adminApprove: (txId) => api.patch(`/admin/transactions/${txId}/approve`),
  adminReject: (txId) => api.patch(`/admin/transactions/${txId}/reject`),
  adminCredit: (data) => api.post(`/admin/users/${data.userId}/credit`, data),
  adminDebit: (data) => api.post(`/admin/users/${data.userId}/debit`, data),
  updateTransaction: (txId, data) => api.patch(`/admin/transactions/${txId}`, data),
};




// ============================================
// ADMIN API
// ============================================

export const adminAPI = {
  // Stats
  getStats: () => api.get('/admin/stats'),
  
  // User management
  getAllUsers: () => api.get('/admin/users'),
  getUserById: (userId) => api.get(`/admin/users/${userId}`),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  updateUserStatus: (userId, status) => api.patch(`/admin/users/${userId}/status`, { status }),
  
  // Account management
  getAllAccounts: () => api.get('/admin/accounts'),
  getAccountDetails: (accountId) => api.get(`/admin/accounts/${accountId}`),
  updateAccountStatus: (accountId, status) => api.patch(`/admin/accounts/${accountId}/status`, { status }),
  
  // Transaction management
  getAllTransactions: (params) => api.get('/admin/transactions', { params }),
  getTransactionById: (txId) => api.get(`/admin/transactions/${txId}`),
  approveTransaction: (txId) => api.patch(`/admin/transactions/${txId}/approve`),
  rejectTransaction: (txId) => api.patch(`/admin/transactions/${txId}/reject`),
};



// ============================================
// CHAT API
// ============================================

export const chatAPI = {
  createConversation: (data) => api.post('/chat/conversations', data),
  startNewConversation: (data) => api.post('/chat/conversations/new', data),
  getUserConversations: () => api.get('/chat/conversations'),
  getConversationById: (conversationId) => api.get(`/chat/conversations/${conversationId}`),
  sendMessage: (conversationId, data) => api.post(`/chat/conversations/${conversationId}/messages`, data),
  markConversationRead: (conversationId) => api.patch(`/chat/conversations/${conversationId}/read`),
  closeConversation: (conversationId) => api.patch(`/chat/conversations/${conversationId}/close`),

  // ---- Admin endpoints ----
  getAdminConversations: (status = 'active') => api.get('/chat/admin/conversations', { params: { status } }),
  claimConversation: (conversationId) => api.patch(`/chat/admin/conversations/${conversationId}/claim`),
};

export default api;