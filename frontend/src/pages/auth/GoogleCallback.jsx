import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import useAuthStore from '../../store/authStore';
import { toast } from 'react-toastify';
import axios from 'axios';

/**
 * This component handles the Google OAuth callback in the frontend
 * It processes the authorization code from Google and sends it to your backend
 */
const GoogleCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setTokensManually } = useAuthStore();
    
    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Extract query parameters
                const searchParams = new URLSearchParams(location.search);
                const code = searchParams.get('code');
                const error = searchParams.get('error');
                
                // Handle any OAuth error returned from Google
                if (error) {
                    console.error('Google OAuth error:', error);
                    toast.error(`Google authentication error: ${error}`);
                    navigate('/login');
                    return;
                }
                
                if (!code) {
                    toast.error('Authorization code missing');
                    navigate('/login');
                    return;
                }
                
                // Forward the authorization code to your backend API
                const apiUrl = import.meta.env.PROD 
                    ? "https://backend-production-a087.up.railway.app"  // Make sure this matches LoginPage.jsx
                    : import.meta.env.VITE_API_URL;
                
                console.log('Sending code to backend:', apiUrl);
                
                // Use the exact same redirect URI as registered in Google Cloud Console
                // This MUST match what you have registered there exactly
                const redirectUri = `${window.location.origin}/auth/google/callback`;
                
                // Send the code to your backend for processing
                const response = await axios.post(`${apiUrl}/api/v1/auth/google/process-callback`, { 
                    code,
                    redirect_uri: redirectUri
                });
                
                console.log('Response received:', response.status);
                
                // Handle successful authentication
                if (response.data && response.data.access_token) {
                    setTokensManually(response.data.access_token, response.data.refresh_token);
                    toast.success('Successfully signed in with Google!');
                    
                    // Redirect to home or saved redirect path
                    const redirectPath = localStorage.getItem('login_redirect') || '/';
                    localStorage.removeItem('login_redirect');
                    navigate(redirectPath);
                } else {
                    throw new Error('Invalid response from server');
                }
            } catch (error) {
                console.error('Error processing Google callback:', error);
                // More detailed error message
                const errorDetail = error.response?.data?.detail || 
                                   (error.response ? `Error ${error.response.status}: ${error.response.statusText}` : 
                                   error.message || 'Authentication failed');
                toast.error(errorDetail);
                navigate('/login');
            }
        };
        
        handleCallback();
    }, [location.search, navigate, setTokensManually]);
    
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-center">
                <h2 className="text-2xl font-semibold mb-4">Processing your sign-in...</h2>
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 mx-auto"></div>
            </div>
        </div>
    );
};

export default GoogleCallback; 