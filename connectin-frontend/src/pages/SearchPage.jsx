import React, { useState } from "react";
import axios from "axios";
import PopularProjects from "../components/PopularProjects";
import { fakePopularProjects } from "../data/data";

export default function SearchPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false); // ✅ Track if search was triggered

    // 🔹 Fetch search results from API
    const fetchSearchResults = async () => {
        if (!searchQuery.trim()) return; // ✅ Don't search if input is empty

        setLoading(true);
        setSearched(true); // ✅ Mark as searched
        try {
            const response = await axios.get(`http://127.0.0.1:8000/posts/search?query=${searchQuery}`);
            setSearchResults(response.data);
        } catch (error) {
            console.error("Error fetching search results:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-8 gap-4 my-5 min-h-screen items-start text-black">
            <div className="col-span-6 flex flex-col space-y-4">
                {/* 🔹 Search Bar */}
                <div className="flex space-x-5">
                    <input type="text" placeholder="Search for posts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white text-sm px-3 py-2 border border-gray-200 rounded-md shadow-sm" />
                    <button onClick={fetchSearchResults} className="font-semibold shadow-md bg-green-700 text-white px-4 rounded-md hover:bg-green-600 transition cursor-pointer">
                        Search
                    </button>
                </div>

                {/* 🔹 Search Results (only shown after search is triggered) */}
                {searched && (
                    <div className="bg-white border border-gray-200 p-4 rounded-md shadow-sm">
                        {loading ? (
                            <p className="text-gray-500">Searching...</p>
                        ) : (
                            searchResults.map((post) => (
                                <div key={post.id} className="py-5 first:pt-0 last:pb-0 border-b last:border-b-0">
                                    <h3 className="font-semibold">{post.title}</h3>
                                    <p className="text-gray-600" dangerouslySetInnerHTML={{ __html: post.content }} />
                                    <p className="text-sm text-gray-500">Tags: {post.tags.length > 0 ? post.tags.join(", ") : "No tags"}</p>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* 🔹 Display Popular Projects */}
            <PopularProjects fakePopularProjects={fakePopularProjects} />
        </div>
    );
}
