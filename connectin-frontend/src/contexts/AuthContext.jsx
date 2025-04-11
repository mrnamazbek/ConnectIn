import { createContext, useContext, useState, useEffect } from 'react';
import TokenService from '../services/tokenService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(TokenService.isUserLoggedIn());

    useEffect(() => {
        // Update authentication state when token changes
        const handleStorageChange = () => {
            setIsAuthenticated(TokenService.isUserLoggedIn());
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const updateAuthState = (authenticated) => {
        setIsAuthenticated(authenticated);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, updateAuthState }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 