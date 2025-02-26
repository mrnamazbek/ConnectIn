import { useState, useEffect } from "react";
import axios from "axios";
import { NavLink } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";

const ProjectsPage = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        fetchProjects();
        fetchCurrentUser();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await axios.get("http://127.0.0.1:8000/projects/");
            setProjects(response.data);
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCurrentUser = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const response = await axios.get("http://127.0.0.1:8000/users/me", {
                headers: { Authorization: `Bearer ${token}` },
            });

            setCurrentUser(response.data);
        } catch (error) {
            console.error("Error fetching current user:", error);
        }
    };

    const handleApply = async (projectId) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Please log in to apply for a project.");
                return;
            }

            await axios.post(`http://127.0.0.1:8000/projects/${projectId}/apply`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });

            alert("Application submitted!");
        } catch (error) {
            console.error("Failed to apply:", error);
            alert("Failed to apply. You may have already applied.");
        }
    };

    return (
        <div className="space-y-5">
            {loading ? (
                <p className="text-center text-gray-500">Loading projects...</p>
            ) : projects.length > 0 ? (
                projects.map((project) => (
                    <div key={project.id} className="bg-white shadow-md rounded-md border border-green-700 p-5">
                        {/* 🔹 Project Owner Info */}
                        <div className="flex items-center space-x-2">
                            <img src={project.owner.avatar_url || "https://media.tenor.com/HmFcGkSu58QAAAAM/silly.gif"} alt={project.owner.username} className="w-10 h-10 rounded-full border" />
                            <p className="font-semibold">{project.owner.username}</p>
                        </div>

                        {/* 🔹 Tags */}
                        <div className="flex flex-wrap my-2">
                            {project.tags.length > 0 && (
                                <div className="flex flex-wrap mt-2 text-xs text-gray-500">
                                    {project.tags.map((tag) => tag.name).join(" • ")}
                                </div>
                            )}
                        </div>

                        {/* 🔹 Project Details */}
                        <h3 className="text-lg font-bold">{project.name}</h3>
                        <p className="text-gray-700 mb-3">{project.description}</p>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {project.skills.length > 0 ? (
                                project.skills.map((skill) => (
                                    <span key={skill.id} className="text-xs px-2 py-1 bg-green-300 rounded-md">
                                        {skill.name}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-500 text-xs">No skills</span>
                            )}
                        </div>

                        {/* 🔹 Buttons */}
                        <div className="flex justify-between">
                            <div className="space-x-5 mt-3">
                                <button className="text-gray-500 hover:text-green-700 transition cursor-pointer">
                                    <FontAwesomeIcon icon={faArrowUp} />
                                </button>
                                <button className="text-gray-500 hover:text-red-700 transition cursor-pointer">
                                    <FontAwesomeIcon icon={faArrowDown} />
                                </button>
                            </div>

                            {/* ✅ Show Apply Button only if the user is not the owner */}
                            {currentUser && currentUser.id !== project.owner.id && (
                                <button 
                                    onClick={() => handleApply(project.id)} 
                                    className="rounded shadow-sm text-sm px-6 py-2 border border-green-700 hover:text-white font-semibold cursor-pointer hover:bg-green-700 transition"
                                >
                                    Apply
                                </button>
                            )}

                            {/* ✅ Show "View Project" button */}
                            <NavLink 
                                to={`/project/${project.id}`} 
                                className="rounded shadow-sm text-sm px-6 py-2 border border-blue-700 hover:text-white font-semibold cursor-pointer hover:bg-blue-700 transition"
                            >
                                View Project
                            </NavLink>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-center text-gray-500">No projects available.</p>
            )}
        </div>
    );
};

export default ProjectsPage;
