// src/pages/SearchPage.jsx
import React, { useState } from "react";
import PopularProjects from "../components/PopularProjects";
import { fakePopularProjects } from "../data/data";

export default function SearchPage() {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="grid grid-cols-8 gap-4 my-5 min-h-screen items-start text-black">
            {/* Left Column */}
            <div className="col-span-6 flex space-x-5 bg-white p-5">
                <input type="text" placeholder="Search for a technology..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="p-1 w-full border border-gray-300 shadow-sm focus:outline-none focus:ring focus:ring-green-600" />
                <button className="border border-gray-300 bg-gray-200 px-5 shadow-md cursor-pointer">Search</button>
            </div>

            {/* Right Column */}
            <PopularProjects fakePopularProjects={fakePopularProjects} />
        </div>
    );
}
