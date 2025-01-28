import React from "react";

const Input = ({ type, placeholder }) => {
    return <input type={type} placeholder={placeholder} className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />;
};

export default Input;
