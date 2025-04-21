import PopularProjects from "../components/PopularProjects";
import { Routes, Route, Navigate } from "react-router";
import ProjectsPage from "./ProjectsPage";
import SubNav from "../components/SubNav";
import PublishPage from "./PublishPage";
import PopularPosts from "../components/PopularPosts";
import PostPage from "./PostPage";
import ProjectPage from "./ProjectPage";
import PostsPage from "./PostsPage";

const Feed = () => {
    return (
        <>
            <SubNav />
            <div className="grid grid-cols-1 md:grid-cols-8 gap-5 my-5 min-h-screen">
                <div className="md:col-span-6">
                    <Routes>
                        <Route index element={<Navigate to="news" />} />
                        <Route path="news" element={<PostsPage />} />
                        <Route path="projects" element={<ProjectsPage />} />
                        <Route path="post" element={<PublishPage />} />
                        <Route path="post/:postId" element={<PostPage />} />
                        <Route path="project/:projectId" element={<ProjectPage />} />
                    </Routes>
                </div>
                <div className="md:col-span-2 flex-col space-y-5">
                    <PopularPosts />
                    <PopularProjects />
                </div>
            </div>
        </>
    );
};

export default Feed;
