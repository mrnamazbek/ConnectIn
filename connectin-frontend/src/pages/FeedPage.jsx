import PopularProjects from "../components/PopularProjects";
import { Routes, Route, Navigate } from "react-router";
import NewsPage from "./NewsPage";
import ProjectsPage from "./ProjectsPage";
import TeamsPage from "./TeamsPage";
import SubNav from "../components/SubNav";
import { fakePopularProjects, fakeNews, fakeProjects, fakeTeams } from "../data/data";
import PublishPage from "./PublishPage";
import PopularNews from "../components/PopularNews";

const Feed = () => {
    return (
        <>
            <SubNav />
            <div className="grid grid-cols-8 gap-5 my-5 min-h-screen">
                <div className="col-span-6">
                    <Routes>
                        <Route index element={<Navigate to="news" />} />
                        <Route path="news" element={<NewsPage fakeNews={fakeNews} />} />
                        <Route path="projects" element={<ProjectsPage fakeProjects={fakeProjects} />} />
                        <Route path="teams" element={<TeamsPage fakeTeams={fakeTeams} />} />
                        <Route path="post" element={<PublishPage />} />
                    </Routes>
                </div>
                <div className="col-span-2 flex-col space-y-5">
                    <PopularNews />
                    <PopularProjects fakePopularProjects={fakePopularProjects} />
                </div>
            </div>
        </>
    );
};

export default Feed;
