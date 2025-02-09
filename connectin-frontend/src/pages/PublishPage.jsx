import React, { useState, useEffect, useRef, useMemo } from "react";
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
    const [loading, setLoading] = useState(false);
    const [isLayoutReady, setIsLayoutReady] = useState(false);
    const cloud = useCKEditorCloud({ version: "44.1.0" });

    // 🔹 Fetch Tags from DB
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await axios.get("http://127.0.0.1:8000/tags/");
                setTags(response.data);
            } catch (error) {
                console.error("Failed to fetch tags:", error);
            }
        };

        fetchTags();
        setIsLayoutReady(true);

        return () => setIsLayoutReady(false);
    }, []);

    // 🔹 Handle Tag Selection
    const handleTagSelection = (tagId) => {
        setSelectedTags((prevTags) => (prevTags.includes(tagId) ? prevTags.filter((id) => id !== tagId) : [...prevTags, tagId]));
    };

    // 🔹 Submit Post
    const handleSubmit = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");

            if (!content.trim()) {
                alert("Content cannot be empty!");
                setLoading(false);
                return;
            }

            const payload = {
                title,
                content,  // ✅ Ensure content is being sent correctly
                post_type: postType,
                project_id: projectId ? parseInt(projectId) : null,
                team_id: teamId ? parseInt(teamId) : null,
                tag_ids: selectedTags,  // ✅ Send tag IDs properly
            };

            await axios.post(
                "http://127.0.0.1:8000/posts",
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
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
            Heading,
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
                        "heading",
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
                    Heading,
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
                heading: {
                    options: [
                        { model: "paragraph", title: "Paragraph", class: "ck-heading_paragraph" },
                        { model: "heading1", view: "h1", title: "Heading 1", class: "ck-heading_heading1" },
                        { model: "heading2", view: "h2", title: "Heading 2", class: "ck-heading_heading2" },
                        { model: "heading3", view: "h3", title: "Heading 3", class: "ck-heading_heading3" },
                        { model: "heading4", view: "h4", title: "Heading 4", class: "ck-heading_heading4" },
                        { model: "heading5", view: "h5", title: "Heading 5", class: "ck-heading_heading5" },
                        { model: "heading6", view: "h6", title: "Heading 6", class: "ck-heading_heading6" },
                    ],
                },
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

            {/* 🔹 Post Title Input */}
            <input className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none" placeholder="Enter your post title..." value={title} onChange={(e) => setTitle(e.target.value)} />

            {/* 🔹 Tag Selection (Only for Project Posts) */}
            {(postType === "project" || postType === "news") && (
                <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-sm">Select Tags:</p>
                    {tags.length > 0 ? (
                        tags.map((tag) => (
                            <button key={tag.id} onClick={() => handleTagSelection(tag.id)} className={`px-2 py-1 shadow-sm rounded-md text-sm cursor-pointer transition ${selectedTags.includes(tag.id) ? "bg-green-700 text-white" : ""}`}>
                                {tag.name}
                            </button>
                        ))
                    ) : (
                        <p className="text-gray-500 text-sm">No tags available.</p>
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
