import { useNavigate } from "react-router";

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
            <div className="relative">
                <h1 className="text-9xl font-bold text-gray-200 dark:text-gray-800 mb-4">404</h1>
                <div className="absolute inset-0 flex items-center justify-center">
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Page Not Found</h2>
                </div>
            </div>

            <div className="mt-16 max-w-md">
                <p className="text-gray-600 dark:text-gray-400 mb-8">The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>

                <div className="space-y-4">
                    <button onClick={() => navigate(-1)} className="px-6 py-2 mr-4 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200 text-gray-800 dark:text-gray-200">
                        Go Back
                    </button>

                    <button onClick={() => navigate("/")} className="px-6 py-2 rounded-md bg-green-600 hover:bg-green-700 transition-colors duration-200 text-white">
                        Go Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
