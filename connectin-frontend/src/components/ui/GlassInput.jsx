import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * GlassInput - Glassmorphism input field
 * Features: frosted glass background, neon focus glow, smooth transitions
 * 
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.type - Input type
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.error - Error message
 * @param {React.ReactNode} props.icon - Optional icon element
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.required - Required field indicator
 * @param {boolean} props.disabled - Disabled state
 */
const GlassInput = ({
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    error,
    icon,
    className = '',
    required = false,
    disabled = false,
    ...props
}) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            {label && (
                <label className="text-sm font-medium text-secondary">
                    {label}
                    {required && <span className="text-neon-aqua ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">
                        {icon}
                    </div>
                )}

                <motion.input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`
            glass-input w-full
            ${icon ? 'pl-12' : 'pl-4'}
            ${error ? 'border-red-500' : ''}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    animate={{
                        borderColor: isFocused ? 'var(--neon-aqua)' : 'var(--glass-border)',
                    }}
                    transition={{ duration: 0.2 }}
                    {...props}
                />
            </div>

            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-400"
                >
                    {error}
                </motion.p>
            )}
        </div>
    );
};

GlassInput.propTypes = {
    label: PropTypes.string,
    type: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    error: PropTypes.string,
    icon: PropTypes.node,
    className: PropTypes.string,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
};

export default GlassInput;
