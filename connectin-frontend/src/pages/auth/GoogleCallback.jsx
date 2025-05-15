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
                const state = searchParams.get('state');
                
                if (!code) {
                    toast.error('Authorization code missing');
                    navigate('/login');
                    return;
                }
                
                // Forward the authorization code to your backend API
                const apiUrl = import.meta.env.PROD 
                    ? "https://connectin-production.up.railway.app/api/v1" // Replace with your actual production API URL
                    : `${import.meta.env.VITE_API_URL}/api/v1`;
                
                // Send the code to your backend for processing
                const response = await axios.post(`${apiUrl}/auth/google/process-callback`, { 
                    code, 
                    state,
                    redirect_uri: window.location.origin + '/auth/google/callback'
                });
                
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
                toast.error(error.response?.data?.detail || 'Authentication failed');
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