import React from 'react';
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactTyped } from "react-typed";
import {
    faUsers, faProjectDiagram, faStar, faUserTie, faCode, faRocket,
    faSearch, faNetworkWired, faBriefcase, faArrowRight, faComments,
    faCalendarAlt, faBlog, faLink, faImage, faVideo, faFileAlt
} from "@fortawesome/free-solid-svg-icons";

// Анимации
const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};
const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
};
const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};
const fadeInLeft = {
    hidden: { opacity: 0, x: -60 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
};
const fadeInRight = {
    hidden: { opacity: 0, x: 60 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
};

// --- КОМПОНЕНТ СТРАНИЦЫ ---
const LandingPageV3 = () => {

    // --- Данные для секций (ЗАМЕНИТЕ НА СВОИ!) ---
    const keyBenefits = [
        { icon: faSearch, color: "emerald", title: "Smart Project Discovery", desc: "Find projects matching your skills, interests, and career goals using our intelligent matching.", link: "/projects", image: "/images/placeholder-benefit-1.png" },
        { icon: faNetworkWired, color: "teal", title: "Build Your Dream Team", desc: "Connect with talented developers, designers, and PMs. Form effective teams for collaboration.", link: "/teams", image: "/images/placeholder-benefit-2.png" },
        { icon: faBriefcase, color: "green", title: "Unlock Opportunities", desc: "Explore job postings, freelance gigs within projects, and grow your professional network.", link: "/jobs", image: "/images/placeholder-benefit-3.png" },
    ];
    const testimonials = [
        { quote: "ConnectIn helped me find a project that perfectly matched my skill set!", name: "Alex Chen", title: "Full Stack Developer", avatar: "/images/placeholder-avatar-1.jpg" },
        { quote: "I built my entire dev team through ConnectIn. The matching algorithm is far superior.", name: "Sarah Johnson", title: "Tech Lead at StartupX", avatar: "/images/placeholder-avatar-2.jpg" },
        { quote: "As a self-taught developer, ConnectIn gave me the opportunity to contribute to real projects.", name: "Michael Rodriguez", title: "Frontend Developer", avatar: "/images/placeholder-avatar-3.jpg" },
        { quote: "ConnectIn bridges the gap between project ideas and implementation. Found collaborators in days.", name: "Emily Wong", title: "Open Source Maintainer", avatar: "/images/placeholder-avatar-4.jpg" },
    ];
    const faqItems = [
        { q: "How is ConnectIn different?", a: "We focus on connecting people and fostering collaboration for projects and careers, not just hosting code." },
        { q: "Is it for beginners?", a: "Yes! ConnectIn welcomes all levels. Find projects suitable for learning and growth." },
        { q: "How does project matching work?", a: "Our algorithm considers your skills, project requirements, and team dynamics." },
        { q: "Can I recruit a team?", a: "Absolutely! List your project, specify needed skills, and connect with potential collaborators." },
    ];
    // --- Конец данных для секций ---

    // Вспомогательный компонент для ошибки загрузки изображения
    const handleImageError = (e, itemColor, icon) => {
        e.target.onerror = null; // предотвратить бесконечный цикл
        const parent = e.target.parentNode;
        if (parent) {
            parent.classList.add(`bg-${itemColor}-100`, `dark:bg-${itemColor}-900/30`, 'flex', 'items-center', 'justify-center');
            parent.innerHTML = `<div class="text-${itemColor}-500 dark:text-${itemColor}-400 text-6xl"><i class="fas ${icon ? icon.iconName : 'fa-image'}"></i></div>`; // Используем FontAwesome
        }
        e.target.remove(); // Удаляем тег img с ошибкой
    };

    return (
        // Добавляем отступ сверху под основной NavBar (подберите значение под высоту вашего NavBar)
        <div className="min-h-screen bg-white dark:bg-black text-gray-800 dark:text-gray-200 overflow-x-hidden pt-16 md:pt-20">

            {/* --- УДАЛЕНА СЕКЦИЯ <header> --- */}

            {/* === Hero Section === */}
            <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 px-4 text-center overflow-hidden">
                {/* Фоновые элементы */}
                <div className="absolute inset-0 opacity-40 dark:opacity-60 z-0">
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-white dark:from-black to-transparent"></div>
                     <motion.div animate={{ y: [0, -15, 0], rotate: [0, 5, 0], scale: [1, 1.03, 1], }} transition={{ duration: 22, repeat: Infinity, ease: "linear", }} className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-emerald-400/10 dark:bg-emerald-700/10 blur-3xl" />
                     <motion.div animate={{ y: [0, 25, 0], rotate: [0, -7, 0], scale: [1, 1.08, 1], }} transition={{ duration: 28, repeat: Infinity, ease: "linear", delay: 3 }} className="absolute bottom-1/3 left-1/3 w-96 h-96 rounded-full bg-teal-300/10 dark:bg-teal-600/10 blur-3xl" />
                </div>

                <div className="max-w-5xl mx-auto relative z-10">
                    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto">
                        <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
                             <span className="block bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 dark:from-emerald-400 dark:via-teal-400 dark:to-green-400">Connect.</span>
                             <span className="block mt-1 md:mt-2">Collaborate. Create.</span>
                        </motion.h1>
                        <motion.p variants={fadeIn} className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
                            The dynamic ecosystem where developers find meaningful projects, build exceptional teams, and unlock career opportunities beyond just code.
                        </motion.p>
                        <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center">
                            <NavLink to="/register" className="inline-block bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3 rounded-full text-lg font-medium hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-emerald-500/30 transform hover:scale-105">
                                Get Started Free
                            </NavLink>
                            <NavLink to="/about" className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-400 px-8 py-3 text-lg font-medium hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors">
                                Learn More <FontAwesomeIcon icon={faArrowRight} className="ml-1 text-sm" />
                            </NavLink>
                        </motion.div>
                    </motion.div>

                    {/* Визуализация приложения */}
                    <motion.div
                        initial="hidden" animate="visible"
                        variants={{ hidden: { opacity: 0, y: 100 }, visible: { opacity: 1, y: 0, transition: { delay: 0.5, duration: 1.2, ease: [0.22, 1, 0.36, 1] }, }, }}
                        className="mt-20 max-w-5xl mx-auto"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 translate-y-4 blur-xl rounded-2xl scale-95 mx-auto transform z-0"></div>
                            <div className="relative bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 z-10">
                                {/* Fake window bar */}
                                <div className="h-9 bg-gray-100 dark:bg-gray-800 flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex space-x-1.5"> <div className="w-3 h-3 bg-red-400 rounded-full"></div><div className="w-3 h-3 bg-yellow-400 rounded-full"></div><div className="w-3 h-3 bg-green-400 rounded-full"></div> </div>
                                </div>
                                {/* Placeholder for App screenshot */}
                                <div className="relative aspect-[16/9] bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-1">
                                     {/* ===> ЗАМЕНИТЕ НА РЕАЛЬНЫЙ СКРИНШОТ <=== */}
                                    <img src="/images/app-preview-placeholder.png" alt="ConnectIn Platform Preview" className="w-full h-full object-cover rounded-md shadow-inner" onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span class=\"text-gray-400 text-sm\">[App Preview Screenshot]</span>'; }} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
                 {/* Плавный градиент в конце */}
                 <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-black to-transparent z-20"></div>
            </section>

            {/* === Trusted By Section === */}
             <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                     <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="text-center mb-10">
                         <h2 className="text-sm font-semibold tracking-wider text-gray-500 dark:text-gray-400 uppercase">AS SEEN AT</h2>
                     </motion.div>
                     <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 items-center justify-items-center opacity-60 grayscale">
                         {/* ===> ЗАМЕНИТЕ НА РЕАЛЬНЫЕ ЛОГО (университета, технопарка, партнеров?) ИЛИ УБЕРИТЕ <=== */}
                          {["SDU", "Technopark", "Partner A", "Incubator B", "Event C"].map((name) => (
                             <motion.div key={name} variants={fadeIn} className="h-8">
                                 <div className="text-gray-400 font-semibold text-lg">{name}</div>
                             </motion.div>
                         ))}
                     </motion.div>
                 </div>
             </section>

            {/* === Key Benefits Section === */}
            <section className="py-24 px-4 bg-white dark:bg-black">
                <div className="max-w-7xl mx-auto">
                     <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-20">
                         <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">Everything You Need</h2>
                         <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">Features designed for effective connection and collaboration.</p>
                     </motion.div>
                     <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid md:grid-cols-3 gap-8 md:gap-10">
                         {keyBenefits.map((item, index) => (
                            <motion.div key={index} variants={fadeInUp} className="group">
                                 <div className={`bg-white dark:bg-gray-800/50 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 group-hover:shadow-xl h-full transform group-hover:-translate-y-1 border border-gray-100 dark:border-gray-800 flex flex-col`}>
                                    <div className={`h-48 bg-${item.color}-50 dark:bg-${item.color}-900/20 relative overflow-hidden flex items-center justify-center p-4`}>
                                        {/* ===> ЗАМЕНИТЕ НА РЕАЛЬНЫЕ ИЗОБРАЖЕНИЯ/МОКАПЫ ФИЧ <=== */}
                                        <img src={item.image} alt={item.title} className="max-h-full max-w-full object-contain transition-all duration-500 group-hover:scale-105" onError={(e) => handleImageError(e, item.color, item.icon)}/>
                                    </div>
                                    <div className="p-6 md:p-8 flex-grow flex flex-col">
                                        <div className={`inline-block p-3 bg-${item.color}-100 dark:bg-${item.color}-900 rounded-lg mb-4 w-12 h-12`}>
                                            <FontAwesomeIcon icon={item.icon} className={`text-${item.color}-600 dark:text-${item.color}-400 text-xl`} />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-5 flex-grow">{item.desc}</p>
                                        <NavLink to={item.link || "#"} className={`mt-auto inline-flex items-center text-sm font-medium text-${item.color}-600 dark:text-${item.color}-400 hover:underline group-hover:text-${item.color}-700 dark:group-hover:text-${item.color}-300`}>
                                            Learn more <FontAwesomeIcon icon={faArrowRight} className="ml-2 text-xs" />
                                        </NavLink>
                                    </div>
                                 </div>
                             </motion.div>
                         ))}
                     </motion.div>
                </div>
            </section>

             {/* === Testimonials Section === */}
             <section className="py-24 bg-gray-50 dark:bg-gray-900/50 overflow-hidden">
                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                     <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-16">
                         <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">From the Community</h2>
                         <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">See how ConnectIn helps developers thrive.</p>
                     </motion.div>
                     <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="flex overflow-x-auto space-x-6 pb-8 -mx-4 px-4 scrollbar-hide">
                         {testimonials.map((testimonial, index) => (
                            <motion.div key={index} variants={fadeIn} className="flex-shrink-0 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                                 <div className="flex flex-col h-full">
                                    {/* ... код отзыва из предыдущего ответа ... */}
                                    <div className="mb-6 flex-grow">...</div>
                                    <div className="flex items-center">...</div>
                                 </div>
                             </motion.div>
                         ))}
                     </motion.div>
                 </div>
             </section>

            {/* === FAQ Section === */}
             <section className="py-24 bg-white dark:bg-black">
                 <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                     <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-16">
                         <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
                     </motion.div>
                     <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="space-y-6">
                         {faqItems.map((faq, index) => (
                             <motion.div key={index} variants={fadeIn} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
                                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{faq.q}</h3>
                                 <p className="text-gray-600 dark:text-gray-400 text-sm">{faq.a}</p>
                             </motion.div>
                         ))}
                     </motion.div>
                 </div>
             </section>


             {/* === Final CTA Section === */}
             <section className="py-28 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-green-700 to-teal-600 dark:from-emerald-900 dark:via-green-900 dark:to-teal-900"></div>
                     <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2], }} transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 1, }} className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
                     <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0.3, 0.15], }} transition={{ duration: 18, repeat: Infinity, ease: "linear", delay: 3, }} className="absolute -bottom-40 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                 </div>
                 <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                     <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Elevate Your Collaboration?</motion.h2>
                     <motion.p variants={fadeInUp} className="text-xl text-emerald-100 dark:text-emerald-200 mb-10 max-w-3xl mx-auto">Join ConnectIn and find your next project, team, or career move today.</motion.p>
                     <motion.div variants={fadeInUp}>
                         <NavLink to="/register" className="inline-block bg-white text-emerald-700 px-10 py-4 rounded-full text-lg font-bold hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105">
                             Sign Up - It&apos;s Free!
                         </NavLink>
                     </motion.div>
                 </motion.div>
             </section>

            {/* --- Footer не нужен, т.к. он рендерится в App.jsx --- */}

        </div>
    );
};

export default LandingPageV3;