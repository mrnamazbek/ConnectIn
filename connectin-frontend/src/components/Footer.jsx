import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faTwitter, faLinkedin, faDiscord } from "@fortawesome/free-brands-svg-icons";
import { faQuestionCircle, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router";

const Footer = () => {
    return (
        <footer className="bg-white dark:bg-gray-900 border-t border-green-700 dark:border-gray-800">
            {/* Main footer content */}
            <div className="grid grid-cols-8 pt-12 pb-8">
                <div className="col-start-2 col-span-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Company info */}
                        <div className="col-span-1 md:col-span-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">ConnectIn</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">Building the future of developer collaboration, one connection at a time.</p>
                            <div className="flex space-x-4 mb-6">
                                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400 transition">
                                    <FontAwesomeIcon icon={faGithub} className="text-lg" />
                                </a>
                                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400 transition">
                                    <FontAwesomeIcon icon={faTwitter} className="text-lg" />
                                </a>
                                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400 transition">
                                    <FontAwesomeIcon icon={faLinkedin} className="text-lg" />
                                </a>
                                <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400 transition">
                                    <FontAwesomeIcon icon={faDiscord} className="text-lg" />
                                </a>
                            </div>
                        </div>

                        {/* Company Links */}
                        <div className="col-span-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Company</h3>
                            <ul className="space-y-2">
                                <li>
                                    <NavLink to="/about" className="text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400 transition">
                                        About Us
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/contact" className="text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400 transition">
                                        Contact
                                    </NavLink>
                                </li>
                            </ul>
                        </div>

                        {/* Resources Links */}
                        <div className="col-span-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Resources</h3>
                            <ul className="space-y-2">
                                <li>
                                    <NavLink to="/faq" className="text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400 transition">
                                        <FontAwesomeIcon icon={faQuestionCircle} className="mr-2" />
                                        FAQ
                                    </NavLink>
                                </li>
                            </ul>
                        </div>

                        {/* Newsletter */}
                        <div className="col-span-1 md:col-span-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Stay Updated</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">Subscribe to our newsletter for the latest updates.</p>
                            <form className="flex flex-col space-y-2">
                                <div className="relative">
                                    <input type="email" placeholder="Your email" className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                                    <button type="submit" className="absolute right-1 top-1 bottom-1 px-3 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center transition-colors">
                                        <FontAwesomeIcon icon={faArrowRight} />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-500">We respect your privacy. Unsubscribe at any time.</p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Copyright bar */}
            <div className="border-t border-gray-200 dark:border-gray-800 py-6">
                <div className="grid grid-cols-8">
                    <div className="col-start-2 col-span-6 flex flex-col md:flex-row justify-between items-center">
                        <p className="text-gray-600 dark:text-gray-400 mb-4 md:mb-0">&copy; {new Date().getFullYear()} ConnectIn. All rights reserved.</p>
                        <div className="flex flex-wrap justify-center space-x-6">
                            <NavLink to="/terms" className="text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400 transition">
                                Terms
                            </NavLink>
                            <NavLink to="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400 transition">
                                Privacy
                            </NavLink>
                            <NavLink to="/cookies" className="text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400 transition">
                                Cookies
                            </NavLink>
                            <NavLink to="/accessibility" className="text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400 transition">
                                Accessibility
                            </NavLink>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
