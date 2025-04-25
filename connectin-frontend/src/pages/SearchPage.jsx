import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faSpinner, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import SearchResults from "../components/Search/SearchResults";
import useSearchStore from "../store/searchStore";
import useDebounce from "../hooks/useDebounce";

export default function SearchPage() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialQuery = queryParams.get("q") || "";
    const [showLengthHint, setShowLengthHint] = useState(false);

    const { query, setQuery, search, clearResults, loading } = useSearchStore();

    // Set initial query from URL
    useEffect(() => {
        if (initialQuery) {
            setQuery(initialQuery);
            search(initialQuery);
        }
    }, [initialQuery, setQuery, search]);

    // Debounce search query to reduce API calls
    const debouncedQuery = useDebounce(query, 500);

    // Perform search when debounced query changes
    useEffect(() => {
        if (debouncedQuery.trim()) {
            search(debouncedQuery);

            // Update URL with search query
            const url = new URL(window.location);
            url.searchParams.set("q", debouncedQuery);
            window.history.pushState({}, "", url);
        } else if (debouncedQuery === "") {
            clearResults();

            // Remove query parameter from URL
            const url = new URL(window.location);
            url.searchParams.delete("q");
            window.history.pushState({}, "", url);
        }
    }, [debouncedQuery, search, clearResults]);

    // Handle input change
    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        // Show hint if query is less than 3 characters and not empty
        setShowLengthHint(value.trim().length > 0 && value.trim().length < 3);
    };

    // Handle submit
    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim().length >= 3) {
            search(query);
        }
    };

    // Handle key press
    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (query.trim().length >= 3) {
                search(query);
            }
        }
    };

    return (
        <div className="container mx-auto py-5 min-h-screen">
            {/* Search Bar with animation */}
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }} className="mb-6">
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row sm:space-x-4">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search for posts, projects, skills... (min. 3 characters)"
                            value={query}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            className="w-full bg-white text-sm pl-10 pr-4 py-3 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                        {showLengthHint && (
                            <div className="absolute -bottom-6 left-0 text-amber-600 text-xs flex items-center">
                                <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                                Search query must be at least 3 characters long
                            </div>
                        )}
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={!query.trim() || query.trim().length < 3 || loading}
                        className={`mt-2 sm:mt-0 px-6 py-3 font-semibold text-white rounded-md shadow-md transition ${!query.trim() || query.trim().length < 3 || loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-700 hover:bg-green-600"}`}
                        type="submit"
                    >
                        {loading ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                                Searching
                            </>
                        ) : (
                            "Search"
                        )}
                    </motion.button>
                </form>
            </motion.div>

            {/* Search Results */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <SearchResults />
                </div>
            </div>
        </div>
    );
}
