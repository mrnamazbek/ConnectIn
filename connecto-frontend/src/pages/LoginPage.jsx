import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router";

const LoginPage = () => {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 overflow-y-hidden">
            <div className="w-full bg-white text-black p-5 rounded-lg flex">
                {/* Left side - Login Form */}
                <div className="w-2/3 flex justify-center items-center">
                    <LoginForm />
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

const LoginForm = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Email:", email, "Password:", password);
    };

    return (
        <div className="bg-white p-5 rounded-lg w-full max-w-lg">
            <h1 className="text-3xl font-bold text-center mb-2">
                <FontAwesomeIcon icon={faUsers} />
                <span className="ml-3">Connect</span>
            </h1>
            <p className="text-center text-black mb-6">Enter your email and password to continue</p>

            <hr className="mb-6" />

            <form onSubmit={handleSubmit}>
                <div className="mb-4 text-black">
                    <label className="block text-black font-bold text-sm mb-2">Email</label>
                    <input type="email" placeholder="Enter your email" className="w-full p-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <div className="mb-6">
                    <label className="block font-bold  text-sm mb-2">Password</label>
                    <input type="password" placeholder="Enter your password" className="w-full p-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>

                <button type="submit" className="w-full border border-black text-black py-3 rounded-lg font-semibold hover:bg-gray-100 transition cursor-pointer">
                    Sign in
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
