import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import useAuthStore from '../store/authStore';

// This component replaces AccessTokenManager and initializes the auth store
const AuthInitializer = () => {
    const navigate = useNavigate();
    const { initialize, handleOAuthCookies } = useAuthStore();

    useEffect(() => {
        // Initialize the auth store
        initialize();
        
        // Handle OAuth cookies if present (e.g., after redirect from OAuth provider)
        const oauthSuccess = handleOAuthCookies();
        if (oauthSuccess) {
            navigate('/');
        }
    }, [initialize, handleOAuthCookies, navigate]);

    // This component doesn't render anything
    return null;
};

export default AuthInitializer; 