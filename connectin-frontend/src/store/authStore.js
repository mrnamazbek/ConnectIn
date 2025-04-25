import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

const useAuthStore = create((set, get) => ({
  // State
  isAuthenticated: !!localStorage.getItem(ACCESS_TOKEN_KEY),
  user: null,
  accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  refreshTimeout: null,
  loading: false,
  refreshLock: false,
  refreshSubscribers: [],

  // Initialize the store
  initialize: () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    
    if (accessToken) {
      // Set axios default headers
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      
      // Setup token refresh
      get().setupTokenRefresh(accessToken);
      
      // Fetch user data
      get().fetchCurrentUser();
    }
    
    set({ 
      accessToken, 
      refreshToken, 
      isAuthenticated: !!accessToken 
    });
  },

  // Fetch current user data
  fetchCurrentUser: async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/auth/me`);
      set({ user: response.data });
      return response.data;
    } catch (error) {
      console.error("Error fetching user data:", error);
      if (error.response?.status === 401) {
        // Try refreshing token first
        try {
          await get().refreshToken();
          // If refresh successful, try fetching user again
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/auth/me`);
          set({ user: response.data });
          return response.data;
        } catch (refreshError) {
          // If refresh fails, logout
          get().logout();
        }
      }
      return null;
    }
  },

  // Login with credentials
  login: async (username, password) => {
    set({ loading: true });
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        formData
      );

      const { access_token, refresh_token, user } = response.data;
      
      // Store tokens
      localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
      
      // Set axios default headers
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      
      // Setup token refresh
      get().setupTokenRefresh(access_token);
      
      // Update state
      set({ 
        accessToken: access_token, 
        refreshToken: refresh_token, 
        isAuthenticated: true,
        user,
        loading: false 
      });
      
      toast.success("Login successful!");
      return true;
    } catch (error) {
      console.error("Login error:", error);
      set({ loading: false });
      toast.error(error.response?.data?.detail || "Login failed. Please check your credentials.");
      return false;
    }
  },

  // Register a new user
  register: async (userData) => {
    set({ loading: true });
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/register`,
        userData
      );
      
      set({ loading: false });
      toast.success("Registration successful! Please log in.");
      return response.data;
    } catch (error) {
      console.error("Registration error:", error);
      set({ loading: false });
      toast.error(error.response?.data?.detail || "Registration failed. Please try again.");
      return null;
    }
  },

  // Logout
  logout: () => {
    const { accessToken, refreshTimeout } = get();
    
    // Clear timeout
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    
    // Blacklist token on server if available
    if (accessToken) {
      axios.post(`${import.meta.env.VITE_API_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` },
        // Skip interceptor handling for this request
        skipAuthRefresh: true
      }).catch(error => {
        console.error("Logout error:", error);
      });
    }
    
    // Clear tokens
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    
    // Remove axios headers
    delete axios.defaults.headers.common["Authorization"];
    
    // Update state
    set({ 
      accessToken: null, 
      refreshToken: null, 
      isAuthenticated: false, 
      user: null,
      refreshTimeout: null
    });
  },

  // Setup token refresh
  setupTokenRefresh: (token) => {
    if (!token) return;
    
    try {
      // Clear any existing timeout
      const { refreshTimeout } = get();
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      
      // Decode token to get expiration
      const decoded = jwtDecode(token);
      if (!decoded.exp) return;
      
      // Calculate time until expiration
      const expiresAt = decoded.exp * 1000;
      const timeLeft = expiresAt - Date.now();
      
      // Token already expired
      if (timeLeft <= 0) {
        get().refreshToken();
        return;
      }
      
      // Set timeout to refresh before expiration (1 minute before)
      const refreshTime = Math.max(0, timeLeft - 60000);
      const timeout = setTimeout(() => {
        get().refreshToken();
      }, refreshTime);
      
      set({ refreshTimeout: timeout });
    } catch (error) {
      console.error("Token setup error:", error);
      get().logout();
    }
  },

  // Subscribe to token refresh
  subscribeTokenRefresh: (callback) => {
    const { refreshSubscribers } = get();
    set({ refreshSubscribers: [...refreshSubscribers, callback] });
  },

  // Execute callbacks after token refresh
  onTokenRefreshed: (token) => {
    const { refreshSubscribers } = get();
    refreshSubscribers.forEach(callback => callback(token));
    set({ refreshSubscribers: [] });
  },

  // Refresh token
  refreshToken: async () => {
    const { refreshToken, refreshLock } = get();
    
    // If no refresh token available
    if (!refreshToken) {
      get().logout();
      throw new Error("No refresh token available");
    }
    
    // If already refreshing, wait for it to complete
    if (refreshLock) {
      return new Promise((resolve, reject) => {
        get().subscribeTokenRefresh(token => {
          if (token) {
            resolve(token);
          } else {
            reject(new Error("Token refresh failed"));
          }
        });
      });
    }
    
    // Set refresh lock
    set({ refreshLock: true });
    
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
        { refresh_token: refreshToken },
        {
          headers: { "Content-Type": "application/json" },
          // Skip interceptor for this request
          skipAuthRefresh: true
        }
      );
      
      const { access_token, refresh_token } = response.data;
      
      // Validate new token
      if (!access_token) {
        throw new Error("Invalid response from server");
      }
      
      // Update tokens
      localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
      if (refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
      }
      
      // Update axios headers
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      
      // Setup new token refresh
      get().setupTokenRefresh(access_token);
      
      // Update state
      set({ 
        accessToken: access_token,
        refreshToken: refresh_token || refreshToken,
        isAuthenticated: true,
        refreshLock: false
      });
      
      // Notify subscribers
      get().onTokenRefreshed(access_token);
      
      return access_token;
    } catch (error) {
      console.error("Token refresh failed:", error);
      get().logout();
      
      // Notify subscribers of failure
      get().onTokenRefreshed(null);
      
      // Release lock
      set({ refreshLock: false });
      
      throw error;
    }
  },

  // Handle OAuth cookies
  handleOAuthCookies: () => {
    const accessTokenCookie = Cookies.get("access_token");
    const refreshTokenCookie = Cookies.get("refresh_token");
    
    if (accessTokenCookie && refreshTokenCookie) {
      try {
        // Validate token before setting
        jwtDecode(accessTokenCookie);
        
        // Store tokens
        localStorage.setItem(ACCESS_TOKEN_KEY, accessTokenCookie);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshTokenCookie);
        
        // Set axios default headers
        axios.defaults.headers.common["Authorization"] = `Bearer ${accessTokenCookie}`;
        
        // Setup token refresh
        get().setupTokenRefresh(accessTokenCookie);
        
        // Remove cookies
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        
        // Update state
        set({ 
          accessToken: accessTokenCookie, 
          refreshToken: refreshTokenCookie, 
          isAuthenticated: true 
        });
        
        // Fetch user data
        get().fetchCurrentUser();
        
        toast.success("Login successful via OAuth!");
        return true;
      } catch (error) {
        console.error("Invalid OAuth token:", error);
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        return false;
      }
    }
    return false;
  }
}));

// Setup axios interceptors for automatic token handling
const setupAxiosInterceptors = () => {
  // Request interceptor - adds token to requests
  axios.interceptors.request.use(
    (config) => {
      // Don't add token for refresh token requests
      if (config.skipAuthRefresh) {
        return config;
      }
      
      const accessToken = useAuthStore.getState().accessToken;
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handles 401 errors
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // Only handle 401 errors that aren't already retried and aren't refresh requests
      if (
        error.response?.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.skipAuthRefresh &&
        !originalRequest.url?.includes("/auth/refresh-token")
      ) {
        originalRequest._retry = true;
        
        try {
          // Get a fresh token
          const authStore = useAuthStore.getState();
          const newAccessToken = await authStore.refreshToken();
          
          // Update the original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          
          // Retry the original request
          return axios(originalRequest);
        } catch (refreshError) {
          // Handle token refresh failure
          console.error("Failed to refresh token:", refreshError);
          
          // Redirect to login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = "/login?session_expired=true";
            toast.error("Your session has expired. Please log in again.");
          }
          
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );
};

// Initialize interceptors
setupAxiosInterceptors();

export default useAuthStore; 