import axios from "axios";

axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem("refresh_token");
                if (!refreshToken) throw new Error("No refresh token");

                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL}/refresh_token`,
                    { refresh_token: refreshToken },
                    {
                        headers: { "Content-Type": "application/json" },
                    }
                );
                const newAccessToken = response.data.access_token;
                localStorage.setItem("access_token", newAccessToken);
                axios.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return axios(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default axios;
