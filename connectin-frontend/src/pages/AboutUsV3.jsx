import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin, faTelegram } from "@fortawesome/free-brands-svg-icons";
import technologies_v2 from "../data/technologies_v2.js";
import members from "../data/team";
import Typist from "react-typist"; // Ensure 'react-typist' is installed (npm install react-typist)
import { FaLightbulb, FaHandshake, FaRocket } from "react-icons/fa"; // Correct import from react-icons
import { useEffect, useState } from "react"; // Import useState and useEffect for Typist reset

// Group technologies by category (Logic is sound)
const technologyCategories = technologies_v2.reduce((acc, tech) => {
  const category = tech.category || "Other";
  if (!acc[category]) {
    acc[category] = [];
  }
  acc[category].push(tech);
  return acc;
}, {});

const AboutUsV3 = () => {
  // State to reset Typist animation, useful if component re-renders
  const [typingKey, setTypingKey] = useState(0);

  useEffect(() => {
    // Example: Reset animation if some condition changes, or just on mount
    // This is a simple way, more complex logic might be needed depending on use case
    setTypingKey(prevKey => prevKey + 1);
  }, []); // Runs once on mount

  return (
    <div className="col-span-6 flex flex-col my-5 bg-white p-6 md:p-10 rounded-lg shadow-xl border border-gray-200 overflow-hidden">
      {/* === Suggestion: Move Inline CSS === */}
      {/* While functional, embedding <style> tags directly isn't ideal for maintainability and scoping in React. */}
      {/* Consider moving these styles to your global CSS file (e.g., index.css) or using CSS Modules / Styled Components. */}
      {/* If keeping inline for simplicity in this specific case, ensure it's well-commented. */}
      <style>{`
        /* Flip Card Effect Styles */
        .flip-card {
          perspective: 1000px; /* Creates the 3D space */
          background-color: transparent; /* Ensure container itself is transparent */
          height: 12rem; /* h-48 equivalent: Fixed height - see note below */
        }
        .flip-card-inner {
          position: relative; /* Changed from absolute to relative */
          width: 100%;
          height: 100%;
          text-align: center;
          transition: transform 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55); /* Added easing */
          transform-style: preserve-3d;
        }
        /* Trigger flip on hover */
        .flip-card:hover .flip-card-inner {
          transform: rotateY(180deg);
        }
        /* Front and Back Card Styling */
        .flip-card-front, .flip-card-back {
          position: absolute; /* Position front and back layers */
          width: 100%;
          height: 100%;
          backface-visibility: hidden; /* Hide the back side when facing away */
          /* Added flex centering for content within front/back */
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1rem; /* p-4 */
          border-radius: 0.5rem; /* rounded-lg */
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); /* shadow */
        }
        .flip-card-front {
          background-color: #F9FAFB; /* bg-gray-50 */
          color: black;
        }
        .flip-card-back {
          background-color: #DCFCE7; /* bg-green-100 */
          color: #374151; /* text-gray-700 approx */
          transform: rotateY(180deg); /* Position the back card correctly */
        }
        /* Accessibility Consideration: Ensure interactive elements inside are reachable, */
        /* and content visibility is handled correctly for screen readers if needed. */
        /* Consider adding focus styles for keyboard navigation if cards become interactive. */

        /* Typist cursor styling (Optional - customize as needed) */
        .Typist .Cursor {
            display: inline-block;
        }
        .Typist .Cursor--blinking {
            opacity: 1;
            animation: blink 1s linear infinite;
        }
        @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0; }
            100% { opacity: 1; }
        }
      `}</style>

      {/* Hero Section */}
      {/* Gradient looks good. Consider adding padding (`px-`) if needed on smaller screens */}
      <div className="text-center mb-12 border-b pb-8 border-gray-200 bg-gradient-to-r from-green-500 to-blue-600 text-white py-16 rounded-t-lg">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 px-4">ConnectIn</h1>
        {/* Added key prop to reset Typist animation if component re-renders */}
        {/* Check Typist docs for cursor options if default isn't desired */}
        <Typist key={typingKey} className="text-xl md:text-2xl px-4" cursor={{ show: true, blink: true, element: '|', hideWhenDone: true, hideWhenDoneDelay: 1000 }}>
          <span>Beyond Code: Building Teams, Projects, and Careers.</span>
          {/* You can add more Typist.Backspace and text elements here for cooler effects */}
        </Typist>
      </div>

      {/* Problem and Solution Section */}
      <div className="mb-16 px-4"> {/* Added horizontal padding */}
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-10 text-center tracking-tight">What Problem Are We Solving?</h2>
        {/* Using icons here is a nice visual touch */}
        <div className="flex flex-col md:flex-row justify-center items-center md:items-start space-y-6 md:space-y-0 md:space-x-12 mb-10 text-center">
          <div className="flex flex-col items-center max-w-xs">
            <FaLightbulb className="text-5xl text-yellow-400 mb-3" />
            <h3 className="font-semibold text-lg mb-1">Finding Right Projects</h3>
            <p className="text-gray-600 text-sm">Navigate the noise to discover projects matching your skills and passion.</p>
          </div>
          <div className="flex flex-col items-center max-w-xs">
            <FaHandshake className="text-5xl text-blue-500 mb-3" />
            <h3 className="font-semibold text-lg mb-1">Connecting Teams</h3>
            <p className="text-gray-600 text-sm">Build or join teams with compatible professionals for effective collaboration.</p>
          </div>
          <div className="flex flex-col items-center max-w-xs">
            <FaRocket className="text-5xl text-red-500 mb-3" />
            <h3 className="font-semibold text-lg mb-1">Discovering Opportunities</h3>
            <p className="text-gray-600 text-sm">Uncover relevant job openings and freelance work within the ecosystem.</p>
          </div>
        </div>

        {/* Separating the descriptive paragraph for better flow */}
        <p className="text-gray-700 leading-relaxed text-lg mb-12 text-center max-w-3xl mx-auto">
          Many talented individuals struggle with these connections. Existing platforms focus heavily on code, leaving a gap for a true <span className="font-semibold text-green-700">collaboration and opportunity hub.</span> That's where ConnectIn comes in.
        </p>

        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6 text-center tracking-tight">Introducing ConnectIn</h2>
        <p className="text-gray-700 leading-relaxed text-lg text-center max-w-3xl mx-auto">
          ConnectIn is your dynamic platform designed to bridge that gap. We foster a vibrant ecosystem where professionals can:
        </p>
        {/* Consider adding icons to list items too */}
        <ul className="text-gray-700 leading-relaxed text-lg mt-6 space-y-3 max-w-lg mx-auto">
          <li className="flex items-center"><span className="font-semibold text-green-700 w-8 text-center mr-2">✓</span> Discover projects matching skills and passions.</li>
          <li className="flex items-center"><span className="font-semibold text-green-700 w-8 text-center mr-2">✓</span> Build & join teams with like-minded individuals.</li>
          <li className="flex items-center"><span className="font-semibold text-green-700 w-8 text-center mr-2">✓</span> Explore relevant job and freelance opportunities.</li>
          <li className="flex items-center"><span className="font-semibold text-green-700 w-8 text-center mr-2">✓</span> Engage actively, becoming integral to project journeys.</li>
        </ul>
      </div>

      {/* Why Choose ConnectIn Section */}
      <div className="mb-16 bg-gradient-to-br from-green-50 via-white to-green-100 p-8 rounded-lg shadow-md mx-4"> {/* Added gradient & horizontal margin */}
        <h2 className="text-2xl md:text-3xl font-semibold text-green-800 mb-6 text-center tracking-tight">What Makes ConnectIn Unique?</h2>
        <p className="text-gray-700 leading-relaxed text-lg text-center mb-4 max-w-3xl mx-auto">
          Unlike platforms primarily focused on code storage (like GitHub), ConnectIn emphasizes <strong className="text-green-900">active participation and community building</strong>. We provide the tools and environment for real collaboration to flourish.
        </p>
        <p className="text-gray-700 leading-relaxed text-lg text-center max-w-3xl mx-auto">
          It's a space designed for interaction, networking, and growing together within project teams.
        </p>
      </div>

      {/* Technologies Section */}
      <div className="mb-16 px-4"> {/* Added horizontal padding */}
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-8 text-center tracking-tight">Built with Cutting-Edge Technology</h2>
        {/* Textual descriptions seem good */}
        <p className="text-gray-700 leading-relaxed text-lg text-center mb-4 max-w-3xl mx-auto">
          We leverage a modern, robust tech stack for a high-performance platform. Our commitment to <strong className="text-green-800">Clean Code</strong> & <strong className="text-green-800">Clean Architecture</strong> ensures maintainability.
        </p>
        <p className="text-gray-700 leading-relaxed text-lg text-center mb-10 max-w-3xl mx-auto">
          Why <span className="font-semibold">Python & FastAPI</span>? Speed, efficiency, scalability, and a fantastic developer experience.
        </p>
        {Object.keys(technologyCategories).map((category) => (
          <div key={category} className="mb-10">
            <h3 className="text-xl font-semibold mb-5 text-green-700 border-l-4 border-green-700 pl-3">{category}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {technologyCategories[category].map((tech) => (
                // === Flip Card Implementation ===
                // Note: Fixed height `h-48` (12rem) is set via inline CSS.
                // This might clip longer descriptions on the back.
                // Consider dynamic height calculation or a different hover effect if content varies greatly.
                <div key={tech.name} className="flip-card"> {/* Added tech.name as key for stability */}
                  <div className="flip-card-inner">
                    {/* Front Side */}
                    <div className="flip-card-front">
                       {/* Ensure tech.logo is a valid URL or path */}
                      <img src={tech.logo || "https://via.placeholder.com/64"} alt={`${tech.name} logo`} className="h-12 md:h-14 mb-3 object-contain" />
                      <p className="text-center text-gray-800 font-semibold text-base">{tech.name}</p>
                    </div>
                    {/* Back Side */}
                    <div className="flip-card-back">
                      <p className="text-center text-xs md:text-sm">{tech.description || "Core technology for our platform."}</p> {/* Provide a slightly better default */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Team Section */}
      <div className="mb-12 px-4"> {/* Added horizontal padding */}
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-10 text-center tracking-tight">Meet the Innovators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 lg:gap-12"> {/* Increased gap slightly on large screens */}
          {members.map((member) => (
             // Added member.name or unique ID as key
            <div key={member.name || member.linkedin} className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg border border-gray-100 text-center transform transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl">
              <img src={member.photo} alt={member.name} className="w-24 h-24 rounded-full mb-4 shadow-md border-2 border-green-200 transition-transform duration-300 hover:scale-110" /> {/* Hover effect on image is nice */}
              <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
              <p className="text-green-700 font-medium mb-3">{member.role}</p>
              {/* Optional: Add a short bio/quote here */}
              {/* <p className="text-sm text-gray-500 mb-4 px-2">"{member.quote}"</p> */}
              <div className="flex space-x-5 mt-auto pt-4"> {/* Pushed icons down with mt-auto, added padding */}
                <a href={member.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} LinkedIn Profile`} className="text-blue-600 hover:text-blue-800 transition-colors duration-200">
                  <FontAwesomeIcon icon={faLinkedin} size="lg" />
                </a>
                <a href={member.telegram} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} Telegram Profile`} className="text-sky-500 hover:text-sky-700 transition-colors duration-200">
                  <FontAwesomeIcon icon={faTelegram} size="lg" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center mt-16 mb-8 px-4"> {/* Increased top margin, added bottom margin, added padding */}
       {/* Ensure '/signup' route exists and is handled by your router */}
        <a href="/signup" className="inline-block bg-green-700 text-white font-bold py-3 px-10 rounded-full shadow-lg hover:bg-green-800 transition-all duration-300 ease-in-out transform hover:scale-105">
          Join ConnectIn Today
        </a>
      </div>
    </div>
  );
};

export default AboutUsV3;