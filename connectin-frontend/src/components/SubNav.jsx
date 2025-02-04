import React from "react";
import { NavLink } from "react-router";

const SubNav = () => {
    return (
        <div className="shadow-md sticky top-0 backdrop-blur-xs rounded-b-md border-b border-r border-l border-green-700">
            <nav className="flex justify-center space-x-6 py-2 font-semibold">
                {/* News Link */}
                <NavLink to="/news" className={({ isActive }) => (isActive ? "text-green-700 border-green-700" : "hover:text-green-700")}>
                    News
                </NavLink>

                {/* Projects Link */}
                <NavLink to="/projects" className={({ isActive }) => (isActive ? "text-green-700 border-green-700" : "hover:text-green-700")}>
                    Projects
                </NavLink>

                {/* Teams Link */}
                <NavLink to="/teams" className={({ isActive }) => (isActive ? "text-green-700 border-green-700" : "hover:text-green-700")}>
                    Teams
                </NavLink>
            </nav>
        </div>
    );
};

export default SubNav;
