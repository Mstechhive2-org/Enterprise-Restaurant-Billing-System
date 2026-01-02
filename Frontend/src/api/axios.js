import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a separate axios instance for auth refresh to avoid interceptor recursion
const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token refresh state management
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add a request interceptor to include the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Log errors for debugging in production
    if (error.response) {
      console.error('API Error:', {
        status: error.response.status,
        url: error.config?.url,
        message: error.response.data?.message || error.message,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('Network Error:', {
        url: error.config?.url,
        message: 'No response received from server'
      });
    } else {
      console.error('Request Error:', error.message);
    }

    // Handle 401 (Unauthorized) - Session invalid/expired -> Logout immediately
    if (error.response?.status === 401) {
      console.warn('401 Unauthorized - Logging out user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.reload();
      return Promise.reject(error);
    }

    // Handle 403 (Forbidden) - Token expired -> Try Refresh
    if (error.response?.status === 403 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        console.warn('No refresh token available - Logging out');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.reload();
        return Promise.reject(error);
      }

      try {
        console.log('Attempting to refresh access token...');
        // Use separate axios instance to avoid triggering interceptor
        const response = await authApi.post('/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        console.log('Token refresh successful');
        // Store new tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Process queued requests
        processQueue(null, accessToken);
        isRefreshing = false;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear storage and reload
        console.error('Token refresh failed:', refreshError.response?.data || refreshError.message);
        processQueue(refreshError, null);
        isRefreshing = false;

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.reload();
        return Promise.reject(refreshError);
      }
    }

    // If not a 401/403 or refresh failed, reject the error
    return Promise.reject(error);
  }
);

export default api;
