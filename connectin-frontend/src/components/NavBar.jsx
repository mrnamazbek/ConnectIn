import { NavLink, useLocation, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon, faMagnifyingGlass, faUser, faComments, faNewspaper, faPen } from "@fortawesome/free-solid-svg-icons";
import Logo from "../assets/images/connectin-logo-png.png";
import axios from "axios";

const NavBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const noStickyRoutes = ["/news", "/projects", "/teams", "/post", "/search"];
    const isSticky = !noStickyRoutes.includes(location.pathname);

    const [isDark, setIsDark] = useState(localStorage.getItem("theme") === "dark");
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }

        // Close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (showMenu && !event.target.closest(".user-button")) {
                setShowMenu(false);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [isDark, showMenu]);

    const isLoggedIn = () => {
        return !!localStorage.getItem("access_token");
    };

    const handleLogout = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/auth/logout`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            navigate("/login");
        } catch (error) {
            console.error("Logout failed:", error);
            navigate("/login");
        }
    };

    return (
        <nav className={`grid grid-cols-8 bg-white dark:bg-zinc-800 text-sm border-b border-green-700 shadow-md ${isSticky ? "sticky top-0" : ""}`}>
            <div className="col-start-2 col-span-6">
                <div className="flex justify-between items-center py-3">
                    <NavLink to="/" className="flex items-center space-x-2 font-semibold text-green-700">
                        <img src={Logo} alt="Logo" width={24} height={24} />
                        <p>ConnectIn</p>
                    </NavLink>
                    <div className="space-x-5 font-semibold flex items-center">
                        {/* Theme Toggle */}
                        <button onClick={() => setIsDark(!isDark)} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}>
                            <FontAwesomeIcon icon={isDark ? faSun : faMoon} className="cursor-pointer text-gray-600 dark:text-white hover:text-green-700" />
                        </button>

                        {/* Search */}
                        <NavLink to="/search" className={({ isActive }) => (isActive ? "text-green-700 dark:text-white" : "hover:text-green-700 dark:hover:text-white")}>
                            <FontAwesomeIcon icon={faMagnifyingGlass} />
                        </NavLink>

                        {/* New Post */}
                        <NavLink to="/post" className={({ isActive }) => (isActive ? "text-green-700 dark:text-white" : "hover:text-green-700 dark:hover:text-white")}>
                            <FontAwesomeIcon icon={faPen} />
                        </NavLink>

                        {/* Navigation Links */}
                        <NavLink to="/" className={({ isActive }) => (isActive ? "text-green-700 dark:text-white" : "hover:text-green-700 dark:hover:text-white")}>
                            <FontAwesomeIcon icon={faNewspaper} />
                        </NavLink>
                        <NavLink to="/chats" className={({ isActive }) => (isActive ? "text-green-700 dark:text-white" : "hover:text-green-700 dark:hover:text-white")}>
                            <FontAwesomeIcon icon={faComments} />
                        </NavLink>
                        {isLoggedIn() ? (
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
                                    <div className="absolute z-10 top-6 right-0 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-gray-700 shadow-md p-2">
                                        <NavLink to="/profile" className="block py-2 px-4 text-sm text-gray-700 dark:text-white hover:underline dark:hover:bg-gray-700" onClick={() => setShowMenu(false)}>
                                            Profile
                                        </NavLink>
                                        <button
                                            className="block py-2 px-4 text-sm text-gray-700 dark:text-white hover:underline dark:hover:bg-gray-700 text-left w-full"
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
