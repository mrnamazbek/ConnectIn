import { useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faFile, faSpinner, faTimes, faFileImage, faFilePdf, faFileAudio, faFileVideo, faFileArchive, faFileAlt } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

const MediaUpload = ({ conversationId, onMediaSent }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size should be less than 10MB");
            return;
        }

        setSelectedFile(file);

        // Create preview for images
        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    const clearSelection = () => {
        setSelectedFile(null);
        setPreview(null);
        setUploadProgress(0);
    };

    const uploadMedia = async () => {
        if (!selectedFile || !conversationId) return;

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("conversation_id", conversationId);

        try {
            setIsUploading(true);
            setUploadProgress(0);

            const token = localStorage.getItem("access_token");
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/chats/${conversationId}/media`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                },
            });

            if (response.data) {
                toast.success("Media sent successfully");
                onMediaSent(response.data);
                clearSelection();
            }
        } catch (error) {
            console.error("Failed to upload media:", error);
            toast.error("Failed to send media. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    // Function to get the appropriate icon based on file type
    const getFileIcon = (file) => {
        if (!file) return faFile;

        const type = file.type;

        if (type.startsWith("image/")) return faFileImage;
        if (type.startsWith("video/")) return faFileVideo;
        if (type.startsWith("audio/")) return faFileAudio;
        if (type === "application/pdf") return faFilePdf;
        if (type.includes("zip") || type.includes("rar") || type.includes("tar") || type.includes("gz")) return faFileArchive;

        return faFileAlt;
    };

    // Function to format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";

        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className="media-upload">
            {!selectedFile ? (
                <label className="media-upload-button p-2 text-green-600 hover:text-green-700 cursor-pointer">
                    <FontAwesomeIcon icon={faImage} className="text-xl" />
                    <input type="file" className="hidden" onChange={handleFileSelect} accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" />
                </label>
            ) : (
                <div className="media-preview bg-gray-50 p-3 rounded-lg mb-3">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                            {preview ? (
                                <div className="w-16 h-16 rounded overflow-hidden bg-gray-200 mr-3 flex-shrink-0">
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded bg-gray-200 mr-3 flex-shrink-0 flex items-center justify-center">
                                    <FontAwesomeIcon icon={getFileIcon(selectedFile)} className="text-gray-500 text-2xl" />
                                </div>
                            )}
                            <div className="text-sm">
                                <p className="font-medium text-gray-800 truncate max-w-[150px]">{selectedFile.name}</p>
                                <p className="text-gray-500">{formatFileSize(selectedFile.size)}</p>
                            </div>
                        </div>
                        <button onClick={clearSelection} className="text-gray-500 hover:text-gray-700" disabled={isUploading}>
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>

                    {isUploading ? (
                        <div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Uploading...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                        </div>
                    ) : (
                        <button onClick={uploadMedia} className="w-full py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm">
                            Send
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default MediaUpload;
