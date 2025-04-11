import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import ProjectCard from "../components/Project/ProjectCard";
import TagsFilter from "../components/TagsFilter";
import qs from "qs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router";
import { motion, AnimatePresence } from "framer-motion";

const ProjectsPage = () => {
    const [projects, setProjects] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterLoading, setFilterLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [error, setError] = useState(null);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;

    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = parseInt(searchParams.get("page") || "1");

    const fetchAllData = useCallback(async () => {
        try {
            setLoading(true);
            const [tagsRes, userRes] = await Promise.all([axios.get(`${import.meta.env.VITE_API_URL}/tags/`), fetchCurrentUser()]);

            // Fetch projects with pagination
            await fetchProjects(currentPage);

            setAllTags(tagsRes.data);
            setCurrentUser(userRes);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Failed to load projects. Please try again.");
            toast.error("Failed to load projects");
        } finally {
            setLoading(false);
        }
    }, [currentPage]);

    const fetchProjects = async (page) => {
        try {
            const projectsRes = await axios.get(`${import.meta.env.VITE_API_URL}/projects/`, {
                params: {
                    page: page,
                    page_size: pageSize,
                },
            });

            setProjects(projectsRes.data.items);
            setTotalPages(projectsRes.data.total_pages);

            // Update URL with current page
            setSearchParams({ page: page.toString() });
        } catch (error) {
            console.error("Error fetching projects:", error);
            throw error;
        }
    };

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
                params: {
                    tag_ids: tags,
                    page: 1, // Reset to page 1 when filtering
                    page_size: pageSize,
                },
                paramsSerializer: (params) => {
                    return qs.stringify(params, { arrayFormat: "repeat" });
                },
            });

            setProjects(response.data.items);
            setTotalPages(response.data.total_pages);
            setSearchParams({ page: "1" }); // Reset to page 1 in URL
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

    const handlePageChange = (page) => {
        setSearchParams({ page: page.toString() });
    };

    const renderPagination = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="flex justify-center mt-6">
                <nav className="flex items-center space-x-2">
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded border border-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        Previous
                    </button>

                    {startPage > 1 && (
                        <>
                            <button onClick={() => handlePageChange(1)} className="px-3 py-1 rounded border border-green-700 hover:bg-green-50">
                                1
                            </button>
                            {startPage > 2 && <span className="px-2">...</span>}
                        </>
                    )}

                    {pageNumbers.map((number) => (
                        <button key={number} onClick={() => handlePageChange(number)} className={`px-3 py-1 rounded ${currentPage === number ? "bg-green-700 text-white" : "border border-green-700 hover:bg-green-50"}`}>
                            {number}
                        </button>
                    ))}

                    {endPage < totalPages && (
                        <>
                            {endPage < totalPages - 1 && <span className="px-2">...</span>}
                            <button onClick={() => handlePageChange(totalPages)} className="px-3 py-1 rounded border border-green-700 hover:bg-green-50">
                                {totalPages}
                            </button>
                        </>
                    )}

                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded border border-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        Next
                    </button>
                </nav>
            </div>
        );
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
                when: "beforeChildren",
                staggerChildren: 0.1,
            },
        },
        exit: {
            opacity: 0,
            y: -20,
            transition: {
                duration: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
            },
        },
    };

    return (
        <div className="space-y-6">
            <TagsFilter allTags={allTags} selectedTags={selectedTags} onTagSelect={handleTagSelect} title="Filter Projects by Tags" />

            {/* Projects List */}
            {loading ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center items-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
                </motion.div>
            ) : error ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                    <FontAwesomeIcon icon={faExclamationCircle} className="text-red-500 text-4xl mb-4" />
                    <p className="text-red-500">{error}</p>
                    <button onClick={() => window.location.reload()} className="mt-4 text-sm text-green-700 hover:text-green-800 underline">
                        Try again
                    </button>
                </motion.div>
            ) : filterLoading ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center items-center min-h-[200px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
                </motion.div>
            ) : projects.length > 0 ? (
                <AnimatePresence mode="wait">
                    <motion.div key={currentPage} variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            {projects.map((project) => (
                                <motion.div key={project.id} variants={itemVariants}>
                                    <ProjectCard key={project.id} project={project} currentUser={currentUser} handleApply={handleApply} handleUpvote={handleUpvote} handleDownvote={handleDownvote} showViewProject={true} showCommentsLink={true} />
                                </motion.div>
                            ))}
                        </div>

                        {/* Pagination controls */}
                        {totalPages > 1 && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                {renderPagination()}
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            ) : (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8 border border-dashed rounded-md">
                    <p className="text-gray-500">No projects found.</p>
                </motion.div>
            )}
        </div>
    );
};

export default ProjectsPage;
