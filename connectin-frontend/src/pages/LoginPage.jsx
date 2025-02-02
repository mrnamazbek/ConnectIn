import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router"; // or "react-router-dom", depending on your version

const LoginPage = () => {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="w-full bg-white text-black p-5 flex h-full shadow-xl">
                {/* Left side - Login Form */}
                <div className="w-2/3 flex justify-center items-center">
                    <LoginForm />
                </div>

                {/* Right side - Promotional Text */}
                <div className="w-3/4 bg-green-600 text-white flex justify-center items-center rounded-lg shadow-2xl">
                    <p className="text-xl font-bold text-center px-5">
                        ConnectIn: Build Projects <br /> Grow Skills, Find Your Team.{" "}
                    </p>
                </div>
            </div>
        </div>
    );
};

const LoginForm = () => {
    // 1. Define validation with Yup
    const validationSchema = Yup.object({
        email: Yup.string().email("Invalid email address").required("Email is required"),
        password: Yup.string().required("Password is required"),
    });

    // 2. Configure Formik
    const formik = useFormik({
        initialValues: {
            email: "",
            password: "",
        },
        validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                // Example API call to your backend
                const response = await axios.post("http://localhost:8000/login", {
                    email: values.email,
                    password: values.password,
                });

                console.log("Login successful:", response.data);
                // Here you could store a JWT, set cookies, etc.
                // e.g., localStorage.setItem('token', response.data.token);

                alert("You are now logged in!");
            } catch (error) {
                console.error("Login failed:", error);
                alert("Login failed. Please check your credentials and try again.");
            } finally {
                // Reset isSubmitting so button becomes clickable again
                setSubmitting(false);
            }
        },
    });

    return (
        <div className="bg-white p-5 rounded-lg w-full max-w-lg">
            <h1 className="text-3xl font-bold text-center mb-2">
                <FontAwesomeIcon icon={faUsers} />
                <span className="ml-3">Connect</span>
            </h1>
            <p className="text-center text-black mb-6">Enter your email and password to continue</p>

            <hr className="mb-6" />

            <form onSubmit={formik.handleSubmit}>
                {/* Email Field */}
                <div className="mb-4 text-black">
                    <label className="block text-black font-bold text-sm mb-2" htmlFor="email">
                        Email
                    </label>
                    <input id="email" type="email" className={`w-full p-3 border ${formik.touched.email && formik.errors.email ? "border-red-500" : "border-black"} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800`} placeholder="Enter your email" {...formik.getFieldProps("email")} />
                    {formik.touched.email && formik.errors.email && <p className="text-red-500 text-sm mt-1">{formik.errors.email}</p>}
                </div>

                {/* Password Field */}
                <div className="mb-6">
                    <label className="block font-bold text-sm mb-2" htmlFor="password">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        className={`w-full p-3 border ${formik.touched.password && formik.errors.password ? "border-red-500" : "border-black"} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800`}
                        placeholder="Enter your password"
                        {...formik.getFieldProps("password")}
                    />
                    {formik.touched.password && formik.errors.password && <p className="text-red-500 text-sm mt-1">{formik.errors.password}</p>}
                </div>

                {/* Submit Button */}
                <button type="submit" disabled={formik.isSubmitting} className="w-full border border-black text-black py-3 rounded-lg font-semibold hover:bg-gray-100 transition cursor-pointer">
                    {formik.isSubmitting ? "Signing in..." : "Sign in"}
                </button>

                <div className="mt-4 text-center">
                    <button type="button" className="w-full border text-white py-3 rounded-lg font-semibold bg-black hover:bg-gray-800 transition cursor-pointer">
                        Sign in with Google
                    </button>
                </div>

                <p className="mt-4 text-gray-700 text-sm text-center">
                    Already have an account?
                    <NavLink to="/register" className="text-black font-semibold ml-1">
                        Register here
                    </NavLink>
                </p>
            </form>
        </div>
    );
};

export default LoginPage;
