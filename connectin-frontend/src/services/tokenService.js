import axios from "axios";

class TokenService {
    static ACCESS_TOKEN_KEY = "access_token";
    static REFRESH_TOKEN_KEY = "refresh_token";
    static isRefreshing = false;
    static refreshSubscribers = [];
    static refreshLock = false;

    // Subscribe callback that will be executed when token refresh is complete
    static subscribeTokenRefresh(callback) {
        this.refreshSubscribers.push(callback);
    }

    // Execute callbacks after token refresh
    static onTokenRefreshed(token) {
        this.refreshSubscribers.forEach(callback => callback(token));
        this.refreshSubscribers = [];
    }

    // Return token value or null
    static getAccessToken() {
        const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
        return token || null;
    }

    // Return refresh token value or null
    static getRefreshToken() {
        const token = localStorage.getItem(this.REFRESH_TOKEN_KEY);
        return token || null;
    }

    // Set just access token
    static setAccessToken(accessToken) {
        if (!accessToken) {
            this.clearTokens();
            return;
        }
        localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
        axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    }

    // Set both tokens
    static setTokens(accessToken, refreshToken) {
        if (!accessToken) {
            this.clearTokens();
            return;
        }
        localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
        if (refreshToken) {
            localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
        }
        axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    }

    // Clear all tokens and remove Authorization header
    static clearTokens() {
        localStorage.removeItem(this.ACCESS_TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        delete axios.defaults.headers.common["Authorization"];
    }

    // Get user status (logged in or not)
    static isUserLoggedIn() {
        return !!this.getAccessToken();
    }

    // Refresh token with mutex lock to prevent multiple simultaneous refreshes
    static async refreshToken() {
        // If already refreshing, wait for it to complete
        if (this.refreshLock) {
            return new Promise((resolve, reject) => {
                this.subscribeTokenRefresh(token => {
                    if (token) {
                        resolve(token);
                    } else {
                        reject(new Error("Token refresh failed"));
                    }
                });
            });
        }

        // Set refresh lock
        this.refreshLock = true;

        try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
                throw new Error("No refresh token available");
            }

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
                { refresh_token: refreshToken },
                {
                    headers: { 
                        "Content-Type": "application/json"
                    },
                    // Skip the interceptor for this request to avoid loops
                    skipAuthRefresh: true
                }
            );

            const { access_token, refresh_token } = response.data;
            
            // Validate new tokens
            if (!access_token) {
                throw new Error("Invalid response from server");
            }
            
            // Update tokens
            this.setTokens(access_token, refresh_token || null);
            
            // Notify subscribers
            this.onTokenRefreshed(access_token);
            
            // Release lock
            this.refreshLock = false;
            
            return access_token;
        } catch (error) {
            console.error("Token refresh failed:", error);
            this.clearTokens();
            // Notify subscribers of failure
            this.onTokenRefreshed(null);
            // Release lock
            this.refreshLock = false;
            throw error;
        }
    }

    // Setup axios interceptors for automatic token handling
    static setupAxiosInterceptors() {
        // Request interceptor - adds token to requests
        axios.interceptors.request.use(
            (config) => {
                // Don't add token for refresh token requests
                if (config.skipAuthRefresh) {
                    return config;
                }
                
                const token = this.getAccessToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
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
                        const newAccessToken = await this.refreshToken();
                        
                        // Update the original request
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        
                        // Retry the original request
                        return axios(originalRequest);
                    } catch (refreshError) {
                        // If refresh fails, redirect to login
                        window.location.href = "/login";
                        return Promise.reject(refreshError);
                    }
                }
                
                // If it's a 422 error on refresh-token endpoint, clear tokens and redirect
                if (error.response?.status === 422 && error.config.url?.includes("/auth/refresh-token")) {
                    this.clearTokens();
                    window.location.href = "/login";
                }
                
                return Promise.reject(error);
            }
        );
    }
}

export default TokenService;
