import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router";
import { NavLink } from "react-router";

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
                <div className="flex flex-col flex-1 p-6">
                    <h1 className="text-lg font-semibold dark:text-white">Welcome!</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Enter your username and password to continue</p>

                    <form onSubmit={formik.handleSubmit} className="mt-4">
                        <div className="flex flex-col space-y-3">
                            <div className="flex flex-col space-y-2">
                                <label className="font-semibold text-sm dark:text-gray-300" htmlFor="username">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    className={`w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 bg-white dark:bg-gray-700 dark:text-white ${
                                        formik.touched.username && formik.errors.username ? "border-red-500 dark:border-red-400" : ""
                                    }`}
                                    placeholder="Enter your username"
                                    {...formik.getFieldProps("username")}
                                />
                                {formik.touched.username && formik.errors.username && <p className="text-red-500 dark:text-red-400 text-sm">{formik.errors.username}</p>}
                            </div>

                            <div className="flex flex-col space-y-2">
                                <label className="font-semibold text-sm dark:text-gray-300" htmlFor="email">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    className={`w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 bg-white dark:bg-gray-700 dark:text-white ${
                                        formik.touched.email && formik.errors.email ? "border-red-500 dark:border-red-400" : ""
                                    }`}
                                    placeholder="Enter your email"
                                    {...formik.getFieldProps("email")}
                                />
                                {formik.touched.email && formik.errors.email && <p className="text-red-500 dark:text-red-400 text-sm">{formik.errors.email}</p>}
                            </div>

                            {/* Password Field */}
                            <div className="flex flex-col space-y-2">
                                <label className="font-semibold text-sm dark:text-gray-300" htmlFor="password">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    className={`w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 bg-white dark:bg-gray-700 dark:text-white ${
                                        formik.touched.password && formik.errors.password ? "border-red-500 dark:border-red-400" : ""
                                    }`}
                                    placeholder="Enter your password"
                                    {...formik.getFieldProps("password")}
                                />
                                {formik.touched.password && formik.errors.password && <p className="text-red-500 dark:text-red-400 text-sm">{formik.errors.password}</p>}
                            </div>

                            <div className="flex flex-col space-y-2">
                                <label htmlFor="confirmPassword" className="font-semibold text-sm dark:text-gray-300">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    className={`w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 bg-white dark:bg-gray-700 dark:text-white ${
                                        formik.touched.confirmPassword && formik.errors.confirmPassword ? "border-red-500 dark:border-red-400" : ""
                                    }`}
                                    placeholder="Confirm your password"
                                    {...formik.getFieldProps("confirmPassword")}
                                />
                                {formik.touched.confirmPassword && formik.errors.confirmPassword && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{formik.errors.confirmPassword}</p>}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="mt-5">
                            <button type="submit" disabled={formik.isSubmitting} className="w-full font-semibold bg-green-700 dark:bg-green-600 shadow-md text-white py-2 rounded-md hover:bg-green-600 dark:hover:bg-green-500 transition cursor-pointer disabled:opacity-70">
                                {formik.isSubmitting ? "Signing up..." : "Sign up"}
                            </button>
                        </div>

                        {/* Register Link */}
                        <p className="text-sm text-center mt-4 dark:text-gray-400">
                            <span>Already have an account?</span>
                            <NavLink to="/login" className="font-semibold text-green-700 dark:text-green-400 hover:underline ml-1 hover:text-green-600 dark:hover:text-green-300">
                                Sign in here
                            </NavLink>
                        </p>
                    </form>
                </div>

                {/* Right Side: Welcome Banner */}
                <div className="bg-green-700 dark:bg-green-800 rounded-r-md shadow-md justify-center items-center px-6 hidden md:flex">
                    <p className="text-white text-center font-semibold text-lg">
                        ConnectIn: Build Projects. <br /> Grow Skills. Find Your Team.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
