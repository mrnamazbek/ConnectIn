import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * SkillChip - Glassmorphism skill badge with neon glow
 * Used for displaying technologies, skills, or tags
 * 
 * @param {Object} props
 * @param {string} props.label - Skill name
 * @param {React.ReactNode} props.icon - Optional icon
 * @param {string} props.variant - Style variant: 'blue' | 'aqua' | 'lime' | 'purple'
 * @param {Function} props.onRemove - Remove handler (shows X button if provided)
 * @param {string} props.className - Additional CSS classes
 */
const SkillChip = ({
    label,
    icon,
    variant = 'aqua',
    onRemove,
    className = '',
    ...props
}) => {
    const variants = {
        blue: 'border-neon-blue text-neon-blue hover:shadow-glow-blue',
        aqua: 'border-neon-aqua text-neon-aqua hover:shadow-glow-aqua',
        lime: 'border-neon-lime text-neon-lime hover:shadow-glow-lime',
        purple: 'border-neon-purple text-neon-purple hover:shadow-glow-purple',
    };

    return (
        <motion.span
            className={`skill-chip ${variants[variant]} ${className}`}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            {...props}
        >
            {icon && <span className="w-4 h-4">{icon}</span>}
            <span>{label}</span>
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="ml-1 hover:opacity-70 transition-opacity"
                    aria-label={`Remove ${label}`}
                >
                    <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            )}
        </motion.span>
    );
};

SkillChip.propTypes = {
    label: PropTypes.string.isRequired,
    icon: PropTypes.node,
    variant: PropTypes.oneOf(['blue', 'aqua', 'lime', 'purple']),
    onRemove: PropTypes.func,
    className: PropTypes.string,
};

export default SkillChip;
