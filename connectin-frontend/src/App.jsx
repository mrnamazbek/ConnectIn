import { BrowserRouter as Router, Routes, Route } from "react-router";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UserProfile from "./pages/UserProfile";
import ProjectProfile from "./pages/ProjectProfile";
import NotFoundPage from "./pages/NotFoundPage";
import FeedPage from "./pages/FeedPage";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import SearchPage from "./pages/SearchPage";
import { useLocation } from "react-router";

function App() {
    return (
        <Router>
            <NavBar />
            <div className="grid grid-cols-8">
                <div className="col-start-2 col-span-6">
                    <Routes>
                        <Route path="/*" element={<FeedPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/profile" element={<UserProfile />} />
                        <Route path="/project/:projectId" element={<ProjectProfile />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </div>
            </div>
            <ConditionalFooter />
        </Router>
    );
}

function ConditionalFooter() {
    const location = useLocation();
    const hiddenRoutes = ["/login", "/register"];

    return !hiddenRoutes.includes(location.pathname) ? <Footer /> : null;
}

export default App;
