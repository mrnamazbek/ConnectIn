import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTags, faSearch, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";

const TagsFilter = ({ allTags, selectedTags, onTagSelect, initialTagLimit = 10, title = "Filter by Tags" }) => {
    const [showAllTags, setShowAllTags] = useState(false);
    const [tagSearchQuery, setTagSearchQuery] = useState("");

    const filteredTags = allTags.filter((tag) => tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()));

    const visibleTags = showAllTags ? filteredTags : filteredTags.slice(0, initialTagLimit);

    const containerVariants = {
        hidden: { height: "fit-content" },
        visible: { height: "auto" }
    };

    const tagVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.02,
                duration: 0.2
            }
        })
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
                <FontAwesomeIcon icon={faTags} className="text-green-700" />
                <h3 className="font-semibold">{title}</h3>
            </div>
            <div className="relative mb-3">
                <input type="text" placeholder="Search tags..." value={tagSearchQuery} onChange={(e) => setTagSearchQuery(e.target.value)} className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none dark:bg-gray-700 dark:border-zinc-600 dark:text-white" />
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <motion.div
                className="flex flex-wrap gap-2 overflow-y-auto"
                style={{ maxHeight: showAllTags ? "300px" : "auto" }}
                variants={containerVariants}
                initial="hidden"
                animate={showAllTags ? "visible" : "hidden"}
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
                <AnimatePresence>
                    {visibleTags.map((tag, index) => (
                        <motion.button
                            key={tag.id}
                            custom={index}
                            variants={tagVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className={`px-3 py-1 rounded-full text-xs cursor-pointer shadow-sm transition-all duration-200 ${
                                selectedTags.includes(tag.id) ? "bg-green-700 text-white hover:bg-green-600" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                            onClick={() => onTagSelect(tag.id)}
                        >
                            {tag.name}
                        </motion.button>
                    ))}
                </AnimatePresence>
            </motion.div>
            {filteredTags.length > initialTagLimit && (
                <button onClick={() => setShowAllTags(!showAllTags)} className="mt-3 cursor-pointer text-sm text-green-700 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 flex items-center gap-1">
                    {showAllTags ? (
                        <>
                            <span>Show Less</span>
                            <FontAwesomeIcon icon={faChevronUp} className="text-xs" />
                        </>
                    ) : (
                        <>
                            <span>Show More ({filteredTags.length - initialTagLimit} more)</span>
                            <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
                        </>
                    )}
                </button>
            )}
        </div>
    );
};

export default TagsFilter;
