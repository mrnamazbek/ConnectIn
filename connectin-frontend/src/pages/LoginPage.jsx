import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { NavLink, useNavigate } from "react-router";

const LoginPage = () => {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="w-full bg-white text-black p-5 flex h-full shadow-xl">
                <div className="w-2/3 flex justify-center items-center">
                    <LoginForm />
                </div>
                <div className="w-3/4 bg-green-600 text-white flex justify-center items-center rounded-lg shadow-2xl">
                    <p className="text-xl font-bold text-center px-5">
                        ConnectIn: Build Projects <br /> Grow Skills, Find Your Team.
                    </p>
                </div>
            </div>
        </div>
    );
};

const LoginForm = () => {
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
        onSubmit: async (values, { setSubmitting }) => {
            try {
                const response = await axios.post(
                    "http://127.0.0.1:8000/auth/login",
                    {
                        username: values.username,
                        password: values.password,
                    },
                    {
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                        },
                    }
                );

                console.log("Login successful:", response.data);
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("user", JSON.stringify(response.data.user));

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
        <div className="bg-white p-5 rounded-lg w-full max-w-lg">
            <h1 className="text-3xl font-bold text-center mb-2">
                <FontAwesomeIcon icon={faUsers} />
                <span className="ml-3">ConnectIn</span>
            </h1>
            <p className="text-center text-black mb-6">Enter your username and password to continue</p>

            <hr className="mb-6" />

            <form onSubmit={formik.handleSubmit}>
                <div className="mb-4 text-black">
                    <label className="block text-black font-bold text-sm mb-2" htmlFor="username">
                        Username
                    </label>
                    <input
                        id="username"
                        type="text"
                        className={`w-full p-3 border ${formik.touched.username && formik.errors.username ? "border-red-500" : "border-black"} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800`}
                        placeholder="Enter your username"
                        {...formik.getFieldProps("username")}
                    />
                    {formik.touched.username && formik.errors.username && <p className="text-red-500 text-sm mt-1">{formik.errors.username}</p>}
                </div>

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

                <button type="submit" disabled={formik.isSubmitting} className="w-full border border-black text-black py-3 rounded-lg font-semibold hover:bg-gray-100 transition cursor-pointer">
                    {formik.isSubmitting ? "Signing in..." : "Sign in"}
                </button>

                <div className="mt-4 text-center">
                    <button type="button" className="w-full border text-white py-3 rounded-lg font-semibold bg-black hover:bg-gray-800 transition cursor-pointer">
                        Sign in with Google
                    </button>
                </div>

                <p className="mt-4 text-gray-700 text-sm text-center">
                    Don't have an account?
                    <NavLink to="/register" className="text-black font-semibold ml-1">
                        Register here
                    </NavLink>
                </p>
            </form>
        </div>
    );
};

export default LoginPage;
