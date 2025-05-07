import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faCheckCircle, faTimesCircle, faBriefcase, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import useAuthStore from "../store/authStore";
import { toast } from "react-toastify";

const InboxPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        const fetchNotifications = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("access_token");
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/notifications/me`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                setNotifications(response.data);
                setError(null);
            } catch (err) {
                console.error("Error fetching notifications:", err);
                setError("Failed to load notifications. Please try again.");
                toast.error("Failed to load notifications");
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [isAuthenticated, navigate]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    const handleViewProject = (projectId) => {
        navigate(`/project/${projectId}/profile`);
    };

    const markAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem("access_token");
            await axios.post(
                `${import.meta.env.VITE_API_URL}/notifications/mark-read/${notificationId}`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            
            // Update the local state to mark this notification as read
            setNotifications(notifications.map(notification => 
                notification.id === notificationId 
                    ? { ...notification, read: true } 
                    : notification
            ));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const handleRejectionClick = (notification) => {
        // Mark rejection notification as read
        if (!notification.read) {
            markAsRead(notification.id);
        }
    };

    const handleNotificationClick = (notification) => {
        if (notification.type === "application_rejected") {
            handleRejectionClick(notification);
            return;
        }
        
        if (notification.project_id) {
            // Mark notification as read when clicked
            if (!notification.read) {
                markAsRead(notification.id);
            }
            handleViewProject(notification.project_id);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-green-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-md mb-4">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="py-6 sm:py-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-6">Inbox</h1>

            {notifications.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                        You don't have any notifications yet.
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                            Notifications
                        </h2>
                    </div>
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {notifications.map((notification) => (
                            <li
                                key={notification.id}
                                className={`p-4 transition-colors ${
                                    notification.project_id && notification.type !== "application_rejected" 
                                        ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' 
                                        : notification.type === "application_rejected"
                                          ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                          : ''
                                } ${!notification.read ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
                                onClick={() => {
                                    if (notification.type === "application_rejected") {
                                        handleRejectionClick(notification);
                                    } else if (notification.project_id) {
                                        handleNotificationClick(notification);
                                    }
                                }}
                            >
                                <div className="flex items-start justify-between flex-wrap sm:flex-nowrap gap-2">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            {notification.type === "application_accepted" ? (
                                                <FontAwesomeIcon
                                                    icon={faCheckCircle}
                                                    className="text-green-500 text-xl"
                                                />
                                            ) : notification.type === "application_rejected" ? (
                                                <FontAwesomeIcon
                                                    icon={faTimesCircle}
                                                    className="text-red-500 text-xl"
                                                />
                                            ) : (
                                                <FontAwesomeIcon
                                                    icon={faBriefcase}
                                                    className="text-blue-500 text-xl"
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p 
                                                className={`text-sm sm:text-base font-medium ${
                                                    notification.project_id && notification.type !== "application_rejected"
                                                        ? 'text-green-700 dark:text-green-400 hover:underline' 
                                                        : notification.type === "application_rejected"
                                                            ? 'text-red-700 dark:text-red-400'
                                                            : 'text-gray-800 dark:text-white'
                                                }`}
                                                onClick={(e) => {
                                                    if (notification.type === "application_rejected") {
                                                        e.stopPropagation();
                                                        handleRejectionClick(notification);
                                                    } else if (notification.project_id) {
                                                        e.stopPropagation();
                                                        handleNotificationClick(notification);
                                                    }
                                                }}
                                            >
                                                {notification.title}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                {formatDate(notification.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    {notification.type !== "application_rejected" && notification.project_id && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleNotificationClick(notification);
                                            }}
                                            className="px-3 py-1 mt-2 sm:mt-0 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors inline-flex items-center gap-1"
                                        >
                                            <span>View Project</span>
                                            <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default InboxPage; 