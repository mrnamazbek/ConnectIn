import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin, faTelegram } from "@fortawesome/free-brands-svg-icons";
import technologies_v2 from "../data/technologies_v2.js";
import members from "../data/team";
import Typist from "react-typist";
import { FaLightbulb, FaHandshake, FaRocket } from "react-icons/fa";

// Group technologies by category
const technologyCategories = technologies_v2.reduce((acc, tech) => {
  const category = tech.category || "Other";
  if (!acc[category]) acc[category] = [];
  acc[category].push(tech);
  return acc;
}, {});

const AboutUsV3 = () => {
  return (
    <div className="col-span-6 flex flex-col my-5 bg-white p-6 md:p-10 rounded-lg shadow-xl border border-gray-200">
      {/* Inline CSS for flip card effect */}
      <style>{`
        .flip-card {
          perspective: 1000px;
        }
        .flip-card-inner {
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }
        .flip-card:hover .flip-card-inner {
          transform: rotateY(180deg);
        }
        .flip-card-front, .flip-card-back {
          backface-visibility: hidden;
          position: absolute;
          width: 100%;
          height: 100%;
        }
        .flip-card-back {
          transform: rotateY(180deg);
        }
      `}</style>
        {/* Hero Section */}
      <div className="text-center mb-12 border-b pb-8 border-gray-200 bg-gradient-to-r from-green-400 to-blue-500 text-white py-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">ConnectIn</h1>
        <Typist className="text-xl md:text-2xl">
          <span>Beyond Code: Building Teams, Projects, and Careers.</span>
        </Typist>
      </div>

      {/* Problem and Solution */}
      <div className="mb-16">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6 text-center">What Problem Are We Solving?</h2>
        <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8 mb-8">
          <div className="flex flex-col items-center">
            <FaLightbulb className="text-4xl text-yellow-500 mb-2" />
            <p className="text-gray-700">Finding the right projects</p>
          </div>
          <div className="flex flex-col items-center">
            <FaHandshake className="text-4xl text-blue-500 mb-2" />
            <p className="text-gray-700">Connecting with compatible teams</p>
          </div>
          <div className="flex flex-col items-center">
            <FaRocket className="text-4xl text-red-500 mb-2" />
            <p className="text-gray-700">Discovering meaningful opportunities</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed text-lg mb-6 text-center">
          Many talented developers, freelancers, and job seekers struggle to find the right projects, connect with compatible team members, and discover meaningful opportunities. Existing platforms often focus solely on code repositories. We saw a gap – a need for a true collaboration hub.
        </p>
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6 text-center">Introducing ConnectIn</h2>
        <p className="text-gray-700 leading-relaxed text-lg text-center">
          ConnectIn is your dynamic platform designed to bridge that gap. We go beyond code hosting to foster a vibrant ecosystem where professionals can:
        </p>
        <ul className="list-disc list-inside text-gray-700 leading-relaxed text-lg mt-4 space-y-2 pl-4 text-center">
          <li><span className="font-semibold">Discover Projects:</span> Find initiatives that match your skills and passions.</li>
          <li><span className="font-semibold">Build & Join Teams:</span> Connect with like-minded individuals and form effective collaborations.</li>
          <li><span className="font-semibold">Explore Opportunities:</span> Find jobs and freelance work relevant to your expertise.</li>
          <li><span className="font-semibold">Engage Actively:</span> Be more than a follower; become an integral part of a project's journey.</li>
        </ul>
      </div>

      {/* Why Choose ConnectIn */}
      <div className="mb-16 bg-green-50 p-8 rounded-lg shadow-md">
        <h2 className="text-2xl md:text-3xl font-semibold text-green-800 mb-6 text-center">What Makes ConnectIn Unique?</h2>
        <p className="text-gray-700 leading-relaxed text-lg text-center mb-4">
          Unlike platforms primarily focused on code storage like GitHub, ConnectIn emphasizes <span className="font-bold">active participation and community building</span>. We provide the tools and environment for real collaboration to flourish.
        </p>
        <p className="text-gray-700 leading-relaxed text-lg text-center">
          It's a space designed for interaction, networking, and growing together within project teams.
        </p>
      </div>

      {/* Technologies Section */}
      <div className="mb-16">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-8 text-center">Built with Cutting-Edge Technology</h2>
        <p className="text-gray-700 leading-relaxed text-lg text-center mb-4">
          We leverage a modern, robust tech stack to deliver a high-performance, scalable, and reliable platform. Our commitment to <span className="font-bold">Clean Code</span> and <span className="font-bold">Clean Architecture</span> principles ensures maintainability and future growth.
        </p>
        <p className="text-gray-700 leading-relaxed text-lg text-center mb-8">
          Why <span className="font-semibold">Python & FastAPI</span>? Speed, efficiency, scalability, and a fantastic developer experience, allowing us to build powerful APIs quickly.
        </p>
        {Object.keys(technologyCategories).map((category) => (
          <div key={category} className="mb-10">
            <h3 className="text-xl font-semibold mb-5 text-green-700 border-l-4 border-green-700 pl-3">{category}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {technologyCategories[category].map((tech, index) => (
                <div key={index} className="flip-card h-48">
                  <div className="flip-card-inner relative w-full h-full">
                    <div className="flip-card-front absolute w-full h-full flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg shadow">
                      <img src={tech.logo || "https://via.placeholder.com/64"} alt={`${tech.name} logo`} className="h-12 md:h-16 mb-3 object-contain" />
                      <p className="text-center text-gray-800 font-semibold text-base">{tech.name}</p>
                    </div>
                    <div className="flip-card-back absolute w-full h-full flex items-center justify-center p-4 bg-green-100 rounded-lg shadow">
                      <p className="text-center text-gray-700 text-sm">{tech.description || "No description available"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Team Section */}
      <div className="mb-12">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-8 text-center">Meet the Innovators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {members.map((member, index) => (
            <div key={index} className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg border border-gray-100 text-center transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
              <img src={member.photo} alt={member.name} className="w-24 h-24 rounded-full mb-4 shadow-md border-2 border-green-200 transition-transform duration-300 hover:scale-110" />
              <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
              <p className="text-green-700 font-medium mb-3">{member.role}</p>
              <div className="flex space-x-5 mt-2">
                <a href={member.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} LinkedIn Profile`} className="text-blue-600 hover:text-blue-800 transition-colors">
                  <FontAwesomeIcon icon={faLinkedin} size="lg" />
                </a>
                <a href={member.telegram} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} Telegram Profile`} className="text-sky-500 hover:text-sky-700 transition-colors">
                  <FontAwesomeIcon icon={faTelegram} size="lg" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center mt-12">
        <a href="/signup" className="inline-block bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-green-800 transition-colors">
          Join ConnectIn Today
        </a>
      </div>
    </div>
  );
};

export default AboutUsV3;