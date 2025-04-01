import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { PostCard } from "../components/Post/PostCard";
import TagsFilter from "../components/TagsFilter";
import qs from "qs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import TokenService from "../services/tokenService";

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

    const fetchAllData = useCallback(async () => {
        try {
            const [postsRes, tagsRes, userRes] = await Promise.all([axios.get(`${import.meta.env.VITE_API_URL}/posts/`), axios.get(`${import.meta.env.VITE_API_URL}/tags/`), fetchCurrentUser()]);
            setPosts(postsRes.data);
            setAllTags(tagsRes.data);
            setCurrentUser(userRes);

            // Fetch like and save statuses for posts
            await Promise.all([fetchLikeStatuses(postsRes.data), fetchSaveStatuses(postsRes.data)]);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Failed to load posts. Please try again.");
            toast.error("Failed to load posts");
        } finally {
            setLoading(false);
        }
    }, []);

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

    const fetchLikeStatuses = async (posts) => {
        const token = TokenService.getAccessToken();
        if (!token) return;

        try {
            const likePromises = posts.map((post) =>
                axios
                    .get(`${import.meta.env.VITE_API_URL}/posts/${post.id}/is_liked`, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                    .then((response) => ({ postId: post.id, isLiked: response.data.is_liked }))
            );
            const likeResults = await Promise.all(likePromises);
            setLikedPosts(
                likeResults.reduce((acc, { postId, isLiked }) => {
                    acc[postId] = isLiked;
                    return acc;
                }, {})
            );
        } catch (error) {
            console.error("Error fetching like statuses:", error);
        }
    };

    const fetchSaveStatuses = async (posts) => {
        const token = TokenService.getAccessToken();
        if (!token) return;

        try {
            const savePromises = posts.map((post) =>
                axios
                    .get(`${import.meta.env.VITE_API_URL}/posts/${post.id}/is_saved`, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                    .then((response) => ({ postId: post.id, isSaved: response.data.is_saved }))
            );
            const saveResults = await Promise.all(savePromises);
            setSavedPosts(
                saveResults.reduce((acc, { postId, isSaved }) => {
                    acc[postId] = isSaved;
                    return acc;
                }, {})
            );
        } catch (error) {
            console.error("Error fetching save statuses:", error);
        }
    };

    const handleLike = async (postId) => {
        const token = TokenService.getAccessToken();
        if (!token) {
            toast.error("Please log in to like posts");
            return;
        }

        try {
            const isCurrentlyLiked = likedPosts[postId] || false;
            await axios.post(`${import.meta.env.VITE_API_URL}/posts/${postId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setLikedPosts((prev) => ({ ...prev, [postId]: !isCurrentlyLiked }));
            setPosts((prevPosts) => prevPosts.map((post) => (post.id === postId ? { ...post, likes_count: post.likes_count + (isCurrentlyLiked ? -1 : 1) } : post)));
        } catch (error) {
            console.error("Error liking post:", error);
            toast.error("Failed to like post");
        }
    };

    const handleSave = async (postId) => {
        const token = TokenService.getAccessToken();
        if (!token) {
            toast.error("Please log in to save posts");
            return;
        }

        try {
            const isCurrentlySaved = savedPosts[postId] || false;
            await axios.post(`${import.meta.env.VITE_API_URL}/posts/${postId}/save`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setSavedPosts((prev) => ({ ...prev, [postId]: !isCurrentlySaved }));
            setPosts((prevPosts) => prevPosts.map((post) => (post.id === postId ? { ...post, saves_count: post.saves_count + (isCurrentlySaved ? -1 : 1) } : post)));
        } catch (error) {
            console.error("Error saving post:", error);
            toast.error("Failed to save post");
        }
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
                params: { tag_ids: tags },
                paramsSerializer: (params) => {
                    return qs.stringify(params, { arrayFormat: "repeat" });
                },
            });
            setPosts(response.data);

            // Fetch like and save statuses for filtered posts
            await Promise.all([fetchLikeStatuses(response.data), fetchSaveStatuses(response.data)]);
        } catch (error) {
            console.error("Error filtering posts:", error);
            toast.error("Failed to filter posts");
        } finally {
            setFilterLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <TagsFilter allTags={allTags} selectedTags={selectedTags} onTagSelect={handleTagSelect} title="Filter Posts by Tags" />

            {/* Posts List */}
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
            ) : posts.length > 0 ? (
                <div className="space-y-4">
                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} currentUser={currentUser} showViewPost={true} showCommentsLink={true} onLike={() => handleLike(post.id)} onSave={() => handleSave(post.id)} isLiked={likedPosts[post.id] || false} isSaved={savedPosts[post.id] || false} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 border border-dashed rounded-md">
                    <p className="text-gray-500">No posts found.</p>
                </div>
            )}
        </div>
    );
};

export default PostsPage;
