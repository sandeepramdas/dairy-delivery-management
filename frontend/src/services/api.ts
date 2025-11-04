import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  getProfile: () => api.get('/auth/profile'),

  changePassword: (current_password: string, new_password: string) =>
    api.post('/auth/change-password', { current_password, new_password }),
};

// Customers API
export const customersAPI = {
  getAll: (params?: any) => api.get('/customers', { params }),
  getById: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
  getOutstanding: (id: string) => api.get(`/customers/${id}/outstanding`),
};

// Areas API
export const areasAPI = {
  getAll: (params?: any) => api.get('/areas', { params }),
  getById: (id: string) => api.get(`/areas/${id}`),
  create: (data: any) => api.post('/areas', data),
  update: (id: string, data: any) => api.put(`/areas/${id}`, data),
  delete: (id: string) => api.delete(`/areas/${id}`),
};

// Products API
export const productsAPI = {
  getAll: (params?: any) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// Deliveries API
export const deliveriesAPI = {
  getAll: (params?: any) => api.get('/deliveries', { params }),
  getToday: (params?: any) => api.get('/deliveries/today', { params }),
  getCalendar: (year: number, month: number, area_id?: string) =>
    api.get('/deliveries/calendar', { params: { year, month, area_id } }),
  getByDate: (date: string, params?: any) =>
    api.get(`/deliveries/date/${date}`, { params }),
  getById: (id: string) => api.get(`/deliveries/${id}`),
  complete: (id: string, data: any) =>
    api.post(`/deliveries/${id}/complete`, data),
  markMissed: (id: string, data: any) =>
    api.post(`/deliveries/${id}/missed`, data),
  reportException: (id: string, data: any) =>
    api.post(`/deliveries/${id}/exceptions`, data),
  getExceptions: (id: string) =>
    api.get(`/deliveries/${id}/exceptions`),
};

// Subscriptions API
export const subscriptionsAPI = {
  getAll: (params?: any) => api.get('/subscriptions', { params }),
  getById: (id: string) => api.get(`/subscriptions/${id}`),
  create: (data: any) => api.post('/subscriptions', data),
  update: (id: string, data: any) => api.put(`/subscriptions/${id}`, data),
  pause: (id: string) => api.post(`/subscriptions/${id}/pause`),
  resume: (id: string) => api.post(`/subscriptions/${id}/resume`),
  cancel: (id: string) => api.post(`/subscriptions/${id}/cancel`),
};

// Payments API
export const paymentsAPI = {
  getAll: (params?: any) => api.get('/payments', { params }),
  getById: (id: string) => api.get(`/payments/${id}`),
  create: (data: any) => api.post('/payments', data),
  getAllocate: (id: string, data: any) => api.post(`/payments/${id}/allocate`, data),
};

// Reports API
export const reportsAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getAging: (params?: any) => api.get('/reports/aging', { params }),
  getFinancial: (params?: any) => api.get('/reports/financial', { params }),
  getDeliveries: (params?: any) => api.get('/reports/deliveries', { params }),
  getCustomers: (params?: any) => api.get('/reports/customers', { params }),
};

export default api;
