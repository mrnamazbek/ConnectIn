import { useState, useEffect } from "react";
import axios from "axios";
import { NavLink } from "react-router";

const ProjectsSection = ({ user }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("access_token");
            const response = await axios.get("http://127.0.0.1:8000/projects/my", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProjects(response.data);
        } catch (error) {
            console.error("Failed to fetch projects:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProject = async (projectId, ownerId) => {
        if (!user || user.id !== ownerId) {
            alert("You can only delete your own projects.");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this project?")) return;

        try {
            const token = localStorage.getItem("access_token");
            await axios.delete(`http://127.0.0.1:8000/projects/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("Project deleted successfully!");
            setProjects((prev) => prev.filter((project) => project.id !== projectId));
        } catch (error) {
            console.error("Failed to delete project:", error);
        }
    };

    return (
        <div className="self-start w-full hover:shadow-green-700 transition space-y-5">
            {loading ? (
                <p className="text-center text-gray-500 py-4">Loading projects...</p>
            ) : projects.length > 0 ? (
                <div className="space-y-4">
                    {projects.map((project) => (
                        <div key={project.id} className="border border-gray-200 rounded-md p-4 hover:shadow-md transition">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold">{project.name}</h3>
                                    <div>{project.tags?.length > 0 && <div className="mt-2 text-xs text-gray-500">{project.tags.map((tag) => tag.name).join(" • ")}</div>}</div>
                                    <p className="text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {user && user.id === project.owner?.id && (
                                        <button onClick={() => handleDeleteProject(project.id, project.owner?.id)} className="text-red-500 hover:text-red-700 px-2 py-1">
                                            Delete
                                        </button>
                                    )}
                                    <NavLink to={`/project/${project.id}/profile`} className="bg-green-700 text-white px-3 py-1 rounded hover:bg-green-600">
                                        Enter
                                    </NavLink>
                                </div>
                            </div>

                            <div className="flex mt-3 text-sm text-gray-500">
                                <div className="flex items-center mr-4">
                                    <span>Votes: {project.vote_count}</span>
                                </div>
                                <div className="flex items-center">
                                    <span>Comments: {project.comments_count}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 border border-dashed rounded-md">
                    <p className="text-gray-500">No projects available.</p>
                    <NavLink to="/post" className="text-green-700 hover:underline mt-2 inline-block">
                        Create your first project
                    </NavLink>
                </div>
            )}
        </div>
    );
};

export default ProjectsSection;
