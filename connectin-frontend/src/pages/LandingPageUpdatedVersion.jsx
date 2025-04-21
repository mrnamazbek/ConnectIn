import { motion } from "framer-motion";
import { NavLink } from "react-router-dom"; // Убрал неиспользуемый импорт Routes и др.
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUsers,
    faProjectDiagram,
    faComments,
    faStar,
    faCalendarAlt,
    faLink,
    faBlog,
    faUserTie,
    faTree,
    faTrophy,
    faCode,
    faFileAlt,
    faVideo,
    faImage,
    faRocket,
    faLightbulb,
    faHandshake,
    faSearch, // Иконка для поиска
    faNetworkWired, // Иконка для сети
    faBriefcase // Иконка для возможностей
} from "@fortawesome/free-solid-svg-icons";

// Анимации (оставляем как есть, они хорошие)
const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const fadeInUp = { // Немного другой вариант появления
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
            delayChildren: 0.1,
        },
    },
};


const LandingPage = () => {
    return (
        // Улучшаем градиент фона
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-slate-900 dark:to-black text-gray-800 dark:text-gray-200">

            {/* === Hero Section === */}
            <section className="relative pt-28 pb-24 px-4 text-center overflow-hidden">
                {/* Фоновые элементы */}
                <div className="absolute inset-0 opacity-50">
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-white dark:from-slate-900 to-transparent"></div>
                    {/* Можно добавить более интересный SVG паттерн или градиентные круги */}
                </div>

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                    className="max-w-5xl mx-auto relative z-10"
                >
                    <motion.h1
                        variants={fadeInUp}
                        // Улучшенный градиент текста
                        className="text-5xl md:text-7xl font-extrabold mb-5 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 dark:from-emerald-400 dark:via-green-400 dark:to-teal-400"
                    >
                        Connect. Collaborate. Create.
                    </motion.h1>
                    <motion.p
                        variants={fadeInUp}
                        className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto"
                    >
                        ConnectIn is the dynamic ecosystem where developers find projects, build teams, and unlock career opportunities beyond just code repositories.
                    </motion.p>
                    <motion.div variants={fadeInUp}>
                        <NavLink
                            to="/register" // Ведет на регистрацию
                            className="inline-block bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-10 py-4 rounded-lg text-lg font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-emerald-500/30 transform hover:scale-105"
                        >
                            Get Started Now
                        </NavLink>
                         <NavLink
                            to="/login" // Добавим ссылку на логин
                            className="ml-4 inline-block text-emerald-700 dark:text-emerald-400 px-8 py-3 text-md font-semibold hover:underline"
                        >
                            Sign In
                        </NavLink>
                    </motion.div>
                </motion.div>
            </section>

            {/* === Problem / Solution Section === */}
            <section className="py-20 px-4">
                 <div className="max-w-6xl mx-auto text-center">
                     <motion.h2
                        initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeInUp}
                        className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6"
                    >
                        Stop Searching, Start Connecting
                    </motion.h2>
                    <motion.p
                        initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeInUp}
                         className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto"
                    >
                        Tired of endless code repositories? ConnectIn focuses on what truly matters: finding the right projects, collaborating with skilled people, and building your tech career effectively.
                    </motion.p>

                    {/* Placeholder for a visual element showing the problem vs solution */}
                     <motion.div
                         initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeIn}
                         className="aspect-video bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 rounded-lg max-w-4xl mx-auto shadow-md flex items-center justify-center mb-12"
                     >
                        <p className="text-gray-500 dark:text-gray-400">[Placeholder: Image/Animation showing ConnectIn bridging gaps]</p>
                    </motion.div>
                 </div>
            </section>


             {/* === Key Benefits Section === */}
            <section className="py-20 px-4 bg-white dark:bg-slate-900">
                <div className="max-w-6xl mx-auto">
                    <motion.h2
                        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
                        className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-16"
                    >
                        Your Ecosystem for Growth
                    </motion.h2>

                    <motion.div
                        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
                        className="grid md:grid-cols-3 gap-10" // Увеличил gap
                    >
                        {/* Benefit 1 */}
                        <motion.div variants={fadeInUp} className="text-center p-4">
                            <div className="inline-block p-5 bg-emerald-100 dark:bg-emerald-900 rounded-full mb-5 shadow">
                                <FontAwesomeIcon icon={faSearch} className="text-emerald-600 dark:text-emerald-400 text-3xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Discover Relevant Projects</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Find projects matching your skills and interests, moving beyond just code to meaningful contribution.
                            </p>
                            {/* Placeholder for small screenshot */}
                            <div className="mt-4 h-32 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-400 text-xs">Project Preview</div>
                        </motion.div>

                        {/* Benefit 2 */}
                        <motion.div variants={fadeInUp} className="text-center p-4">
                             <div className="inline-block p-5 bg-teal-100 dark:bg-teal-900 rounded-full mb-5 shadow">
                                <FontAwesomeIcon icon={faNetworkWired} className="text-teal-600 dark:text-teal-400 text-3xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Build & Join Teams</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Connect with passionate developers and professionals. Form or join teams built for collaboration.
                            </p>
                             {/* Placeholder for small screenshot */}
                             <div className="mt-4 h-32 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-400 text-xs">Team Profile Preview</div>
                        </motion.div>

                         {/* Benefit 3 */}
                         <motion.div variants={fadeInUp} className="text-center p-4">
                             <div className="inline-block p-5 bg-green-100 dark:bg-green-900 rounded-full mb-5 shadow">
                                <FontAwesomeIcon icon={faBriefcase} className="text-green-600 dark:text-green-400 text-3xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Unlock Opportunities</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Explore job openings, freelance gigs, and grow your career within the ConnectIn network.
                            </p>
                             {/* Placeholder for small screenshot */}
                             <div className="mt-4 h-32 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-400 text-xs">Opportunity Feed Preview</div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* === Social Proof / Team Section (Example) === */}
             <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto text-center">
                     <motion.h2
                        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
                        className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-12"
                    >
                        Built by Developers, for Developers
                    </motion.h2>
                    {/* Здесь можно вставить карточки команды (как на About Us) или отзывы */}
                    <motion.div
                        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
                        className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10"
                     >
                         "ConnectIn finally provides the missing link between showcasing skills and finding real collaborative opportunities." - [Placeholder Testimonial]
                     </motion.div>
                     {/* <div className="flex justify-center gap-8"> [Placeholder Logos] </div> */}
                 </div>
             </section>


            {/* === Final CTA Section === */}
            <section className="py-24 px-4 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 dark:from-gray-900 dark:via-gray-800 dark:to-black">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                    className="max-w-4xl mx-auto text-center"
                >
                    <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                        Ready to Connect?
                    </motion.h2>
                    <motion.p variants={fadeInUp} className="text-xl text-emerald-100 dark:text-gray-300 mb-10">
                        Join ConnectIn today and start building your network, finding projects, and growing your career.
                    </motion.p>
                    <motion.div variants={fadeInUp}>
                        <NavLink
                            to="/register"
                            className="inline-block bg-white text-emerald-700 px-12 py-4 rounded-lg text-lg font-bold hover:bg-emerald-50 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
                        >
                            Sign Up for Free
                        </NavLink>
                    </motion.div>
                </motion.div>
            </section>
        </div>
    );
};

export default LandingPage;