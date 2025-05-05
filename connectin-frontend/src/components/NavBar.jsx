import { NavLink, useLocation, useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon, faMagnifyingGlass, faUser, faComments, faNewspaper, faPen, faBars, faTimes, faChevronDown, faThumbsUp, faNetworkWired } from "@fortawesome/free-solid-svg-icons";
import Logo from "../assets/images/connectin-logo-png.png";
import axios from "axios";
import { toast } from "react-toastify";
import useAuthStore from "../store/authStore";
import { useModeAnimation } from "react-theme-switch-animation";

const NavBar = () => {
    const { isAuthenticated, logout } = useAuthStore();
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
    }, [isDarkMode, isMenuOpen, isMobileMenuOpen]);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
                    headers: {
                        Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
                    },
                });
            } catch (error) {
                if (error.response?.status === 401) {
                    logout();
                    navigate("/login");
                }
            }
        };

        if (isAuthenticated) {
            checkAuth();
        }
    }, [navigate, logout, isAuthenticated]);

    const handleLogout = () => {
        logout();
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
                flex flex-col items-center justify-center space-y-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-green-700 dark:hover:text-green-400"}
            `}
        >
            <FontAwesomeIcon icon={icon} className="w-5 h-5" />
            <span>{label}</span>
        </NavLink>
    );

    return (
        <nav className={`bg-white/95 dark:bg-gray-900/95 backdrop-blur-md text-sm border-b border-green-700 shadow-md ${isSticky ? "sticky top-0" : ""} z-30`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <NavLink to="/" className="flex items-center space-x-2 font-semibold text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors duration-200">
                            <img src={Logo} alt="Logo" width={32} height={32} className="h-8 w-auto" />
                            <span className="text-lg hidden sm:inline">ConnectIn</span>
                        </NavLink>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-1">
                        <NavItem to="/search" icon={faMagnifyingGlass} label="Search" />
                        <NavItem to="/post" icon={faPen} label="New Post" />
                        <NavItem to="/feed" icon={faNewspaper} label="Feed" />
                        <NavItem to="/network" icon={faNetworkWired} label="Network" />
                        <NavItem to="/recommendations" icon={faThumbsUp} label="For You" onClick={() => handleNavigation("/recommendations")} />
                        <NavItem to="/chats" icon={faComments} label="Chat" onClick={() => handleNavigation("/chats")} />

                        {/* Theme Toggle */}
                        <button
                            ref={themeRef}
                            onClick={toggleSwitchTheme}
                            className="flex flex-col cursor-pointer items-center justify-center space-y-1 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ml-1 text-gray-600 dark:text-gray-300"
                            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                        >
                            <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} className="w-5 h-5 transition-transform duration-300" />
                            <span className="text-sm">Theme</span>
                        </button>

                        {/* User Menu */}
                        {isAuthenticated ? (
                            <div className="relative user-button ml-1">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex flex-col items-center space-y-1 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 transition-colors duration-200"
                                >
                                    <div className="flex items-center">
                                        <FontAwesomeIcon icon={faUser} className="w-5 h-5" />
                                        <FontAwesomeIcon icon={faChevronDown} className={`w-3 h-3 transition-transform ml-1 ${isMenuOpen ? "rotate-180" : ""}`} />
                                    </div>
                                    <span>Profile</span>
                                </button>
                                {isMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 border border-gray-200 dark:border-gray-700 z-40">
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                handleNavigation("/profile") && navigate("/profile");
                                            }}
                                            className="block w-full cursor-pointer text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                        >
                                            Profile
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                handleLogout();
                                            }}
                                            className="block w-full cursor-pointer text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex space-x-2 ml-2">
                                <NavLink to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 transition-colors">
                                    Sign in
                                </NavLink>
                                <NavLink to="/register" className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-colors">
                                    Sign up
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center space-x-2">
                        <button ref={themeRef} onClick={toggleSwitchTheme} className="flex flex-col items-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200" aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}>
                            <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} className="w-5 h-5 text-gray-600 dark:text-white transition-transform duration-300" />
                            <span className="text-xs mt-1">Theme</span>
                        </button>
                        <button onClick={handleMobileMenuClick} className="flex flex-col items-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200" aria-label="Toggle menu" aria-expanded={isMobileMenuOpen}>
                            <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} className="w-5 h-5 text-gray-600 dark:text-white" />
                            <span className="text-xs mt-1">Menu</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div ref={mobileMenuRef} className={`mobile-menu md:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
                <div className="px-4 pt-2 pb-4 space-y-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                    <NavItem to="/search" icon={faMagnifyingGlass} label="Search" onClick={handleMobileMenuClick} />
                    <NavItem to="/post" icon={faPen} label="New Post" onClick={handleMobileMenuClick} />
                    <NavItem to="/feed" icon={faNewspaper} label="Feed" onClick={handleMobileMenuClick} />
                    <NavItem to="/network" icon={faNetworkWired} label="Network" onClick={handleMobileMenuClick} />
                    <NavItem
                        to="/recommendations"
                        icon={faThumbsUp}
                        label="For You"
                        onClick={() => {
                            handleNavigation("/recommendations");
                            handleMobileMenuClick();
                        }}
                    />
                    <NavItem
                        to="/chats"
                        icon={faComments}
                        label="Chat"
                        onClick={() => {
                            handleNavigation("/chats");
                            handleMobileMenuClick();
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
                                className="w-full flex flex-col items-center justify-center space-y-1 px-4 py-2 rounded-lg text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                            >
                                <FontAwesomeIcon icon={faUser} className="w-5 h-5" />
                                <span>Logout</span>
                            </button>
                        </>
                    ) : (
                        <div className="space-y-2 pt-2 pb-1">
                            <NavItem to="/login" icon={faUser} label="Sign In" onClick={handleMobileMenuClick} />
                            <NavLink to="/register" onClick={handleMobileMenuClick} className="block w-full px-4 py-2 text-center text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-colors">
                                Sign up
                            </NavLink>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default NavBar;
