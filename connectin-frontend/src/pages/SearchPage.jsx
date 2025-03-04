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
            <div className="col-span-6 flex space-x-5">
                <input type="text" placeholder="Search for..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white text-sm px-3 py-2 border border-gray-200 rounded-md shadow-sm" />
                <button className="font-semibold shadow-md bg-green-700 text-white px-4 rounded-md hover:bg-green-600 transition cursor-pointer">Search</button>
            </div>

            <PopularProjects fakePopularProjects={fakePopularProjects} />
        </div>
    );
}
