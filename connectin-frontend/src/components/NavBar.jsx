import { NavLink } from "react-router";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLightbulb } from "@fortawesome/free-solid-svg-icons";
import { faMoon } from "@fortawesome/free-regular-svg-icons";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

const NavBar = () => {
    const [theme, setTheme] = useState("light");
    const handleThemeChange = () => {
        console.log("Theme changed");
        setTheme(theme === "light" ? "dark" : "light");
    };

    return (
        <nav className="bg-green-600 text-white w-full py-3 font-bold shadow-xl">
            {/* Full-width Navbar with inner content grid */}
            <div className="grid grid-cols-8">
                <div className="col-start-2 col-span-6 flex justify-between items-center">
                    {/* Logo */}
                    <h1 className="text-2xl">
                        <NavLink to="/" end>
                            ConnectIn
                        </NavLink>
                    </h1>

                    {/* Navigation Links */}
                    <div className="flex items-center space-x-4">
                        {theme === "light" ? (
                            <button onClick={handleThemeChange}>
                                <FontAwesomeIcon icon={faMoon} className="cursor-pointer" />
                            </button>
                        ) : (
                            <button onClick={handleThemeChange}>
                                <FontAwesomeIcon icon={faLightbulb} className="cursor-pointer" />
                            </button>
                        )}
                        <NavLink to="/search" className="hover:underline hover:underline-offset-4 transition duration-300">
                            <FontAwesomeIcon icon={faMagnifyingGlass} />
                        </NavLink>
                        <NavLink to="/" className="hover:underline hover:underline-offset-4 transition duration-300">
                            Feed
                        </NavLink>
                        <NavLink to="/profile" className="hover:underline hover:underline-offset-4 transition duration-300">
                            Profile
                        </NavLink>
                        <NavLink to="/login" className="hover:underline hover:underline-offset-4 transition duration-300">
                            Login
                        </NavLink>
                        <NavLink to="/register" className="hover:underline hover:underline-offset-4 transition duration-300">
                            Registration
                        </NavLink>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default NavBar;
