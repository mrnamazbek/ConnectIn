import {motion, useScroll, useTransform} from "framer-motion";
import {useRef} from "react";
import {NavLink} from "react-router";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {ReactTyped} from "react-typed";
import {
    faUsers,
    faProjectDiagram,
    faStar,
    faUserTie,
    faCode,
    faRocket,
    faSearch,
    faNetworkWired,
    faBriefcase,
    faArrowRight,
    faComments,
    faBlog,
    faFileCode
} from "@fortawesome/free-solid-svg-icons";

// Animations
const fadeIn = {
    hidden: {opacity: 0, y: 20},
    visible: {opacity: 1, y: 0, transition: {duration: 0.8, ease: [0.22, 1, 0.36, 1]}},
};

const fadeInUp = {
    hidden: {opacity: 0, y: 40},
    visible: {opacity: 1, y: 0, transition: {duration: 0.9, ease: [0.22, 1, 0.36, 1]}},
};

const staggerContainer = {
    hidden: {opacity: 0},
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.1,
        },
    },
};

const fadeInLeft = {
    hidden: {opacity: 0, x: -60},
    visible: {opacity: 1, x: 0, transition: {duration: 0.9, ease: [0.22, 1, 0.36, 1]}},
};

const fadeInRight = {
    hidden: {opacity: 0, x: 60},
    visible: {opacity: 1, x: 0, transition: {duration: 0.9, ease: [0.22, 1, 0.36, 1]}},
};

const LandingPage_v3 = () => {
    const {scrollY} = useScroll();
    const mainRef = useRef(null);

    // Parallax effect for title
    const headerOpacity = useTransform(scrollY, [0, 300], [1, 0]);
    const headerY = useTransform(scrollY, [0, 300], [0, -50]);

    // Create a transform value for the sticky scale effect
    const smoothStickyScale = useTransform(scrollY, [0, 300], [1, 0.95]);

    return (
        <div className="min-h-screen bg-white dark:bg-black text-gray-800 dark:text-gray-200 overflow-hidden"
             ref={mainRef}>
            {/* Hero Section with parallax effect */}
            <section className="relative min-h-screen pt-5 flex items-center">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div style={{opacity: headerOpacity, y: headerY}} className="text-center max-w-4xl mx-auto">
                        <motion.h1 initial="hidden" animate="visible" variants={fadeInUp}
                                   className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
                            <span className="block">
                                <span
                                    className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 dark:from-emerald-400 dark:via-teal-400 dark:to-green-400">Connect.</span>
                            </span>
                            <span className="block mt-2">
                                <ReactTyped strings={["Collaborate.", "Create.", "Contribute."]} typeSpeed={100}
                                            backSpeed={70} loop
                                            className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 dark:from-emerald-400 dark:via-teal-400 dark:to-green-400"/>
                            </span>
                        </motion.h1>

                        <motion.p initial="hidden" animate="visible" variants={fadeIn}
                                  className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
                            The dynamic platform where developers find meaningful projects and unlock career
                            opportunities beyond just code.
                        </motion.p>

                        <motion.div initial="hidden" animate="visible" variants={fadeIn}
                                    className="flex flex-col sm:flex-row gap-4 justify-center">
                            <NavLink to="/register"
                                     className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-10 py-4 rounded-full text-lg font-medium hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-emerald-500/30 transform hover:translate-y-[-2px]">
                                Get Started Free
                            </NavLink>
                        </motion.div>
                    </motion.div>

                    {/* App visualization with "sticky" effect on scroll */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: {opacity: 0, y: 100},
                            visible: {
                                opacity: 1,
                                y: 0,
                                transition: {
                                    delay: 0.5,
                                    duration: 1.2,
                                    ease: [0.22, 1, 0.36, 1],
                                },
                            },
                        }}
                        style={{scale: smoothStickyScale}}
                        className="mt-16 md:mt-20 max-w-5xl mx-auto"
                    ></motion.div>
                </div>
            </section>

            {/* === Problem / Solution Section с красивой визуализацией === */}
            <section className="py-24 px-4 bg-white dark:bg-black relative overflow-hidden">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <motion.div initial="hidden" whileInView="visible" viewport={{once: true, amount: 0.3}}
                                    variants={fadeInLeft}>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                                Stop Searching.
                                <br/>
                                Start <span className="text-emerald-500 dark:text-emerald-400">Connecting</span>.
                            </h2>
                            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">We focus on
                                people and collaboration.</p>

                            <ul className="space-y-6">
                                {[
                                    {
                                        icon: faSearch,
                                        title: "Find relevant projects",
                                        desc: "Projects matching your exact skills and interests",
                                    },
                                    {
                                        icon: faUsers,
                                        title: "Connect with skilled developers",
                                        desc: "Build your network with professionals who complement your skillset",
                                    },
                                    {
                                        icon: faRocket,
                                        title: "Accelerate your growth",
                                        desc: "Build your portfolio and reputation through meaningful work",
                                    },
                                ].map((item, index) => (
                                    <motion.li key={index} variants={fadeIn} className="flex items-start gap-4">
                                        <div
                                            className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                            <FontAwesomeIcon icon={item.icon}/>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                                            <p className="text-gray-600 dark:text-gray-400">{item.desc}</p>
                                        </div>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>

                        <motion.div initial="hidden" whileInView="visible" viewport={{once: true, amount: 0.3}}
                                    variants={fadeInRight} className="relative">
                            {/* Создаем эффект "плавающих" элементов интерфейса */}
                            <div className="relative">
                                <motion.div
                                    animate={{y: [-8, 8, -8], x: [3, -3, 3]}}
                                    transition={{repeat: Infinity, duration: 10, ease: "easeInOut"}}
                                    className="absolute top-10 -right-6 w-64 h-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 z-30 border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="w-full h-5 bg-emerald-100 dark:bg-emerald-900 rounded mb-3"></div>
                                    <div className="w-3/4 h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                                    <div className="w-1/2 h-3 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div
                                            className="h-12 bg-emerald-50 dark:bg-emerald-900/50 rounded flex items-center justify-center">
                                            <FontAwesomeIcon icon={faCode}
                                                             className="text-emerald-500 dark:text-emerald-400"/>
                                        </div>
                                        <div
                                            className="h-12 bg-emerald-50 dark:bg-emerald-900/50 rounded flex items-center justify-center">
                                            <FontAwesomeIcon icon={faUsers}
                                                             className="text-emerald-500 dark:text-emerald-400"/>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    animate={{y: [5, -5, 5], x: [-4, 4, -4]}}
                                    transition={{repeat: Infinity, duration: 12, ease: "easeInOut"}}
                                    className="absolute top-20 -left-10 w-72 h-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 z-20 border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="flex items-center mb-4">
                                        <div
                                            className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-500 dark:text-emerald-400 mr-3">
                                            <FontAwesomeIcon icon={faUserTie}/>
                                        </div>
                                        <div>
                                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                                            <div className="h-3 w-24 bg-emerald-100 dark:bg-emerald-900 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
                                    </div>
                                </motion.div>

                                <motion.div animate={{y: [-10, 10, -10], x: [5, -5, 5]}}
                                            transition={{repeat: Infinity, duration: 14, ease: "easeInOut"}}
                                            className="relative z-10 w-80 h-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-5 border border-gray-200 dark:border-gray-700 mx-auto">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="w-1/2 h-6 bg-emerald-100 dark:bg-emerald-900 rounded"></div>
                                        <div
                                            className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                            <FontAwesomeIcon icon={faProjectDiagram}/>
                                        </div>
                                    </div>
                                    <div className="space-y-3 mb-6">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div
                                            className="h-8 w-20 bg-emerald-500 rounded flex items-center justify-center text-white text-xs">Connect
                                        </div>
                                        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* === Key Benefits Section с анимированными карточками === */}
            <section
                className="py-24 px-4 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-black dark:to-gray-900">
                <div className="w-full max-w-7xl mx-auto">
                    <motion.div initial="hidden" whileInView="visible" viewport={{once: true}} variants={fadeInUp}
                                className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">Your Complete
                            Platform for Growth</h2>
                        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">Every feature designed
                            to accelerate your development journey and expand your network.</p>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{once: true}}
                                variants={staggerContainer} className="grid md:grid-cols-3 gap-8 md:gap-12">
                        {[
                            {
                                icon: faSearch,
                                title: "Smart Project Discovery",
                                desc: "Our AI matching algorithm finds projects that perfectly align with your skills and interests.",
                            },
                            {
                                icon: faNetworkWired,
                                title: "Networking & Collaboration",
                                desc: "Connect with developers who have complementary skills. Communicate and collaborate seamlessly.",
                                link: "/features/networking",
                            },
                            {
                                icon: faBriefcase,
                                title: "Career Opportunities",
                                desc: "Access to job postings, freelance gigs, and networking events to boost your professional growth.",
                            },
                        ].map((item, index) => (
                            <motion.div key={index} variants={fadeInUp} className="group">
                                <div
                                    className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-emerald-500/10 h-full transform group-hover:translate-y-[-8px]">
                                    <div
                                        className="h-48 bg-emerald-100 dark:bg-emerald-900/30 relative overflow-hidden flex items-center justify-center">
                                        <div
                                            className="text-emerald-500 dark:text-emerald-400 text-6xl transform transition-all duration-500 group-hover:scale-110">
                                            <FontAwesomeIcon icon={item.icon}/>
                                        </div>
                                    </div>
                                    <div className="p-8">
                                        <div
                                            className="inline-block p-3 bg-emerald-100 dark:bg-emerald-900 rounded-lg mb-4 w-12 h-12 flex items-center justify-center">
                                            <FontAwesomeIcon icon={item.icon}
                                                             className="text-emerald-600 dark:text-emerald-400 text-xl"/>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{item.title}</h3>
                                        <p className="text-gray-600 dark:text-gray-400 mb-6">{item.desc}</p>
                                        <NavLink
                                            to={item.link || `/features/${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                                            className="inline-flex items-center font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
                                            Learn more
                                            <FontAwesomeIcon icon={faArrowRight} className="ml-2 text-sm"/>
                                        </NavLink>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* === Features Showcase Section с параллакс-эффектом === */}
            <section
                className="py-24 bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900 dark:from-gray-900 dark:via-gray-800 dark:to-black text-white relative overflow-hidden">
                {/* Декоративные элементы фона */}
                <div className="absolute inset-0 overflow-hidden">
                    <div
                        className="absolute w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-800/30 via-transparent to-transparent opacity-70"></div>
                    <div
                        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div initial="hidden" whileInView="visible" viewport={{once: true}} variants={fadeInUp}
                                className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">Designed for the Modern Developer</h2>
                        <p className="text-xl text-emerald-100 dark:text-gray-300 max-w-3xl mx-auto">Powerful features
                            that help you focus on what matters most: building great things with great people.</p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-y-12 md:gap-x-8">
                        {[
                            {
                                icon: faProjectDiagram,
                                title: "Project Matching",
                                desc: "AI-powered matching connects you with projects that align with your skills and interests.",
                            },
                            {
                                icon: faUsers,
                                title: "Developer Networking",
                                desc: "Connect with skilled developers who share your interests and complement your abilities.",
                            },
                            {
                                icon: faComments,
                                title: "Real-Time Chat",
                                desc: "Seamless communication with other developers, with project-specific channels.",
                            },
                            {
                                icon: faFileCode,
                                title: "Portfolio Building",
                                desc: "Showcase your projects and contributions to build a compelling professional portfolio.",
                            },
                            {
                                icon: faBlog,
                                title: "Knowledge Sharing",
                                desc: "Share your insights and learn from others with our integrated blogging platform.",
                            },
                            {
                                icon: faStar,
                                title: "Skill Recognition",
                                desc: "Get endorsed for your skills and build your professional reputation.",
                            },
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{once: true, amount: 0.3}}
                                variants={{
                                    hidden: {opacity: 0, y: 30},
                                    visible: {
                                        opacity: 1,
                                        y: 0,
                                        transition: {
                                            delay: index * 0.1,
                                            duration: 0.7,
                                            ease: [0.22, 1, 0.36, 1],
                                        },
                                    },
                                }}
                                className="flex flex-col items-center text-center px-4"
                            >
                                <div
                                    className="h-16 w-16 rounded-full bg-emerald-700/50 dark:bg-emerald-800/30 flex items-center justify-center text-emerald-400 mb-6">
                                    <FontAwesomeIcon icon={feature.icon} className="text-xl"/>
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-emerald-100 dark:text-gray-400">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* === Testimonials Section с горизонтальной прокруткой === */}
            <section className="py-24 bg-white dark:bg-black overflow-hidden">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div initial="hidden" whileInView="visible" viewport={{once: true}} variants={fadeInUp}
                                className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">From the
                            Developer Community</h2>
                        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">Hear from developers
                            who&apos;ve found success through ConnectIn.</p>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{once: true}}
                                variants={staggerContainer}
                                className="flex overflow-x-auto space-x-6 pb-8 -mx-4 px-4 scrollbar-hide">
                        {[
                            {
                                quote: "ConnectIn helped me find a project that perfectly matched my skill set. Now I'm contributing to an open-source project that's making a real difference.",
                                name: "Amirkhan Mamytbek",
                                title: "Tech Lead at Google",
                            },
                            {
                                quote: "I built my entire professional network through ConnectIn. The quality of talent and the matching algorithm is far superior to any other platform I've used.",
                                name: "Yerman Berik",
                                title: "Backend Developer",
                            },
                            {
                                quote: "As a self-taught developer, ConnectIn gave me the opportunity to contribute to real projects and build my portfolio. The community here is incredibly supportive.",
                                name: "Yeldos Anarbaev",
                                title: "Frontend Developer",
                            },
                            {
                                quote: "ConnectIn bridges the gap between project ideas and implementation. I found amazing collaborators for my open-source initiative within days.",
                                name: "Namdar Ibrakhim",
                                title: "Backend Developer",
                            },
                            {
                                quote: "The portfolio building features helped me showcase my work effectively. I've received multiple job offers after connecting with professionals in my field.",
                                name: "Adilet Zhandyrbay",
                                title: "UI/UX Designer",
                            },
                        ].map((testimonial, index) => (
                            <motion.div
                                key={index}
                                variants={fadeIn}
                                className="flex-shrink-0 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-emerald-100 dark:border-emerald-900/20 group hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 transform hover:translate-y-[-4px]"
                            >
                                <div className="flex flex-col h-full">
                                    <div className="mb-6 flex-grow">
                                        <svg className="h-8 w-8 text-emerald-500 mb-4" fill="currentColor"
                                             viewBox="0 0 32 32">
                                            <path
                                                d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z"/>
                                        </svg>
                                        <p className="text-gray-700 dark:text-gray-300 italic mb-3">{testimonial.quote}</p>
                                    </div>
                                    <div className="flex items-center">
                                        <div
                                            className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-500 dark:text-emerald-400 font-bold mr-4">{testimonial.name.charAt(0)}</div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</h4>
                                            <p className="text-sm text-emerald-600 dark:text-emerald-400">{testimonial.title}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* === Pricing Section === */}
            <section className="py-24 bg-white dark:bg-black overflow-hidden">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div initial="hidden" whileInView="visible" viewport={{once: true}} variants={fadeInUp}
                                className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">Simple,
                            Transparent Pricing</h2>
                        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">Choose the plan
                            that&apos;s right for your development journey.</p>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{once: true}}
                                variants={staggerContainer} className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                name: "Free",
                                price: "Free",
                                period: "forever",
                                description: "Perfect for exploring and getting started",
                                features: ["Join up to 3 active projects", "Basic collaboration tools", "Community support", "Personal profile"],
                                cta: "Get Started",
                                highlighted: false,
                            },
                            {
                                name: "Premium",
                                price: "Contact us",
                                period: "",
                                description: "Everything you need for serious collaboration and AI features",
                                features: ["Unlimited projects", "Advanced networking features", "Priority matching algorithm", "Direct messaging", "Profile verification badge", "Email support"],
                                cta: "Contact Sales",
                                highlighted: true,
                            },
                            {
                                name: "Enterprise",
                                price: "Custom",
                                period: "pricing",
                                description: "Best for long-term professional growth",
                                features: ["All Premium features", "Personal workspace", "Advanced analytics", "Custom branding", "API access", "Dedicated support"],
                                cta: "Contact Sales",
                                highlighted: false,
                            },
                        ].map((plan, index) => (
                            <motion.div
                                key={index}
                                variants={fadeInUp}
                                className={`rounded-2xl overflow-hidden ${
                                    plan.highlighted ? "ring-4 ring-emerald-500 dark:ring-emerald-400" : "border border-emerald-200 dark:border-emerald-800/20"
                                } transition-all duration-300 group hover:shadow-xl hover:shadow-emerald-500/5 transform hover:translate-y-[-4px]`}
                            >
                                <div
                                    className={`p-8 ${plan.highlighted ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white" : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"}`}>
                                    <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                                    <p className={`mb-5 ${plan.highlighted ? "text-emerald-100" : "text-gray-500 dark:text-gray-400"}`}>{plan.description}</p>
                                    <div className="flex items-baseline mb-5">
                                        <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                                        {plan.period && <span
                                            className={`ml-1 text-xl ${plan.highlighted ? "text-emerald-100" : "text-gray-500 dark:text-gray-400"}`}> {plan.period}</span>}
                                    </div>
                                    <button
                                        className={`w-full py-3 px-6 rounded-lg font-medium transition-all transform hover:translate-y-[-2px] ${plan.highlighted ? "bg-white text-emerald-600 hover:bg-gray-50" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}>{plan.cta}</button>
                                </div>
                                <div className="p-8 bg-gray-50 dark:bg-gray-800">
                                    <ul className="space-y-4">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start">
                                                <svg
                                                    className="h-6 w-6 text-emerald-500 dark:text-emerald-400 mr-3 flex-shrink-0"
                                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                          d="M5 13l4 4L19 7"/>
                                                </svg>
                                                <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    <motion.p initial="hidden" whileInView="visible" viewport={{once: true}} variants={fadeIn}
                              className="text-center text-gray-600 dark:text-gray-400 mt-10">
                        Need a custom solution?{" "}
                        <a href="/contact" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                            Contact our team
                        </a>
                    </motion.p>
                </div>
            </section>

            {/* === Final CTA Section со стильным фоном === */}
            <section className="py-32 relative overflow-hidden">
                {/* Градиентный фон с сияющим эффектом */}
                <div className="absolute inset-0 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 dark:from-emerald-900 dark:via-green-900 dark:to-teal-900"></div>
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.2, 0.4, 0.2],
                        }}
                        transition={{
                            duration: 15,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 2,
                        }}
                        className="absolute -bottom-40 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
                    />
                </div>

                <motion.div initial="hidden" whileInView="visible" viewport={{once: true}} variants={staggerContainer}
                            className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <motion.h2 variants={fadeInUp} className="text-4xl md:text-6xl font-bold text-white mb-6">
                        Ready to transform your development experience?
                    </motion.h2>
                    <motion.p variants={fadeInUp}
                              className="text-xl md:text-2xl text-emerald-100 dark:text-emerald-200 mb-10 max-w-3xl mx-auto">
                        Join thousands of developers who&apos;ve found their perfect projects, teams, and career
                        opportunities on ConnectIn.
                    </motion.p>
                    <motion.div variants={fadeInUp}
                                className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <NavLink to="/register"
                                 className="bg-white text-emerald-700 px-10 py-4 rounded-full text-lg font-semibold hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl transform hover:translate-y-[-2px]">
                            Join ConnectIn Today
                        </NavLink>
                        {/*<NavLink to="/demo" className="text-white border border-white/40 bg-white/10 backdrop-blur-sm px-10 py-4 rounded-full text-lg font-semibold hover:bg-white/20 transition-all">*/}
                        {/*    Request Demo*/}
                        {/*</NavLink>*/}
                    </motion.div>
                </motion.div>
            </section>
        </div>
    );
};

export default LandingPage_v3;
