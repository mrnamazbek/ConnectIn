import { createContext, useContext } from 'react';
import useAuthStore from '../store/authStore';

// Create context for compatibility with existing code
const AuthContext = createContext();

// AuthProvider now just provides values from our Zustand store
export const AuthProvider = ({ children }) => {
    // Get auth state from Zustand store
    const { isAuthenticated, logout } = useAuthStore();

    // For backwards compatibility, provide the same interface
    const updateAuthState = (authenticated) => {
        if (!authenticated) {
            logout();
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, updateAuthState }}>
            {children}
        </AuthContext.Provider>
    );
};

// useAuth hook remains the same, but now just provides access to Zustand store
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 