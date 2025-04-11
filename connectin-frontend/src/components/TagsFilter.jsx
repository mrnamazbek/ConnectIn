import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTags, faSearch } from "@fortawesome/free-solid-svg-icons";

const TagsFilter = ({ allTags, selectedTags, onTagSelect, initialTagLimit = 10, title = "Filter by Tags" }) => {
    const [showAllTags, setShowAllTags] = useState(false);
    const [tagSearchQuery, setTagSearchQuery] = useState("");

    const filteredTags = allTags.filter((tag) => tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()));

    const visibleTags = showAllTags ? filteredTags : filteredTags.slice(0, initialTagLimit);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
                <FontAwesomeIcon icon={faTags} className="text-green-700" />
                <h3 className="font-semibold text-lg">{title}</h3>
            </div>
            <div className="relative mb-3">
                <input type="text" placeholder="Search tags..." value={tagSearchQuery} onChange={(e) => setTagSearchQuery(e.target.value)} className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none dark:bg-gray-700 dark:border-zinc-600 dark:text-white" />
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <div className="flex flex-wrap gap-2">
                {visibleTags.map((tag) => (
                    <button
                        key={tag.id}
                        className={`px-3 py-1 rounded-full text-sm shadow-sm transition-all duration-200 ${selectedTags.includes(tag.id) ? "bg-green-700 text-white hover:bg-green-600" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
                        onClick={() => onTagSelect(tag.id)}
                    >
                        {tag.name}
                    </button>
                ))}
            </div>
            {filteredTags.length > initialTagLimit && (
                <button onClick={() => setShowAllTags(!showAllTags)} className="mt-3 text-sm text-green-700 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">
                    {showAllTags ? "Show Less" : `Show More (${filteredTags.length - initialTagLimit} more)`}
                </button>
            )}
        </div>
    );
};

export default TagsFilter;
