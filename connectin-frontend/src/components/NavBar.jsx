import { NavLink, useLocation, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon, faMagnifyingGlass, faUser, faComments, faNewspaper, faPen } from "@fortawesome/free-solid-svg-icons";
import Logo from "../assets/images/connectin-logo-png.png";
import axios from "axios";
import TokenService from "../services/tokenService";
import { toast } from "react-toastify";

const NavBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const noStickyRoutes = ["/news", "/projects", "/teams", "/post", "/search"];
    const isSticky = !noStickyRoutes.includes(location.pathname);

    const [isDark, setIsDark] = useState(localStorage.getItem("theme") === "dark");
    const [showMenu, setShowMenu] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(TokenService.isUserLoggedIn());

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }

        // Check auth status on mount and when token changes
        setIsAuthenticated(TokenService.isUserLoggedIn());

        // Close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (showMenu && !event.target.closest(".user-button")) {
                setShowMenu(false);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [isDark, showMenu]);

    const handleLogout = async () => {
        try {
            const token = TokenService.getAccessToken();
            if (!token) {
                // Already logged out
                TokenService.clearTokens();
                setIsAuthenticated(false);
                navigate("/login");
                return;
            }

            await axios.post(
                `${import.meta.env.VITE_API_URL}/auth/logout`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            TokenService.clearTokens();
            setIsAuthenticated(false);
            navigate("/login");
            toast.success("You have been logged out successfully");
        } catch (error) {
            console.error("Logout failed:", error);
            // Clear tokens even if the logout request fails
            TokenService.clearTokens();
            setIsAuthenticated(false);
            navigate("/login");
        }
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
                        <button onClick={() => setIsDark(!isDark)} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}>
                            <FontAwesomeIcon icon={isDark ? faSun : faMoon} className="cursor-pointer text-gray-600 dark:text-white hover:text-green-700" />
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
                        <button onClick={() => handleNavigation("/chats") && navigate("/chats")} className={({ isActive }) => (isActive ? "text-green-700 dark:text-green-700" : "hover:text-green-600 dark:text-white dark:hover:text-green-700")} aria-label="Chats">
                            <FontAwesomeIcon icon={faComments} />
                        </button>

                        {isAuthenticated ? (
                            <div className="relative user-button">
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setShowMenu(!showMenu)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            setShowMenu(!showMenu);
                                        }
                                    }}
                                    className="dark:text-white hover:cursor-pointer"
                                    aria-expanded={showMenu}
                                    aria-label="User menu"
                                >
                                    <FontAwesomeIcon icon={faUser} />
                                </div>
                                {showMenu && (
                                    <div className="absolute z-20 top-6 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-md p-2">
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                handleNavigation("/profile") && navigate("/profile");
                                            }}
                                            className="block cursor-pointer py-2 px-4 text-sm text-gray-700 dark:text-white dark:hover:bg-gray-700 text-left w-full"
                                        >
                                            Profile
                                        </button>
                                        <button
                                            className="block cursor-pointer py-2 px-4 text-sm text-gray-700 dark:text-white dark:hover:bg-gray-700 text-left w-full"
                                            onClick={() => {
                                                setShowMenu(false);
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
