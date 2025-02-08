// src/pages/SearchPage.jsx
import React, { useState } from "react";
import PopularProjects from "../components/PopularProjects";
import { fakePopularProjects } from "../data/data";

export default function SearchPage() {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="grid grid-cols-8 gap-4 my-5 min-h-screen items-start text-black">
            {/* Left Column */}
            <div className="col-span-6 flex space-x-5">
                <input type="text" placeholder="Search for..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white text-sm px-3 py-2 border border-gray-200 rounded-md shadow-sm" />
                <button className="font-semibold shadow-md bg-green-700 text-white px-4 rounded-md hover:bg-green-600 transition cursor-pointer">Search</button>
            </div>

            {/* Right Column */}
            <PopularProjects fakePopularProjects={fakePopularProjects} />
        </div>
    );
}
