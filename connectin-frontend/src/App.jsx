import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Импорт стилей для Toastify

// Контекст и обертки
import { AuthProvider } from "./contexts/AuthContext"; // Путь к вашему AuthContext
import AuthWrapper from "./components/AuthWrapper.jsx"; // Путь к AuthWrapper

// Основные компоненты
import NavBar from "./components/NavBar"; // Путь к NavBar
import Footer from "./components/Footer"; // Путь к Footer

// Импорты Страниц
import LandingPageV3 from "./pages/LandingPage_v3.jsx"; // Наш новый лендинг
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UserProfile from "./pages/UserProfile";
import NotFoundPage from "./pages/NotFoundPage";
import SearchPage from "./pages/SearchPage";
import FeedPage from "./pages/FeedPage";
import ChatPage from "./pages/ChatPage";
import ProjectProfile from "./pages/ProjectProfile";
import AboutPage from "./pages/AboutPage.jsx";
import PublishPage from "./pages/PublishPage.jsx";
import ProjectPage from "./pages/ProjectPage.jsx";
// Убедитесь, что пути ко всем страницам и компонентам верны!

function App() {
    return (
        <AuthProvider>
            <Router>
                {/* AuthWrapper обрабатывает состояние аутентификации */}
                <AuthWrapper>
                    {/* Общий контейнер приложения */}
                    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
                        {/* Немного изменил фон */}
                        {/* Навигация отображается всегда */}
                        <NavBar />
                        {/* Основной контент */}
                        <main className="flex-grow">
                            {" "}
                            {/* main занимает оставшееся место */}
                            <Routes>
                                {/* === ЛЕНДИНГ НА ГЛАВНОЙ === */}
                                <Route path="/" element={<LandingPageV3 />} />

                                {/* === ОСТАЛЬНЫЕ СТРАНИЦЫ ВНУТРИ ОБЕРТКИ С ОГРАНИЧЕНИЕМ ШИРИНЫ === */}
                                <Route
                                    path="/feed/*"
                                    element={
                                        <MainContentWrapper>
                                            <FeedPage />
                                        </MainContentWrapper>
                                    }
                                />
                                <Route
                                    path="/login"
                                    element={
                                        <MainContentWrapper>
                                            <LoginPage />
                                        </MainContentWrapper>
                                    }
                                />
                                <Route
                                    path="/register"
                                    element={
                                        <MainContentWrapper>
                                            <RegisterPage />
                                        </MainContentWrapper>
                                    }
                                />
                                <Route
                                    path="/profile/*"
                                    element={
                                        <MainContentWrapper>
                                            <UserProfile />
                                        </MainContentWrapper>
                                    }
                                />
                                <Route
                                    path="/post"
                                    element={
                                        <MainContentWrapper>
                                            <PublishPage />
                                        </MainContentWrapper>
                                    }
                                />
                                <Route
                                    path="/search"
                                    element={
                                        <MainContentWrapper>
                                            <SearchPage />
                                        </MainContentWrapper>
                                    }
                                />
                                <Route
                                    path="/project/:projectId"
                                    element={
                                        <MainContentWrapper>
                                            <ProjectPage />
                                        </MainContentWrapper>
                                    }
                                />
                                <Route
                                    path="/project/:projectId/profile"
                                    element={
                                        <MainContentWrapper>
                                            <ProjectProfile />
                                        </MainContentWrapper>
                                    }
                                />
                                <Route
                                    path="/about"
                                    element={
                                        <MainContentWrapper>
                                            <AboutPage />
                                        </MainContentWrapper>
                                    }
                                />
                                {/* Добавьте другие страницы внутрь MainContentWrapper */}

                                {/* Чат - особый случай, может требовать другой обертки или полной высоты */}
                                <Route
                                    path="/chats"
                                    element={
                                        <FullHeightPage>
                                            <ChatPage />
                                        </FullHeightPage>
                                    }
                                />

                                {/* Страница не найдена */}
                                <Route
                                    path="*"
                                    element={
                                        <MainContentWrapper>
                                            <NotFoundPage />
                                        </MainContentWrapper>
                                    }
                                />
                            </Routes>
                        </main>
                        {/* Уведомления */}
                        <ToastContainer autoClose={3000} position="bottom-left" theme="colored" />
                        {/* Футер с условием */}
                        <ConditionalFooter />
                    </div>
                </AuthWrapper>
            </Router>
        </AuthProvider>
    );
}

// Компонент-обертка для страниц с ограниченной шириной и центровкой
function MainContentWrapper({ children }) {
    // Используем grid для позиционирования, но контент сам определяет свою ширину (max-w в дочерних)
    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Общий контейнер с отступами */}
            {children}
        </div>
    );
}

// Обертка для чата (оставляем)
function FullHeightPage({ children }) {
    // Убедитесь, что высота NavBar вычитается правильно (здесь 64px как пример)
    return <div className="h-[calc(100vh-64px)] overflow-hidden">{children}</div>;
}

// Условный футер (оставляем)
function ConditionalFooter() {
    const location = useLocation();
    // Скрываем только на этих страницах
    const hiddenRoutes = ["/login", "/register", "/chats"];
    return !hiddenRoutes.includes(location.pathname) ? <Footer /> : null;
}

export default App;
