import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router";
import { NavLink } from "react-router";
import { faGoogle, faGithub } from "@fortawesome/free-brands-svg-icons";

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
                const response = await axios.post("http://127.0.0.1:8000/auth/register", {
                    username: values.username,
                    email: values.email,
                    password: values.password,
                });
                console.log("Registration successful:", response.data);

                alert("Registration successful! Redirecting to login...");
                navigate("/login");
            } catch (error) {
                console.error("Registration failed:", error);
                if (error.response && error.response.data.message) {
                    setFieldError("email", error.response.data.message);
                }
                alert("Registration failed. Please try again.");
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        // <div className="bg-white p-5 rounded-lg w-full max-w-lg">
        //     <h1 className="text-3xl font-bold text-center mb-2">
        //         <FontAwesomeIcon icon={faUsers} />
        //         <span className="ml-3">ConnectIn</span>
        //     </h1>
        //     <p className="text-center text-black mb-6">Create your account to get started</p>
        //     <hr className="mb-6" />
        //     <form onSubmit={formik.handleSubmit}>
        //         <div className="mb-4 text-black">
        //             <label htmlFor="username" className="block text-black font-bold text-sm mb-2">
        //                 Username
        //             </label>
        //             <input
        //                 type="text"
        //                 id="username"
        //                 className={`w-full p-3 border ${formik.touched.username && formik.errors.username ? "border-red-500" : "border-black"} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800`}
        //                 placeholder="Enter your username"
        //                 {...formik.getFieldProps("username")}
        //             />
        //             {formik.touched.username && formik.errors.username && <p className="text-red-500 text-sm mt-1">{formik.errors.username}</p>}
        //         </div>
        //         <div className="mb-4 text-black">
        //             <label htmlFor="email" className="block text-black font-bold text-sm mb-2">
        //                 Email
        //             </label>
        //             <input type="email" id="email" className={`w-full p-3 border ${formik.touched.email && formik.errors.email ? "border-red-500" : "border-black"} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800`} placeholder="Enter your email" {...formik.getFieldProps("email")} />
        //             {formik.touched.email && formik.errors.email && <p className="text-red-500 text-sm mt-1">{formik.errors.email}</p>}
        //         </div>
        //         <div className="mb-4 text-black">
        //             <label htmlFor="password" className="block text-black font-bold text-sm mb-2">
        //                 Password
        //             </label>
        //             <input
        //                 type="password"
        //                 id="password"
        //                 className={`w-full p-3 border ${formik.touched.password && formik.errors.password ? "border-red-500" : "border-black"} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800`}
        //                 placeholder="Enter your password"
        //                 {...formik.getFieldProps("password")}
        //             />
        //             {formik.touched.password && formik.errors.password && <p className="text-red-500 text-sm mt-1">{formik.errors.password}</p>}
        //         </div>
        //         <div className="mb-6 text-black">
        //             <label htmlFor="confirmPassword" className="block text-black font-bold text-sm mb-2">
        //                 Confirm Password
        //             </label>
        //             <input
        //                 type="password"
        //                 id="confirmPassword"
        //                 className={`w-full p-3 border ${formik.touched.confirmPassword && formik.errors.confirmPassword ? "border-red-500" : "border-black"} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800`}
        //                 placeholder="Confirm your password"
        //                 {...formik.getFieldProps("confirmPassword")}
        //             />
        //             {formik.touched.confirmPassword && formik.errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{formik.errors.confirmPassword}</p>}
        //         </div>
        //         <button type="submit" disabled={formik.isSubmitting} className="w-full border border-black text-black py-3 rounded-lg font-semibold hover:bg-gray-100 transition cursor-pointer">
        //             {formik.isSubmitting ? "Registering..." : "Register"}
        //         </button>
        //     </form>
        // </div>

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

                            {/* Email Field */}
                            <div className="flex flex-col space-y-2">
                                <label className="font-semibold text-sm" htmlFor="email">
                                    Email
                                </label>
                                <input id="email" type="email" className={`w-full text-sm px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none ${formik.touched.email && formik.errors.email ? "border-red-500" : ""}`} placeholder="Enter your email" autoFocus {...formik.getFieldProps("email")} />
                                {formik.touched.email && formik.errors.email && <p className="text-red-500 text-sm">{formik.errors.email}</p>}
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

                            <div className="flex flex-col space-y-2">
                                <label htmlFor="confirmPassword" className="font-semibold text-sm">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    className={`w-full text-sm px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none ${formik.touched.confirmPassword && formik.errors.confirmPassword ? "border-red-500" : ""}`}
                                    placeholder="Confirm your password"
                                    {...formik.getFieldProps("confirmPassword")}
                                />
                                {formik.touched.confirmPassword && formik.errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{formik.errors.confirmPassword}</p>}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="mt-5">
                            <button type="submit" disabled={formik.isSubmitting} className="w-full font-semibold bg-green-700 shadow-md text-white py-2 rounded-md hover:bg-green-600 transition cursor-pointer">
                                {formik.isSubmitting ? "Signing up..." : "Sign up"}
                            </button>
                        </div>

                        {/* OAuth Buttons */}
                        <div className="flex justify-between space-x-3 mt-4">
                            <button type="button" className="w-full flex items-center justify-center border shadow-md border-gray-200 py-2 font-semibold rounded-md hover:bg-gray-100 transition cursor-pointer">
                                <FontAwesomeIcon icon={faGoogle} className="mr-2" /> Google
                            </button>
                            <button type="button" className="w-full flex items-center justify-center border border-gray-200 shadow-md py-2 font-semibold rounded-md hover:bg-gray-100 transition cursor-pointer">
                                <FontAwesomeIcon icon={faGithub} className="mr-2" /> Github
                            </button>
                        </div>

                        {/* Register Link */}
                        <p className="text-sm text-center mt-4">
                            <span className="text-gray-500">Already have an account?</span>
                            <NavLink to="/login" className="font-semibold underline ml-1">
                                Sign in here
                            </NavLink>
                        </p>
                    </form>
                </div>

                {/* Right Side: Welcome Banner */}
                <div className="bg-green-700 rounded-l-md shadow-md justify-center items-center px-6 hidden md:flex">
                    <p className="text-white text-center font-semibold text-lg">
                        ConnectIn: Build Projects. <br /> Grow Skills. Find Your Team.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
