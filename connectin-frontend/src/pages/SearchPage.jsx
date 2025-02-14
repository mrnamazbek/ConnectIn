import React, { useState, useEffect } from "react";
import axios from "axios";
import PopularProjects from "../components/PopularProjects";
import { fakePopularProjects } from "../data/data";
import { debounce } from "lodash"; // ✅ Debouncing for efficiency

export default function SearchPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // 🔹 Fetch search results from API
    const fetchSearchResults = async (query) => {
        if (!query) {
            setSearchResults([]); // ✅ Clear results if empty query
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(`http://127.0.0.1:8000/posts/search?query=${query}`);
            setSearchResults(response.data);
        } catch (error) {
            console.error("Error fetching search results:", error);
        }
        setLoading(false);
    };

    // 🔹 Debounced search function (prevents excessive API calls)
    const debouncedSearch = debounce((query) => {
        fetchSearchResults(query);
    }, 500);

    // 🔹 Handle input change
    const handleSearchChange = (event) => {
        const query = event.target.value;
        setSearchQuery(query);
        debouncedSearch(query);
    };

    return (
        <div className="grid grid-cols-8 gap-4 my-5 min-h-screen items-start text-black">
            <div className="col-span-6 flex flex-col space-y-4">
                <div className="flex space-x-5">
                    <input
                        type="text"
                        placeholder="Search for posts..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full bg-white text-sm px-3 py-2 border border-gray-200 rounded-md shadow-sm"
                    />
                    <button
                        onClick={() => fetchSearchResults(searchQuery)}
                        className="font-semibold shadow-md bg-green-700 text-white px-4 rounded-md hover:bg-green-600 transition cursor-pointer"
                    >
                        Search
                    </button>
                </div>

                {/* 🔹 Display Search Results */}
                <div className="bg-white border border-gray-200 p-4 rounded-md shadow-sm">
                    <h2 className="text-lg font-semibold">Search Results</h2>
                    {loading ? (
                        <p className="text-gray-500">Searching...</p>
                    ) : searchResults.length > 0 ? (
                        searchResults.map((post) => (
                            <div key={post.id} className="p-3 border-b last:border-b-0">
                                <h3 className="font-semibold">{post.title}</h3>
                                <p className="text-gray-600">{post.content}</p>
                                <p className="text-sm text-gray-500">
                                    Tags: {post.tags.length > 0 ? post.tags.join(", ") : "No tags"}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">No results found.</p>
                    )}
                </div>
            </div>

            {/* 🔹 Display Popular Projects */}
            <PopularProjects fakePopularProjects={fakePopularProjects} />
        </div>
    );
}
