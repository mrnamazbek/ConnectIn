import { NavLink, useLocation, useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon, faMagnifyingGlass, faUser, faComments, faNewspaper, faPen, faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import Logo from "../assets/images/connectin-logo-png.png";
import axios from "axios";
import TokenService from "../services/tokenService";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import { useModeAnimation } from "react-theme-switch-animation";

const NavBar = () => {
    const { isAuthenticated, updateAuthState } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const noStickyRoutes = ["/news", "/projects", "/teams", "/post", "/search"];
    const isSticky = !noStickyRoutes.includes(location.pathname);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef(null);
    const { ref: themeRef, toggleSwitchTheme, isDarkMode } = useModeAnimation();

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }

        updateAuthState(TokenService.isUserLoggedIn());

        const handleClickOutside = (event) => {
            if (isMenuOpen && !event.target.closest(".user-button")) {
                setIsMenuOpen(false);
            }
            if (isMobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setIsMobileMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isDarkMode, isMenuOpen, isMobileMenuOpen, updateAuthState]);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
                    headers: {
                        Authorization: `Bearer ${TokenService.getAccessToken()}`,
                    },
                });
                updateAuthState(true);
            } catch (error) {
                if (error.response?.status === 401) {
                    updateAuthState(false);
                    TokenService.clearTokens();
                    navigate("/login");
                }
            }
        };

        if (TokenService.isUserLoggedIn()) {
            checkAuth();
        }
    }, [navigate, updateAuthState]);

    const handleLogout = () => {
        TokenService.clearTokens();
        updateAuthState(false);
        navigate("/login");
    };

    const handleNavigation = (path) => {
        if ((path === "/chats" || path === "/profile") && !isAuthenticated) {
            toast.warning("Please login to access this feature");
            navigate("/login");
            return false;
        }
        setIsMobileMenuOpen(false);
        return true;
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen((prev) => !prev);
    };

    const handleMobileMenuClick = (e) => {
        e.stopPropagation();
        toggleMobileMenu();
    };

    const NavItem = ({ to, icon, label, onClick }) => (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) => `
                flex flex-col items-center justify-center space-y-1 px-3 py-1 rounded-md text-sm font-medium transition-all duration-200
                ${isActive ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-green-700 dark:hover:text-green-400"}
            `}
        >
            <FontAwesomeIcon icon={icon} className="w-5 h-5" />
            <span className="text-xs">{label}</span>
        </NavLink>
    );

    return (
        <nav className={`grid grid-cols-8 bg-white dark:bg-gray-800 text-sm border-b border-green-700 shadow-md ${isSticky ? "sticky top-0" : ""} z-30`}>
            <div className="col-start-2 col-span-6">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <NavLink to="/" className="flex items-center space-x-2 font-semibold text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors duration-200">
                        <img src={Logo} alt="Logo" width={24} height={24} />
                        <span className="hidden sm:inline">ConnectIn</span>
                    </NavLink>

                    {/* Desktop Navigation */}
                    <div className="hidden font-semibold md:flex items-center space-x-2">
                        {/* Theme Toggle */}
                        <button ref={themeRef} onClick={toggleSwitchTheme} className="flex flex-col cursor-pointer items-center space-y-1 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200" aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}>
                            <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} className="w-5 h-5 text-gray-600 dark:text-white transition-transform duration-300" />
                            <span className="text-xs text-gray-600 dark:text-gray-300">Theme</span>
                        </button>

                        {/* Navigation Links */}
                        <NavItem to="/search" icon={faMagnifyingGlass} label="Search" />
                        <NavItem to="/post" icon={faPen} label="New Post" />
                        <NavItem to="/" icon={faNewspaper} label="Feed" />
                        <NavItem to="/chats" icon={faComments} label="Chats" onClick={() => handleNavigation("/chats")} />

                        {/* User Menu */}
                        {isAuthenticated ? (
                            <div className="relative user-button">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex flex-col cursor-pointer items-center space-y-1 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 transition-colors duration-200"
                                >
                                    <FontAwesomeIcon icon={faUser} className="w-5 h-5" />
                                    <span className="text-xs">Profile</span>
                                </button>
                                {isMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700 z-40">
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                handleNavigation("/profile") && navigate("/profile");
                                            }}
                                            className="block w-full cursor-pointer text-left px-4 py-1 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                        >
                                            Profile
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                handleLogout();
                                            }}
                                            className="block w-full cursor-pointer text-left px-4 py-1 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <NavItem to="/login" icon={faUser} label="Sign In" />
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center space-x-2">
                        <button ref={themeRef} onClick={toggleSwitchTheme} className="flex flex-col items-center space-y-1 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200" aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}>
                            <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} className="w-5 h-5 text-gray-600 dark:text-white transition-transform duration-300 transform hover:scale-110" />
                            <span className="text-xs text-gray-600 dark:text-white">Theme</span>
                        </button>
                        <button onClick={handleMobileMenuClick} className="flex flex-col items-center space-y-1 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200" aria-label="Toggle menu" aria-expanded={isMobileMenuOpen}>
                            <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} className="w-5 h-5 text-gray-600 dark:text-white" />
                            <span className="text-xs text-gray-600 dark:text-white">Menu</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div ref={mobileMenuRef} className={`col-start-2 col-span-6 mobile-menu md:hidden transition-all duration-200 ease-in-out ${isMobileMenuOpen ? "block" : "hidden"}`}>
                <div className="px-2 pt-1 pb-2 space-y-1 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    <NavItem to="/search" icon={faMagnifyingGlass} label="Search" onClick={handleMobileMenuClick} />
                    <NavItem to="/post" icon={faPen} label="New Post" onClick={handleMobileMenuClick} />
                    <NavItem to="/" icon={faNewspaper} label="Feed" onClick={handleMobileMenuClick} />
                    <NavItem
                        to="/chats"
                        icon={faComments}
                        label="Chat"
                        onClick={() => {
                            handleMobileMenuClick();
                            handleNavigation("/chats");
                        }}
                    />

                    {isAuthenticated ? (
                        <>
                            <NavItem
                                to="/profile"
                                icon={faUser}
                                label="Profile"
                                onClick={() => {
                                    handleMobileMenuClick();
                                    handleNavigation("/profile");
                                }}
                            />
                            <button
                                onClick={() => {
                                    handleMobileMenuClick();
                                    handleLogout();
                                }}
                                className="w-full flex flex-col items-center space-y-1 px-4 py-1 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                            >
                                <FontAwesomeIcon icon={faUser} className="w-5 h-5" />
                                <span className="text-xs">Logout</span>
                            </button>
                        </>
                    ) : (
                        <NavItem to="/login" icon={faUser} label="Sign In" onClick={handleMobileMenuClick} />
                    )}
                </div>
            </div>
        </nav>
    );
};

export default NavBar;
