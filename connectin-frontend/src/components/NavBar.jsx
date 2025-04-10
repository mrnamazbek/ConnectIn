import { NavLink, useLocation, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon, faMagnifyingGlass, faUser, faComments, faNewspaper, faPen } from "@fortawesome/free-solid-svg-icons";
import Logo from "../assets/images/connectin-logo-png.png";
import axios from "axios";
import TokenService from "../services/tokenService";
import { toast } from "react-toastify";
import { useAuth } from '../contexts/AuthContext';

const NavBar = () => {
    const { isAuthenticated, updateAuthState } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const noStickyRoutes = ["/news", "/projects", "/teams", "/post", "/search"];
    const isSticky = !noStickyRoutes.includes(location.pathname);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem("theme") === "dark");
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }

        // Check auth status on mount and when token changes
        updateAuthState(TokenService.isUserLoggedIn());

        // Close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (isMenuOpen && !event.target.closest(".user-button")) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [isDarkMode, isMenuOpen, updateAuthState]);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
                    headers: {
                        Authorization: `Bearer ${TokenService.getAccessToken()}`
                    }
                });
                setUser(response.data);
                updateAuthState(true);
            } catch (error) {
                if (error.response?.status === 401) {
                    updateAuthState(false);
                    TokenService.clearTokens();
                    navigate('/login');
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (TokenService.isUserLoggedIn()) {
            checkAuth();
        } else {
            setIsLoading(false);
        }
    }, [navigate, updateAuthState]);

    const handleLogout = () => {
        TokenService.clearTokens();
        updateAuthState(false);
        navigate('/login');
    };

    const handleNavigation = (path) => {
        if ((path === "/chats" || path === "/profile") && !isAuthenticated) {
            toast.warning("Please login to access this feature");
            navigate("/login");
            return false;
        }
        return true;
    };

    return (
        <nav className={`grid grid-cols-8 bg-white dark:bg-gray-800 text-sm border-b border-green-700 shadow-md ${isSticky ? "sticky top-0" : ""} z-20`}>
            <div className="col-start-2 col-span-6">
                <div className="flex justify-between items-center py-3">
                    <NavLink to="/" className="flex items-center space-x-2 font-semibold text-green-700 dark:text-green-400">
                        <img src={Logo} alt="Logo" width={24} height={24} />
                        <p>ConnectIn</p>
                    </NavLink>
                    <div className="space-x-5 font-semibold flex items-center">
                        {/* Theme Toggle */}
                        <button onClick={() => setIsDarkMode(!isDarkMode)} aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}>
                            <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} className="cursor-pointer text-gray-600 dark:text-white hover:text-green-700" />
                        </button>

                        {/* Search */}
                        <NavLink to="/search" className={({ isActive }) => (isActive ? "text-green-700 dark:text-green-700" : "hover:text-green-600 dark:text-white dark:hover:text-green-700")}>
                            <FontAwesomeIcon icon={faMagnifyingGlass} />
                        </NavLink>

                        {/* New Post */}
                        <NavLink to="/post" className={({ isActive }) => (isActive ? "text-green-700 dark:text-green-700" : "hover:text-green-600 dark:text-white dark:hover:text-green-700")}>
                            <FontAwesomeIcon icon={faPen} />
                        </NavLink>

                        {/* Navigation Links */}
                        <NavLink to="/" className={({ isActive }) => (isActive ? "text-green-700 dark:text-green-700" : "hover:text-green-600 dark:text-white dark:hover:text-green-700")}>
                            <FontAwesomeIcon icon={faNewspaper} />
                        </NavLink>

                        {/* Chats - verify auth before navigating */}
                        <button 
                            onClick={() => handleNavigation("/chats") && navigate("/chats")} 
                            className="hover:text-green-600 dark:text-white dark:hover:text-green-700" 
                            aria-label="Chats"
                        >
                            <FontAwesomeIcon icon={faComments} />
                        </button>

                        {isAuthenticated ? (
                            <div className="relative user-button">
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            setIsMenuOpen(!isMenuOpen);
                                        }
                                    }}
                                    className="dark:text-white hover:cursor-pointer"
                                    aria-expanded={isMenuOpen}
                                    aria-label="User menu"
                                >
                                    <FontAwesomeIcon icon={faUser} />
                                </div>
                                {isMenuOpen && (
                                    <div className="absolute z-20 top-6 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-md p-2">
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                handleNavigation("/profile") && navigate("/profile");
                                            }}
                                            className="block cursor-pointer py-2 px-4 text-sm text-gray-700 dark:text-white dark:hover:bg-gray-700 text-left w-full"
                                        >
                                            Profile
                                        </button>
                                        <button
                                            className="block cursor-pointer py-2 px-4 text-sm text-gray-700 dark:text-white dark:hover:bg-gray-700 text-left w-full"
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                handleLogout();
                                            }}
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <button onClick={() => navigate("/login")} className="text-green-700 dark:text-white hover:underline" aria-label="Sign in">
                                    <FontAwesomeIcon icon={faUser} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default NavBar;
