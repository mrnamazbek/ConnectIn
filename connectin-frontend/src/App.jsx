import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UserProfile from "./pages/UserProfile";
import NotFoundPage from "./pages/NotFoundPage";
import SearchPage from "./pages/SearchPage";
import FeedPage from "./pages/FeedPage";
import ChatPage from "./pages/ChatPage";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import ProjectProfile from "./pages/ProjectProfile";
import AboutPage from "./pages/AboutPage.jsx";
import LandingPage from "./pages/LandingPage";
import { ToastContainer } from "react-toastify";
import AuthWrapper from "./components/AuthWrapper.jsx";
import { AuthProvider } from "./contexts/AuthContext";
import PublishPage from "./pages/PublishPage.jsx";

function App() {
    return (
        <AuthProvider>
            <Router>
                <AuthWrapper>
                    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                        <NavBar />
                        <div className="flex-grow grid grid-cols-8">
                            <div className="col-start-2 col-span-6">
                                <Routes>
                                    <Route path="/" element={<LandingPage />} />
                                    <Route path="/feed" element={<FeedPage />} />
                                    <Route path="/login" element={<LoginPage />} />
                                    <Route path="/register" element={<RegisterPage />} />
                                    <Route path="/profile/*" element={<UserProfile />} />
                                    <Route path="/post" element={<PublishPage />} />
                                    <Route path="/search" element={<SearchPage />} />
                                    <Route
                                        path="/chats"
                                        element={
                                            <FullHeightPage>
                                                <ChatPage />
                                            </FullHeightPage>
                                        }
                                    />
                                    <Route path="/project/:projectId/profile" element={<ProjectProfile />} />
                                    <Route path="/about" element={<AboutPage />} />
                                    <Route path="*" element={<NotFoundPage />} />
                                </Routes>
                            </div>
                            <ToastContainer autoClose={5000} position="bottom-left" />
                        </div>
                        <ConditionalFooter />
                    </div>
                </AuthWrapper>
            </Router>
        </AuthProvider>
    );
}

// Wrapper component for pages that need full height
function FullHeightPage({ children }) {
    return <div className="h-[calc(100vh-64px)] overflow-hidden">{children}</div>;
}

function ConditionalFooter() {
    const location = useLocation();
    const hiddenRoutes = ["/login", "/register", "/", "/chats"];
    return !hiddenRoutes.includes(location.pathname) ? <Footer /> : null;
}

export default App;
