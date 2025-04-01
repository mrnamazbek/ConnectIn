import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faGoogle, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router";

const Footer = () => {
    return (
        <footer className="border-t bg-white border-green-700 py-3">
            <div className="grid grid-cols-8">
                {/* Footer content aligned to the grid */}
                <div className="col-start-2 col-span-6 flex justify-between items-center font-semibold">
                    {/* Left Section: Copyright */}
                    <p>&copy; 2025 ConnectIn. All rights reserved.</p>

                    <div className="flex space-x-8">
                        {/* Right Section: Links */}
                        <NavLink to="/faq" className="transition hover:text-green-700">
                            <FontAwesomeIcon icon={faQuestionCircle} className="pr-1" />
                            FAQ
                        </NavLink>
                        <NavLink to="/about" className="transition hover:text-green-700">
                            About Us
                        </NavLink>
                        <NavLink to="/aboutus" className="transition hover:text-green-700">
                            About Us more details
                        </NavLink>

                        {/* Right Section: Social Media Links */}
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                            <FontAwesomeIcon icon={faGithub} className="transition hover:text-green-700" />
                        </a>
                        <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">
                            <FontAwesomeIcon icon={faLinkedin} className="transition hover:text-green-700" />
                        </a>
                        <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">
                            <FontAwesomeIcon icon={faGoogle} className="transition hover:text-green-700" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
