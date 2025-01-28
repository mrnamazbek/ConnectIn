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

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-gray-200 font-gilroy">
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
                <Footer />
            </div>
        </Router>
    );
}

export default App;
