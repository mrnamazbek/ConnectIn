import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import useAuthStore from "../store/authStore";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faProjectDiagram, faThumbsUp, faExternalLinkAlt, faLock } from "@fortawesome/free-solid-svg-icons";

const RecommendationsPage = () => {
    const { isAuthenticated } = useAuth();
    const { user } = useAuthStore();
    const [recommendations, setRecommendations] = useState({
        projects: [],
        posts: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // If not authenticated, don't attempt to fetch
        if (!isAuthenticated || !user) {
            setLoading(false);
            return;
        }

        const fetchRecommendations = async () => {
            try {
                setLoading(true);

                // Fetch project recommendations
                const projectsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/recommendations/`, {
                    params: { type: "project" },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                    },
                });

                // Process project recommendations to remove duplicates and keep highest score
                const uniqueProjects = {};
                projectsResponse.data.forEach((rec) => {
                    if (!uniqueProjects[rec.project_id] || uniqueProjects[rec.project_id].score < rec.score) {
                        uniqueProjects[rec.project_id] = rec;
                    }
                });

                // Sort projects by ID (newest first)
                const sortedProjects = Object.values(uniqueProjects).sort((a, b) => b.id - a.id);

                // Fetch additional project details
                const projectsWithDetails = await Promise.all(
                    sortedProjects.map(async (rec) => {
                        try {
                            const projectDetails = await axios.get(`${import.meta.env.VITE_API_URL}/projects/${rec.project_id}`, {
                                headers: {
                                    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                                },
                            });
                            return {
                                ...rec,
                                projectDetails: projectDetails.data,
                            };
                        } catch (err) {
                            console.error(`Error fetching details for project ${rec.project_id}:`, err);
                            return rec;
                        }
                    })
                );

                // Fetch post recommendations (if implemented)
                let postsWithDetails = [];
                try {
                    const postsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/recommendations/`, {
                        params: { type: "post" },
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                        },
                    });

                    // Process post recommendations to remove duplicates and keep highest score
                    const uniquePosts = {};
                    postsResponse.data.forEach((rec) => {
                        if (!uniquePosts[rec.post_id] || uniquePosts[rec.post_id].score < rec.score) {
                            uniquePosts[rec.post_id] = rec;
                        }
                    });

                    // Sort posts by ID (newest first)
                    const sortedPosts = Object.values(uniquePosts).sort((a, b) => b.id - a.id);

                    postsWithDetails = await Promise.all(
                        sortedPosts.map(async (rec) => {
                            try {
                                const postDetails = await axios.get(`${import.meta.env.VITE_API_URL}/posts/${rec.post_id}`, {
                                    headers: {
                                        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                                    },
                                });
                                return {
                                    ...rec,
                                    postDetails: postDetails.data,
                                };
                            } catch (err) {
                                console.error(`Error fetching details for post ${rec.post_id}:`, err);
                                return rec;
                            }
                        })
                    );
                } catch (err) {
                    console.log("Post recommendations might not be implemented yet:", err);
                }

                setRecommendations({
                    projects: projectsWithDetails,
                    posts: postsWithDetails,
                });

                setLoading(false);
            } catch (err) {
                console.error("Error fetching recommendations:", err);
                setError("Failed to load recommendations. Please try again later.");
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [isAuthenticated, user]);

    const formatScore = (score) => {
        return Number(score).toFixed(1);
    };

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] py-10 px-4 text-center">
                <FontAwesomeIcon icon={faLock} className="text-5xl text-gray-400 mb-6" />
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">Personalized Recommendations</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">Sign in to see personalized project and post recommendations based on your skills and interests.</p>
                <Link to="/login" className="bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-6 rounded-lg font-medium transition">
                    Sign In
                </Link>
                <p className="mt-4 text-sm text-gray-500">
                    Don&apos;t have an account?{" "}
                    <Link to="/register" className="text-emerald-600 hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10">
                <p className="text-red-500 dark:text-red-400">{error}</p>
            </div>
        );
    }

    const hasRecommendations = recommendations.projects.length > 0 || recommendations.posts.length > 0;

    if (!hasRecommendations) {
        return (
            <div className="text-center py-16">
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">No recommendations yet</h2>
                <p className="text-gray-600 dark:text-gray-400">As you use the platform more, we&apos;ll generate personalized recommendations for you.</p>
            </div>
        );
    }

    return (
        <div className="py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Your Recommendations</h1>

            {recommendations.projects.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                        <FontAwesomeIcon icon={faProjectDiagram} className="mr-3 text-emerald-500" />
                        Recommended Projects
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recommendations.projects.map((rec) => (
                            <div key={rec.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-200 dark:border-gray-700">
                                <div className="bg-emerald-50 dark:bg-emerald-900/30 p-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{rec.projectDetails?.title || `Project #${rec.project_id}`}</h3>
                                        <span className="bg-emerald-100 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm font-medium px-2.5 py-0.5 rounded">Match: {formatScore(rec.score)}/10</span>
                                    </div>
                                </div>
                                <div className="p-5">
                                    {rec.projectDetails ? (
                                        <>
                                            <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2" dangerouslySetInnerHTML={{ __html: rec.projectDetails.description || "No description available" }}></p>
                                            {rec.projectDetails.skills && rec.projectDetails.skills.length > 0 && (
                                                <div className="mb-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {rec.projectDetails.skills.slice(0, 3).map((skill) => (
                                                            <span key={skill.id} className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs font-medium px-2.5 py-0.5 rounded">
                                                                {skill.name}
                                                            </span>
                                                        ))}
                                                        {rec.projectDetails.skills.length > 3 && <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs font-medium px-2.5 py-0.5 rounded">+{rec.projectDetails.skills.length - 3} more</span>}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-gray-500 dark:text-gray-400 italic">Loading project details...</p>
                                    )}
                                    <p className="text-gray-500 text-sm mb-4">{rec.text || "Recommended based on your skills"}</p>
                                    <Link to={`/feed/project/${rec.project_id}`} className="inline-flex items-center text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
                                        View Project <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-1 text-xs" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {recommendations.posts.length > 0 && (
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                        <FontAwesomeIcon icon={faThumbsUp} className="mr-3 text-emerald-500" />
                        Recommended Posts
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {recommendations.posts.map((rec) => (
                            <div key={rec.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-200 dark:border-gray-700">
                                <div className="p-5">
                                    {rec.postDetails ? (
                                        <>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 truncate">{rec.postDetails.title || `Post #${rec.post_id}`}</h3>
                                            <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3" dangerouslySetInnerHTML={{ __html: rec.postDetails.content }}></p>
                                        </>
                                    ) : (
                                        <p className="text-gray-500 dark:text-gray-400 italic">Loading post details...</p>
                                    )}
                                    <p className="text-gray-500 text-sm mb-4">{rec.text || "Recommended based on your interests"}</p>
                                    <div className="flex justify-between items-center">
                                        <Link to={`/feed/post/${rec.post_id}`} className="inline-flex items-center text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
                                            Read Post <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-1 text-xs" />
                                        </Link>
                                        <span className="bg-emerald-100 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm font-medium px-2.5 py-0.5 rounded">Match: {formatScore(rec.score)}/10</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecommendationsPage;
