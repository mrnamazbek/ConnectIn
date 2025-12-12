import { NavLink } from "react-router";

const SubNav = () => {
    return (
        <div className="text-sm dark:bg-gray-800 dark:text-gray-300 shadow-md sticky top-0 backdrop-blur-xs rounded-b-md border-b border-r border-l border-green-700 z-10">
            <nav className="flex justify-center space-x-6 py-2 font-semibold">
                {/* News Link */}
                <NavLink to="/feed/news" className={({ isActive }) => (isActive ? "text-green-700 dark:text-green-400" : "hover:text-green-700")}>
                    News
                </NavLink>

                {/* Projects Link */}
                <NavLink to="/feed/projects" className={({ isActive }) => (isActive ? "text-green-700 dark:text-green-400" : "hover:text-green-700")}>
                    Projects
                </NavLink>

                {/* Teams Link
                <NavLink to="/teams" className={({ isActive }) => (isActive ? "text-green-700 dark:text-green-400" : "hover:text-green-700")}>
                    Teams
                </NavLink> */}
            </nav>
        </div>
    );
};

export default SubNav;
