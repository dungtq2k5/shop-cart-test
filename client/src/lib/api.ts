import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // send HttpOnly JWT cookie automatically
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: on 401, dispatch a custom event for the auth store to react to
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export default api;
