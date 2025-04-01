import { useEffect, useState, useCallback, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router";
import Cookies from "js-cookie";
import TokenService from "../services/tokenService";
import { toast } from "react-toastify";

const AccessTokenManager = () => {
    const [accessToken, setAccessToken] = useState(TokenService.getAccessToken());
    const navigate = useNavigate();
    const timeoutRef = useRef(null);

    // Handle token refresh before expiration
    const setupTokenRefresh = useCallback((token) => {
        if (!token) return;

        try {
            // Decode token to get expiration
            const decoded = jwtDecode(token);
            if (!decoded.exp) return;

            // Calculate time until expiration
            const expiresAt = decoded.exp * 1000;
            const timeLeft = expiresAt - Date.now();

            // Clear any existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Token already expired
            if (timeLeft <= 0) {
                // Don't return the Promise, just call it
                TokenService.refreshToken()
                    .then(newToken => {
                        setAccessToken(newToken);
                    })
                    .catch(error => {
                        console.error("Token refresh failed:", error);
                        TokenService.clearTokens();
                        navigate("/login");
                    });
                return;
            }

            // Set timeout to refresh before expiration (1 minute before)
            const refreshTime = Math.max(0, timeLeft - 60000);
            timeoutRef.current = setTimeout(() => {
                TokenService.refreshToken()
                    .then(newToken => {
                        setAccessToken(newToken);
                    })
                    .catch(error => {
                        console.error("Auto token refresh failed:", error);
                        // Don't navigate on background refresh failures
                    });
            }, refreshTime);
        } catch (error) {
            console.error("Token decode error:", error);
            // If token is invalid, clear it
            TokenService.clearTokens();
            navigate("/login");
        }
    }, [navigate]);

    // Effect to handle OAuth cookies and setup token refresh
    useEffect(() => {
        // Handle OAuth redirect cookies if present
        const accessTokenCookie = Cookies.get("access_token");
        const refreshTokenCookie = Cookies.get("refresh_token");

        if (accessTokenCookie && refreshTokenCookie) {
            try {
                // Validate token before setting
                jwtDecode(accessTokenCookie);

                // Set tokens and remove cookies
                TokenService.setTokens(accessTokenCookie, refreshTokenCookie);
                Cookies.remove("access_token");
                Cookies.remove("refresh_token");

                // Update state
                setAccessToken(accessTokenCookie);

                // Show success message
                toast.success("Login successful via OAuth!", {
                    position: "bottom-left",
                    autoClose: 3000,
                });

                // Navigate to home
                navigate("/");
            } catch (error) {
                console.error("Invalid OAuth token:", error);
                Cookies.remove("access_token");
                Cookies.remove("refresh_token");
                TokenService.clearTokens();
                navigate("/login");
            }
        }

        // Setup token refresh for existing token
        const currentToken = TokenService.getAccessToken();
        if (currentToken) {
            setupTokenRefresh(currentToken);
        }

        // Cleanup function
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [navigate, setupTokenRefresh]);

    // Effect to handle token changes
    useEffect(() => {
        if (accessToken) {
            setupTokenRefresh(accessToken);
        }
        
        // Cleanup function
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [accessToken, setupTokenRefresh]);

    // Return null instead of an object - this component just handles side effects
    return null;
};

export default AccessTokenManager;
