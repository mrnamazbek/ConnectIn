import { useEffect, useState } from "react";
import { decode } from "jwt-decode";
import axios from "axios";
import { useNavigate } from "react-router";
import Cookies from "js-cookie";

const AccessTokenManager = () => {
    const [accessToken, setAccessToken] = useState(localStorage.getItem("access_token"));
    const navigate = useNavigate();

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

        // Handle tokens from Google OAuth redirect
        const accessTokenCookie = Cookies.get("access_token");
        const refreshTokenCookie = Cookies.get("refresh_token");
        if (accessTokenCookie && refreshTokenCookie) {
            localStorage.setItem("access_token", accessTokenCookie);
            localStorage.setItem("refresh_token", refreshTokenCookie);
            Cookies.remove("access_token");
            Cookies.remove("refresh_token");
            setAccessToken(accessTokenCookie);
        }
    }, [accessToken]);

    const refreshAccessToken = async () => {
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
            setAccessToken(newAccessToken);
        } catch (error) {
            console.error("Failed to refresh token:", error);
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            navigate("/login");
        }
    };

    return { accessToken };
};

export default AccessTokenManager;
