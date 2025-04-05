import { useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

const AvatarUpload = ({ user, onAvatarUpdate }) => {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size should be less than 5MB");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            setIsUploading(true);
            const token = localStorage.getItem("access_token");
            const response = await axios.patch(
                `${import.meta.env.VITE_API_URL}/users/me/avatar`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

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

    return (
        <div className="relative group">
            <img
                src={user.avatar_url || "https://via.placeholder.com/150"}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-green-700 dark:border-green-500 shadow-lg"
            />
            <label
                className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer transition-opacity ${
                    isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
            >
                {isUploading ? (
                    <FontAwesomeIcon icon={faSpinner} className="text-white text-2xl animate-spin" />
                ) : (
                    <FontAwesomeIcon icon={faCamera} className="text-white text-2xl" />
                )}
                <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isUploading}
                />
            </label>
        </div>
    );
};

export default AvatarUpload; 