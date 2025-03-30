import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { CKEditor, useCKEditorCloud } from "@ckeditor/ckeditor5-react";

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
    const cloud = useCKEditorCloud({ version: "44.1.0" });

    // 🔹 Fetch Tags from DB
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
            }
        };

        fetchData();
        setIsLayoutReady(true);

        return () => setIsLayoutReady(false);
    }, [postType]);

    // 🔹 Handle Tag Selection (Limit max 10 tags)
    const handleTagSelection = (tagId) => {
        setSelectedTags((prevTags) => {
            if (prevTags.includes(tagId)) {
                return prevTags.filter((id) => id !== tagId); // Deselect tag
            } else if (prevTags.length < 10) {
                return [...prevTags, tagId]; // Select tag if limit not reached
            }
            return prevTags; // Do nothing if limit reached
        });
    };

    // 🔹 Handle Skill Selection
    const handleSkillSelection = (skillId) => {
        setSelectedSkills((prevSkills) => (prevSkills.includes(skillId) ? prevSkills.filter((id) => id !== skillId) : [...prevSkills, skillId]));
    };

    // 🔹 Submit Post
    const handleSubmit = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("access_token");

            if (!content.trim()) {
                alert("Content cannot be empty!");
                setLoading(false);
                return;
            }

            const payload = {
                title,
                content, // ✅ Ensure content is being sent correctly
                post_type: postType,
                project_id: projectId ? parseInt(projectId) : null,
                team_id: teamId ? parseInt(teamId) : null,
                tag_ids: selectedTags, // ✅ Send tag IDs properly
            };

            await axios.post(`${import.meta.env.VITE_API_URL}/posts`, payload, { headers: { Authorization: `Bearer ${token}` } });
            alert("Post created successfully!");
            setTitle("");
            setContent("");
            setPostType("news");
            setProjectId("");
            setTeamId("");
            setSelectedTags([]);
        } catch (error) {
            console.error("Failed to create post:", error);
        }
        setLoading(false);
    };

    // 🔹 CKEditor Configuration
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
        <div className="col-span-6 flex flex-col space-y-5 shadow-md rounded-md border border-green-700 bg-white p-5">
            <p className="font-semibold">New Post</p>

            {/* 🔹 Post Type Selection */}
            <select className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none" value={postType} onChange={(e) => setPostType(e.target.value)}>
                <option value="news">News</option>
                <option value="project">Project</option>
                <option value="team">Team</option>
            </select>

            {/* 🔹 Tag Selection (Only for Project Posts or News) */}
            {(postType === "project" || postType === "news") && (
                <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-sm">Select Tags (max 10):</p>
                    {tags.length > 0 ? (
                        // Отображаем только первые 20 тегов
                        tags.slice(0, 20).map((tag) => {
                            const isSelected = selectedTags.includes(tag.id);
                            return (
                                <button key={tag.id} onClick={() => handleTagSelection(tag.id)} className={`px-2 py-1 shadow-sm rounded-md text-sm cursor-pointer transition ${isSelected ? "bg-green-700 text-white" : ""}`}>
                                    {tag.name}
                                </button>
                            );
                        })
                    ) : (
                        <p className="text-gray-500 text-sm">No tags available.</p>
                    )}
                </div>
            )}

            {/* 🔹 Skill Selection (Only for Project Posts) */}
            {postType === "project" && (
                <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-sm">Select Required Skills:</p>
                    {skills.length > 0 ? (
                        skills.map((skill) => (
                            <button key={skill.id} onClick={() => handleSkillSelection(skill.id)} className={`px-2 py-1 shadow-sm rounded-md text-sm cursor-pointer transition ${selectedSkills.includes(skill.id) ? "bg-green-700 text-white" : ""}`}>
                                {skill.name}
                            </button>
                        ))
                    ) : (
                        <p className="text-gray-500 text-sm">No skills available.</p>
                    )}
                </div>
            )}

            {/* 🔹 CKEditor Content */}
            <div className="w-full text-sm border border-gray-200 rounded-md shadow-sm">
                {ClassicEditor && editorConfig && (
                    <CKEditor
                        editor={ClassicEditor}
                        config={editorConfig}
                        onChange={(event, editor) => {
                            const data = editor.getData();
                            setContent(data); // ✅ Update state when typing
                        }}
                    />
                )}
            </div>

            {/* 🔹 Submit Button */}
            <button type="submit" className="w-full font-semibold shadow-md bg-green-700 text-white py-2 rounded-md hover:bg-green-600 transition cursor-pointer" onClick={handleSubmit} disabled={loading}>
                {loading ? "Publishing..." : "Publish"}
            </button>
        </div>
    );
};

export default PublishPage;
