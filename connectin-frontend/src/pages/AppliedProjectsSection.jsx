import { useState, useEffect } from "react";
import axios from "axios";
import { NavLink } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import ProjectCard from "../components/Project/ProjectCard";

const AppliedProjectsSection = ({ loading, isStatic }) => {
    const [appliedProjects, setAppliedProjects] = useState([]);
    const [localLoading, setLocalLoading] = useState(true);

    useEffect(() => {
        if (isStatic && appliedProjects.length > 0) {
            setLocalLoading(false);
            return;
        }

        fetchAppliedProjects();
    }, [isStatic]);

    const fetchAppliedProjects = async () => {
        try {
            setLocalLoading(true);
            const token = localStorage.getItem("access_token");
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/applied`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response?.data) {
                setAppliedProjects(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch applied projects:", error);
            toast.error("Failed to load applied projects");
        } finally {
            setLocalLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {loading || localLoading ? (
                <div className="flex justify-center items-center py-8">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-green-700 text-2xl" />
                </div>
            ) : appliedProjects.length > 0 ? (
                <div className="overflow-x-auto pb-4">
                    <div className="flex flex-col space-y-6">
                        {[...appliedProjects].reverse().map((project) => (
                            <div key={project.id}>
                                <ProjectCard 
                                    project={project}
                                    showViewProject={true}
                                    showCommentsLink={true}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 border border-dashed rounded-md">
                    <p className="text-gray-500">No applied projects available.</p>
                    <NavLink to="/projects" className="text-green-700 hover:underline mt-2 inline-block">
                        Browse Projects
                    </NavLink>
                </div>
            )}
        </div>
    );
};

export default AppliedProjectsSection;
