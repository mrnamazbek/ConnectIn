import { NavLink, useLocation } from "react-router";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon, faMagnifyingGlass, faS } from "@fortawesome/free-solid-svg-icons";
import { faUser } from "@fortawesome/free-regular-svg-icons";
import { faNewspaper } from "@fortawesome/free-solid-svg-icons";
import { faPen } from "@fortawesome/free-solid-svg-icons";

const NavBar = () => {
    const location = useLocation();
    const noStickyRoutes = ["/news", "/projects", "/teams", "/post", "/search"];
    const isSticky = !noStickyRoutes.includes(location.pathname);

    const [isDark, setIsDark] = useState(localStorage.getItem("theme") === "dark");

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add("dark"); // ✅ Add "dark" class to <html>
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark"); // ✅ Remove "dark" class
            localStorage.setItem("theme", "light");
        }
    }, [isDark]);

    return (
        <nav className={`grid grid-cols-8 bg-white border-b border-green-700 shadow-md ${isSticky ? "sticky top-0" : ""}`}>
            <div className="col-start-2 col-span-6">
                <div className="flex justify-between items-center py-3">
                    <NavLink to="/" className="font-semibold text-green-700">
                        ConnectIn
                    </NavLink>

                    <div className="space-x-5 font-semibold flex items-center">
                        {/* Theme Toggle */}
                        <button onClick={() => setIsDark(!isDark)}>
                            <FontAwesomeIcon icon={isDark ? faSun : faMoon} className="cursor-pointer text-gray-600 hover:text-green-700" />
                        </button>

                        {/* Search */}
                        <NavLink to="/search" className={({ isActive }) => (isActive ? "text-green-700" : "hover:text-green-700")}>
                            <FontAwesomeIcon icon={faMagnifyingGlass} />
                        </NavLink>

                        {/* New Post */}
                        <NavLink to="/post" className={({ isActive }) => (isActive ? "text-green-700" : "hover:text-green-700")}>
                            <FontAwesomeIcon icon={faPen} />
                        </NavLink>

                        {/* Navigation Links */}
                        <NavLink to="/" className={({ isActive }) => (isActive ? "text-green-700" : "hover:text-green-700")}>
                            <FontAwesomeIcon icon={faNewspaper} />
                        </NavLink>
                        <NavLink to="/profile" className={({ isActive }) => (isActive ? "text-green-700" : "hover:text-green-700")}>
                            <FontAwesomeIcon icon={faUser} />
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
