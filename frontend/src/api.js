import axios from 'axios';

const resolvedBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname === 'localhost' ? 'http://127.0.0.1:8000' : 'http://localhost:8000');

const api = axios.create({ baseURL: resolvedBaseUrl });

// Interceptor to add the JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
