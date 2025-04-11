import axios from "axios";
import TokenService from "../services/tokenService";

axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = TokenService.getRefreshToken();
                if (!refreshToken) throw new Error("No refresh token");

                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
                    { refresh_token: refreshToken },
                    {
                        headers: { "Content-Type": "application/json" },
                    }
                );

                if (response.data.refresh_token) {
                    TokenService.setTokens(response.data.access_token, response.data.refresh_token);
                } else {
                    TokenService.setAccessToken(response.data.access_token);
                }

                originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
                return axios(originalRequest);
            } catch (refreshError) {
                TokenService.clearTokens();
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default axios;
