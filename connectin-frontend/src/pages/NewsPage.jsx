import React, { useEffect, useState } from "react";
import axios from "axios";
import qs from "qs";
import { PostCard, LoadingMessage, ErrorMessage, NoDataMessage } from "../components/Post/PostCard";

export default function NewsPage() {
    const [news, setNews] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterLoading, setFilterLoading] = useState(false);
    const [error, setError] = useState(null);
    const [likedPosts, setLikedPosts] = useState({});
    const [savedPosts, setSavedPosts] = useState({});
    const [showAllTags, setShowAllTags] = useState(false); 
    const initialTagLimit = 10; 

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            const [newsRes, tagsRes] = await Promise.all([axios.get(`${import.meta.env.VITE_API_URL}/posts/?post_type=news`), axios.get(`${import.meta.env.VITE_API_URL}/tags/`)]);
            setNews(newsRes.data);
            setAllTags(tagsRes.data);
            await Promise.all([fetchLikeStatuses(newsRes.data), fetchSaveStatuses(newsRes.data)]);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Failed to load news or tags. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fetchNewsByTags = async (tagIds) => {
        setFilterLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts/filter_by_tags`, {
                params: { tag_ids: tagIds, post_type: "news" },
                paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "repeat" }),
            });
            setNews(response.data);
            await Promise.all([fetchLikeStatuses(response.data), fetchSaveStatuses(response.data)]);
        } catch (error) {
            console.error("Error filtering news:", error);
            setError("Failed to filter news. Please try again.");
        } finally {
            setFilterLoading(false);
        }
    };

    const handleTagSelect = (tagId) => {
        setSelectedTags((prev) => {
            const newSelected = prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId];
            fetchNewsByTags(newSelected);
            return newSelected;
        });
    };

    const fetchLikeStatuses = async (posts) => {
        const token = localStorage.getItem("access_token");
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
        const token = localStorage.getItem("access_token");
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
        const token = localStorage.getItem("access_token");
        if (!token) {
            console.error("User not authenticated");
            return;
        }

        try {
            const isCurrentlyLiked = likedPosts[postId] || false;
            await axios.post(`${import.meta.env.VITE_API_URL}/posts/${postId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setLikedPosts((prev) => ({ ...prev, [postId]: !isCurrentlyLiked }));
            setNews((prevNews) => prevNews.map((post) => (post.id === postId ? { ...post, likes_count: post.likes_count + (isCurrentlyLiked ? -1 : 1) } : post)));
        } catch (error) {
            console.error("Error liking post:", error);
        }
    };

    const handleSave = async (postId) => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            console.error("User not authenticated");
            return;
        }

        try {
            const isCurrentlySaved = savedPosts[postId] || false;
            await axios.post(`${import.meta.env.VITE_API_URL}/posts/${postId}/save`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setSavedPosts((prev) => ({ ...prev, [postId]: !isCurrentlySaved }));
            setNews((prevNews) => prevNews.map((post) => (post.id === postId ? { ...post, saves_count: post.saves_count + (isCurrentlySaved ? -1 : 1) } : post)));
        } catch (error) {
            console.error("Error saving post:", error);
        }
    };

    const visibleTags = showAllTags ? allTags : allTags.slice(0, initialTagLimit);

    return (
        <div className="flex flex-col">
            <div className="flex-grow container mx-auto">
                {/* Tag Filtering UI */}
                <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                        {visibleTags.map((tag) => (
                            <button key={tag.id} className={`px-3 py-1 rounded-md shadow-sm border-gray-200 cursor-pointer text-sm ${selectedTags.includes(tag.id) ? "bg-green-700 text-white" : "bg-white hover:bg-gray-300"}`} onClick={() => handleTagSelect(tag.id)}>
                                {tag.name}
                            </button>
                        ))}
                    </div>
                    {allTags.length > initialTagLimit && (
                        <button onClick={() => setShowAllTags(!showAllTags)} className="mt-2 text-green-700 cursor-pointer hover:underline text-sm" aria-label={showAllTags ? "Show fewer tags" : "Show more tags"}>
                            {showAllTags ? "Show Less" : `Show More (${allTags.length - initialTagLimit} more)`}
                        </button>
                    )}
                </div>

                {/* News Display */}
                {loading ? (
                    <LoadingMessage />
                ) : filterLoading ? (
                    <div className="flex justify-center items-center my-8">
                        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-t-transparent border-green-700" role="status">
                            <span className="sr-only">Loading...</span>
                        </div>
                    </div>
                ) : error ? (
                    <ErrorMessage message={error} />
                ) : news.length === 0 ? (
                    <NoDataMessage message="No news articles found." />
                ) : (
                    <div className="flex flex-col space-y-5">
                        {news.map((article) => (
                            <PostCard key={article.id} post={article} onLike={() => handleLike(article.id)} onSave={() => handleSave(article.id)} isLiked={likedPosts[article.id] || false} isSaved={savedPosts[article.id] || false} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
