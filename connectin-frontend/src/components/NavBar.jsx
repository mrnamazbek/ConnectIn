import { NavLink, useLocation } from "react-router";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

const NavBar = () => {
    const location = useLocation();
    const noStickyRoutes = ["/news", "/projects", "/teams"];
    const isSticky = !noStickyRoutes.includes(location.pathname);

    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        localStorage.setItem("theme", theme);
    }, [theme]);

    return (
        <nav className={`grid grid-cols-8 bg-white border-b border-green-700 shadow-md ${isSticky ? "sticky top-0" : ""}`}>
            <div className="col-start-2 col-span-6">
                <div className="flex justify-between items-center py-3">
                    <NavLink to="/" className="font-semibold text-green-700">
                        ConnectIn
                    </NavLink>

                    <div className="space-x-5 font-semibold flex items-center">
                        {/* Theme Toggle */}
                        <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                            <FontAwesomeIcon icon={theme === "light" ? faMoon : faSun} className="cursor-pointer text-gray-600 hover:text-green-700" />
                        </button>

                        {/* Search */}
                        <NavLink to="/search" className={({ isActive }) => (isActive ? "text-green-700" : "hover:text-green-700")}>
                            <FontAwesomeIcon icon={faMagnifyingGlass} />
                        </NavLink>

                        {/* Navigation Links */}
                        <NavLink to="/" className={({ isActive }) => (isActive ? "text-green-700" : "hover:text-green-700")}>
                            Feed
                        </NavLink>
                        <NavLink to="/profile" className={({ isActive }) => (isActive ? "text-green-700" : "hover:text-green-700")}>
                            Profile
                        </NavLink>
                        <NavLink to="/login" className={({ isActive }) => (isActive ? "text-green-700" : "hover:text-green-700")}>
                            Sign in
                        </NavLink>
                        <NavLink to="/register" className={({ isActive }) => (isActive ? "text-green-700" : "hover:text-green-700")}>
                            Sign up
                        </NavLink>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default NavBar;
