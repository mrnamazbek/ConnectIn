import { NavLink } from "react-router";

const Navbar = () => {
    return (
        <nav className="bg-green-800 text-white w-full py-3 font-bold shadow-md">
            {/* Full-width Navbar with inner content grid */}
            <div className="grid grid-cols-8">
                <div className="col-start-2 col-span-6 flex justify-between items-center">
                    {/* Logo */}
                    <h1 className="text-2xl">
                        <NavLink to="/" end>
                            Connect
                        </NavLink>
                    </h1>

                    {/* Navigation Links */}
                    <div className="flex items-center space-x-4">
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

export default Navbar;
