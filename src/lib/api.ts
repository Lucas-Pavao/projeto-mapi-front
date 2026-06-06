import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

// Request Interceptor: Automatically attach JWT token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  // Robust check for valid token strings
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Handle auth errors (401, 403)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // If we get a 403 on a protected route while we THINK we are logged in,
      // it might mean the token is invalid or expired.
      console.warn('Auth Error Detected (401/403). Clearing session...');
      // Uncomment if you want automatic logout on auth failure
      // localStorage.removeItem('token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

/**
 * @deprecated Use the centralized 'api' instance instead.
 * Keeping this for backward compatibility during migration.
 */
export const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  if (!token || token === 'undefined' || token === 'null') {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
};
