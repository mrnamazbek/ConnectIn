import AuthInitializer from "./AuthInitializer";

// AuthWrapper now wraps the children with the Zustand-based auth initializer
const AuthWrapper = ({ children }) => {
    return (
        <>
            <AuthInitializer />
            {children}
        </>
    );
};

export default AuthWrapper;
