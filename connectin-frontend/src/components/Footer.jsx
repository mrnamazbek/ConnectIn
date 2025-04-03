import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router";

const Footer = () => {
    return (
        <footer className="border-t bg-white dark:bg-gray-800 border-green-700 dark:border-gray-700 py-3">
            <div className="grid grid-cols-8">
                {/* Footer content aligned to the grid */}
                <div className="col-start-2 col-span-6 flex justify-between items-center font-semibold">
                    {/* Left Section: Copyright */}
                    <p className="text-gray-800 dark:text-gray-300">&copy; 2025 ConnectIn. All rights reserved.</p>

                    <div className="flex space-x-8">
                        {/* Right Section: Links */}
                        <NavLink to="/faq" className="transition hover:text-green-700 dark:hover:text-green-400 text-gray-800 dark:text-gray-300">
                            <FontAwesomeIcon icon={faQuestionCircle} className="pr-1" />
                            FAQ
                        </NavLink>
                        <NavLink to="/about" className="transition hover:text-green-700 dark:hover:text-green-400 text-gray-800 dark:text-gray-300">
                            About Us
                        </NavLink>
                        <NavLink to="/aboutus" className="transition hover:text-green-700 dark:hover:text-green-400 text-gray-800 dark:text-gray-300">
                            About Us more details
                        </NavLink>
                        <NavLink to="/theynotlikeus" className="transition hover:text-green-700 dark:hover:text-green-400 text-gray-800 dark:text-gray-300">
                            They not like us
                        </NavLink>

                        {/* Right Section: Social Media Links */}
                        <a href="https://github.com/ded-r/ConnectIn" target="_blank" rel="noopener noreferrer" className="text-gray-800 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 transition">
                            <FontAwesomeIcon icon={faGithub} />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
