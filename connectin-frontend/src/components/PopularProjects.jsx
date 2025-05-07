import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router";

const PopularProjects = () => {
    const [popularProjects, setPopularProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPopularProjects = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/popular-projects`, {
                    params: {
                        limit: 3,
                    },
                });
                setPopularProjects(response.data);
            } catch (error) {
                console.error("Error fetching popular projects:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPopularProjects();
    }, []);

    return (
        <div className="bg-white dark:bg-gray-800 col-span-2 dark:text-gray-300 flex flex-col border border-green-700 rounded-md p-5 shadow-md">
            <h2 className="font-semibold mb-2">Popular Projects</h2>
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center items-center py-4">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-green-700 text-2xl" />
                    </div>
                ) : popularProjects.length > 0 ? (
                    popularProjects.map((project) => (
                        <div key={project.id} className="py-2 last:border-b-0 border-t border-gray-300">
                            {project.tags && project.tags.length > 0 && (
                                <div className="my-1 flex flex-wrap gap-1">
                                    {project.tags.map((tag, index) => (
                                        <span key={index} className="text-xs text-gray-500">
                                            {tag.name}
                                            {index < project.tags.length - 1 && <span className="mx-1">•</span>}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <h3 className="font-semibold text-sm mb-2">{project.name}</h3>
                            <p className="text-sm mb-2 line-clamp-2" dangerouslySetInnerHTML={{ __html: project.description }}></p>
                            <div className="flex justify-between items-center text-xs">
                                <NavLink to={`/feed/projects/${project.id}`} className="border border-green-700 px-2 py-1 rounded-md text-green-700 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">
                                    View Project
                                </NavLink>
                                <div className="text-gray-500">
                                    <span>Votes: {project.vote_count}</span>
                                    <span className="ml-2">Comments: {project.comments_count}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-center py-4">No popular projects available.</p>
                )}
            </div>
        </div>
    );
};

export default PopularProjects;
