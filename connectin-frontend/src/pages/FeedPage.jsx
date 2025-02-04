import PopularProjects from "../components/PopularProjects";
import { Routes, Route, Navigate } from "react-router";
import NewsPage from "./NewsPage";
import ProjectsPage from "./ProjectsPage";
import TeamsPage from "./TeamsPage";
import SubNav from "../components/SubNav";
import { fakePopularProjects, fakeNews, fakeProjects, fakeTeams } from "../data/data";
import Footer from "../components/Footer";

const Feed = () => {
    return (
        <>
            <SubNav />
            <div className="grid grid-cols-8 gap-4 my-5 min-h-screen items-start  text-black">
                {/* Left Column */}
                <div className="col-span-6">
                    {/* Nested Grid */}
                    <div className="grid grid-rows-[auto_1fr]">
                        {/* Row 2: Feed Content */}
                        <Routes>
                            {/* Default route: if user goes to /feed (no sub-path), redirect to /feed/news */}
                            <Route index element={<Navigate to="news" />} />

                            <Route path="news" element={<NewsPage fakeNews={fakeNews} />} />
                            <Route path="projects" element={<ProjectsPage fakeProjects={fakeProjects} />} />
                            <Route path="teams" element={<TeamsPage fakeTeams={fakeTeams} />} />
                        </Routes>
                    </div>
                </div>

                {/* Right Column */}
                <PopularProjects fakePopularProjects={fakePopularProjects} />
            </div>
        </>
    );
};

export default Feed;
