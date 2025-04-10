import { NavLink, useLocation, useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon, faMagnifyingGlass, faUser, faComments, faNewspaper, faPen, faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import Logo from "../assets/images/connectin-logo-png.png";
import axios from "axios";
import TokenService from "../services/tokenService";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";

const NavBar = () => {
    const { isAuthenticated, updateAuthState } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const noStickyRoutes = ["/news", "/projects", "/teams", "/post", "/search"];
    const isSticky = !noStickyRoutes.includes(location.pathname);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem("theme") === "dark");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef(null);

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
        setIsMobileMenuOpen(prev => !prev);
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
                flex items-center space-x-2 px-4 py-2 text-sm
                ${isActive ? "text-green-700 dark:text-green-400" : "text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400"}
            `}
        >
            <FontAwesomeIcon icon={icon} className="w-4 h-4" />
            <span>{label}</span>
        </NavLink>
    );

    return (
        <nav className={`bg-white dark:bg-gray-800 border-b border-green-700 shadow-md ${isSticky ? "sticky top-0" : ""} z-20`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <NavLink to="/" className="flex items-center space-x-2 font-semibold text-green-700 dark:text-green-400">
                        <img src={Logo} alt="Logo" width={24} height={24} />
                        <span className="hidden sm:inline">ConnectIn</span>
                    </NavLink>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-4">
                        {/* Theme Toggle */}
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}>
                            <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} className="w-4 h-4 text-gray-600 dark:text-white" />
                        </button>

                        {/* Navigation Links */}
                        <NavItem to="/search" icon={faMagnifyingGlass} label="Search" />
                        <NavItem to="/post" icon={faPen} label="New Post" />
                        <NavItem to="/" icon={faNewspaper} label="Feed" />
                        <NavItem to="/chats" icon={faComments} label="Chats" onClick={() => handleNavigation("/chats")} />

                        {/* User Menu */}
                        {isAuthenticated ? (
                            <div className="relative user-button">
                                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-gray-600 dark:text-white" />
                                </button>
                                {isMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700">
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                handleNavigation("/profile") && navigate("/profile");
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            Profile
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                handleLogout();
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
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
                    <div className="md:hidden flex items-center space-x-4">
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}>
                            <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} className="w-4 h-4 text-gray-600 dark:text-white" />
                        </button>
                        <button 
                            onClick={handleMobileMenuClick}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" 
                            aria-label="Toggle menu"
                            aria-expanded={isMobileMenuOpen}
                        >
                            <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} className="w-4 h-4 text-gray-600 dark:text-white" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div 
                ref={mobileMenuRef} 
                className={`mobile-menu md:hidden transition-all duration-200 ease-in-out ${
                    isMobileMenuOpen ? "block" : "hidden"
                }`}
            >
                <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    <NavItem to="/search" icon={faMagnifyingGlass} label="Search" onClick={handleMobileMenuClick} />
                    <NavItem to="/post" icon={faPen} label="New Post" onClick={handleMobileMenuClick} />
                    <NavItem to="/" icon={faNewspaper} label="Feed" onClick={handleMobileMenuClick} />
                    <NavItem
                        to="/chats"
                        icon={faComments}
                        label="Chats"
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
                                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
                                <span>Logout</span>
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
