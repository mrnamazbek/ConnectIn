// src/pages/RegisterPage.jsx
import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "../utils/axiosConfig"; // Ваш настроенный axios
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faLightbulb, faHandshake, faRocket } from "@fortawesome/free-solid-svg-icons";
import { faGoogle, faGithub } from "@fortawesome/free-brands-svg-icons";
import { Link, useNavigate } from "react-router-dom"; // Используем Link из react-router-dom
import { ReactTyped } from "react-typed";
import { toast } from "react-toastify";

// Схема валидации для регистрации
const registerSchema = Yup.object({
    username: Yup.string().required("Username is required").min(3, "Min 3 characters"),
    email: Yup.string().email("Invalid email address").required("Email is required"),
    password: Yup.string().required("Password is required").min(6, "Min 6 characters"),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], "Passwords must match") // Используем null в oneOf
        .required("Confirm password is required"),
});

// Компонент InputField (можно вынести в отдельный файл для DRY)
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

const RegisterPage2 = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Formik для формы регистрации
    const formikRegister = useFormik({
        initialValues: { username: "", email: "", password: "", confirmPassword: "" },
        validationSchema: registerSchema,
        validateOnBlur: true, // Включаем для лучшего UX
        validateOnChange: true,
        onSubmit: async (values, { setSubmitting, setFieldError }) => {
            setLoading(true);
            try {
                await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
                    username: values.username,
                    email: values.email,
                    password: values.password,
                });
                toast.success("Registration successful! Please log in.", { position: "bottom-left", autoClose: 3000 });
                navigate("/login"); // Перенаправляем на страницу входа после успеха
            } catch (error) {
                console.error("Registration failed:", error.response?.data || error.message);
                let errorMessage = "Registration failed. Please try again.";
                 if (error.response?.data?.detail) {
                     if (typeof error.response.data.detail === 'string') {
                        errorMessage = error.response.data.detail;
                        // Попробуем определить, к какому полю относится ошибка по тексту
                        if (errorMessage.toLowerCase().includes('email')) {
                             setFieldError('email', errorMessage);
                        } else if (errorMessage.toLowerCase().includes('username')) {
                            setFieldError('username', errorMessage);
                        }
                     } else if (Array.isArray(error.response.data.detail)) {
                        // Если бэкенд возвращает массив ошибок FastAPI
                        error.response.data.detail.forEach(err => {
                            if (err.loc && err.loc[1]) {
                                setFieldError(err.loc[1], err.msg); // Устанавливаем ошибку для конкретного поля
                            }
                        });
                         errorMessage = error.response.data.detail.map(err => err.msg).join('; '); // Общее сообщение для toast
                     }
                 }
                toast.error(errorMessage, { position: "bottom-left", autoClose: 5000 });
            } finally {
                setLoading(false);
                setSubmitting(false);
            }
        },
    });

    // Функции для OAuth входа (дублируем, т.к. отдельная страница)
    const handleGoogleLogin = () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/auth/google/login`;
    };
    const handleGitHubLogin = () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/auth/github/login`;
    };


    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-10">
            <div className="w-full max-w-4xl">
                 <div className="flex flex-col md:flex-row rounded-xl shadow-2xl overflow-hidden bg-white dark:bg-gray-800 min-h-[650px]"> {/* Немного больше высота */}

                    {/* === Левая Панель: Информационная/Визуальная === */}
                    <div className="w-full md:w-1/2 p-8 flex flex-col justify-center items-center text-center text-white bg-gradient-to-br from-blue-600 via-purple-500 to-pink-500"> {/* Другой градиент для разнообразия */}
                        <h1 className="text-3xl font-extrabold mb-4">Join ConnectIn</h1>
                         <div className="text-lg mb-8 h-10">
                            <ReactTyped strings={["Create Your Profile.", "Showcase Your Skills.", "Connect with Teams.", "Start Your Journey!"]} typeSpeed={60} backSpeed={40} loop />
                        </div>
                       <div className="space-y-6 mt-6">
                             <div className="flex items-center text-left space-x-3">
                                <FontAwesomeIcon icon={faLightbulb} className="text-3xl text-yellow-300" />
                                <div>
                                    <h3 className="font-semibold">Share Ideas</h3>
                                    <p className="text-sm opacity-90">Contribute to innovative projects.</p>
                                </div>
                            </div>
                            <div className="flex items-center text-left space-x-3">
                                <FontAwesomeIcon icon={faHandshake} className="text-3xl text-cyan-300" /> {/* Другой цвет иконки */}
                                <div>
                                    <h3 className="font-semibold">Network Easily</h3>
                                    <p className="text-sm opacity-90">Find collaborators and mentors.</p>
                                </div>
                            </div>
                             <div className="flex items-center text-left space-x-3">
                                <FontAwesomeIcon icon={faRocket} className="text-3xl text-orange-300" /> {/* Другой цвет иконки */}
                                <div>
                                    <h3 className="font-semibold">Accelerate Growth</h3>
                                    <p className="text-sm opacity-90">Unlock new opportunities daily.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* === Правая Панель: Форма Регистрации === */}
                    <div className="w-full md:w-1/2 p-6 flex flex-col">
                         <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">Create Account</h2>
                         <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Join the ConnectIn community!</p>
                        <form onSubmit={formikRegister.handleSubmit} className="space-y-3 flex-grow flex flex-col">
                             <InputField formik={formikRegister} id="register-username" name="username" type="text" placeholder="Choose a username" label="Username" isDark={true} />
                             <InputField formik={formikRegister} id="register-email" name="email" type="email" placeholder="Enter your email" label="Email" isDark={true} />
                             <InputField formik={formikRegister} id="register-password" name="password" type="password" placeholder="Create a password (min 6 chars)" label="Password" isDark={true} />
                             <InputField formik={formikRegister} id="register-confirmPassword" name="confirmPassword" type="password" placeholder="Confirm your password" label="Confirm Password" isDark={true} />

                            {/* Кнопка Регистрации */}
                             <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading || !formikRegister.isValid}
                                    className="w-full font-semibold cursor-pointer shadow-md bg-blue-600 dark:bg-blue-500 text-white py-2.5 rounded-md hover:bg-blue-500 dark:hover:bg-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {loading ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : 'Sign Up'}
                                </button>
                            </div>

                            {/* Разделитель и OAuth Кнопки */}
                            <div className="flex items-center my-3">
                                <hr className="flex-grow border-gray-300 dark:border-gray-600"/>
                                <span className="px-2 text-xs text-gray-500 dark:text-gray-400">Or sign up with</span>
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

                             {/* Ссылка на Вход */}
                             <div className="mt-auto pt-4"> {/* mt-auto чтобы прижать вниз */}
                                <p className="text-sm text-center">
                                    <span className="text-gray-500 dark:text-gray-400">Already have an account?</span>
                                    {/* Используем Link для перехода без перезагрузки страницы */}
                                    <Link to="/login" className="font-semibold text-green-700 dark:text-green-400 ml-1 hover:underline focus:outline-none focus:ring-2 focus:ring-green-500 rounded">
                                        Sign in here
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

export default RegisterPage2;