import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";

const RegisterPage = () => {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="w-full bg-white text-black p-5 rounded-lg flex">
                {/* Left side - Register Form */}
                <div className="w-2/3 flex justify-center items-center">
                    <RegisterForm />
                </div>

                {/* Right side - Promotional Text */}
                <div className="w-3/4 bg-green-600 text-white flex justify-center items-center rounded-lg shadow-2xl">
                    <p className="text-xl font-bold text-center px-5">
                        ConnecTo: Build Projects <br /> Grow Skills, Find Your Team.
                    </p>
                </div>
            </div>
        </div>
    );
};

const RegisterForm = () => {
    // 1. Define the validation schema with Yup
    const validationSchema = Yup.object({
        username: Yup.string().min(3, "Username must be at least 3 characters").required("Username is required"),
        email: Yup.string().email("Invalid email address").required("Email is required"),
        password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
        confirmPassword: Yup.string()
            .oneOf([Yup.ref("password"), null], "Passwords must match")
            .required("Confirm Password is required"),
    });

    // 2. Initialize Formik
    const formik = useFormik({
        initialValues: {
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
        validationSchema,
        onSubmit: async (values, { setSubmitting, setFieldError }) => {
            try {
                // Example API call
                const response = await axios.post("http://localhost:8000/register", {
                    username: values.username,
                    email: values.email,
                    password: values.password,
                });
                console.log("Registration successful:", response.data);

                // You can redirect or show a success message here
                alert("Registration successful!");
            } catch (error) {
                console.error("Registration failed:", error);

                // Optionally, set a field error if the server returns something specific
                // For example, if the server says "Email already taken," you could do:
                // setFieldError("email", "Email already taken");

                alert("Registration failed. Please try again.");
            } finally {
                setSubmitting(false);
            }
        },
    });

    // 3. Render the form
    return (
        <div className="bg-white p-5 rounded-lg w-full max-w-lg">
            <h1 className="text-3xl font-bold text-center mb-2">
                <FontAwesomeIcon icon={faUsers} />
                <span className="ml-3">Connect</span>
            </h1>
            <p className="text-center text-black mb-6">Create your account to get started</p>

            <hr className="mb-6" />

            {/* Formik form */}
            <form onSubmit={formik.handleSubmit}>
                {/* Username */}
                <div className="mb-4 text-black">
                    <label htmlFor="username" className="block text-black font-bold text-sm mb-2">
                        Username
                    </label>
                    <input
                        type="text"
                        id="username"
                        className={`w-full p-3 border ${formik.touched.username && formik.errors.username ? "border-red-500" : "border-black"} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800`}
                        placeholder="Enter your username"
                        {...formik.getFieldProps("username")}
                    />
                    {formik.touched.username && formik.errors.username && <p className="text-red-500 text-sm mt-1">{formik.errors.username}</p>}
                </div>

                {/* Email */}
                <div className="mb-4 text-black">
                    <label htmlFor="email" className="block text-black font-bold text-sm mb-2">
                        Email
                    </label>
                    <input type="email" id="email" className={`w-full p-3 border ${formik.touched.email && formik.errors.email ? "border-red-500" : "border-black"} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800`} placeholder="Enter your email" {...formik.getFieldProps("email")} />
                    {formik.touched.email && formik.errors.email && <p className="text-red-500 text-sm mt-1">{formik.errors.email}</p>}
                </div>

                {/* Password */}
                <div className="mb-4 text-black">
                    <label htmlFor="password" className="block text-black font-bold text-sm mb-2">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        className={`w-full p-3 border ${formik.touched.password && formik.errors.password ? "border-red-500" : "border-black"} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800`}
                        placeholder="Enter your password"
                        {...formik.getFieldProps("password")}
                    />
                    {formik.touched.password && formik.errors.password && <p className="text-red-500 text-sm mt-1">{formik.errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div className="mb-6 text-black">
                    <label htmlFor="confirmPassword" className="block text-black font-bold text-sm mb-2">
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        className={`w-full p-3 border ${formik.touched.confirmPassword && formik.errors.confirmPassword ? "border-red-500" : "border-black"} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800`}
                        placeholder="Confirm your password"
                        {...formik.getFieldProps("confirmPassword")}
                    />
                    {formik.touched.confirmPassword && formik.errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{formik.errors.confirmPassword}</p>}
                </div>

                {/* Submit Button */}
                <button type="submit" disabled={formik.isSubmitting} className="w-full border border-black text-black py-3 rounded-lg font-semibold hover:bg-gray-100 transition cursor-pointer">
                    {formik.isSubmitting ? "Registering..." : "Register"}
                </button>

                <div className="mt-4 text-center">
                    <button type="button" className="w-full border text-white py-3 rounded-lg font-semibold bg-black hover:bg-gray-800 transition cursor-pointer">
                        Sign in with Google
                    </button>
                </div>

                <p className="mt-4 text-gray-700 text-sm text-center">
                    Already have an account?{" "}
                    <a href="/login" className="text-black font-semibold ml-1">
                        Login here
                    </a>
                </p>
            </form>
        </div>
    );
};

export default RegisterPage;
