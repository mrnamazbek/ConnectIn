import { useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons";

const RegisterPage = () => {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 overflow-y-hidden">
            <div className="w-full bg-white text-black p-5 rounded-lg flex">
                {/* Left side - Register Form */}
                <div className="w-2/3 flex justify-center items-center">
                    <RegisterForm />
                </div>

                {/* Right side - Promotional Text */}
                <div className="w-3/4 bg-green-800 text-white flex justify-center items-center rounded-lg shadow-2xl">
                    <p className="text-xl font-bold text-center px-5">
                        ConnecTo: Build Projects <br /> Grow Skills, Find Your Team.{" "}
                    </p>
                </div>
            </div>
        </div>
    );
};

const RegisterForm = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleRegister = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        try {
            const response = await axios.post("http://localhost:8000/register", {
                username,
                email,
                password,
            });
            console.log(response.data);
        } catch (error) {
            console.error("Registration failed", error);
        }
    };

    return (
        <div className="bg-white p-5 rounded-lg w-full max-w-lg">
            <h1 className="text-3xl font-bold text-center mb-2">
                <FontAwesomeIcon icon={faUsers} />
                <span className="ml-3">Connect</span>
            </h1>
            <p className="text-center text-black mb-6">Create your account to get started</p>

            <hr className="mb-6" />

            <form onSubmit={handleRegister}>
                {/* Username Input */}
                <div className="mb-4 text-black">
                    <label className="block text-black font-bold text-sm mb-2">Username</label>
                    <input type="text" placeholder="Enter your username" className="w-full p-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>

                {/* Email Input */}
                <div className="mb-4 text-black">
                    <label className="block text-black font-bold text-sm mb-2">Email</label>
                    <input type="email" placeholder="Enter your email" className="w-full p-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                {/* Password Input */}
                <div className="mb-4 text-black">
                    <label className="block text-black font-bold text-sm mb-2">Password</label>
                    <input type="password" placeholder="Enter your password" className="w-full p-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>

                {/* Confirm Password Input */}
                <div className="mb-6 text-black">
                    <label className="block text-black font-bold text-sm mb-2">Confirm Password</label>
                    <input type="password" placeholder="Confirm your password" className="w-full p-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>

                <button type="submit" className="w-full border border-black text-black py-3 rounded-lg font-semibold hover:bg-gray-100 transition cursor-pointer">
                    Register
                </button>

                <div className="mt-4 text-center">
                    <button type="button" className="w-full border text-white py-3 rounded-lg font-semibold bg-black hover:bg-gray-800 transition cursor-pointer">
                        Sign in with Google
                    </button>
                </div>

                <p className="mt-4 text-gray-700 text-sm text-center">
                    Already have an account?
                    <a href="/login" className="text-black font-semibold">
                        Login here
                    </a>
                </p>
            </form>
        </div>
    );
};

export default RegisterPage;
