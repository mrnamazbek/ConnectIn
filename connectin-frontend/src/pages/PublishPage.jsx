import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { CKEditor, useCKEditorCloud } from "@ckeditor/ckeditor5-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

const LICENSE_KEY = import.meta.env.VITE_CKEDITOR_LICENSE_KEY;

const PublishPage = () => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [postType, setPostType] = useState("news");
    const [projectId, setProjectId] = useState("");
    const [teamId, setTeamId] = useState("");
    const [skills, setSkills] = useState([]);
    const [tags, setTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isLayoutReady, setIsLayoutReady] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showAllTags, setShowAllTags] = useState(false);
    const [showAllSkills, setShowAllSkills] = useState(false);
    const [error, setError] = useState(null);
    const cloud = useCKEditorCloud({ version: "44.1.0" });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const tagRes = await axios.get(`${import.meta.env.VITE_API_URL}/tags/`);
                setTags(tagRes.data);

                if (postType === "project") {
                    const skillRes = await axios.get(`${import.meta.env.VITE_API_URL}/skills/`);
                    setSkills(skillRes.data);
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
                setError("Failed to load tags and skills. Please try again.");
                toast.error("Failed to load tags and skills");
            }
        };

        fetchData();
        setIsLayoutReady(true);

        return () => setIsLayoutReady(false);
    }, [postType]);

    // 🔹 Filter tags and skills based on search query
    const filteredTags = useMemo(() => {
        return tags.filter((tag) => tag.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [tags, searchQuery]);

    const filteredSkills = useMemo(() => {
        return skills.filter((skill) => skill.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [skills, searchQuery]);

    const handleTagSelection = (tagId) => {
        setSelectedTags((prevTags) => {
            if (prevTags.includes(tagId)) {
                return prevTags.filter((id) => id !== tagId);
            } else if (prevTags.length < 10) {
                return [...prevTags, tagId];
            } else {
                toast.warning("You can only select up to 10 tags");
                return prevTags;
            }
        });
    };

    const handleSkillSelection = (skillId) => {
        setSelectedSkills((prevSkills) => (prevSkills.includes(skillId) ? prevSkills.filter((id) => id !== skillId) : [...prevSkills, skillId]));
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast.error("Title cannot be empty!");
            return;
        }

        if (!content.trim()) {
            toast.error("Content cannot be empty!");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                toast.error("Please login to create a post");
                return;
            }

            const payload = {
                title,
                content,
                post_type: postType,
                project_id: projectId ? parseInt(projectId) : null,
                team_id: teamId ? parseInt(teamId) : null,
                tag_ids: selectedTags,
                skill_ids: postType === "project" ? selectedSkills : [],
            };

            await axios.post(`${import.meta.env.VITE_API_URL}/posts/`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            toast.success("Post created successfully!");
            setTitle("");
            setContent("");
            setPostType("news");
            setProjectId("");
            setTeamId("");
            setSelectedTags([]);
            setSelectedSkills([]);
        } catch (error) {
            console.error("Failed to create post:", error);
            toast.error(error.response?.data?.message || "Failed to create post");
        } finally {
            setLoading(false);
        }
    };

    // CKEditor Configuration
    const { ClassicEditor, editorConfig } = useMemo(() => {
        if (cloud.status !== "success" || !isLayoutReady) {
            return {};
        }

        const {
            ClassicEditor,
            Autosave,
            BlockQuote,
            Bold,
            Code,
            Essentials,
            FontBackgroundColor,
            FontColor,
            FontFamily,
            FontSize,
            Highlight,
            Indent,
            IndentBlock,
            Italic,
            Link,
            Paragraph,
            RemoveFormat,
            SpecialCharacters,
            Strikethrough,
            Subscript,
            Superscript,
            Table,
            TableCaption,
            TableCellProperties,
            TableColumnResize,
            TableProperties,
            TableToolbar,
            Underline,
        } = cloud.CKEditor;

        return {
            ClassicEditor,
            editorConfig: {
                toolbar: {
                    items: [
                        "|",
                        "fontSize",
                        "fontFamily",
                        "fontColor",
                        "fontBackgroundColor",
                        "|",
                        "bold",
                        "italic",
                        "underline",
                        "strikethrough",
                        "subscript",
                        "superscript",
                        "code",
                        "removeFormat",
                        "|",
                        "specialCharacters",
                        "link",
                        "insertTable",
                        "highlight",
                        "blockQuote",
                        "|",
                        "outdent",
                        "indent",
                    ],
                    shouldNotGroupWhenFull: true,
                },
                plugins: [
                    Autosave,
                    BlockQuote,
                    Bold,
                    Code,
                    Essentials,
                    FontBackgroundColor,
                    FontColor,
                    FontFamily,
                    FontSize,
                    Highlight,
                    Indent,
                    IndentBlock,
                    Italic,
                    Link,
                    Paragraph,
                    RemoveFormat,
                    SpecialCharacters,
                    Strikethrough,
                    Subscript,
                    Superscript,
                    Table,
                    TableCaption,
                    TableCellProperties,
                    TableColumnResize,
                    TableProperties,
                    TableToolbar,
                    Underline,
                ],
                fontFamily: { supportAllValues: true },
                fontSize: { options: [10, 12, 14, "default", 18, 20, 22], supportAllValues: true },
                licenseKey: LICENSE_KEY,
                link: {
                    addTargetToExternalLinks: true,
                    defaultProtocol: "https://",
                    decorators: {
                        toggleDownloadable: {
                            mode: "manual",
                            label: "Downloadable",
                            attributes: { download: "file" },
                        },
                    },
                },
                placeholder: "Enter your post content here...",
                table: {
                    contentToolbar: ["tableColumn", "tableRow", "mergeTableCells", "tableProperties", "tableCellProperties"],
                },
            },
        };
    }, [cloud, isLayoutReady]);

    return (
        <div className="col-span-6 flex flex-col space-y-5 shadow-md rounded-md border border-green-700 bg-white dark:bg-gray-800 p-5">
            <p className="font-semibold text-xl dark:text-white">Create New Post</p>

            {/* Post Type Selection */}
            <select className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm focus:outline-none bg-white dark:bg-gray-700 dark:text-white" value={postType} onChange={(e) => setPostType(e.target.value)}>
                <option value="news" className="dark:bg-gray-800">
                    News
                </option>
                <option value="project" className="dark:bg-gray-800">
                    Project
                </option>
                <option value="team" className="dark:bg-gray-800">
                    Team
                </option>
            </select>

            {/* Title Input */}
            <input
                type="text"
                placeholder="Enter post title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm focus:outline-none bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />

            {/* Search Input for Tags and Skills */}
            {(postType === "project" || postType === "news") && (
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search tags and skills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-sm px-3 py-2 pl-10 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm focus:outline-none bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    />
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" />
                </div>
            )}

            {/* Tags Section */}
            {(postType === "project" || postType === "news") && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm dark:text-gray-300">Tags (max 10):</p>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{selectedTags.length}/10</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(showAllTags ? filteredTags : filteredTags.slice(0, 10)).map((tag) => (
                            <button
                                key={tag.id}
                                onClick={() => handleTagSelection(tag.id)}
                                className={`px-2 py-1 rounded-full text-xs shadow-sm transition-all duration-200 ${selectedTags.includes(tag.id) ? "bg-green-700 text-white hover:bg-green-600" : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"}`}
                            >
                                {tag.name}
                            </button>
                        ))}
                    </div>
                    {filteredTags.length > 10 && (
                        <button onClick={() => setShowAllTags(!showAllTags)} className="text-sm text-green-700 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">
                            {showAllTags ? "Show Less" : `Show More (${filteredTags.length - 10} more)`}
                        </button>
                    )}
                </div>
            )}

            {/* Skills Section (Only for Project Posts) */}
            {postType === "project" && (
                <div className="space-y-2">
                    <p className="font-semibold text-sm dark:text-gray-300">Required Skills:</p>
                    <div className="flex flex-wrap gap-2">
                        {(showAllSkills ? filteredSkills : filteredSkills.slice(0, 10)).map((skill) => (
                            <button
                                key={skill.id}
                                onClick={() => handleSkillSelection(skill.id)}
                                className={`px-2 py-1 rounded-full text-xs shadow-sm transition-all duration-200 ${selectedSkills.includes(skill.id) ? "bg-blue-700 text-white hover:bg-blue-600" : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"}`}
                            >
                                {skill.name}
                            </button>
                        ))}
                    </div>
                    {filteredSkills.length > 10 && (
                        <button onClick={() => setShowAllSkills(!showAllSkills)} className="text-sm text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                            {showAllSkills ? "Show Less" : `Show More (${filteredSkills.length - 10} more)`}
                        </button>
                    )}
                </div>
            )}

            {/* Selected Tags and Skills Display */}
            {(selectedTags.length > 0 || selectedSkills.length > 0) && (
                <div className="space-y-2">
                    {selectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            <p className="font-semibold text-sm dark:text-gray-300">Selected Tags:</p>
                            {selectedTags.map((tagId) => {
                                const tag = tags.find((t) => t.id === tagId);
                                return (
                                    tag && (
                                        <span key={tag.id} className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
                                            {tag.name}
                                        </span>
                                    )
                                );
                            })}
                        </div>
                    )}
                    {selectedSkills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            <p className="font-semibold text-sm dark:text-gray-300">Selected Skills:</p>
                            {selectedSkills.map((skillId) => {
                                const skill = skills.find((s) => s.id === skillId);
                                return (
                                    skill && (
                                        <span key={skill.id} className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                                            {skill.name}
                                        </span>
                                    )
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* CKEditor Content */}
            <div className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-md shadow-sm">
                {ClassicEditor && editorConfig && (
                    <CKEditor
                        editor={ClassicEditor}
                        config={editorConfig}
                        onChange={(event, editor) => {
                            const data = editor.getData();
                            setContent(data);
                        }}
                    />
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="flex items-center gap-2 text-red-500 dark:text-red-400 text-sm">
                    <FontAwesomeIcon icon={faExclamationCircle} />
                    <span>{error}</span>
                </div>
            )}

            {/* Submit Button */}
            <button type="submit" className="w-full font-semibold shadow-md bg-green-700 text-white py-2 rounded-md hover:bg-green-600 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleSubmit} disabled={loading}>
                {loading ? "Publishing..." : "Publish"}
            </button>
        </div>
    );
};

export default PublishPage;
