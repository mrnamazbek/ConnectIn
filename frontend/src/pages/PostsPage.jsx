import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { PostCard } from "../components/Post/PostCard";
import TagsFilter from "../components/TagsFilter";
import qs from "qs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import TokenService from "../services/tokenService";
import { useSearchParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import usePostStore from "../store/postStore";

// Create a global cache object that persists between renders and navigation
const globalCache = {
    tags: null,
    user: null,
    posts: {},
    statuses: {},
    scrollPosition: 0
};

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
    const contentRef = useRef(null);
    const navigate = useNavigate();

    // Get current page from URL or default to 1
    const currentPage = parseInt(searchParams.get("page")) || 1;

    // Cache for storing fetched data is now using the global cache
    const [cache, setCache] = useState(globalCache);

    // Initialize post store
    const initializePostState = usePostStore((state) => state.initializePostState);

    // Restore scroll position when returning to the page
    useEffect(() => {
        if (globalCache.scrollPosition && contentRef.current) {
            setTimeout(() => {
                window.scrollTo(0, globalCache.scrollPosition);
            }, 100);
        }
    }, []);
    
    // Save scroll position before leaving the page
    useEffect(() => {
        const handleBeforeUnload = () => {
            globalCache.scrollPosition = window.scrollY;
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            globalCache.scrollPosition = window.scrollY;
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

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
            const [tagsRes, userRes] = await Promise.all([
                globalCache.tags ? Promise.resolve({ data: globalCache.tags }) : axios.get(`${import.meta.env.VITE_API_URL}/tags/`), 
                globalCache.user ? Promise.resolve({ data: globalCache.user }) : fetchCurrentUser()
            ]);

            // Update global cache with fetched data
            if (!globalCache.tags) {
                globalCache.tags = tagsRes.data;
            }
            if (!globalCache.user) {
                globalCache.user = userRes;
            }

            // Update local cache state
            setCache(globalCache);

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
    }, [currentPage]);

    const fetchPosts = async (page) => {
        try {
            // Check if posts for this page are already cached
            if (globalCache.posts[page]) {
                const items = Array.isArray(globalCache.posts[page].items) ? globalCache.posts[page].items : [];
                setPosts(items);
                setTotalPages(globalCache.posts[page].total_pages || 1);
                return;
            }

            const postsRes = await axios.get(`${import.meta.env.VITE_API_URL}/posts/`, {
                params: {
                    page: page,
                    page_size: pageSize,
                    post_type: "news",
                },
            });

            // Cache the fetched posts in the global cache
            globalCache.posts[page] = postsRes.data;

            // Ensure items is an array
            const items = Array.isArray(postsRes.data.items) ? postsRes.data.items : [];
            setPosts(items);
            setTotalPages(postsRes.data.total_pages || 1);

            if (items.length > 0) {
                // Initialize post store with new posts
                const postIds = items.map((post) => post.id);
                await initializePostState(postIds);

                // Fetch like and save statuses for posts in a single request
                await fetchPostStatuses(items);
            }
        } catch (error) {
            console.error("Error fetching posts:", error);
            setPosts([]);
            setTotalPages(1);
        }
    };

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

    const fetchPostStatuses = async (posts) => {
        const token = TokenService.getAccessToken();
        if (!token) {
            // For non-authenticated users, set default statuses
            const defaultStatuses = {};
            posts.forEach(post => {
                defaultStatuses[post.id] = { is_liked: false, is_saved: false };
            });
            return defaultStatuses;
        }

        try {
            const postIds = posts.map((post) => post.id);

            // Check cache first
            const uncachedPostIds = postIds.filter((id) => !globalCache.statuses[id]);

            if (uncachedPostIds.length > 0) {
                try {
                    const response = await axios.post(`${import.meta.env.VITE_API_URL}/posts/batch_status`, { post_ids: uncachedPostIds }, { headers: { Authorization: `Bearer ${token}` } });

                    // Update global cache with new statuses
                    Object.assign(globalCache.statuses, response.data);
                    
                    // Update local cache state
                    setCache({...globalCache});
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
                const status = globalCache.statuses[id] || { is_liked: false, is_saved: false };
                newLikedPosts[id] = status.is_liked;
                newSavedPosts[id] = status.is_saved;
            });

            setLikedPosts(newLikedPosts);
            setSavedPosts(newSavedPosts);
            return newLikedPosts;
        } catch (error) {
            console.error("Error updating post statuses:", error);
            return {};
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

                // Update global cache
                globalCache.statuses[postId] = {
                    is_liked: likeRes.data.is_liked,
                    is_saved: saveRes.data.is_saved,
                };
                
                // Update local cache state
                setCache({...globalCache});
            } catch (error) {
                console.error(`Error fetching status for post ${postId}:`, error);
            }
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleLike = async (postId, isLiked, likesCount) => {
        // Update posts state with new likes count
        setPosts((prevPosts) => prevPosts.map((post) => (post.id === postId ? { ...post, likes_count: likesCount } : post)));

        // Update liked posts state
        setLikedPosts((prev) => ({
            ...prev,
            [postId]: isLiked,
        }));

        // Update global cache with new status
        if (globalCache.statuses[postId]) {
            globalCache.statuses[postId].is_liked = isLiked;
            globalCache.statuses[postId].likes_count = likesCount;
        } else {
            globalCache.statuses[postId] = {
                is_liked: isLiked,
                likes_count: likesCount,
                is_saved: false,
            };
        }
        
        // Update relevant posts in cache
        Object.keys(globalCache.posts).forEach(pageKey => {
            const page = globalCache.posts[pageKey];
            if (page && page.items) {
                page.items = page.items.map(post => 
                    post.id === postId ? {...post, likes_count: likesCount} : post
                );
            }
        });
        
        setCache({...globalCache});
    };

    const handleSave = async (postId, isSaved, savesCount) => {
        // Update posts state with new saves count
        setPosts((prevPosts) => prevPosts.map((post) => (post.id === postId ? { ...post, saves_count: savesCount } : post)));

        // Update saved posts state
        setSavedPosts((prev) => ({
            ...prev,
            [postId]: isSaved,
        }));

        // Update global cache with new status
        if (globalCache.statuses[postId]) {
            globalCache.statuses[postId].is_saved = isSaved;
            globalCache.statuses[postId].saves_count = savesCount;
        } else {
            globalCache.statuses[postId] = {
                is_saved: isSaved,
                saves_count: savesCount,
                is_liked: false,
            };
        }
        
        // Update relevant posts in cache
        Object.keys(globalCache.posts).forEach(pageKey => {
            const page = globalCache.posts[pageKey];
            if (page && page.items) {
                page.items = page.items.map(post => 
                    post.id === postId ? {...post, saves_count: savesCount} : post
                );
            }
        });
        
        setCache({...globalCache});
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
            // Clear cache for filtered results
            globalCache.posts = {};
            
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

            // Cache the filtered results
            globalCache.posts[1] = response.data;

            // Ensure items is an array
            const items = Array.isArray(response.data.items) 
                ? response.data.items 
                : Array.isArray(response.data) 
                    ? response.data 
                    : [];
            setPosts(items);
            setTotalPages(response.data.total_pages || 1);

            if (items.length > 0) {
                // Fetch like and save statuses for filtered posts
                await fetchPostStatuses(items);
            }
        } catch (error) {
            console.error("Error filtering posts:", error);
            toast.error("Failed to filter posts");
            setPosts([]);
            setTotalPages(1);
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
    
    const handlePostClick = (post, e) => {
        // If the click already has a target that handles it or if e.defaultPrevented is true, don't navigate
        if (e && (e.defaultPrevented || e.target.closest('.author-clickable'))) {
            return;
        }
        
        // Save scroll position before navigating
        globalCache.scrollPosition = window.scrollY;
        
        // Navigate to post detail with state
        navigate(`/feed/post/${post.id}`, { state: { post } });
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
        <div className="space-y-6" ref={contentRef}>
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
                                <div onClick={(e) => handlePostClick(post, e)} className="cursor-pointer">
                                    <PostCard 
                                        key={post.id} 
                                        post={post} 
                                        currentUser={currentUser} 
                                        showViewPost={true} 
                                        showCommentsLink={true} 
                                        onLike={handleLike} 
                                        onSave={handleSave} 
                                        isLiked={likedPosts[post.id] || false} 
                                        isSaved={savedPosts[post.id] || false} 
                                    />
                                </div>
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
