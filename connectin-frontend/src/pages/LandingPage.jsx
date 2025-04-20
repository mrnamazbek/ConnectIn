import { motion } from "framer-motion";
import { NavLink } from "react-router";
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
    faHandshake
} from "@fortawesome/free-solid-svg-icons";

const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
        },
    },
};

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-green-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Hero Section */}
            <section className="relative py-20 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-900/20 dark:to-teal-900/20" />
                <div className="absolute inset-0 bg-[url('/src/assets/landing/hero-pattern.svg')] opacity-10" />
                <motion.div 
                    initial="hidden" 
                    animate="visible" 
                    variants={staggerContainer} 
                    className="max-w-6xl mx-auto text-center relative z-10"
                >
                    <motion.h1 
                        variants={fadeIn} 
                        className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 mb-6"
                    >
                        ConnectIn
                    </motion.h1>
                    <motion.p 
                        variants={fadeIn} 
                        className="text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-3xl mx-auto"
                    >
                        Объединяем профессиональные команды и проекты в единую экосистему
                    </motion.p>
                    <motion.div variants={fadeIn}>
                        <NavLink 
                            to="/register" 
                            className="inline-block bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl"
                        >
                            Начать работу
                        </NavLink>
                    </motion.div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <motion.h2 
                        initial="hidden" 
                        whileInView="visible" 
                        viewport={{ once: true }} 
                        variants={fadeIn} 
                        className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12"
                    >
                        Ключевой функционал сервиса
                    </motion.h2>

                    {/* Projects Section */}
                    <motion.div 
                        initial="hidden" 
                        whileInView="visible" 
                        viewport={{ once: true }} 
                        variants={staggerContainer} 
                        className="grid md:grid-cols-2 gap-8 mb-16"
                    >
                        <motion.div 
                            variants={fadeIn} 
                            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <div className="flex items-center mb-4">
                                <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-lg mr-3">
                                    <FontAwesomeIcon icon={faProjectDiagram} className="text-emerald-600 dark:text-emerald-400 text-2xl" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Страницы проектов</h3>
                            </div>
                            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                                <li className="flex items-start">
                                    <FontAwesomeIcon icon={faStar} className="text-emerald-500 mt-1 mr-2" />
                                    <span>Название и описание проекта</span>
                                </li>
                                <li className="flex items-start">
                                    <FontAwesomeIcon icon={faCalendarAlt} className="text-emerald-500 mt-1 mr-2" />
                                    <span>Даты начала и окончания</span>
                                </li>
                                <li className="flex items-start">
                                    <FontAwesomeIcon icon={faLink} className="text-emerald-500 mt-1 mr-2" />
                                    <span>Медиа-материалы и ресурсы</span>
                                </li>
                                <li className="flex items-start">
                                    <FontAwesomeIcon icon={faBlog} className="text-emerald-500 mt-1 mr-2" />
                                    <span>Личный блог проекта</span>
                                </li>
                                <li className="flex items-start">
                                    <FontAwesomeIcon icon={faComments} className="text-emerald-500 mt-1 mr-2" />
                                    <span>Комментарии и отзывы</span>
                                </li>
                            </ul>
                        </motion.div>

                        {/* Teams Section */}
                        <motion.div 
                            variants={fadeIn} 
                            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <div className="flex items-center mb-4">
                                <div className="p-3 bg-teal-100 dark:bg-teal-900 rounded-lg mr-3">
                                    <FontAwesomeIcon icon={faUsers} className="text-teal-600 dark:text-teal-400 text-2xl" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Страницы команд</h3>
                            </div>
                            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                                <li className="flex items-start">
                                    <FontAwesomeIcon icon={faUserTie} className="text-teal-500 mt-1 mr-2" />
                                    <span>Информация об участниках</span>
                                </li>
                                <li className="flex items-start">
                                    <FontAwesomeIcon icon={faTree} className="text-teal-500 mt-1 mr-2" />
                                    <span>Иерархическая структура</span>
                                </li>
                                <li className="flex items-start">
                                    <FontAwesomeIcon icon={faTrophy} className="text-teal-500 mt-1 mr-2" />
                                    <span>Рейтинги и отзывы</span>
                                </li>
                                <li className="flex items-start">
                                    <FontAwesomeIcon icon={faBlog} className="text-teal-500 mt-1 mr-2" />
                                    <span>Блог команды</span>
                                </li>
                                <li className="flex items-start">
                                    <FontAwesomeIcon icon={faProjectDiagram} className="text-teal-500 mt-1 mr-2" />
                                    <span>Список проектов</span>
                                </li>
                            </ul>
                        </motion.div>
                    </motion.div>

                    {/* Media Types Section */}
                    <motion.div 
                        initial="hidden" 
                        whileInView="visible" 
                        viewport={{ once: true }} 
                        variants={staggerContainer} 
                        className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                        <motion.div 
                            variants={fadeIn} 
                            className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <div className="p-4 bg-emerald-100 dark:bg-emerald-900 rounded-full mb-4">
                                <FontAwesomeIcon icon={faCode} className="text-emerald-600 dark:text-emerald-400 text-2xl" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Репозитории</span>
                        </motion.div>
                        <motion.div 
                            variants={fadeIn} 
                            className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <div className="p-4 bg-teal-100 dark:bg-teal-900 rounded-full mb-4">
                                <FontAwesomeIcon icon={faFileAlt} className="text-teal-600 dark:text-teal-400 text-2xl" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Макеты</span>
                        </motion.div>
                        <motion.div 
                            variants={fadeIn} 
                            className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full mb-4">
                                <FontAwesomeIcon icon={faImage} className="text-green-600 dark:text-green-400 text-2xl" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Изображения</span>
                        </motion.div>
                        <motion.div 
                            variants={fadeIn} 
                            className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <div className="p-4 bg-lime-100 dark:bg-lime-900 rounded-full mb-4">
                                <FontAwesomeIcon icon={faVideo} className="text-lime-600 dark:text-lime-400 text-2xl" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Видео</span>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 px-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-900">
                <div className="max-w-6xl mx-auto">
                    <motion.h2 
                        initial="hidden" 
                        whileInView="visible" 
                        viewport={{ once: true }} 
                        variants={fadeIn} 
                        className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12"
                    >
                        Преимущества платформы
                    </motion.h2>
                    <motion.div 
                        initial="hidden" 
                        whileInView="visible" 
                        viewport={{ once: true }} 
                        variants={staggerContainer} 
                        className="grid md:grid-cols-3 gap-8"
                    >
                        <motion.div 
                            variants={fadeIn} 
                            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <div className="p-4 bg-emerald-100 dark:bg-emerald-900 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                                <FontAwesomeIcon icon={faRocket} className="text-emerald-600 dark:text-emerald-400 text-2xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Быстрый старт</h3>
                            <p className="text-gray-600 dark:text-gray-300">Начните работу с проектом в считанные минуты</p>
                        </motion.div>
                        <motion.div 
                            variants={fadeIn} 
                            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <div className="p-4 bg-teal-100 dark:bg-teal-900 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                                <FontAwesomeIcon icon={faLightbulb} className="text-teal-600 dark:text-teal-400 text-2xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Инновации</h3>
                            <p className="text-gray-600 dark:text-gray-300">Используйте современные инструменты для работы</p>
                        </motion.div>
                        <motion.div 
                            variants={fadeIn} 
                            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                                <FontAwesomeIcon icon={faHandshake} className="text-green-600 dark:text-green-400 text-2xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Сотрудничество</h3>
                            <p className="text-gray-600 dark:text-gray-300">Эффективное взаимодействие в команде</p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <motion.div 
                    initial="hidden" 
                    whileInView="visible" 
                    viewport={{ once: true }} 
                    variants={fadeIn} 
                    className="max-w-4xl mx-auto text-center"
                >
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Готовы начать?</h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                        Присоединяйтесь к сообществу профессионалов и найдите свой идеальный проект или команду
                    </p>
                    <NavLink 
                        to="/register" 
                        className="inline-block bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl"
                    >
                        Зарегистрироваться
                    </NavLink>
                </motion.div>
            </section>
        </div>
    );
};

export default LandingPage;
