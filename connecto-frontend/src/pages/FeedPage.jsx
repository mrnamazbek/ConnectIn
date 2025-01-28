import { useState } from "react";
import PopularProjects from "../components/PopularProjects";
import { Routes, Route, Navigate } from "react-router";
import NewsPage from "./NewsPage";
import ProjectsPage from "./ProjectsPage";
import TeamsPage from "./TeamsPage";
import SubNav from "../components/SubNav";

const Feed = () => {
    const fakeNews = [
        {
            id: 1,
            author: "John Doe",
            title: "React 18 Released",
            content: "New features in React 18 include concurrent mode and new hooks for performance...",
            date: "2025-03-01",
            tags: ["React", "JavaScript", "Frontend"],
        },
        {
            id: 2,
            author: "Jane Smith",
            title: "Tailwind 3.1 Update",
            content: "Tailwind's new JIT features greatly improve developer workflow and performance...",
            date: "2025-03-05",
            tags: ["Tailwind", "CSS", "Web Design"],
        },
    ];

    const fakeProjects = [
        {
            id: 1,
            author: "John Doe",
            profilePic: "https://via.placeholder.com/40",
            theme: "AI Development",
            content: "Join us in building an AI-powered chatbot for customer support. Looking for backend developers and UX designers.",
            date: "2025-01-15",
            tags: ["AI", "Chatbot", "Backend Development"],
        },
        {
            id: 2,
            author: "Jane Smith",
            profilePic: "https://via.placeholder.com/40",
            theme: "Blockchain Technology",
            content: "We are working on a decentralized app for secure transactions. Need frontend experts and smart contract developers.",
            date: "2025-01-18",
            tags: ["Blockchain", "Smart Contracts", "Frontend"],
        },
        {
            id: 3,
            author: "Mike Johnson",
            profilePic: "https://via.placeholder.com/40",
            theme: "Web Development",
            content: "Building a modern e-commerce platform. Seeking team members with expertise in React and Node.js.",
            date: "2025-01-20",
            tags: ["Web Development", "E-commerce", "React"],
        },
    ];

    const fakeTeams = [
        {
            id: 1,
            name: "Frontend Avengers",
            members: ["Alice", "Bob", "Charlie"],
            stack: ["React", "Tailwind CSS", "JavaScript"], // Add stack information
        },
        {
            id: 2,
            name: "Backend Warriors",
            members: ["Dave", "Eve", "Frank"],
            stack: ["Node.js", "Express", "MongoDB"], // Add stack information
        },
    ];

    const fakePopularProjects = [
        {
            id: 1,
            title: "Green Energy Monitoring System",
            date: "2025-01-15",
            tags: ["AI", "Machine Learning", "Green Tech"],
        },
        {
            id: 2,
            title: "Smart Home Automation Platform",
            date: "2025-01-20",
            tags: ["IoT", "TypeScript", "Frontend"],
        },
        {
            id: 3,
            title: "AI-Powered Health Assistant",
            date: "2025-01-18",
            tags: ["AI", "Health Tech", "Backend"],
        },
    ];

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
