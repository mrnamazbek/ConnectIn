import { useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import axios from "axios";

const AuthWrapper = ({ children }) => {
    const navigate = useNavigate();

    useEffect(() => {
        // Add request interceptor to add auth token to all requests
        const requestInterceptor = axios.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem("access_token");
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Add response interceptor to handle auth errors
        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                // Handle 401 errors
                if (error.response?.status === 401) {
                    // If it's a refresh token request, redirect to login
                    if (originalRequest.url.includes("/auth/refresh_token")) {
                        handleAuthError();
                        return Promise.reject(error);
                    }

                    // Try to refresh the token
                    try {
                        const refreshToken = localStorage.getItem("refresh_token");
                        if (!refreshToken) {
                            handleAuthError();
                            return Promise.reject(error);
                        }

                        const response = await axios.post(
                            `${import.meta.env.VITE_API_URL}/auth/refresh_token`,
                            { refresh_token: refreshToken }
                        );

                        const newAccessToken = response.data.access_token;
                        localStorage.setItem("access_token", newAccessToken);
                        axios.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        return axios(originalRequest);
                    } catch (refreshError) {
                        handleAuthError();
                        return Promise.reject(refreshError);
                    }
                }

                // Handle other errors
                if (error.response?.status === 403) {
                    toast.error("You don't have permission to perform this action");
                }

                return Promise.reject(error);
            }
        );

        // Cleanup interceptors on unmount
        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, [navigate]);

    const handleAuthError = () => {
        // Clear auth tokens
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        // Show message
        toast.error("Please log in to continue");

        // Redirect to login
        navigate("/login", { state: { from: window.location.pathname } });
    };

    return children;
};

export default AuthWrapper; 