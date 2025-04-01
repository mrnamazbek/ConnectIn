import { useEffect } from "react";
import { useNavigate } from "react-router";
import TokenService from "../services/tokenService";

const AuthWrapper = ({ children }) => {
    const navigate = useNavigate();

    useEffect(() => {
        // Setup axios interceptors for token management
        TokenService.setupAxiosInterceptors();

        // Cleanup on unmount
        return () => {
            // Cleanup is handled by TokenService
        };
    }, [navigate]);

    return children;
};

export default AuthWrapper;
