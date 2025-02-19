import { useEffect } from "react";
import { useNavigate } from "react-router";

const GoogleAuthHandler = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (token) {
            localStorage.setItem("token", token); // ✅ Store token in localStorage
            navigate("/news"); // ✅ Redirect to news page
        } else {
            console.error("No token found");
            navigate("/login"); // Redirect to login if no token
        }
    }, [navigate]);

    return <p>Authenticating...</p>;
};

export default GoogleAuthHandler;
