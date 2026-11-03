import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('echoai_token') || localStorage.getItem('echoai_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/') {
      sessionStorage.removeItem('echoai_token');
      localStorage.removeItem('echoai_token');
      sessionStorage.removeItem('echoai_user');
      localStorage.removeItem('echoai_user');
      window.location.assign('/');
    }
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/') {
      sessionStorage.removeItem('echoai_token');
      localStorage.removeItem('echoai_token');
      sessionStorage.removeItem('echoai_user');
      localStorage.removeItem('echoai_user');
      window.location.assign('/');
    }
    return Promise.reject(error);
  }
);

export default api;
