import { BrowserRouter as Router, Routes, Route } from "react-router";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UserProfile from "./pages/UserProfile";
import ProjectProfile from "./pages/ProjectProfile";
import FeedPage from "./pages/FeedPage";
import Navbar from "./components/NavBar";
import Footer from "./components/Footer";

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-gray-200 font-gilroy">
                <Navbar />
                <div className="grid grid-cols-8">
                    <div className="col-start-2 col-span-6">
                        <Routes>
                            <Route path="/" element={<FeedPage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/profile" element={<UserProfile />} />
                            <Route path="/project/:projectId" element={<ProjectProfile />} />
                        </Routes>
                    </div>
                </div>
                <Footer />
            </div>
        </Router>
    );
}

export default App;
