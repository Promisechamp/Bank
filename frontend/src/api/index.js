import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// ------------------- Supabase client -------------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// If you already have a supabase client elsewhere, import it instead.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ------------------- Axios instance -------------------
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ----- Request interceptor: add token -----
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ----- Response interceptor: handle 401 with refresh -----
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // If it's a 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the session using Supabase
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) throw refreshError;

        if (!data.session) throw new Error('No session after refresh');

        const newToken = data.session.access_token;
        // Store the new token
        localStorage.setItem('token', newToken);

        // Update the Authorization header and retry the request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed – clear session and redirect to login
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // For other errors, just reject
    return Promise.reject(error.response?.data || error.message);
  }
);

// ------------------- API exports (unchanged) -------------------
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
		selfRegister: (data) => api.post('/auth/self-register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  getAllUsers: () => api.get('/admin/users'),
  getUserById: (userId) => api.get(`/admin/users/${userId}`),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  updateUserStatus: (userId, status) => api.patch(`/admin/users/${userId}/status`, { status }),

};

export const accountsAPI = {
  create: (data) => api.post('/accounts', data),
  getAll: () => api.get('/accounts'),
  getOne: (id) => api.get(`/accounts/${id}`),
  getBalance: (id) => api.get(`/accounts/${id}/balance`),
  close: (id) => api.delete(`/accounts/${id}`),
  checkExists: (accountNumber) => api.get(`/accounts/check/${accountNumber}`),
  adminGetAll: () => api.get('/admin/accounts'),
  adminGetOne: (accountId) => api.get(`/admin/accounts/${accountId}`),
  adminUpdateStatus: (accountId, status) => api.patch(`/admin/accounts/${accountId}/status`, { status }),
  adminDelete: (accountId) => api.delete(`/admin/accounts/${accountId}`),
};

export const transactionsAPI = {
  getHistory: (accountId, params) => api.get(`/transactions/history/${accountId}`, { params }),
  getByReference: (referenceId) => api.get(`/transactions/reference/${referenceId}`),
  initiateTransfer: (data) => api.post('/transactions/transfer/initiate', data),
  verifyTransfer: (data) => api.post('/transactions/transfer/verify', data),
  adminGetAll: (params) => api.get('/admin/transactions', { params }),
  adminGetById: (txId) => api.get(`/admin/transactions/${txId}`),
  adminApprove: (txId) => api.patch(`/admin/transactions/${txId}/approve`),
  adminReject: (txId) => api.patch(`/admin/transactions/${txId}/reject`),
  adminCredit: (data) => api.post(`/admin/users/${data.userId}/credit`, data),
  adminDebit: (data) => api.post(`/admin/users/${data.userId}/debit`, data),
  updateTransaction: (txId, data) => api.patch(`/admin/transactions/${txId}`, data),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getLayoutStats: () => api.get('/admin/stats/layout'),
  getAllUsers: () => api.get('/admin/users'),
  getUserById: (userId) => api.get(`/admin/users/${userId}`),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  updateUserStatus: (userId, status) => api.patch(`/admin/users/${userId}/status`, { status }),
  getAllAccounts: () => api.get('/admin/accounts'),
  getAccountDetails: (accountId) => api.get(`/admin/accounts/${accountId}`),
  updateAccountStatus: (accountId, status) => api.patch(`/admin/accounts/${accountId}/status`, { status }),
  getAllTransactions: (params) => api.get('/admin/transactions', { params }),
  getTransactionById: (txId) => api.get(`/admin/transactions/${txId}`),
  approveTransaction: (txId) => api.patch(`/admin/transactions/${txId}/approve`),
  rejectTransaction: (txId) => api.patch(`/admin/transactions/${txId}/reject`),
		
		generateRegisterToken: (expiresAt) => api.post('/admin/tokens/generate', { expiresAt }),
  getRegisterTokens: () => api.get('/admin/tokens'),
  revokeRegisterToken: (token) => api.delete(`/admin/tokens/${token}`),

  adminCredit: (data) => api.post(`/admin/users/${data.userId}/credit`, {
    accountId: data.accountId,
    amount: data.amount,
    description: data.description,
    date: data.date,
    sendAlert: data.sendAlert,
    senderName: data.senderName,
    senderBank: data.senderBank,
    senderAccountNo: data.senderAccountNo
  }),

  adminDebit: (data) => api.post(`/admin/users/${data.userId}/debit`, {
    accountId: data.accountId,
    amount: data.amount,
    description: data.description,
    note: data.note,
    date: data.date,
    sendAlert: data.sendAlert,
    receiverName: data.receiverName,
    receiverBank: data.receiverBank,
    receiverAccountNo: data.receiverAccountNo
  }),


};

export const chatAPI = {
  createConversation: (data) => api.post('/chat/conversations', data),
  startNewConversation: (data) => api.post('/chat/conversations/new', data),
  getUserConversations: () => api.get('/chat/conversations'),
  getConversationById: (conversationId) => api.get(`/chat/conversations/${conversationId}`),
  sendMessage: (conversationId, data) => api.post(`/chat/conversations/${conversationId}/messages`, data),
  markConversationRead: (conversationId) => api.patch(`/chat/conversations/${conversationId}/read`),
  closeConversation: (conversationId) => api.patch(`/chat/conversations/${conversationId}/close`),
  getAdminConversations: (status = 'active') => api.get('/chat/admin/conversations', { params: { status } }),
		deleteConversation: (conversationId) => api.delete(`/chat/conversations/${conversationId}`),
};

export const cardTrackingAPI = {
  create: (data) => api.post('/card-tracking', data),
  getMyCards: () => api.get('/card-tracking'),
  getByOrderId: (orderId) => api.get(`/card-tracking/${orderId}`),
  adminGetAll: (params) => api.get('/card-tracking/admin/all', { params }),
  adminGetOne: (id) => api.get(`/card-tracking/admin/${id}`),
  adminCreate: (data) => api.post('/card-tracking/admin', data),
  adminUpdate: (id, data) => api.put(`/card-tracking/admin/${id}`, data),
  adminDelete: (id) => api.delete(`/card-tracking/admin/${id}`),
  updateStatus: (id, data) => api.patch(`/card-tracking/admin/${id}/status`, data),
  addTrackingEvent: (id, data) => api.post(`/card-tracking/admin/${id}/events`, data),
};



export const notificationsAPI = {
  get: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  deleteBatch: (ids) => api.delete('/notifications', { data: { ids } }),
  deleteAll: (readOnly = false) => api.delete(`/notifications?deleteAll=true${readOnly ? '&readOnly=true' : ''}`),
};

export default api;