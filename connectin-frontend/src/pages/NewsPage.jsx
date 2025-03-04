import React, { useEffect, useState } from "react";
import axios from "axios";
import { PostCard, LoadingMessage, ErrorMessage, NoDataMessage } from "../components/Post/PostCard";

export default function NewsPage() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [likedPosts, setLikedPosts] = useState({});
    const [savedPosts, setSavedPosts] = useState({});

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        try {
            const response = await axios.get("http://127.0.0.1:8000/posts/?post_type=news");
            setNews(response.data);
            await Promise.all([
                fetchLikeStatuses(response.data),
                fetchSaveStatuses(response.data), // Fetch save statuses
            ]);
        } catch (error) {
            console.error("Error fetching news:", error);
            setError("Failed to load news. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fetchLikeStatuses = async (posts) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const likePromises = posts.map((post) =>
                axios
                    .get(`http://127.0.0.1:8000/posts/${post.id}/is_liked`, {
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
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const savePromises = posts.map((post) =>
                axios
                    .get(`http://127.0.0.1:8000/posts/${post.id}/is_saved`, {
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
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("User not authenticated");
            return;
        }

        try {
            const isCurrentlyLiked = likedPosts[postId] || false;
            await axios.post(`http://127.0.0.1:8000/posts/${postId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setLikedPosts((prev) => ({ ...prev, [postId]: !isCurrentlyLiked }));
            setNews((prevNews) => prevNews.map((post) => (post.id === postId ? { ...post, likes_count: post.likes_count + (isCurrentlyLiked ? -1 : 1) } : post)));
        } catch (error) {
            console.error("Error liking post:", error);
        }
    };

    const handleSave = async (postId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("User not authenticated");
            return;
        }

        try {
            const isCurrentlySaved = savedPosts[postId] || false;
            const response = await axios.post(`http://127.0.0.1:8000/posts/${postId}/save`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setSavedPosts((prev) => ({ ...prev, [postId]: !isCurrentlySaved }));
            setNews((prevNews) => prevNews.map((post) => (post.id === postId ? { ...post, saves_count: post.saves_count + (isCurrentlySaved ? -1 : 1) } : post)));
        } catch (error) {
            console.error("Error saving post:", error);
        }
    };

    return (
        <div className="flex flex-col">
            <div className="flex-grow container mx-auto">
                {loading ? (
                    <LoadingMessage />
                ) : error ? (
                    <ErrorMessage message={error} />
                ) : news.length === 0 ? (
                    <NoDataMessage message="No news articles found." />
                ) : (
                    <div className="flex flex-col space-y-5">
                        {news.map((article) => (
                            <PostCard
                                key={article.id}
                                post={article}
                                onLike={() => handleLike(article.id)}
                                onSave={() => handleSave(article.id)} 
                                isLiked={likedPosts[article.id] || false}
                                isSaved={savedPosts[article.id] || false} 
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
