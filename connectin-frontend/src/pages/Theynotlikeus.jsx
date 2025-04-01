import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin, faTelegram } from "@fortawesome/free-brands-svg-icons";
import technologies from "../data/technologies.js"; // Ensure this includes Backend, DB, etc.
import members from "../data/team";
import Typist from "react-typist"; // npm install react-typist
import { FaLightbulb, FaHandshake, FaRocket } from "react-icons/fa";
import { useEffect, useState } from "react";

const technologyCategories = technologies.reduce((acc, tech) => {
  const category = tech.category || "Other";
  if (!acc[category]) acc[category] = [];
  acc[category].push(tech);
  return acc;
}, {});

const AboutUsV3 = () => {
  const [typingKey, setTypingKey] = useState(0);
  const [daysSinceStart, setDaysSinceStart] = useState(0);

  // Reset Typist animation on mount
  useEffect(() => {
    setTypingKey((prev) => prev + 1);

    // Calculate days since Dec 1, 2024
    const startDate = new Date("2024-12-01");
    const today = new Date();
    const diffTime = Math.abs(today - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysSinceStart(diffDays);
  }, []);

  return (
    <div className="col-span-6 flex flex-col my-5 bg-white p-6 md:p-10 rounded-lg shadow-xl border border-gray-200 overflow-hidden font-sans">
      <style>{`
        .flip-card {
          perspective: 1000px;
          height: 12rem;
        }
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          text-align: center;
          transition: transform 0.6s ease-in-out;
          transform-style: preserve-3d;
        }
        .flip-card:hover .flip-card-inner {
          transform: rotateY(180deg);
        }
        .flip-card-front, .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .flip-card-front {
          background-color: #F9FAFB;
          color: #000;
        }
        .flip-card-back {
          background-color: #DCFCE7;
          color: #374151;
          transform: rotateY(180deg);
        }
        .progress-circle {
          position: relative;
          width: 100px;
          height: 100px;
        }
        .progress-circle svg {
          transform: rotate(-90deg);
        }
        .progress-circle .bg {
          fill: none;
          stroke: #e5e7eb;
          stroke-width: 10;
        }
        .progress-circle .progress {
          fill: none;
          stroke: #10b981;
          stroke-width: 10;
          stroke-linecap: round;
          transition: stroke-dashoffset 1s ease-in-out;
        }
        .progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.25rem;
          font-weight: bold;
          color: #10b981;
        }
        .fade-in {
          animation: fadeIn 1s ease-in;
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Hero Section */}
      <div className="text-center mb-12 bg-gradient-to-r from-green-600 via-teal-500 to-blue-600 text-white py-16 rounded-t-lg fade-in">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 px-4 tracking-tight">ConnectIn</h1>
        <Typist
          key={typingKey}
          className="text-xl md:text-2xl px-4"
          cursor={{ show: true, blink: true, element: "|", hideWhenDone: true }}
        >
          <span>Beyond Code: Building Futures.</span>
          <Typist.Backspace count={8} delay={1000} />
          <span>Teams, Projects, Careers.</span>
        </Typist>
      </div>

      {/* Work in Progress Section */}
      <div className="mb-16 px-4 bg-gray-50 py-8 rounded-lg shadow-inner fade-in">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6 text-center">In Progress Since Dec 2024</h2>
        <div className="flex justify-center">
          <div className="progress-circle">
            <svg width="100" height="100">
              <circle className="bg" cx="50" cy="50" r="45" />
              <circle
                className="progress"
                cx="50"
                cy="50"
                r="45"
                strokeDasharray="282.6"
                strokeDashoffset={282.6 - (daysSinceStart / 365) * 282.6}
              />
            </svg>
            <div className="progress-text">{daysSinceStart} Days</div>
          </div>
        </div>
        <p className="text-gray-700 text-lg text-center mt-4 max-w-xl mx-auto">
          We’ve been crafting ConnectIn since December 2024, evolving it into a game-changer!
        </p>
      </div>

      {/* Problem and Solution Section */}
      <div className="mb-16 px-4 fade-in">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-10 text-center">What We Solve</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="flex flex-col items-center text-center">
            <FaLightbulb className="text-5xl text-yellow-400 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Finding Projects</h3>
            <p className="text-gray-600 text-sm">Match your skills with inspiring projects.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <FaHandshake className="text-5xl text-blue-500 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Connecting Teams</h3>
            <p className="text-gray-600 text-sm">Collaborate with the right professionals.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <FaRocket className="text-5xl text-red-500 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Opportunities</h3>
            <p className="text-gray-600 text-sm">Discover jobs and gigs effortlessly.</p>
          </div>
        </div>
        <p className="text-gray-700 text-lg text-center max-w-3xl mx-auto">
          ConnectIn bridges the gap left by code-centric platforms, creating a <span className="font-semibold text-green-700">collaboration hub</span>.
        </p>
      </div>

      {/* Technologies Section */}
      <div className="mb-16 px-4 fade-in">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-8 text-center">Our Tech Stack</h2>
        {Object.keys(technologyCategories).map((category) => (
          <div key={category} className="mb-10">
            <h3 className="text-xl font-semibold mb-5 text-green-700 border-l-4 border-green-700 pl-3">{category}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {technologyCategories[category].map((tech) => (
                <div key={tech.name} className="flip-card">
                  <div className="flip-card-inner">
                    <div className="flip-card-front">
                      <img src={tech.logo || "https://via.placeholder.com/64"} alt={`${tech.name} logo`} className="h-12 mb-3" />
                      <p className="font-semibold">{tech.name}</p>
                    </div>
                    <div className="flip-card-back">
                      <p className="text-sm">{tech.description || "Key platform tech."}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Team Section */}
      <div className="mb-16 px-4 fade-in">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-10 text-center">Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {members.map((member) => (
            <div
              key={member.name || member.linkedin}
              className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <img
                src={member.photo}
                alt={member.name}
                className="w-24 h-24 rounded-full mb-4 border-2 border-green-200"
              />
              <h3 className="text-lg font-bold">{member.name}</h3>
              <p className="text-green-700 mb-4">{member.role}</p>
              <div className="flex space-x-4">
                <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                  <FontAwesomeIcon icon={faLinkedin} size="lg" />
                </a>
                <a href={member.telegram} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:text-sky-700">
                  <FontAwesomeIcon icon={faTelegram} size="lg" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center mb-8 px-4 fade-in">
        <a
          href="/signup"
          className="inline-block bg-green-700 text-white font-bold py-3 px-10 rounded-full shadow-lg hover:bg-green-800 hover:scale-105 transition-all duration-300"
        >
          Join ConnectIn Now
        </a>
      </div>
    </div>
  );
};

export default AboutUsV3;