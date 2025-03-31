import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import ProjectCard from "../components/Project/ProjectCard";
import TagsFilter from "../components/TagsFilter";
import qs from "qs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

const ProjectsPage = () => {
    const [projects, setProjects] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterLoading, setFilterLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [error, setError] = useState(null);

    const fetchAllData = useCallback(async () => {
        try {
            const [projectsRes, tagsRes, userRes] = await Promise.all([axios.get(`${import.meta.env.VITE_API_URL}/projects/`), axios.get(`${import.meta.env.VITE_API_URL}/tags/`), fetchCurrentUser()]);
            setProjects(projectsRes.data);
            setAllTags(tagsRes.data);
            setCurrentUser(userRes);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Failed to load projects. Please try again.");
            toast.error("Failed to load projects");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const fetchCurrentUser = async () => {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) return null;

            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching current user:", error);
            return null;
        }
    };

    const handleTagSelect = (tagId) => {
        setSelectedTags((prev) => {
            const newSelected = prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId];
            filterProjectsByTags(newSelected);
            return newSelected;
        });
    };

    const filterProjectsByTags = async (tags) => {
        setFilterLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/filter_by_tags`, {
                params: { tag_ids: tags },
                paramsSerializer: (params) => {
                    return qs.stringify(params, { arrayFormat: "repeat" });
                },
            });
            setProjects(response.data);
        } catch (error) {
            console.error("Error filtering projects:", error);
            toast.error("Failed to filter projects");
        } finally {
            setFilterLoading(false);
        }
    };

    const handleApply = async (projectId) => {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                toast.error("Please log in to apply for a project");
                return;
            }

            await axios.post(
                `${import.meta.env.VITE_API_URL}/projects/${projectId}/apply`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            toast.success("Application submitted successfully!");
        } catch (error) {
            console.error("Failed to apply:", error);
            toast.error("Failed to apply. You may have already applied.");
        }
    };

    const handleUpvote = async (projectId) => {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                toast.error("Please log in to vote");
                return;
            }

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/projects/${projectId}/vote`,
                { is_upvote: true },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setProjects((prevProjects) =>
                prevProjects.map((proj) =>
                    proj.id === projectId
                        ? {
                              ...proj,
                              vote_count: response.data.vote_count,
                          }
                        : proj
                )
            );
            toast.success(response.data.detail);
        } catch (error) {
            console.error("Failed to upvote:", error);
            toast.error("Failed to upvote");
        }
    };

    const handleDownvote = async (projectId) => {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                toast.error("Please log in to vote");
                return;
            }

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/projects/${projectId}/vote`,
                { is_upvote: false },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setProjects((prevProjects) =>
                prevProjects.map((proj) =>
                    proj.id === projectId
                        ? {
                              ...proj,
                              vote_count: response.data.vote_count,
                          }
                        : proj
                )
            );
            toast.success(response.data.detail);
        } catch (error) {
            console.error("Failed to downvote:", error);
            toast.error("Failed to downvote");
        }
    };

    return (
        <div className="space-y-6">
            <TagsFilter allTags={allTags} selectedTags={selectedTags} onTagSelect={handleTagSelect} title="Filter Projects by Tags" />

            {/* Projects List */}
            {loading ? (
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
                </div>
            ) : error ? (
                <div className="text-center py-8">
                    <FontAwesomeIcon icon={faExclamationCircle} className="text-red-500 text-4xl mb-4" />
                    <p className="text-red-500">{error}</p>
                    <button onClick={() => window.location.reload()} className="mt-4 text-sm text-green-700 hover:text-green-800 underline">
                        Try again
                    </button>
                </div>
            ) : filterLoading ? (
                <div className="flex justify-center items-center min-h-[200px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
                </div>
            ) : projects.length > 0 ? (
                <div className="space-y-4">
                    {projects.map((project) => (
                        <ProjectCard key={project.id} project={project} currentUser={currentUser} handleApply={handleApply} handleUpvote={handleUpvote} handleDownvote={handleDownvote} showViewProject={true} showCommentsLink={true} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 border border-dashed rounded-md">
                    <p className="text-gray-500">No projects found.</p>
                </div>
            )}
        </div>
    );
};

export default ProjectsPage;
