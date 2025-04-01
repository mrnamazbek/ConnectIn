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

                // Prevent infinite loops
                if (originalRequest._retry) {
                    handleAuthError();
                    return Promise.reject(error);
                }

                // Handle 401 errors
                if (error.response?.status === 401) {
                    originalRequest._retry = true;

                    // If it's already a refresh token request that failed, logout
                    if (originalRequest.url.includes("/auth/refresh-token")) {
                        handleAuthError();
                        return Promise.reject(error);
                    }

                    try {
                        const refreshToken = localStorage.getItem("refresh_token");
                        if (!refreshToken) {
                            throw new Error("No refresh token available");
                        }

                        const response = await axios.post(
                            `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
                            { refresh_token: refreshToken },
                            {
                                headers: { "Content-Type": "application/json" }
                            }
                        );

                        const { access_token, refresh_token } = response.data;
                        
                        // Update both tokens if we got new ones
                        localStorage.setItem("access_token", access_token);
                        if (refresh_token) {
                            localStorage.setItem("refresh_token", refresh_token);
                        }

                        // Update auth headers
                        axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
                        originalRequest.headers.Authorization = `Bearer ${access_token}`;
                        
                        // Retry the original request
                        return axios(originalRequest);
                    } catch (refreshError) {
                        console.error("Token refresh failed:", refreshError);
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
        toast.error("Session expired. Please log in again.");

        // Redirect to login
        navigate("/login", { 
            state: { 
                from: window.location.pathname,
                message: "Session expired. Please log in again." 
            } 
        });
    };

    return children;
};

export default AuthWrapper; 