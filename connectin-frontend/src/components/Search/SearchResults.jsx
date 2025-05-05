import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faNewspaper, faDiagramProject, faInfoCircle, faExclamationTriangle, faUser } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router";
import { PostCard } from "../Post/PostCard";
import ProjectCard from "../Project/ProjectCard";
import LoadingAnimation from "./LoadingAnimation";
import useSearchStore from "../../store/searchStore";
import usePostStore from "../../store/postStore";

const SearchResults = () => {
    const { query, loading, error, activeTab, setActiveTab, getFilteredResults, getTotalCount, hasSearched } = useSearchStore();

    const { initializePostState } = usePostStore();
    const [initialized, setInitialized] = useState(false);

    const results = getFilteredResults();
    const totalCount = getTotalCount();
    const isQueryTooShort = query.trim().length > 0 && query.trim().length < 3;

    // Format error message to ensure it's always a string
    const errorMessage = typeof error === "string" ? error : error ? "An error occurred during search" : null;

    // Initialize post states for all posts in search results
    useEffect(() => {
        if (results.posts.length > 0 && !initialized) {
            initializePostState(results.posts.map((post) => post.id));
            setInitialized(true);
        }
    }, [results.posts, initializePostState, initialized]);


    // Container animation
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.3,
                when: "beforeChildren",
                staggerChildren: 0.1,
            },
        },
        exit: {
            opacity: 0,
            transition: {
                duration: 0.2,
            },
        },
    };

    // Tab animation
    const tabVariants = {
        inactive: {
            borderColor: "transparent",
            color: "#6B7280",
            backgroundColor: "transparent",
        },
        active: {
            borderColor: "#047857",
            color: "#047857",
            backgroundColor: "rgba(4, 120, 87, 0.1)",
        },
    };

    return (
        <div className="w-full">
            {/* Tabs for filtering */}
            {hasSearched && !isQueryTooShort && !loading && !errorMessage && totalCount > 0 && (
                <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-wrap space-x-2">
                        <motion.button variants={tabVariants} animate={activeTab === "all" ? "active" : "inactive"} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="py-2 px-4 text-sm font-medium border-b-2 rounded-t-lg focus:outline-none" onClick={() => setActiveTab("all")}>
                            <FontAwesomeIcon icon={faSearch} className="mr-2" />
                            All ({totalCount})
                        </motion.button>

                        <motion.button variants={tabVariants} animate={activeTab === "users" ? "active" : "inactive"} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="py-2 px-4 text-sm font-medium border-b-2 rounded-t-lg focus:outline-none" onClick={() => setActiveTab("users")}>
                            <FontAwesomeIcon icon={faUser} className="mr-2" />
                            Users ({results.users.length})
                        </motion.button>

                        <motion.button variants={tabVariants} animate={activeTab === "posts" ? "active" : "inactive"} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="py-2 px-4 text-sm font-medium border-b-2 rounded-t-lg focus:outline-none" onClick={() => setActiveTab("posts")}>
                            <FontAwesomeIcon icon={faNewspaper} className="mr-2" />
                            Posts ({results.posts.length})
                        </motion.button>

                        <motion.button
                            variants={tabVariants}
                            animate={activeTab === "projects" ? "active" : "inactive"}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="py-2 px-4 text-sm font-medium border-b-2 rounded-t-lg focus:outline-none"
                            onClick={() => setActiveTab("projects")}
                        >
                            <FontAwesomeIcon icon={faDiagramProject} className="mr-2" />
                            Projects ({results.projects.length})
                        </motion.button>
                    </div>
                </div>
            )}

            {/* Loading state */}
            {loading && <LoadingAnimation />}

            {/* Query too short message */}
            {isQueryTooShort && !loading && (
                <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-4 rounded-md mb-4 flex items-start">
                    <FontAwesomeIcon icon={faInfoCircle} className="mr-2 mt-1 flex-shrink-0" />
                    <div>
                        <p className="font-medium">Search query too short</p>
                        <p className="text-sm">Please enter at least 3 characters to search.</p>
                    </div>
                </div>
            )}

            {/* Error state */}
            {errorMessage && !isQueryTooShort && (
                <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-md mb-4 flex items-start">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 mt-1 flex-shrink-0" />
                    <div>
                        <p className="font-medium">Search error</p>
                        <p className="text-sm">{errorMessage}</p>
                    </div>
                </div>
            )}

            {/* No results state */}
            {!loading && hasSearched && !isQueryTooShort && !errorMessage && totalCount === 0 && (
                <div className="text-center py-8">
                    <div className="text-gray-400 text-5xl mb-4">
                        <FontAwesomeIcon icon={faSearch} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No results found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">No matches found for "{query}". Try different keywords or check your spelling.</p>
                </div>
            )}

            {/* Results */}
            {!loading && hasSearched && !isQueryTooShort && !errorMessage && totalCount > 0 && (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab} // Change key when tab changes to trigger animation
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="space-y-4"
                    >
                        {/* Show users if on 'all' or 'users' tab */}
                        {(activeTab === "all" || activeTab === "users") && results.users.length > 0 && (
                            <>
                                {activeTab === "all" && <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-2 mb-3">Users ({results.users.length})</h2>}
                                <div className="space-y-3">
                                    {results.users.map((user) => (
                                        <motion.div key={`user-${user.id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                                            <Link to={`/profile/${user.id}`} className="block">
                                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow flex items-center">
                                                    <div className="flex-shrink-0 mr-4">
                                                        {user.avatar_url ? (
                                                            <img src={user.avatar_url} alt={user.username} className="w-12 h-12 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                                <FontAwesomeIcon icon={faUser} className="text-gray-500 dark:text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}</h3>
                                                        <p className="text-sm text-gray-600 dark:text-gray-300">@{user.username}</p>
                                                        {user.position && <p className="text-sm text-gray-500 dark:text-gray-400">{user.position}</p>}
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Show posts if on 'all' or 'posts' tab */}
                        {(activeTab === "all" || activeTab === "posts") && results.posts.length > 0 && (
                            <>
                                {activeTab === "all" && <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6 mb-3">Posts ({results.posts.length})</h2>}
                                <div className="space-y-3">
                                    {results.posts.map((post) => (
                                        <motion.div key={`post-${post.id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                                            <PostCard post={post} />
                                        </motion.div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Show projects if on 'all' or 'projects' tab */}
                        {(activeTab === "all" || activeTab === "projects") && results.projects.length > 0 && (
                            <>
                                {activeTab === "all" && <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6 mb-3">Projects ({results.projects.length})</h2>}
                                <div className="space-y-3">
                                    {results.projects.map((project) => (
                                        <motion.div key={`project-${project.id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                                            <ProjectCard project={project} handleApply={handleApply} />
                                        </motion.div>
                                    ))}
                                </div>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
};

export default SearchResults;
