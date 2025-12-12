import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';

/**
 * Component to handle OAuth callback and redirections
 * This component should be rendered on routes where OAuth callbacks might happen
 */
const OAuthHandler = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { handleOAuthCookies, setTokensManually } = useAuthStore();

    useEffect(() => {
        // Extract query parameters
        const searchParams = new URLSearchParams(location.search);
        const authSuccess = searchParams.get('auth_success');
        const error = searchParams.get('error');
        const state = searchParams.get('state');
        
        // Check if tokens are in URL params (fallback method)
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');

        // Validate state if present
        const storedState = localStorage.getItem('oauth_state');
        if (state && storedState && state !== storedState) {
            toast.error('Authentication error: Invalid state parameter');
            navigate('/login');
            return;
        }

        // Clean up state
        localStorage.removeItem('oauth_state');

        // First try to handle OAuth cookies
        const cookiesProcessed = handleOAuthCookies();
        
        // Handle based on query params and cookie processing
        if (cookiesProcessed) {
            // Successful OAuth login via cookies
            console.log("Authentication successful via cookies");
            const redirectPath = localStorage.getItem('login_redirect') || '/';
            localStorage.removeItem('login_redirect');
            navigate(redirectPath);
        } else if (authSuccess === 'true' && accessToken && refreshToken) {
            // Fallback: Use tokens from URL params if cookies didn't work
            console.log("Using tokens from URL parameters");
            setTokensManually(accessToken, refreshToken);
            
            const redirectPath = localStorage.getItem('login_redirect') || '/';
            localStorage.removeItem('login_redirect');
            toast.success("Login successful!");
            navigate(redirectPath);
        } else if (authSuccess === 'true') {
            // Auth was successful according to query param, but no tokens found
            toast.error('Authentication successful but session data missing');
            navigate('/login');
        } else if (error) {
            // Handle specific errors
            let errorMessage = 'Authentication failed';
            switch(error) {
                case 'google_auth_failed':
                    errorMessage = 'Google authentication failed';
                    break;
                case 'github_auth_failed':
                    errorMessage = 'GitHub authentication failed';
                    break;
                case 'email_missing':
                    errorMessage = 'Could not retrieve email from your account';
                    break;
                default:
                    errorMessage = `Authentication error: ${error}`;
            }
            toast.error(errorMessage);
            navigate('/login');
        }
    }, [location.search, handleOAuthCookies, navigate, setTokensManually]);

    // This component doesn't render anything
    return null;
};

export default OAuthHandler; 