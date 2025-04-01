import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin, faTelegram } from "@fortawesome/free-brands-svg-icons";
import technologies from "../data/technologies.js"; // Ensure this includes Backend, DB, etc.
import team from "../data/team";
import Typed from "react-typed"; // Вариант 1: Использование react-typedimport { FaLightbulb, FaHandshake, FaRocket } from "react-icons/fa";
import { useEffect, useState } from "react";
import { FaLightbulb, FaHandshake, FaRocket } from "react-icons/fa";

// Группировка технологий по категориям
const technologyCategories = technologies.reduce((acc, tech) => {
  const category = tech.category || "Другое";
  if (!acc[category]) acc[category] = [];
  acc[category].push(tech);
  return acc;
}, {});

// Вариант 2: Собственный компонент Typewriter
const Typewriter = ({ text, speed = 100 }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [index, text, speed]);

  return <span>{displayedText}</span>;
};

const AboutUsV3 = () => {
  const [daysSinceStart, setDaysSinceStart] = useState(0);

  useEffect(() => {
    // Расчет дней с 1 декабря 2024 года
    const startDate = new Date("2024-12-01");
    const today = new Date();
    const diffTime = Math.abs(today - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysSinceStart(diffDays);
  }, []);

  return (
    <div className="col-span-6 flex flex-col my-5 bg-white p-6 md:p-10 rounded-lg shadow-xl border border-gray-200 overflow-hidden">
      {/* Встроенный CSS для flip card и progress circle */}
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

      {/* Герой-секция с react-typed (Вариант 1) */}
      <div className="text-center mb-12 bg-gradient-to-r from-green-600 via-teal-500 to-blue-600 text-white py-16 rounded-t-lg fade-in">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 px-4 tracking-tight">ConnectIn</h1>
        <Typed
          strings={["Beyond Code: Building Futures.", "Beyond Code: Building Teams, Projects, Careers."]}
          typeSpeed={40}
          backSpeed={50}
          backDelay={1000}
          loop
          className="text-xl md:text-2xl px-4"
        />
      </div>

      {/* Альтернатива: Герой-секция с собственным Typewriter (Вариант 2) */}
      {/* Раскомментируйте этот блок, если хотите использовать собственное решение */}
      {/*
      <div className="text-center mb-12 bg-gradient-to-r from-green-600 via-teal-500 to-blue-600 text-white py-16 rounded-t-lg fade-in">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 px-4 tracking-tight">ConnectIn</h1>
        <p className="text-xl md:text-2xl px-4">
          <Typewriter text="Beyond Code: Building Teams, Projects, and Careers." speed={50} />
        </p>
      </div>
      */}

      {/* Секция "В разработке с декабря 2024" */}
      <div className="mb-16 px-4 bg-gray-50 py-8 rounded-lg shadow-inner fade-in">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6 text-center">В разработке с декабря 2024</h2>
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
            <div className="progress-text">{daysSinceStart} дней</div>
          </div>
        </div>
        <p className="text-gray-700 text-lg text-center mt-4 max-w-xl mx-auto">
          Мы создаем ConnectIn с декабря 2024 года, превращая его в революционный проект!
        </p>
      </div>

      {/* Секция "Проблема и решение" */}
      <div className="mb-16 px-4 fade-in">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-10 text-center">Что мы решаем</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="flex flex-col items-center text-center">
            <FaLightbulb className="text-5xl text-yellow-400 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Поиск проектов</h3>
            <p className="text-gray-600 text-sm">Находите проекты, соответствующие вашим навыкам.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <FaHandshake className="text-5xl text-blue-500 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Соединение команд</h3>
            <p className="text-gray-600 text-sm">Сотрудничайте с правильными профессионалами.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <FaRocket className="text-5xl text-red-500 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Возможности</h3>
            <p className="text-gray-600 text-sm">Легко находите работу и проекты.</p>
          </div>
        </div>
        <p className="text-gray-700 text-lg text-center max-w-3xl mx-auto">
          ConnectIn устраняет разрыв, созданный платформами, ориентированными на код, создавая <span className="font-semibold text-green-700">центр для совместной работы</span>.
        </p>
      </div>

      {/* Секция "Технологии" */}
      <div className="mb-16 px-4 fade-in">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-8 text-center">Наш технологический стек</h2>
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
                      <p className="text-sm">{tech.description || "Ключевая технология платформы."}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Секция "Команда" */}
      <div className="mb-16 px-4 fade-in">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-10 text-center">Наша команда</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {team.map((member) => (
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

      {/* Призыв к действию */}
      <div className="text-center mb-8 px-4 fade-in">
        <a
          href="/signup"
          className="inline-block bg-green-700 text-white font-bold py-3 px-10 rounded-full shadow-lg hover:bg-green-800 hover:scale-105 transition-all duration-300"
        >
          Присоединяйтесь к ConnectIn сейчас
        </a>
      </div>
    </div>
  );
};

export default AboutUsV3;