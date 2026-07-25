import axios from 'axios';

export const apiBaseURL = '/api/delivery';

const api = axios.create({ baseURL: apiBaseURL });

api.interceptors.request.use((config) => {
  const url = config.url || '';
  const token = localStorage.getItem('delivery_token');
  const customerToken = localStorage.getItem('delivery_customer_token');
  if (customerToken && url.startsWith('/auth/')) {
    config.headers.Authorization = `Bearer ${customerToken}`;
  } else if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) delete config.headers['Content-Type'];
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname.startsWith('/admin')) {
      localStorage.removeItem('delivery_token');
      localStorage.removeItem('delivery_user');
    }
    return Promise.reject(error);
  }
);

export default api;
