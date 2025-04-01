import AccessTokenManager from "./AccessTokenManager";

// AuthWrapper now just wraps the children with access token management
const AuthWrapper = ({ children }) => {
    return (
        <>
            <AccessTokenManager />
            {children}
        </>
    );
};

export default AuthWrapper;
