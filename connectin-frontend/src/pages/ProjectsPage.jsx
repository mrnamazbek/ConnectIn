import { useState, useEffect } from "react";
import axios from "axios";
import ProjectCard from "../components/Project/ProjectCard";
import qs from "qs";

const ProjectsPage = () => {
    const [projects, setProjects] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterLoading, setFilterLoading] = useState(false); // New state for filtering
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            const [projectsRes, tagsRes, userRes] = await Promise.all([axios.get("http://127.0.0.1:8000/projects/"), axios.get("http://127.0.0.1:8000/tags/"), fetchCurrentUser()]);
            setProjects(projectsRes.data);
            setAllTags(tagsRes.data);
            setCurrentUser(userRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCurrentUser = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return null;

            const response = await axios.get("http://127.0.0.1:8000/users/me", {
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
        setFilterLoading(true); // Start the loading spinner
        try {
            const response = await axios.get("http://127.0.0.1:8000/projects/filter_by_tags", {
                params: { tag_ids: tags },
                paramsSerializer: (params) => {
                    return qs.stringify(params, { arrayFormat: "repeat" });
                },
            });
            setProjects(response.data);
            console.log("Filtered projects:", response.data);
        } catch (error) {
            console.error("Error filtering projects:", error);
        } finally {
            setFilterLoading(false); // Stop the loading spinner
        }
    };

    const handleApply = async (projectId) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Please log in to apply for a project.");
                return;
            }

            await axios.post(
                `http://127.0.0.1:8000/projects/${projectId}/apply`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            alert("Application submitted!");
        } catch (error) {
            console.error("Failed to apply:", error);
            alert("Failed to apply. You may have already applied.");
        }
    };

    const handleUpvote = async (projectId) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Please log in to vote.");
                return;
            }

            const response = await axios.post(
                `http://127.0.0.1:8000/projects/${projectId}/vote`,
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
                              vote_count: response.data.detail === "Vote removed" ? proj.vote_count - 1 : proj.vote_count + 1,
                          }
                        : proj
                )
            );
        } catch (error) {
            console.error("Failed to upvote:", error);
            alert("Failed to upvote.");
        }
    };

    const handleDownvote = async (projectId) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Please log in to vote.");
                return;
            }

            const response = await axios.post(
                `http://127.0.0.1:8000/projects/${projectId}/vote`,
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
                              vote_count: response.data.detail === "Vote removed" ? proj.vote_count + 1 : proj.vote_count - 1,
                          }
                        : proj
                )
            );
        } catch (error) {
            console.error("Failed to downvote:", error);
            alert("Failed to downvote.");
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap gap-2 mb-4">
                {allTags.map((tag) => (
                    <button key={tag.id} className={`px-2 py-1 rounded-md text-sm shadow-sm cursor-pointer border-gray-200 ${selectedTags.includes(tag.id) ? "bg-green-700 text-white" : "bg-white"}`} onClick={() => handleTagSelect(tag.id)}>
                        {tag.name}
                    </button>
                ))}
            </div>
            {loading ? (
                <p className="text-center text-gray-500">Loading projects...</p>
            ) : filterLoading ? (
                <div className="flex justify-center items-center">
                    <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-t-transparent border-green-700" role="status">
                        <span className="sr-only">Loading...</span>
                    </div>
                </div>
            ) : projects.length > 0 ? (
                projects.map((project) => <ProjectCard key={project.id} project={project} currentUser={currentUser} handleApply={handleApply} handleUpvote={handleUpvote} handleDownvote={handleDownvote} showViewProject={true} showCommentsLink={true} />)
            ) : (
                <p className="text-center text-gray-500">No projects available.</p>
            )}
        </div>
    );
};

export default ProjectsPage;
