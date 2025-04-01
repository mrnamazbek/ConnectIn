import axios from "axios";

class TokenService {
    static ACCESS_TOKEN_KEY = "access_token";
    static REFRESH_TOKEN_KEY = "refresh_token";

    static getAccessToken() {
        return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }

    static getRefreshToken() {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }

    static setAccessToken(accessToken) {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
        axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    }

    static setTokens(accessToken, refreshToken) {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
        if (refreshToken) {
            localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
        }
        axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    }

    static removeTokens() {
        localStorage.removeItem(this.ACCESS_TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }

    static async refreshToken() {
        try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
                throw new Error("No refresh token available");
            }

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
                { refresh_token: refreshToken },
                {
                    headers: { "Content-Type": "application/json" },
                }
            );

            const { access_token, refresh_token } = response.data;
            this.setTokens(access_token, refresh_token);

            // Update axios default headers
            axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

            return access_token;
        } catch (error) {
            console.error("Token refresh failed:", error);
            this.removeTokens();
            throw error;
        }
    }

    static setupAxiosInterceptors() {
        // Request interceptor
        axios.interceptors.request.use(
            (config) => {
                const token = this.getAccessToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor
        axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                // If the error is 401 and it's not a refresh token request
                if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes("/auth/refresh-token")) {
                    originalRequest._retry = true;

                    try {
                        const newAccessToken = await this.refreshToken();
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        return axios(originalRequest);
                    } catch (refreshError) {
                        // If refresh fails, redirect to login
                        window.location.href = "/login";
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );
    }
}

export default TokenService;
