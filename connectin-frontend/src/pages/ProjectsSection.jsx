import { useState, useEffect } from "react";
import axios from "axios";
import { NavLink } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

const ProjectsSection = ({ user, projects: propProjects, loading, isStatic }) => {
    const [projects, setProjects] = useState([]);
    const [localLoading, setLocalLoading] = useState(true);

    useEffect(() => {
        if (isStatic && propProjects) {
            setProjects(propProjects);
            setLocalLoading(false);
            return;
        }

        fetchProjects();
    }, [isStatic, propProjects]);

    const fetchProjects = async () => {
        try {
            setLocalLoading(true);
            const token = localStorage.getItem("access_token");
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/my`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response?.data) {
                setProjects(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch projects:", error);
            toast.error("Failed to load projects");
        } finally {
            setLocalLoading(false);
        }
    };

    const handleDeleteProject = async (projectId) => {
        if (!window.confirm("Are you sure you want to delete this project?")) return;

        try {
            const token = localStorage.getItem("access_token");
            await axios.delete(`${import.meta.env.VITE_API_URL}/projects/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Project deleted successfully");
            setProjects((prev) => prev.filter((project) => project.id !== projectId));
        } catch (error) {
            console.error("Failed to delete project:", error);
            toast.error("Failed to delete project");
        }
    };

    return (
        <div className="space-y-6">
            {loading || localLoading ? (
                <p className="text-center text-gray-500 py-4">Loading projects...</p>
            ) : projects.length > 0 ? (
                <div className="space-y-4">
                    {projects.map((project) => (
                        <div key={project.id} className="border border-gray-200 rounded-md p-4 hover:shadow-md transition">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                                    {project.tags?.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {project.tags.map((tag) => (
                                                <span key={tag.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                                                    {tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: project.description }} />
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                    {user && user.id === project.owner?.id && (
                                        <button onClick={() => handleDeleteProject(project.id)} className="text-red-500 cursor-pointer hover:text-red-700 px-2 py-1 flex items-center gap-2">
                                            <FontAwesomeIcon icon={faTrashAlt} />
                                            Delete
                                        </button>
                                    )}
                                    <NavLink to={`/project/${project.id}/profile`} className="bg-green-700 text-white px-3 py-1 rounded hover:bg-green-600">
                                        View
                                    </NavLink>
                                </div>
                            </div>

                            <div className="flex mt-4 text-sm text-gray-500">
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
                    <NavLink to="/project/create" className="text-green-700 hover:underline mt-2 inline-block">
                        Create your first project
                    </NavLink>
                </div>
            )}
        </div>
    );
};

export default ProjectsSection;
