import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { PostCard } from "../components/Post/PostCard";
import TagsFilter from "../components/TagsFilter";
import qs from "qs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import TokenService from "../services/tokenService";
import { useSearchParams } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import usePostStore from "../store/postStore";

const PostsPage = () => {
    const [posts, setPosts] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterLoading, setFilterLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [error, setError] = useState(null);
    const [likedPosts, setLikedPosts] = useState({});
    const [savedPosts, setSavedPosts] = useState({});
    const [totalPages, setTotalPages] = useState(1);
    const [searchParams, setSearchParams] = useSearchParams();
    const pageSize = 5;

    // Get current page from URL or default to 1
    const currentPage = parseInt(searchParams.get("page")) || 1;

    // Cache for storing fetched data
    const [cache, setCache] = useState({
        tags: null,
        user: null,
        posts: {},
        statuses: {},
    });

    // Initialize post store
    const initializePostState = usePostStore((state) => state.initializePostState);

    // Update URL when page changes
    useEffect(() => {
        if (!searchParams.get("page")) {
            setSearchParams({ page: "1" });
        }
    }, [searchParams, setSearchParams]);

    const fetchAllData = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch tags and user data in parallel if not cached
            const [tagsRes, userRes] = await Promise.all([cache.tags ? Promise.resolve({ data: cache.tags }) : axios.get(`${import.meta.env.VITE_API_URL}/tags/`), cache.user ? Promise.resolve({ data: cache.user }) : fetchCurrentUser()]);

            // Update cache with fetched data
            if (!cache.tags) {
                setCache((prev) => ({ ...prev, tags: tagsRes.data }));
            }
            if (!cache.user) {
                setCache((prev) => ({ ...prev, user: userRes }));
            }

            // Fetch posts with pagination
            await fetchPosts(currentPage);

            setAllTags(tagsRes.data);
            setCurrentUser(userRes);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Failed to load posts. Please try again.");
            toast.error("Failed to load posts");
        } finally {
            setLoading(false);
        }
    }, [currentPage, cache.tags, cache.user]);

    const fetchPosts = async (page) => {
        try {
            // Check if posts for this page are already cached
            if (cache.posts[page]) {
                setPosts(cache.posts[page].items);
                setTotalPages(cache.posts[page].total_pages);
                return;
            }

            const postsRes = await axios.get(`${import.meta.env.VITE_API_URL}/posts/`, {
                params: {
                    page: page,
                    page_size: pageSize,
                    post_type: "news",
                },
            });

            // Cache the fetched posts
            setCache((prev) => ({
                ...prev,
                posts: {
                    ...prev.posts,
                    [page]: postsRes.data,
                },
            }));

            setPosts(postsRes.data.items);
            setTotalPages(postsRes.data.total_pages);

            // Initialize post store with new posts
            const postIds = postsRes.data.items.map((post) => post.id);
            await initializePostState(postIds);

            // Fetch like and save statuses for posts in a single request
            await fetchPostStatuses(postsRes.data.items);
        } catch (error) {
            console.error("Error fetching posts:", error);
            throw error;
        }
    };

    // Combined function to fetch both like and save statuses in a single request
    const fetchPostStatuses = async (posts) => {
        const token = TokenService.getAccessToken();
        if (!token) return;

        try {
            const postIds = posts.map((post) => post.id);

            // Check cache first
            const uncachedPostIds = postIds.filter((id) => !cache.statuses[id]);

            if (uncachedPostIds.length > 0) {
                try {
                    const response = await axios.post(`${import.meta.env.VITE_API_URL}/posts/batch_status`, { post_ids: uncachedPostIds }, { headers: { Authorization: `Bearer ${token}` } });

                    // Update cache with new statuses
                    setCache((prev) => ({
                        ...prev,
                        statuses: {
                            ...prev.statuses,
                            ...response.data,
                        },
                    }));
                } catch (error) {
                    console.error("Error fetching batch status:", error);
                    // If batch status fails, fetch individual statuses
                    await fetchIndividualStatuses(uncachedPostIds);
                }
            }

            // Update state with all statuses (from cache and new fetches)
            const newLikedPosts = {};
            const newSavedPosts = {};

            postIds.forEach((id) => {
                const status = cache.statuses[id] || { is_liked: false, is_saved: false };
                newLikedPosts[id] = status.is_liked;
                newSavedPosts[id] = status.is_saved;
            });

            setLikedPosts(newLikedPosts);
            setSavedPosts(newSavedPosts);
        } catch (error) {
            console.error("Error updating post statuses:", error);
        }
    };

    // Fallback function to fetch individual statuses
    const fetchIndividualStatuses = async (postIds) => {
        const token = TokenService.getAccessToken();
        if (!token) return;

        for (const postId of postIds) {
            try {
                const [likeRes, saveRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/posts/${postId}/is_liked`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    axios.get(`${import.meta.env.VITE_API_URL}/posts/${postId}/is_saved`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);

                setCache((prev) => ({
                    ...prev,
                    statuses: {
                        ...prev.statuses,
                        [postId]: {
                            is_liked: likeRes.data.is_liked,
                            is_saved: saveRes.data.is_saved,
                        },
                    },
                }));
            } catch (error) {
                console.error(`Error fetching status for post ${postId}:`, error);
            }
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const fetchCurrentUser = async () => {
        try {
            const token = TokenService.getAccessToken();
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

    const handleLike = async (postId, isLiked, likesCount) => {
        // Update posts state with new likes count
        setPosts((prevPosts) => prevPosts.map((post) => (post.id === postId ? { ...post, likes_count: likesCount } : post)));

        // Update liked posts state
        setLikedPosts((prev) => ({
            ...prev,
            [postId]: isLiked,
        }));

        // Update cache with new status
        setCache((prev) => ({
            ...prev,
            statuses: {
                ...prev.statuses,
                [postId]: {
                    ...prev.statuses[postId],
                    is_liked: isLiked,
                    likes_count: likesCount,
                },
            },
        }));
    };

    const handleSave = async (postId, isSaved, savesCount) => {
        // Update posts state with new saves count
        setPosts((prevPosts) => prevPosts.map((post) => (post.id === postId ? { ...post, saves_count: savesCount } : post)));

        // Update saved posts state
        setSavedPosts((prev) => ({
            ...prev,
            [postId]: isSaved,
        }));

        // Update cache with new status
        setCache((prev) => ({
            ...prev,
            statuses: {
                ...prev.statuses,
                [postId]: {
                    ...prev.statuses[postId],
                    is_saved: isSaved,
                    saves_count: savesCount,
                },
            },
        }));
    };

    const handleTagSelect = (tagId) => {
        setSelectedTags((prev) => {
            const newSelected = prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId];
            filterPostsByTags(newSelected);
            return newSelected;
        });
    };

    const filterPostsByTags = async (tags) => {
        setFilterLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts/filter_by_tags`, {
                params: {
                    tag_ids: tags,
                    page: 1, // Reset to page 1 when filtering
                    page_size: pageSize,
                },
                paramsSerializer: (params) => {
                    return qs.stringify(params, { arrayFormat: "repeat" });
                },
            });

            setPosts(response.data.items || response.data);
            setTotalPages(response.data.total_pages);

            // Fetch like and save statuses for filtered posts
            await fetchPostStatuses(response.data.items || response.data);
        } catch (error) {
            console.error("Error filtering posts:", error);
            toast.error("Failed to filter posts");
        } finally {
            setFilterLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;

        // Update URL with new page number
        setSearchParams({ page: newPage.toString() });

        // Scroll to top of the page
        window.scrollTo({ top: 0, behavior: "smooth" });
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
                    <button onClick={() => handlePageChange(1)} disabled={currentPage === 1} className="px-3 py-1 cursor-pointer rounded hover:bg-green-700 hover:transition hover:duration-300 hover:ease-in-out border border-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        First
                    </button>
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 cursor-pointer rounded hover:bg-green-700 hover:transition hover:duration-300 hover:ease-in-out border border-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        Previous
                    </button>

                    {startPage > 1 && <span className="px-3 py-1">...</span>}

                    {pageNumbers.map((number) => (
                        <button
                            key={number}
                            onClick={() => handlePageChange(number)}
                            className={`px-3 py-1 cursor-pointer rounded ${currentPage === number ? "bg-green-700 text-white" : "border border-green-700 hover:bg-green-700 hover:transition hover:duration-300 hover:ease-in-out hover:scale-110"}`}
                        >
                            {number}
                        </button>
                    ))}

                    {endPage < totalPages && <span className="px-3 py-1">...</span>}

                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded cursor-pointer border border-green-700 hover:bg-green-700 hover:transition hover:ease-in-out disabled:opacity-50 disabled:cursor-not-allowed">
                        Next
                    </button>
                    <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} className="px-3 py-1 rounded cursor-pointer border border-green-700 hover:bg-green-700 hover:transition hover:ease-in-out disabled:opacity-50 disabled:cursor-not-allowed">
                        Last
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
            <TagsFilter allTags={allTags} selectedTags={selectedTags} onTagSelect={handleTagSelect} title="Filter Posts by Tags" />

            {/* Posts List */}
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
            ) : posts.length > 0 ? (
                <AnimatePresence mode="wait">
                    <motion.div key={currentPage} variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                        {posts.map((post) => (
                            <motion.div key={post.id} variants={itemVariants}>
                                <PostCard key={post.id} post={post} currentUser={currentUser} showViewPost={true} showCommentsLink={true} onLike={handleLike} onSave={handleSave} isLiked={likedPosts[post.id] || false} isSaved={savedPosts[post.id] || false} />
                            </motion.div>
                        ))}

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
                    <p className="text-gray-500">No posts found.</p>
                </motion.div>
            )}
        </div>
    );
};

export default PostsPage;
