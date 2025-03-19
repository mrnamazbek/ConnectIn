import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useNavigate } from "react-router";
import { faGoogle, faGithub } from "@fortawesome/free-brands-svg-icons";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import Cookies from "js-cookie";

// Axios interceptor for token refresh
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem("refresh_token");
                if (!refreshToken) throw new Error("No refresh token");
                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL}/refresh_token`,
                    { refresh_token: refreshToken },
                    {
                        headers: { "Content-Type": "application/json" },
                    }
                );
                const newAccessToken = response.data.access_token;
                localStorage.setItem("access_token", newAccessToken);
                axios.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return axios(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

const LoginPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const validationSchema = Yup.object({
        username: Yup.string().required("Username is required").min(3, "Username must be at least 3 characters long"),
        password: Yup.string().required("Password is required"),
    });

    const formik = useFormik({
        initialValues: {
            username: "",
            password: "",
        },
        validationSchema,
        validateOnBlur: true,
        validateOnChange: true,
        onSubmit: async (values, { setSubmitting }) => {
            setLoading(true);
            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL}/auth/login`,
                    {
                        username: values.username,
                        password: values.password,
                    },
                    {
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    }
                );
                localStorage.setItem("access_token", response.data.access_token);
                localStorage.setItem("refresh_token", response.data.refresh_token);
                navigate("/");
            } catch (error) {
                console.error("Login failed:", error.response?.data || error.message);
                formik.setErrors({ submit: "Invalid username or password. Please try again." });
            } finally {
                setLoading(false);
                setSubmitting(false);
            }
        },
    });

    useEffect(() => {
        // Handle OAuth redirect
        const accessTokenCookie = Cookies.get("access_token");
        const refreshTokenCookie = Cookies.get("refresh_token");
        if (accessTokenCookie && refreshTokenCookie) {
            localStorage.setItem("access_token", accessTokenCookie);
            localStorage.setItem("refresh_token", refreshTokenCookie);
            Cookies.remove("access_token");
            Cookies.remove("refresh_token");
            navigate("/");
        }
    }, [navigate]);

    const handleOAuthLogin = (provider) => {
        window.location.href = `http://${import.meta.env.VITE_API_URL}/auth/${provider}/login`;
    };

    return (
        <div className="flex justify-center items-center min-h-screen -mt-13 px-4">
            <div className="flex flex-wrap md:flex-nowrap border border-green-700 rounded-md bg-white shadow-lg w-full max-w-3xl">
                {/* Left Side: Form */}
                <div className="flex flex-col flex-1 p-6">
                    <h1 className="text-xl font-semibold text-gray-800 mb-2">Welcome!</h1>
                    <p className="text-sm text-gray-500 mb-6">Enter your credentials to continue</p>

                    <form onSubmit={formik.handleSubmit} className="space-y-4">
                        {/* Username Field */}
                        <div className="space-y-2">
                            <label htmlFor="username" className="font-semibold text-sm text-gray-700">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                className={`w-full text-sm px-3 py-2 border rounded-md shadow-sm focus:outline-none ${formik.touched.username && formik.errors.username ? "border-red-500" : "border-gray-300"}`}
                                placeholder="Enter your username"
                                autoFocus
                                {...formik.getFieldProps("username")}
                            />
                            {formik.touched.username && formik.errors.username && <p className="text-red-500 text-xs mt-1">{formik.errors.username}</p>}
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="font-semibold text-sm text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                className={`w-full text-sm px-3 py-2 border rounded-md shadow-sm focus:outline-none ${formik.touched.password && formik.errors.password ? "border-red-500" : "border-gray-300"}`}
                                placeholder="Enter your password"
                                {...formik.getFieldProps("password")}
                            />
                            {formik.touched.password && formik.errors.password && <p className="text-red-500 text-xs mt-1">{formik.errors.password}</p>}
                        </div>

                        {/* Submit Button */}
                        <div className="mt-6">
                            <button
                                type="submit"
                                disabled={formik.isSubmitting || loading}
                                className="w-full font-semibold cursor-pointer shadow-md bg-green-700 text-white py-2 rounded-md hover:bg-green-600 transition disabled:bg-green-600 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {loading ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                                        Signing in...
                                    </>
                                ) : (
                                    "Sign in"
                                )}
                            </button>
                            {formik.errors.submit && <p className="text-red-500 text-xs mt-2 text-center">{formik.errors.submit}</p>}
                        </div>

                        {/* OAuth Buttons */}
                        {/* <div className="flex justify-between space-x-3 mt-4">
                            <button type="button" className="w-full flex items-center justify-center border border-gray-300 py-2 font-semibold rounded-md shadow-md hover:bg-gray-50 transition cursor-pointer" onClick={() => handleOAuthLogin("google")}>
                                <FontAwesomeIcon icon={faGoogle} className="mr-2 text-red-500" /> Google
                            </button>
                            <button type="button" className="w-full flex items-center justify-center border border-gray-300 py-2 font-semibold rounded-md shadow-md hover:bg-gray-50 transition cursor-pointer" onClick={() => handleOAuthLogin("github")}>
                                <FontAwesomeIcon icon={faGithub} className="mr-2 text-gray-800" /> Github
                            </button>
                        </div> */}

                        {/* Register Link */}
                        <p className="text-sm text-center mt-6">
                            <span className="text-gray-500">Don't have an account?</span>
                            <Link to="/register" className="font-semibold text-green-700 ml-1 hover:underline">
                                Sign up here
                            </Link>
                        </p>
                    </form>
                </div>

                {/* Right Side: Welcome Banner */}
                <div className="bg-green-700 rounded-r-md flex-1 flex justify-center items-center px-6 md:flex">
                    <p className="text-white text-center font-semibold text-xl leading-tight">
                        ConnectIn: <br /> Build Projects. <br /> Grow Skills. <br /> Find Your Team.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
