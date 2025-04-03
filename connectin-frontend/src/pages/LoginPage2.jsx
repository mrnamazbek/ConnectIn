// src/pages/LoginPage.jsx
import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "../utils/axiosConfig"; // Ваш настроенный axios
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faLightbulb, faHandshake, faRocket } from "@fortawesome/free-solid-svg-icons";
import { faGoogle, faGithub } from "@fortawesome/free-brands-svg-icons";
import { Link, useNavigate, useLocation } from "react-router-dom"; // Используем Link из react-router-dom
import { ReactTyped } from "react-typed";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import TokenService from "../services/tokenService"; // Ваш сервис для токенов

// Схема валидации для входа
const loginSchema = Yup.object({
    username: Yup.string().required("Username is required").min(3, "Username must be at least 3 characters long"),
    password: Yup.string().required("Password is required"),
});

// Компонент InputField для уменьшения повторений
const InputField = ({ formik, id, name, type, placeholder, label, isDark }) => (
    <div className="space-y-1">
        <label htmlFor={id} className={`font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{label}</label>
        <input
            id={id}
            name={name}
            type={type}
            placeholder={placeholder}
            className={`w-full text-sm px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 ${
                isDark ? 'dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500' : 'placeholder-gray-400 bg-white'
            } ${
                formik.touched[name] && formik.errors[name]
                ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
                : (isDark ? 'dark:border-gray-600' : 'border-gray-300')
            }`}
            {...formik.getFieldProps(name)}
        />
        {formik.touched[name] && formik.errors[name] && (
            <p className="text-red-500 text-xs mt-1">{formik.errors[name]}</p>
        )}
    </div>
);


const LoginPage2 = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);

    // Formik для формы входа
    const formikLogin = useFormik({
        initialValues: { username: "", password: "" },
        validationSchema: loginSchema,
        validateOnBlur: true, // Можно включить для лучшего UX
        validateOnChange: true,
        onSubmit: async (values, { setSubmitting }) => {
            setLoading(true);
            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL}/auth/login`,
                    { username: values.username, password: values.password },
                    { headers: { "Content-Type": "application/x-www-form-urlencoded" } } // Проверьте Content-Type для вашего бэкенда
                );
                TokenService.setTokens(response.data.access_token, response.data.refresh_token);
                toast.success("Login successful!", { position: "bottom-left", autoClose: 3000 });
                const from = location.state?.from?.pathname || "/";
                navigate(from, { replace: true });
            } catch (error) {
                console.error("Login failed:", error.response?.data || error.message);
                const errorMessage = error.response?.data?.detail || "Invalid credentials. Please try again.";
                toast.error(errorMessage, { position: "bottom-left", autoClose: 5000 });
            } finally {
                setLoading(false);
                setSubmitting(false);
            }
        },
    });

    // Функции для OAuth входа
    const handleGoogleLogin = () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/auth/google/login`;
    };
    const handleGitHubLogin = () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/auth/github/login`;
    };

    // Логика проверки cookie после OAuth редиректа
    // ВНИМАНИЕ: Эта логика может сработать некорректно, если бэкенд перенаправляет
    // пользователя после OAuth не на /login, а на другую страницу.
    // В этом случае этот useEffect лучше перенести в главный компонент App.jsx или Layout.
    useEffect(() => {
        const accessTokenCookie = Cookies.get("access_token");
        const refreshTokenCookie = Cookies.get("refresh_token");
        if (accessTokenCookie && refreshTokenCookie) {
            TokenService.setTokens(accessTokenCookie, refreshTokenCookie);
            Cookies.remove("access_token"); // Удаляем cookie после сохранения
            Cookies.remove("refresh_token");
            toast.success("Login successful via OAuth!", { position: "bottom-left", autoClose: 3000 });
            navigate("/", { replace: true });
        }
     }, [navigate]);


    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-10">
            <div className="w-full max-w-4xl">
                <div className="flex flex-col md:flex-row rounded-xl shadow-2xl overflow-hidden bg-white dark:bg-gray-800 min-h-[600px]">

                    {/* === Левая Панель: Информационная/Визуальная === */}
                    <div className="w-full md:w-1/2 p-8 flex flex-col justify-center items-center text-center text-white bg-gradient-to-br from-green-600 via-teal-500 to-blue-600">
                        <h1 className="text-3xl font-extrabold mb-4">ConnectIn</h1>
                        <div className="text-lg mb-8 h-10">
                            <ReactTyped strings={["Build Teams.", "Discover Projects.", "Grow Careers.", "Welcome Back!"]} typeSpeed={60} backSpeed={40} loop />
                        </div>
                        <div className="space-y-6 mt-6">
                             <div className="flex items-center text-left space-x-3">
                                <FontAwesomeIcon icon={faLightbulb} className="text-3xl text-yellow-300" />
                                <div>
                                    <h3 className="font-semibold">Innovate Together</h3>
                                    <p className="text-sm opacity-90">Find projects that ignite your passion.</p>
                                </div>
                            </div>
                            <div className="flex items-center text-left space-x-3">
                                <FontAwesomeIcon icon={faHandshake} className="text-3xl text-blue-300" />
                                <div>
                                    <h3 className="font-semibold">Build Connections</h3>
                                    <p className="text-sm opacity-90">Collaborate with skilled professionals.</p>
                                </div>
                            </div>
                             <div className="flex items-center text-left space-x-3">
                                <FontAwesomeIcon icon={faRocket} className="text-3xl text-red-300" />
                                <div>
                                    <h3 className="font-semibold">Launch Opportunities</h3>
                                    <p className="text-sm opacity-90">Discover your next career move.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* === Правая Панель: Форма Входа === */}
                    <div className="w-full md:w-1/2 p-6 flex flex-col">
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">Welcome Back!</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Sign in to continue your journey.</p>
                        <form onSubmit={formikLogin.handleSubmit} className="space-y-4 flex-grow flex flex-col">
                            <InputField formik={formikLogin} id="login-username" name="username" type="text" placeholder="Enter your username" label="Username" isDark={true} />
                            <InputField formik={formikLogin} id="login-password" name="password" type="password" placeholder="Enter your password" label="Password" isDark={true} />

                            {/* Кнопка Входа */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading || !formikLogin.isValid}
                                    className="w-full font-semibold cursor-pointer shadow-md bg-green-700 dark:bg-green-600 text-white py-2.5 rounded-md hover:bg-green-600 dark:hover:bg-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {loading ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : 'Sign In'}
                                </button>
                            </div>

                            {/* Разделитель и OAuth Кнопки */}
                            <div className="flex items-center my-4">
                                <hr className="flex-grow border-gray-300 dark:border-gray-600"/>
                                <span className="px-2 text-xs text-gray-500 dark:text-gray-400">Or continue with</span>
                                <hr className="flex-grow border-gray-300 dark:border-gray-600"/>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button onClick={handleGoogleLogin} type="button" className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition">
                                    <FontAwesomeIcon icon={faGoogle} className="text-red-500 mr-2" /> Google
                                </button>
                                <button onClick={handleGitHubLogin} type="button" className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition">
                                    <FontAwesomeIcon icon={faGithub} className="text-gray-800 dark:text-gray-300 mr-2" /> Github
                                </button>
                            </div>

                            {/* Ссылка на Регистрацию */}
                            <div className="mt-auto pt-4"> {/* mt-auto чтобы прижать вниз */}
                                <p className="text-sm text-center">
                                    <span className="text-gray-500 dark:text-gray-400">Need an account?</span>
                                    {/* Используем Link для перехода без перезагрузки страницы */}
                                    <Link to="/register" className="font-semibold text-green-700 dark:text-green-400 ml-1 hover:underline focus:outline-none focus:ring-2 focus:ring-green-500 rounded">
                                        Sign up here
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage2;