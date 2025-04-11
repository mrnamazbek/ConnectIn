import { useState } from "react";
import axios from "axios";
import PopularProjects from "../components/PopularProjects";
import { fakePopularProjects } from "../data/data";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faExclamationCircle, faHeart, faComment, faTag } from "@fortawesome/free-solid-svg-icons";

export default function SearchPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState(null);

    const fetchSearchResults = async () => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        setSearched(true);
        setError(null);
        try {
            const encodedQuery = encodeURIComponent(searchQuery);
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts/search?query=${encodedQuery}`);
            setSearchResults(response.data);
            console.log("Search results:", response.data);
        } catch (error) {
            console.error("Error fetching search results:", error);
            setError("Failed to fetch search results. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            fetchSearchResults();
        }
    };

    return (
        <div className="container mx-auto px-4 py-5 min-h-screen text-black">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row sm:space-x-4 mb-6">
                <input
                    type="text"
                    placeholder="Search for posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 bg-white text-sm px-4 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button onClick={fetchSearchResults} disabled={!searchQuery.trim() || loading} className={`px-4 py-2 font-semibold text-white rounded-md shadow-md transition ${!searchQuery.trim() || loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-700 hover:bg-green-600"}`}>
                    {loading ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : "Search"}
                </button>
            </div>

            {/* Search Results or Default Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    {error && (
                        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md flex items-center">
                            <FontAwesomeIcon icon={faExclamationCircle} className="mr-2" />
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <FontAwesomeIcon icon={faSpinner} spin className="text-green-700 text-3xl" />
                        </div>
                    ) : searched ? (
                        searchResults.length > 0 ? (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-800">Search Results ({searchResults.length})</h2>
                                {searchResults.map((post) => (
                                    <div key={post.id} className="p-4 bg-white rounded-md shadow-md flex space-x-4">
                                        {/* Author Avatar */}
                                        <div className="flex-shrink-0">
                                            {post.author.avatar_url ? (
                                                <img src={post.author.avatar_url} alt={post.author.username} className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">{post.author.username[0]?.toUpperCase() || "U"}</div>
                                            )}
                                        </div>
                                        {/* Post Content */}
                                        <div className="flex-1">
                                            <h3 className="text-md font-medium text-gray-900">{post.title}</h3>
                                            <p className="text-sm text-gray-600 mt-1">{post.content.slice(0, 100)}...</p>
                                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                                <span>Posted by {post.author.username}</span>
                                                <span>
                                                    <FontAwesomeIcon icon={faHeart} className="mr-1" />
                                                    {post.likes_count} Likes
                                                </span>
                                                <span>
                                                    <FontAwesomeIcon icon={faComment} className="mr-1" />
                                                    {post.comments_count} Comments
                                                </span>
                                            </div>
                                            {/* Tags */}
                                            {post.tags.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {post.tags.map((tag, index) => (
                                                        <span key={index} className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                                                            <FontAwesomeIcon icon={faTag} className="mr-1" />
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center">No results found for &quot;{searchQuery}&quot;.</p>
                        )
                    ) : (
                        <p className="text-gray-500 text-center">Enter a search query to find posts.</p>
                    )}
                </div>

                {/* Popular Projects Sidebar */}
                <div className="lg:col-span-1">
                    <PopularProjects fakePopularProjects={fakePopularProjects} />
                </div>
            </div>
        </div>
    );
}
