import { useEffect, useState, useCallback } from "react";
import { decode } from "jwt-decode";
import axios from "../utils/axiosConfig";
import { useNavigate } from "react-router";
import Cookies from "js-cookie";
import TokenService from "../services/tokenService";

const AccessTokenManager = () => {
    const [accessToken, setAccessToken] = useState(TokenService.getAccessToken());
    const navigate = useNavigate();

    const refreshAccessToken = useCallback(async () => {
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
            setAccessToken(response.data.access_token);
        } catch (error) {
            console.error("Failed to refresh token:", error);
            TokenService.clearTokens();
            navigate("/login");
        }
    }, [navigate]);

    useEffect(() => {
        const handleTokenRefresh = async () => {
            if (accessToken) {
                const decoded = decode(accessToken);
                const expiresAt = decoded.exp * 1000;
                const timeLeft = expiresAt - Date.now();

                if (timeLeft < 0) {
                    await refreshAccessToken();
                } else {
                    const timeout = setTimeout(refreshAccessToken, timeLeft - 60000); // Refresh 1 minute before
                    return () => clearTimeout(timeout);
                }
            }
        };

        handleTokenRefresh();

        // Handle tokens from OAuth redirect
        const accessTokenCookie = Cookies.get("access_token");
        const refreshTokenCookie = Cookies.get("refresh_token");
        if (accessTokenCookie && refreshTokenCookie) {
            TokenService.setTokens(accessTokenCookie, refreshTokenCookie);
            Cookies.remove("access_token");
            Cookies.remove("refresh_token");
            setAccessToken(accessTokenCookie);
        }
    }, [accessToken, refreshAccessToken]);

    return { accessToken };
};

export default AccessTokenManager;
