import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * GlassCard - Reusable glassmorphism card component
 * Features: frosted glass background, neon border glow, smooth animations
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.variant - Card style: 'default' | 'highlighted' | 'interactive'
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Click handler (for interactive cards)
 * @param {boolean} props.animate - Enable entrance animation
 * @param {Object} props.style - Additional inline styles
 */
const GlassCard = ({ 
  children, 
  variant = 'default', 
  className = '', 
  onClick,
  animate = true,
  style = {},
  ...props 
}) => {
  const variants = {
    default: 'glass-card',
    highlighted: 'glass-card border-neon-aqua glow-aqua',
    interactive: 'glass-card cursor-pointer hover:scale-[1.02]',
  };

  const animationVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  const Component = animate ? motion.div : 'div';
  const animationProps = animate ? {
    initial: "hidden",
    whileInView: "visible",
    viewport: { once: true, margin: "-50px" },
    variants: animationVariants
  } : {};

  return (
    <Component
      className={`${variants[variant]} ${className}`}
      onClick={onClick}
      style={style}
      {...animationProps}
      {...props}
    >
      {children}
    </Component>
  );
};

GlassCard.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'highlighted', 'interactive']),
  className: PropTypes.string,
  onClick: PropTypes.func,
  animate: PropTypes.bool,
  style: PropTypes.object,
};

export default GlassCard;
