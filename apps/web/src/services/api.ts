import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.peage.io';

// BUG FIX: toutes les routes ci-dessous et dans useAuth.ts sont relatives
// sans préfixe ('/auth/login', '/links', '/domains'...), mais l'API les
// monte sous /api/* (voir apps/api/src/index.ts : app.route('/api/auth', ...)
// et workers/redirect-worker qui appelle lui-même `${API_URL}/api/links/...`).
// Sans le '/api' ici, chaque requête du front visait une route inexistante.
export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Intercepteur de requête — ajouter le token
api.interceptors.request.use((config) => {
  const { accessToken } = useAuth.getState();
  
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  
  return config;
});

// Intercepteur de réponse — gérer les erreurs et refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Si 401 et pas déjà en train de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        await useAuth.getState().refreshAuth();
        const { accessToken } = useAuth.getState();
        
        if (accessToken) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch {
        useAuth.getState().logout();
        window.location.href = '/login';
      }
    }
    
    // Formater l'erreur
    const message = error.response?.data?.error?.message || error.message || 'An error occurred';
    const code = error.response?.data?.error?.code || 'UNKNOWN_ERROR';
    
    return Promise.reject({ message, code, status: error.response?.status });
  }
);

// ─── API Helpers ───────────────────────────────────────
export const apiService = {
  // Auth
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: { email: string; username: string; password: string; referralCode?: string }) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
  
  // Links
  getLinks: (params?: Record<string, unknown>) => api.get('/links', { params }),
  getLink: (id: string) => api.get(`/links/${id}`),
  createLink: (data: Record<string, unknown>) => api.post('/links', data),
  updateLink: (id: string, data: Record<string, unknown>) => api.patch(`/links/${id}`, data),
  deleteLink: (id: string) => api.delete(`/links/${id}`),
  getLinkStats: (id: string) => api.get(`/links/${id}/stats`),
  
  // Analytics
  getAnalyticsOverview: (params?: Record<string, unknown>) => api.get('/analytics/overview', { params }),
  
  // Earnings
  getEarnings: (params?: Record<string, unknown>) => api.get('/earnings', { params }),
  getBalance: () => api.get('/earnings/balance'),
  
  // Withdrawals
  getWithdrawals: (params?: Record<string, unknown>) => api.get('/withdrawals', { params }),
  requestWithdrawal: (data: Record<string, unknown>) => api.post('/withdrawals', data),
  cancelWithdrawal: (id: string) => api.post(`/withdrawals/${id}/cancel`),
  getWithdrawalMethods: () => api.get('/withdrawals/methods'),
  
  // Referrals
  getReferrals: (params?: Record<string, unknown>) => api.get('/referrals', { params }),
  getReferralStats: () => api.get('/referrals/stats'),
  getReferralCode: () => api.get('/referrals/code'),
  
  // Users
  updateProfile: (data: Record<string, unknown>) => api.patch('/users/me', data),
  changePassword: (data: Record<string, unknown>) => api.patch('/users/me/password', data),
  
  // API Keys
  getApiKeys: () => api.get('/api-keys'),
  createApiKey: (data: Record<string, unknown>) => api.post('/api-keys', data),
  deleteApiKey: (id: string) => api.delete(`/api-keys/${id}`),
  
  // Domains
  getDomains: () => api.get('/domains'),
  addDomain: (data: Record<string, unknown>) => api.post('/domains', data),
  verifyDomain: (id: string) => api.post(`/domains/${id}/verify`),
  deleteDomain: (id: string) => api.delete(`/domains/${id}`),
  
  // Admin
  getAdminDashboard: () => api.get('/admin/dashboard'),
  getAdminUsers: (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
  getUserDetails: (id: string) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id: string, status: string) => api.patch(`/admin/users/${id}/status`, { status }),
  updateUserRole: (id: string, role: string) => api.patch(`/admin/users/${id}/role`, { role }),
};
