import { useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpFromBracket, faSpinner, faTrash, faUser } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

const AvatarUpload = ({ user, onAvatarUpdate, editMode }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size should be less than 5MB");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            setIsUploading(true);
            const token = localStorage.getItem("access_token");
            const response = await axios.patch(`${import.meta.env.VITE_API_URL}/users/me/avatar`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data) {
                onAvatarUpdate(response.data.avatar_url);
                toast.success("Avatar updated successfully");
            }
        } catch (error) {
            console.error("Failed to upload avatar:", error);
            toast.error("Failed to update avatar");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteAvatar = async () => {
        try {
            setIsDeleting(true);
            const token = localStorage.getItem("access_token");
            const response = await axios.delete(`${import.meta.env.VITE_API_URL}/users/me/avatar`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data) {
                onAvatarUpdate(null);
                toast.success("Avatar deleted successfully");
            }
        } catch (error) {
            console.error("Failed to delete avatar:", error);
            toast.error("Failed to delete avatar");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="relative">
            {user.avatar_url ? (
                <div className="flex flex-col items-center gap-2">
                    <img src={user.avatar_url} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-green-700 dark:border-green-500 shadow-lg" />
                    {editMode && (
                        <div className="flex gap-2 mt-2">
                            <label className="cursor-pointer px-3 py-1.5 bg-green-700 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-500 transition-colors flex items-center gap-2">
                                {isUploading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faArrowUpFromBracket} />}
                                <span className="text-sm">Change</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
                            </label>
                            <button onClick={handleDeleteAvatar} disabled={isDeleting} className="px-3 py-1.5 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-500 dark:hover:bg-red-400 transition-colors flex items-center gap-2">
                                {isDeleting ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faTrash} />}
                                <span className="text-sm">Delete</span>
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2">
                    <div className="w-32 h-32 rounded-full border-4 border-green-700 dark:border-green-500 shadow-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <FontAwesomeIcon icon={faUser} className="text-gray-400 text-4xl" />
                    </div>
                    {editMode && (
                        <label className="cursor-pointer px-3 py-1.5 bg-green-700 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-500 transition-colors flex items-center gap-2">
                            {isUploading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faArrowUpFromBracket} />}
                            <span className="text-sm">Upload Photo</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
                        </label>
                    )}
                </div>
            )}
        </div>
    );
};

export default AvatarUpload;
