import { useState, useEffect } from "react";
import axios from "axios";
import ProjectCard from "../components/Project/ProjectCard";

const ProjectsSection = ({ user }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
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
            const token = localStorage.getItem("token");
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
                <p className="text-center text-gray-500">Loading projects...</p>
            ) : projects.length > 0 ? (
                projects.map((project) => <ProjectCard key={project.id} project={project} showViewProject={true} showCommentsLink={true} />)
            ) : (
                <p className="text-center text-gray-500">No projects available.</p>
            )}
        </div>
    );
};

export default ProjectsSection;
