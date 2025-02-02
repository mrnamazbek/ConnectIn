import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faGoogle, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router";

const Footer = () => {
    return (
        <footer className="bg-green-600 text-white w-full py-3 font-bold shadow-xl">
            <div className="grid grid-cols-8">
                {/* Footer content aligned to the grid */}
                <div className="col-start-2 col-span-6 flex justify-between items-center">
                    {/* Left Section: Copyright */}
                    <h1 className="text-md">&copy; 2025 Connect. All rights reserved.</h1>

                    {/* Center Section: Links */}
                    <div className="flex space-x-8">
                        <div className="flex space-x-8 items-center">
                            <NavLink to="/faq" className="transition duration-300">
                                <FontAwesomeIcon icon={faQuestionCircle} className="mr-2" />
                                FAQ
                            </NavLink>
                            <NavLink to="/about-us" className="transition duration-300">
                                About Us
                            </NavLink>
                        </div>

                        {/* Right Section: Social Media Links */}
                        <div className="flex space-x-4">
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                                <FontAwesomeIcon icon={faGithub} size="xl" className="hover:text-gray-400 transition duration-300" />
                            </a>
                            <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">
                                <FontAwesomeIcon icon={faLinkedin} size="xl" className="hover:text-gray-400 transition duration-300" />
                            </a>
                            <a href="https://www.google.com" target="_blank" rel="noopener noreferrer">
                                <FontAwesomeIcon icon={faGoogle} size="xl" className="hover:text-gray-400 transition duration-300" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
