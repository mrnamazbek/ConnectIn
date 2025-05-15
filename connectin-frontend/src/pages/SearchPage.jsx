import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faSpinner, faInfoCircle, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import SearchResults from "../components/Search/SearchResults";
import useSearchStore from "../store/searchStore";
import { debounce } from "lodash";

export default function SearchPage() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialQuery = queryParams.get("q") || "";
    const [showLengthHint, setShowLengthHint] = useState(false);
    const [localQuery, setLocalQuery] = useState(initialQuery);

    const { 
        query, 
        setQuery, 
        search, 
        clearResults, 
        loading,
        pagination,
        setPagination,
        getTotalCount
    } = useSearchStore();

    // Debounced search function
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSearch = useCallback(
        debounce((searchQuery) => {
            if (searchQuery.trim().length >= 3) {
                search(searchQuery);
                // Update URL with search query
                const url = new URL(window.location);
                url.searchParams.set("q", searchQuery);
                window.history.pushState({}, "", url);
            } else if (searchQuery.trim() === "") {
                clearResults();
                // Remove query parameter from URL
                const url = new URL(window.location);
                url.searchParams.delete("q");
                window.history.pushState({}, "", url);
            }
        }, 500),
        [search, clearResults]
    );

    // Set initial query from URL and search if there is a query
    useEffect(() => {
        if (initialQuery) {
            setQuery(initialQuery);
            setLocalQuery(initialQuery);
            search(initialQuery);
        }
    }, [initialQuery, setQuery, search]);

    // Handle input change - update local state and show hint
    const handleInputChange = (e) => {
        const value = e.target.value;
        setLocalQuery(value);
        setQuery(value);
        
        // Show hint if query is less than 3 characters and not empty
        setShowLengthHint(value.trim().length > 0 && value.trim().length < 3);
        
        // Trigger debounced search for queries of 3+ characters
        if (value.trim().length >= 3 || value.trim() === "") {
            debouncedSearch(value);
        }
    };

    // Handle submit - immediately search without debounce
    const handleSubmit = (e) => {
        e.preventDefault();
        if (localQuery.trim().length >= 3) {
            debouncedSearch.cancel(); // Cancel any pending debounced searches
            search(localQuery);
            // Update URL with search query
            const url = new URL(window.location);
            url.searchParams.set("q", localQuery);
            window.history.pushState({}, "", url);
        } else if (localQuery.trim() === "") {
            clearResults();
            // Remove query parameter from URL
            const url = new URL(window.location);
            url.searchParams.delete("q");
            window.history.pushState({}, "", url);
        }
    };

    // Handle pagination
    const handlePageChange = (newPage) => {
        if (newPage >= 1) {
            setPagination({ currentPage: newPage });
            search(query, { page: newPage, pageSize: pagination.pageSize });
            
            // Scroll to top of results
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Calculate total pages
    const totalPages = Math.ceil(pagination.totalItems / pagination.pageSize) || 1;

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
                            value={localQuery}
                            onChange={handleInputChange}
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
                        disabled={!localQuery.trim() || localQuery.trim().length < 3 || loading}
                        className={`mt-2 sm:mt-0 cursor-pointer px-6 py-3 font-semibold text-white rounded-md shadow-md transition ${!localQuery.trim() || localQuery.trim().length < 3 || loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-700 hover:bg-green-600"}`}
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
            <div className="w-full">
                <SearchResults />

                {/* Pagination Controls */}
                {getTotalCount() > 0 && (
                    <div className="flex justify-center items-center mt-8 mb-4">
                        <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow">
                            <button
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage <= 1}
                                className={`p-2 rounded-md ${pagination.currentPage <= 1 ? 'text-gray-400 cursor-not-allowed' : 'text-green-700 hover:bg-green-50 dark:hover:bg-gray-700'}`}
                            >
                                <FontAwesomeIcon icon={faChevronLeft} />
                            </button>
                            
                            <div className="text-sm font-medium mx-2">
                                Page {pagination.currentPage} of {totalPages}
                                <span className="text-gray-500 ml-2 hidden sm:inline">
                                    ({pagination.totalItems} {pagination.totalItems === 1 ? 'result' : 'results'})
                                </span>
                            </div>
                            
                            <button
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage >= totalPages}
                                className={`p-2 rounded-md ${pagination.currentPage >= totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-green-700 hover:bg-green-50 dark:hover:bg-gray-700'}`}
                            >
                                <FontAwesomeIcon icon={faChevronRight} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
