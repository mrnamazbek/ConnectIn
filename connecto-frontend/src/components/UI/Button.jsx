import React from "react";

const Button = ({ children, className }) => {
    return <button className={`p-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all ${className}`}>{children}</button>;
};

export default Button;
