import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router";
import { NavLink } from "react-router";
import { ReactTyped } from "react-typed";
import { faShareNodes, faGlobe, faArrowUpRightDots } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const RegisterPage = () => {
    const navigate = useNavigate();

    const validationSchema = Yup.object({
        username: Yup.string().min(3, "Username must be at least 3 characters").required("Username is required"),
        email: Yup.string().email("Invalid email address").required("Email is required"),
        password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
        confirmPassword: Yup.string()
            .oneOf([Yup.ref("password"), null], "Passwords must match")
            .required("Confirm Password is required"),
    });

    const formik = useFormik({
        initialValues: {
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
        validationSchema,
        validateOnBlur: false,
        validateOnChange: true,
        onSubmit: async (values, { setSubmitting, setFieldError }) => {
            try {
                await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
                    username: values.username,
                    email: values.email,
                    password: values.password,
                });
                navigate("/login");
            } catch (error) {
                console.error("Registration failed:", error);
                if (error.response && error.response.data.detail) {
                    if (error.response.data.detail.includes("email")) {
                        setFieldError("email", error.response.data.detail);
                    } else if (error.response.data.detail.includes("username")) {
                        setFieldError("username", error.response.data.detail);
                    } else {
                        alert(error.response.data.detail);
                    }
                } else {
                    alert("Registration failed. Please try again.");
                }
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <div className="flex justify-center items-center min-h-screen -mt-13 px-4 bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-wrap md:flex-nowrap border border-green-700 dark:border-green-600 rounded-md bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-700/50 w-full max-w-3xl">
                {/* Left Side: Form */}
                <div className="flex flex-col flex-1 p-4 sm:p-6">
                    <h1 className="text-lg sm:text-xl font-semibold dark:text-white">Welcome!</h1>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Enter your username and password to continue</p>

                    <form onSubmit={formik.handleSubmit} className="mt-3 sm:mt-4">
                        <div className="flex flex-col space-y-2 sm:space-y-3">
                            <div className="flex flex-col space-y-1 sm:space-y-2">
                                <label className="font-semibold text-xs sm:text-sm dark:text-gray-300" htmlFor="username">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    className={`w-full text-xs sm:text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 bg-white dark:bg-gray-700 dark:text-white ${
                                        formik.touched.username && formik.errors.username ? "border-red-500 dark:border-red-400" : ""
                                    }`}
                                    placeholder="Enter your username"
                                    {...formik.getFieldProps("username")}
                                />
                                {formik.touched.username && formik.errors.username && <p className="text-red-500 dark:text-red-400 text-xs">{formik.errors.username}</p>}
                            </div>

                            <div className="flex flex-col space-y-1 sm:space-y-2">
                                <label className="font-semibold text-xs sm:text-sm dark:text-gray-300" htmlFor="email">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    className={`w-full text-xs sm:text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 bg-white dark:bg-gray-700 dark:text-white ${
                                        formik.touched.email && formik.errors.email ? "border-red-500 dark:border-red-400" : ""
                                    }`}
                                    placeholder="Enter your email"
                                    {...formik.getFieldProps("email")}
                                />
                                {formik.touched.email && formik.errors.email && <p className="text-red-500 dark:text-red-400 text-xs">{formik.errors.email}</p>}
                            </div>

                            {/* Password Field */}
                            <div className="flex flex-col space-y-1 sm:space-y-2">
                                <label className="font-semibold text-xs sm:text-sm dark:text-gray-300" htmlFor="password">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    className={`w-full text-xs sm:text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 bg-white dark:bg-gray-700 dark:text-white ${
                                        formik.touched.password && formik.errors.password ? "border-red-500 dark:border-red-400" : ""
                                    }`}
                                    placeholder="Enter your password"
                                    {...formik.getFieldProps("password")}
                                />
                                {formik.touched.password && formik.errors.password && <p className="text-red-500 dark:text-red-400 text-xs">{formik.errors.password}</p>}
                            </div>

                            <div className="flex flex-col space-y-1 sm:space-y-2">
                                <label htmlFor="confirmPassword" className="font-semibold text-xs sm:text-sm dark:text-gray-300">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    className={`w-full text-xs sm:text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 bg-white dark:bg-gray-700 dark:text-white ${
                                        formik.touched.confirmPassword && formik.errors.confirmPassword ? "border-red-500 dark:border-red-400" : ""
                                    }`}
                                    placeholder="Confirm your password"
                                    {...formik.getFieldProps("confirmPassword")}
                                />
                                {formik.touched.confirmPassword && formik.errors.confirmPassword && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{formik.errors.confirmPassword}</p>}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="mt-4 sm:mt-5">
                            <button type="submit" disabled={formik.isSubmitting} className="w-full font-semibold bg-green-700 dark:bg-green-600 shadow-md text-white py-2 rounded-md hover:bg-green-600 dark:hover:bg-green-500 transition cursor-pointer disabled:opacity-70 text-sm sm:text-base">
                                {formik.isSubmitting ? "Signing up..." : "Sign up"}
                            </button>
                        </div>

                        {/* Register Link */}
                        <p className="text-xs sm:text-sm text-center mt-3 sm:mt-4 dark:text-gray-400">
                            <span>Already have an account?</span>
                            <NavLink to="/login" className="font-semibold text-green-700 dark:text-green-400 hover:underline ml-1 hover:text-green-600 dark:hover:text-green-300">
                                Sign in here
                            </NavLink>
                        </p>
                    </form>
                </div>

                {/* Right Side: Welcome Banner */}
                <div className="bg-gradient-to-br from-green-600 via-green-700 to-green-800 dark:from-green-800 dark:via-green-700 dark:to-green-600 rounded-l-2xl flex-col rounded-r-sm shadow-md justify-center items-center px-6 sm:px-10 py-6 sm:py-8 hidden md:flex">
                    <p className="text-lg sm:text-xl font-semibold text-white">Join ConnectIn</p>
                    <div className="text-base sm:text-lg mb-4 sm:mb-5 text-white">
                        <ReactTyped strings={["Create Your Profile.", "Showcase Your Skills.", "Connect with Teams.", "Start Your Journey!"]} typeSpeed={60} backSpeed={40} loop />
                    </div>
                    <div className="space-y-2 sm:space-y-3 w-full max-w-xs">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-5 sm:w-6 h-5 sm:h-6 flex">
                                <FontAwesomeIcon icon={faShareNodes} className="text-lg sm:text-xl text-yellow-300" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm sm:text-base text-white">Share Ideas</h3>
                                <p className="text-xs sm:text-sm text-white/80">Contribute to innovative projects.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-5 sm:w-6 h-5 sm:h-6 flex">
                                <FontAwesomeIcon icon={faGlobe} className="text-lg sm:text-xl text-blue-300" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm sm:text-base text-white">Network Easily</h3>
                                <p className="text-xs sm:text-sm text-white/80">Find collaborators and mentors.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-5 sm:w-6 h-5 sm:h-6 flex">
                                <FontAwesomeIcon icon={faArrowUpRightDots} className="text-lg sm:text-xl text-red-300" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm sm:text-base text-white">Accelerate Growth</h3>
                                <p className="text-xs sm:text-sm text-white/80">Unlock new opportunities daily.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
