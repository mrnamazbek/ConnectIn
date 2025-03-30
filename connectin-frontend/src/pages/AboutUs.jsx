import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin, faTelegram } from "@fortawesome/free-brands-svg-icons";
import technologies from "../data/technologies";
import members from "../data/team";

// Group technologies by category
const technologyCategories = technologies.reduce((acc, tech) => {
    if (!acc[tech.category]) {
        acc[tech.category] = [];
    }
    acc[tech.category].push(tech);
    return acc;
}, {});

const AboutUs = () => {
    return (
        <div className="col-span-6 flex flex-col my-5 shadow-md rounded-md border border-green-700 bg-white p-5">
            <h1 className="text-center font-bold text-green-700 text-xl mb-8">About Us</h1>

            {/* Introduction Section */}
            <div className="mb-12">
                <h2 className="text-xl font-semibold mb-4">What is ConnectIn?</h2>
                <p className="text-gray-700 leading-relaxed">
                    ConnectIn is your go-to platform for connecting professionals, fostering collaboration, and sharing knowledge. Whether you&apos;re working on innovative projects, staying updated with news, or joining teams, we’re here to help you thrive, powered by cutting-edge technology and
                    personalized recommendations.
                </p>
            </div>

            {/* Technologies Section */}
            <div className="mb-12">
                <h2 className="text-xl font-semibold mb-6">Technologies We Use</h2>
                {Object.keys(technologyCategories).map((category) => (
                    <div key={category} className="mb-8">
                        <h3 className="text-xl font-semibold mb-4">{category}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {technologyCategories[category].map((tech, index) => (
                                <div key={index} className="flex flex-col items-center p-1 bg-gray-50 rounded-md shadow-sm">
                                    <img src={tech.logo || "https://via.placeholder.com/56"} alt={tech.name} className="h-14 mb-1 rounded" />
                                    <p className="text-center text-gray-700 font-medium text-sm">{tech.name}</p>
                                    <p className="text-center text-gray-500 text-xs mt-1">{tech.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Team Section */}
            <div className="mb-12">
                <h2 className="text-2xl font-semibold mb-6">Meet the Team</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {members.map((member, index) => (
                        <div key={index} className="flex flex-col items-center p-4 bg-gray-50 rounded-lg shadow-md">
                            <img src={member.photo} alt={member.name} className="w-20 h-20 rounded-full mb-4" />
                            <h3 className="text-sm font-semibold">{member.name}</h3>
                            <p className="text-center text-gray-500 mb-2">{member.role}</p>
                            <div className="flex space-x-4">
                                <a href={member.linkedin} target="_blank" rel="noreferrer">
                                    <FontAwesomeIcon icon={faLinkedin} className="text-blue-500 hover:text-blue-700" />
                                </a>
                                <a href={member.telegram} target="_blank" rel="noreferrer">
                                    <FontAwesomeIcon icon={faTelegram} className="text-blue-500 hover:text-blue-700" />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AboutUs;
