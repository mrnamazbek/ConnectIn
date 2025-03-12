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
import ProjectCard from "./components/Project/ProjectCard";

function App() {
    return (
        <Router>
            <div className="flex flex-col min-h-screen dark:bg-black dark:text-white">
                <NavBar />
                <div className="flex-grow grid grid-cols-8">
                    <div className="col-start-2 col-span-6">
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/profile/*" element={<UserProfile />} />
                            <Route path="/*" element={<FeedPage />} /> {/* All feed-related routes */}
                            <Route path="/search" element={<SearchPage />} />
                            <Route path="/chats" element={<ChatPage />} />
                            <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                    </div>
                </div>
                <ConditionalFooter />
            </div>
        </Router>
    );
}

function ConditionalFooter() {
    const location = useLocation();
    const hiddenRoutes = ["/login", "/register"];
    return !hiddenRoutes.includes(location.pathname) ? <Footer /> : null;
}

export default App;
