import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NavLink, useNavigate } from "react-router";
import { faGoogle, faGithub } from "@fortawesome/free-brands-svg-icons";

const LoginPage = () => {
    const navigate = useNavigate();

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
        validateOnBlur: false,
        validateOnChange: true,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                const response = await axios.post(
                    "http://127.0.0.1:8000/auth/login",
                    {
                        username: values.username,
                        password: values.password,
                    },
                    {
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    }
                );

                console.log("Login successful:", response.data);
                localStorage.setItem("token", response.data.access_token);

                alert(`Welcome ${response.data.user.username}!`);
                navigate("/");
            } catch (error) {
                console.error("Login failed:", error);
                alert("Login failed. Please check your credentials and try again.");
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <div className="flex justify-center items-center min-h-screen -mt-13 px-4">
            <div className="flex flex-wrap md:flex-nowrap border border-green-700 rounded-md bg-white shadow-lg w-full max-w-3xl">
                {/* Left Side: Form */}
                <div className="flex flex-col flex-1 p-6">
                    <h1 className="text-lg font-semibold">Welcome!</h1>
                    <p className="text-sm text-gray-500">Enter your username and password to continue</p>

                    <form onSubmit={formik.handleSubmit} className="mt-4">
                        <div className="flex flex-col space-y-3">
                            {/* Username Field */}
                            <div className="flex flex-col space-y-2">
                                <label className="font-semibold text-sm" htmlFor="username">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    className={`w-full text-sm px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none ${formik.touched.username && formik.errors.username ? "border-red-500" : ""}`}
                                    placeholder="Enter your username"
                                    autoFocus
                                    {...formik.getFieldProps("username")}
                                />
                                {formik.touched.username && formik.errors.username && <p className="text-red-500 text-sm">{formik.errors.username}</p>}
                            </div>

                            {/* Password Field */}
                            <div className="flex flex-col space-y-2">
                                <label className="font-semibold text-sm" htmlFor="password">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    className={`w-full text-sm px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none ${formik.touched.password && formik.errors.password ? "border-red-500" : ""}`}
                                    placeholder="Enter your password"
                                    {...formik.getFieldProps("password")}
                                />
                                {formik.touched.password && formik.errors.password && <p className="text-red-500 text-sm">{formik.errors.password}</p>}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="mt-5">
                            <button type="submit" disabled={formik.isSubmitting} className="w-full font-semibold shadow-md bg-green-700 text-white py-2 rounded-md hover:bg-green-600 transition cursor-pointer">
                                {formik.isSubmitting ? "Signing in..." : "Sign in"}
                            </button>
                        </div>

                        {/* OAuth Buttons */}
                        <div className="flex justify-between space-x-3 mt-4">
                            <button type="button" className="w-full flex items-center justify-center border border-gray-200 py-2 font-semibold rounded-md shadow-md hover:bg-gray-100 transition cursor-pointer">
                                <FontAwesomeIcon icon={faGoogle} className="mr-2" /> Google
                            </button>
                            <button type="button" className="w-full flex items-center justify-center border border-gray-200 py-2 font-semibold rounded-md shadow-md hover:bg-gray-100 transition cursor-pointer">
                                <FontAwesomeIcon icon={faGithub} className="mr-2" /> Github
                            </button>
                        </div>

                        {/* Register Link */}
                        <p className="text-sm text-center mt-4">
                            <span className="text-gray-500">Don't have an account?</span>
                            <NavLink to="/register" className="font-semibold underline ml-1">
                                Sign up here
                            </NavLink>
                        </p>
                    </form>
                </div>

                {/* Right Side: Welcome Banner */}
                <div className="bg-green-700 rounded-l-md flex justify-center items-center px-6 hidden md:flex">
                    <p className="text-white text-center font-semibold text-lg leading-snug">
                        ConnectIn: Build Projects. <br /> Grow Skills, Find Your Team.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
