import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin, faTelegram } from "@fortawesome/free-brands-svg-icons";
import { faLightbulb, faHandshake, faRocket } from "@fortawesome/free-solid-svg-icons";
import { ReactTyped } from "react-typed";
import technologies from "../data/technologies.js";
import team from "../data/team";
import "../styles/TechCard.css";

const AboutUsV3 = () => {
    const [daysSinceStart, setDaysSinceStart] = useState(0);

    useEffect(() => {
        const startDate = new Date("2024-12-01");
        const diffDays = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24));
        setDaysSinceStart(diffDays);
    }, []);

    const progress = Math.min(daysSinceStart / 365, 1);
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference * (1 - progress);

    // Group technologies by category
    const techByCategory = technologies.reduce((acc, tech) => {
        const category = tech.category || "Other";
        if (!acc[category]) acc[category] = [];
        acc[category].push(tech);
        return acc;
    }, {});

    const features = [
        { icon: faLightbulb, color: "text-yellow-400", title: "Project Discovery", text: "Find projects matching your skills." },
        { icon: faHandshake, color: "text-blue-500", title: "Team Connection", text: "Collaborate with the right professionals." },
        { icon: faRocket, color: "text-red-500", title: "Opportunities", text: "Easily find work and projects." },
    ];

    return (
        <div className="col-span-6 my-5 flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:bg-gray-800 dark:border-gray-700 md:p-10">
            {/* Hero Section */}
            <div className="mb-12 rounded-t-lg bg-gradient-to-r from-green-600 via-teal-500 to-blue-600 py-16 text-center text-white">
                <h1 className="mb-4 px-4 text-4xl font-extrabold md:text-6xl">ConnectIn</h1>
                <div className="px-4 text-xl md:text-2xl">
                    <ReactTyped strings={["Beyond Code: Building Futures.", "Beyond Code: Building Teams, Projects, Careers."]} typeSpeed={50} backSpeed={40} loop />
                </div>
            </div>

            {/* Timeline Section */}
            <div className="mb-16 rounded-lg bg-gray-50 px-4 py-8 dark:bg-gray-700">
                <h2 className="mb-6 text-center text-2xl font-semibold dark:text-white md:text-3xl">In development since December 2024</h2>
                <div className="flex justify-center">
                    <div className="relative h-24 w-24">
                        <svg viewBox="0 0 100 100" className="rotate-[-90deg]">
                            <circle cx="50" cy="50" r="45" fill="none" className="stroke-gray-200 dark:stroke-gray-600" strokeWidth="10" />
                            <circle cx="50" cy="50" r="45" fill="none" className="stroke-green-500 transition-all duration-1000" strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-md font-semibold text-green-700 dark:text-green-400">{daysSinceStart} days</div>
                    </div>
                </div>
                <p className="mx-auto mt-4 max-w-xl text-center text-gray-700 dark:text-gray-300">We&apos;ve been building ConnectIn since December 2024!</p>
            </div>

            {/* Features Section */}
            <div className="mb-16 px-4">
                <h2 className="mb-10 text-center text-2xl font-semibold dark:text-white md:text-3xl">What We Solve</h2>
                <div className="mb-10 grid gap-8 md:grid-cols-3">
                    {features.map((feature) => (
                        <div key={feature.title} className="flex flex-col items-center text-center">
                            <FontAwesomeIcon icon={feature.icon} className={`mb-4 text-5xl ${feature.color}`} />
                            <h3 className="mb-2 text-lg font-semibold dark:text-white">{feature.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400">{feature.text}</p>
                        </div>
                    ))}
                </div>
                <p className="mx-auto max-w-3xl text-center text-gray-700 dark:text-gray-300">
                    ConnectIn bridges the gap, creating a <span className="font-semibold text-green-700 dark:text-green-400">collaboration hub</span>.
                </p>
            </div>

            {/* Technologies Section */}
            <div className="mb-16 px-4">
                <h2 className="mb-8 text-center text-2xl font-semibold dark:text-white md:text-3xl">Our Tech Stack</h2>
                {Object.entries(techByCategory).map(([category, techs]) => (
                    <div key={category} className="mb-10">
                        <h3 className="mb-5 border-l-4 border-green-700 pl-3 text-xl font-semibold text-green-700 dark:text-green-400">{category}</h3>
                        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
                            {techs.map((tech) => (
                                <div key={tech.name} className="perspective h-48">
                                    <div className="flip-card">
                                        {/* Front Face */}
                                        <div className="front flex flex-col items-center justify-center rounded-lg bg-gray-50 p-4 shadow-md dark:bg-gray-700">
                                            <img src={tech.logo} alt={`${tech.name} logo`} className="mb-3 h-12 object-contain" onError={(e) => (e.target.src = "")} />
                                            <p className="font-semibold dark:text-white">{tech.name}</p>
                                        </div>
                                        {/* Back Face */}
                                        <div className="back flex flex-col items-center justify-center rounded-lg bg-green-50 p-4 shadow-md dark:bg-gray-600">
                                            <p className="text-sm text-center dark:text-gray-300">{tech.description || "Key platform technology."}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Team Section */}
            <div className="mb-16 px-4">
                <h2 className="mb-10 text-center text-2xl font-semibold dark:text-white md:text-3xl">Our Team</h2>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {team.map((member, index) => (
                        <div key={`${member.name}-${index}`} className="flex flex-col items-center rounded-xl bg-gray-50 p-6 shadow-lg transition-all hover:scale-105 dark:bg-gray-700">
                            <img src={member.photo || "https://via.placeholder.com/96?text=Photo"} alt={member.name || "Team member"} className="mb-4 h-24 w-24 rounded-full border-2 border-green-200 object-cover dark:border-gray-600" />
                            <h3 className="text-lg font-bold dark:text-white">{member.name || "Team member"}</h3>
                            <p className="mb-4 text-green-700 dark:text-green-400">{member.role || "Role"}</p>
                            <div className="flex space-x-4">
                                {member.linkedin && (
                                    <a href={member.linkedin} className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                                        <FontAwesomeIcon icon={faLinkedin} size="lg" />
                                    </a>
                                )}
                                {member.telegram && (
                                    <a href={member.telegram} className="text-sky-500 hover:text-sky-700 dark:text-sky-400">
                                        <FontAwesomeIcon icon={faTelegram} size="lg" />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AboutUsV3;
