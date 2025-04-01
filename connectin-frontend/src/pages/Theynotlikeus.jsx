import React, { useEffect, useState } from "react"; // Объединяем импорты React
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin, faTelegram } from "@fortawesome/free-brands-svg-icons";
import Typed from "react-typed";
import { FaLightbulb, FaHandshake, FaRocket } from "react-icons/fa"; // Убираем дублирующий импорт

// Предполагаем, что эти файлы существуют и экспортируют массивы объектов
import technologies from "../data/technologies.js";
import team from "../data/team";

// Группировка технологий по категориям (без изменений, выглядит корректно)
const technologyCategories = technologies.reduce((acc, tech) => {
  const category = tech.category || "Другое"; // Используем "Другое" как категорию по умолчанию
  if (!acc[category]) acc[category] = [];
  acc[category].push(tech);
  return acc;
}, {});

// Компонент Typewriter (оставляем закомментированным, т.к. используется react-typed)
// const Typewriter = ({ text, speed = 100 }) => { ... };

const AboutUsV3 = () => {
  const [daysSinceStart, setDaysSinceStart] = useState(0);

  useEffect(() => {
    // Расчет дней с 1 декабря 2024 года
    const startDate = new Date("2024-12-01");
    const today = new Date(); // Используем текущую дату
    // Убедимся, что работаем с датами в одном формате (например, без времени) для корректного сравнения
    const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const diffTime = Math.abs(todayDay - startDay);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysSinceStart(diffDays);
  }, []); // Пустой массив зависимостей гарантирует выполнение эффекта один раз при монтировании

  // Прогресс для круговой диаграммы (от 0 до 1)
  // Ограничиваем максимальное значение 365 днями для полного круга,
  // но можно изменить логику, если нужно показывать > 1 года
  const progress = Math.min(daysSinceStart / 365, 1);
  const circumference = 2 * Math.PI * 45; // Длина окружности (2 * pi * r)
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="col-span-6 my-5 flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-xl md:p-10">
      {/*
        Встроенные стили для flip-card, progress-circle и fade-in.
        Примечание: В идеальном мире эти стили лучше выносить в CSS Modules или использовать
        полностью Tailwind с кастомизацией в tailwind.config.js.
        Оставлено здесь для сохранения функциональности без доп. настроек.
      */}
      <style>{`
        .flip-card {
          perspective: 1000px; /* Добавляет глубину для 3D эффекта */
          height: 12rem; /* Фиксированная высота для карточки */
        }
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          text-align: center;
          transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1); /* Плавный переход */
          transform-style: preserve-3d; /* Сохраняет 3D позиционирование дочерних элементов */
        }
        .flip-card:hover .flip-card-inner {
          transform: rotateY(180deg); /* Поворот при наведении */
        }
        .flip-card-front, .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden; /* Скрывает обратную сторону элемента */
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          border-radius: 0.5rem; /* Скругление углов */
          box-shadow: 0 4px 6px rgba(0,0,0,0.1); /* Тень */
        }
        .flip-card-front {
          background-color: #F9FAFB; /* Светло-серый фон */
          color: #1F2937; /* Темно-серый текст */
        }
        .flip-card-back {
          background-color: #DCFCE7; /* Светло-зеленый фон */
          color: #374151; /* Серый текст */
          transform: rotateY(180deg); /* Изначально повернута обратная сторона */
        }

        /* Стили для SVG прогресс-круга */
        .progress-circle {
          position: relative;
          width: 100px;
          height: 100px;
        }
        .progress-circle svg {
          transform: rotate(-90deg); /* Поворачиваем SVG, чтобы прогресс начинался сверху */
        }
        .progress-circle .bg {
          fill: none; /* Без заливки */
          stroke: #e5e7eb; /* Цвет фона круга (серый) */
          stroke-width: 10; /* Толщина линии */
        }
        .progress-circle .progress {
          fill: none; /* Без заливки */
          stroke: #10b981; /* Цвет прогресса (зеленый) */
          stroke-width: 10; /* Толщина линии */
          stroke-linecap: round; /* Скругленные концы линии */
          transition: stroke-dashoffset 1s ease-out; /* Анимация заполнения */
        }
        .progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%); /* Центрирование текста */
          font-size: 1.1rem; /* Размер шрифта текста */
          font-weight: 600; /* Полужирный шрифт */
          color: #059669; /* Темно-зеленый цвет текста */
        }

        /* Анимация появления */
        .fade-in {
          animation: fadeIn 1s ease-in forwards; /* Применяем анимацию */
          opacity: 0; /* Начальное состояние - невидимый */
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); } /* Начало анимации */
          to { opacity: 1; transform: translateY(0); } /* Конец анимации */
        }
        /* Добавим небольшую задержку для элементов */
        .fade-in-delay-1 { animation-delay: 0.1s; }
        .fade-in-delay-2 { animation-delay: 0.2s; }
        .fade-in-delay-3 { animation-delay: 0.3s; }
        /* ... можно добавить больше задержек при необходимости */
      `}</style>

      {/* Hero-секция с react-typed */}
      <div className="fade-in mb-12 rounded-t-lg bg-gradient-to-r from-green-600 via-teal-500 to-blue-600 py-16 text-center text-white">
        <h1 className="mb-4 px-4 text-4xl font-extrabold tracking-tight md:text-6xl">ConnectIn</h1>
        <div className="px-4 text-xl md:text-2xl"> {/* Обертка для Typed для лучшего контроля */}
          <Typed
            strings={["Beyond Code: Building Futures.", "Beyond Code: Building Teams, Projects, Careers."]}
            typeSpeed={50} // Немного увеличил скорость для динамичности
            backSpeed={40}
            backDelay={1200} // Немного увеличил задержку
            loop
            smartBackspace // Улучшает удаление текста
          />
        </div>
      </div>

      {/* Секция "В разработке с декабря 2024" */}
      <div className="fade-in fade-in-delay-1 mb-16 rounded-lg bg-gray-50 px-4 py-8 shadow-inner">
        <h2 className="mb-6 text-center text-2xl font-semibold text-gray-800 md:text-3xl">В разработке с декабря 2024</h2>
        <div className="flex justify-center">
          <div className="progress-circle">
            <svg width="100" height="100" viewBox="0 0 100 100">
              {/* Фон круга */}
              <circle className="bg" cx="50" cy="50" r="45" />
              {/* Круг прогресса */}
              <circle
                className="progress"
                cx="50"
                cy="50"
                r="45"
                strokeDasharray={circumference} // Длина окружности
                strokeDashoffset={strokeDashoffset} // Смещение для отображения прогресса
              />
            </svg>
            {/* Текст внутри круга */}
            <div className="progress-text">{daysSinceStart} дн.</div>
          </div>
        </div>
        <p className="mx-auto mt-4 max-w-xl text-center text-lg text-gray-700">
          Мы создаем ConnectIn с декабря 2024 года, превращая его в революционный проект! {/* Убедитесь, что дата корректна */}
        </p>
      </div>

      {/* Секция "Проблема и решение" */}
      <div className="fade-in fade-in-delay-2 mb-16 px-4">
        <h2 className="mb-10 text-center text-2xl font-semibold text-gray-800 md:text-3xl">Что мы решаем</h2>
        <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Использование map для уменьшения дублирования, если нужно будет добавлять еще пункты */}
          {[
            { icon: FaLightbulb, color: "text-yellow-400", title: "Поиск проектов", text: "Находите проекты, соответствующие вашим навыкам." },
            { icon: FaHandshake, color: "text-blue-500", title: "Соединение команд", text: "Сотрудничайте с правильными профессионалами." },
            { icon: FaRocket, color: "text-red-500", title: "Возможности", text: "Легко находите работу и проекты." }
          ].map((item, index) => (
            <div key={item.title} className={`flex flex-col items-center text-center fade-in fade-in-delay-${index + 1}`}> {/* Добавил задержку */}
              <item.icon className={`mb-4 text-5xl ${item.color}`} />
              <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.text}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto max-w-3xl text-center text-lg text-gray-700">
          ConnectIn устраняет разрыв, созданный платформами, ориентированными на код, создавая <span className="font-semibold text-green-700">центр для совместной работы</span>.
        </p>
      </div>

      {/* Секция "Технологии" */}
      <div className="fade-in fade-in-delay-3 mb-16 px-4">
        <h2 className="mb-8 text-center text-2xl font-semibold text-gray-800 md:text-3xl">Наш технологический стек</h2>
        {Object.keys(technologyCategories).map((category) => (
          <div key={category} className="mb-10">
            <h3 className="mb-5 border-l-4 border-green-700 pl-3 text-xl font-semibold text-green-700">{category}</h3>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4"> {/* Адаптивность сетки */}
              {technologyCategories[category].map((tech) => (
                <div key={tech.name} className="flip-card"> {/* Ключ здесь */}
                  <div className="flip-card-inner">
                    {/* Передняя сторона */}
                    <div className="flip-card-front">
                      <img
                        src={tech.logo || "https://via.placeholder.com/64?text=Logo"} // Добавил текст плейсхолдера
                        alt={`${tech.name} logo`}
                        className="mb-3 h-12 object-contain" // object-contain чтобы лого не искажалось
                        onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/64?text=Error'} // Обработка ошибки загрузки лого
                      />
                      <p className="font-semibold">{tech.name}</p>
                    </div>
                    {/* Задняя сторона */}
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
      <div className="fade-in fade-in-delay-3 mb-16 px-4"> {/* Используем ту же задержку, что и технологии */}
        <h2 className="mb-10 text-center text-2xl font-semibold text-gray-800 md:text-3xl">Наша команда</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"> {/* Адаптивность сетки */}
          {team.map((member) => (
            <div
              key={member.linkedin || member.name} // Используем LinkedIn как более уникальный ключ, если он есть
              className="flex flex-col items-center rounded-xl bg-gray-50 p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl" // Немного изменил стили карточки команды
            >
              <img
                src={member.photo || "https://via.placeholder.com/96?text=Photo"} // Плейсхолдер для фото
                alt={member.name || "Team member"} // Альтернативный текст
                className="mb-4 h-24 w-24 rounded-full border-2 border-green-200 object-cover" // object-cover для фото
                onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/96?text=Error'} // Обработка ошибки загрузки фото
              />
              <h3 className="text-lg font-bold text-gray-800">{member.name || "Имя не указано"}</h3>
              <p className="mb-4 text-green-700">{member.role || "Роль не указана"}</p>
              <div className="flex space-x-4">
                {member.linkedin && ( // Показываем иконку только если ссылка есть
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 transition-colors hover:text-blue-800" aria-label={`${member.name} LinkedIn Profile`}>
                    <FontAwesomeIcon icon={faLinkedin} size="lg" />
                  </a>
                )}
                {member.telegram && ( // Показываем иконку только если ссылка есть
                  <a href={member.telegram} target="_blank" rel="noopener noreferrer" className="text-sky-500 transition-colors hover:text-sky-700" aria-label={`${member.name} Telegram Profile`}>
                    <FontAwesomeIcon icon={faTelegram} size="lg" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Призыв к действию (оставляем закомментированным) */}
      {/*
      <div className="fade-in text-center mb-8 px-4">
        <a
          href="/auth/register"
          className="inline-block rounded-full bg-green-700 px-10 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-green-800"
        >
          Присоединяйтесь к ConnectIn сейчас
        </a>
      </div>
      */}
    </div>
  );
};

export default AboutUsV3;