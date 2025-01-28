import React from "react";
import { NavLink } from "react-router";

const SubNav = () => {
    return (
        <div className="bg-gray-100 shadow-lg text-black font-bold">
            <nav className="flex justify-center space-x-6 py-3">
                {/* News Link */}
                <NavLink to="/news" className={({ isActive }) => (isActive ? "text-green-600 font-semibold border-b-2 border-green-600" : "hover:text-green-600")}>
                    News
                </NavLink>

                {/* Projects Link */}
                <NavLink to="/projects" className={({ isActive }) => (isActive ? "text-green-600 font-semibold border-b-2 border-green-600" : "hover:text-green-600")}>
                    Projects
                </NavLink>

                {/* Teams Link */}
                <NavLink to="/teams" className={({ isActive }) => (isActive ? "text-green-600 font-semibold border-b-2 border-green-600" : "hover:text-green-600")}>
                    Teams
                </NavLink>
            </nav>
        </div>
    );
};

export default SubNav;
