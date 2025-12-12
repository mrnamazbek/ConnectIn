import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * GlassButton - Premium glassmorphism button component
 * Features: glass effect, neon glow, shimmer animation, loading states
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button text/content
 * @param {string} props.variant - Button style: 'primary' | 'secondary' | 'ghost'
 * @param {string} props.size - Button size: 'sm' | 'md' | 'lg'
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.loading - Loading state
 * @param {React.ReactNode} props.icon - Optional icon element
 * @param {string} props.iconPosition - Icon position: 'left' | 'right'
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.type - Button type attribute
 */
const GlassButton = ({
    children,
    variant = 'primary',
    size = 'md',
    onClick,
    disabled = false,
    loading = false,
    icon = null,
    iconPosition = 'left',
    className = '',
    type = 'button',
    ...props
}) => {
    const baseClass = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'btn-glass-primary',
        secondary: 'btn-glass-secondary',
        ghost: 'btn-glass-ghost',
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
    };

    const handleClick = (e) => {
        if (disabled || loading) return;
        onClick?.(e);
    };

    const LoadingSpinner = () => (
        <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
    );

    return (
        <motion.button
            type={type}
            className={`${baseClass} ${variants[variant]} ${sizes[size]} ${className}`}
            onClick={handleClick}
            disabled={disabled || loading}
            whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
            whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
            {...props}
        >
            {loading && <LoadingSpinner />}
            {!loading && icon && iconPosition === 'left' && icon}
            {children}
            {!loading && icon && iconPosition === 'right' && icon}
        </motion.button>
    );
};

GlassButton.propTypes = {
    children: PropTypes.node.isRequired,
    variant: PropTypes.oneOf(['primary', 'secondary', 'ghost']),
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    icon: PropTypes.node,
    iconPosition: PropTypes.oneOf(['left', 'right']),
    className: PropTypes.string,
    type: PropTypes.string,
};

export default GlassButton;
