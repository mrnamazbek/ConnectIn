import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import TokenService from "./services/tokenService";
import "react-toastify/dist/ReactToastify.css";

// Initialize token service and set defaults
TokenService.setupAxiosInterceptors();

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <App />
    </StrictMode>
);
