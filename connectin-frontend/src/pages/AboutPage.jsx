import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin, faTelegram } from "@fortawesome/free-brands-svg-icons";
import technologies from "../data/technologies.js";
import members from "../data/team.js";

const technologyCategories = technologies.reduce((acc, tech) => {
    const category = tech.category || "Other";
    if (!acc[category]) {
        acc[category] = [];
    }
    acc[category].push(tech);
    return acc;
}, {});

const AboutPage = () => {
    return (
        <div className="col-span-6 flex flex-col my-3 bg-white p-4 md:p-6 rounded-lg shadow-xl border border-gray-200">
            {/* Hero Section */}
            <div className="text-center mb-8 border-b pb-4 border-gray-200">
                <h1 className="text-2xl md:text-3xl font-bold text-green-700 mb-2">ConnectIn</h1>
                <p className="text-base text-gray-600">Beyond Code: Building Teams, Projects, and Careers.</p>
            </div>

            {/* What is ConnectIn & The Problem We Solve */}
            <div className="mb-10">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 text-center">What Problem Are We Solving?</h2>
                <p className="text-gray-700 leading-relaxed text-base mb-4">
                    Many talented developers, freelancers, and job seekers struggle to find the right projects, connect with compatible team members, and discover meaningful opportunities. Existing platforms often focus solely on code repositories. We saw a gap – a need for a true collaboration hub.
                </p>
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 text-center">Introducing ConnectIn</h2>
                <p className="text-gray-700 leading-relaxed text-base">ConnectIn is your dynamic platform designed to bridge that gap. We go beyond code hosting to foster a vibrant ecosystem where professionals can:</p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed text-base mt-2 space-y-1 pl-4">
                    <li>
                        <span className="font-semibold">Discover Projects:</span> Find initiatives that match your skills and passions.
                    </li>
                    <li>
                        <span className="font-semibold">Build & Join Teams:</span> Connect with like-minded individuals and form effective collaborations.
                    </li>
                    <li>
                        <span className="font-semibold">Explore Opportunities:</span> Find jobs and freelance work relevant to your expertise.
                    </li>
                    <li>
                        <span className="font-semibold">Engage Actively:</span> Be more than a follower; become an integral part of a project&apos;s journey.
                    </li>
                </ul>
            </div>

            {/* Why Choose ConnectIn? */}
            <div className="mb-10 bg-green-50 p-6 rounded-lg shadow-md">
                <h2 className="text-lg md:text-xl font-semibold text-green-800 mb-4 text-center">What Makes ConnectIn Unique?</h2>
                <p className="text-gray-700 leading-relaxed text-base text-center mb-2">
                    Unlike platforms primarily focused on code storage like GitHub, ConnectIn emphasizes <span className="font-bold">active participation and community building</span>. We provide the tools and environment for real collaboration to flourish.
                </p>
                <p className="text-gray-700 leading-relaxed text-base text-center">It is a space designed for interaction, networking, and growing together within project teams.</p>
            </div>

            {/* Technologies Section */}
            <div className="mb-10">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-6 text-center">Built with Cutting-Edge Technology</h2>
                <p className="text-gray-700 leading-relaxed text-base text-center mb-2">
                    We leverage a modern, robust tech stack to deliver a high-performance, scalable, and reliable platform. Our commitment to <span className="font-bold">Clean Code</span> and <span className="font-bold">Clean Architecture</span> principles ensures maintainability and future growth.
                </p>
                <p className="text-gray-700 leading-relaxed text-base text-center mb-6">
                    Why <span className="font-semibold">Python & FastAPI</span>? Speed, efficiency, scalability, and a fantastic developer experience, allowing us to build powerful APIs quickly.
                </p>

                {/* Technology Categories */}
                {Object.keys(technologyCategories).map((category) => (
                    <div key={category} className="mb-6">
                        <h3 className="text-base font-semibold mb-3 text-green-700 border-l-4 border-green-700 pl-2">{category}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {technologyCategories[category].map((tech, index) => (
                                <div key={index} className="flex flex-col items-center p-3 bg-gray-50 rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
                                    <img src={tech.logo || "https://via.placeholder.com/64"} alt={`${tech.name} logo`} className="h-10 md:h-12 mb-2 object-contain" />
                                    <p className="text-center text-gray-800 font-semibold text-sm">{tech.name}</p>
                                    {tech.description && <p className="text-center text-gray-500 text-xs mt-1">{tech.description}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Team Section */}
            <div className="mb-8">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-6 text-center">Meet the Innovators</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {members.map((member, index) => (
                        <div key={index} className="flex flex-col items-center p-4 bg-white rounded-xl shadow-lg border border-gray-100 text-center transform transition-transform duration-300 hover:scale-105">
                            <img src={member.photo} alt={member.name} className="w-20 h-20 rounded-full mb-3 shadow-md border-2 border-green-200" />
                            <h3 className="text-sm font-bold text-gray-900">{member.name}</h3>
                            <p className="text-green-700 font-medium mb-2 text-sm">{member.role}</p>
                            <div className="flex space-x-4 mt-2">
                                <a href={member.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} LinkedIn Profile`} className="text-blue-600 hover:text-blue-800 transition-colors">
                                    <FontAwesomeIcon icon={faLinkedin} size="1x" />
                                </a>
                                <a href={member.telegram} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} Telegram Profile`} className="text-sky-500 hover:text-sky-700 transition-colors">
                                    <FontAwesomeIcon icon={faTelegram} size="1x" />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
