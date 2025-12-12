import { motion } from 'framer-motion';

const LoadingAnimation = () => {
  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const dotVariants = {
    initial: { scale: 0.8, opacity: 0.4 },
    animate: {
      scale: 1.2,
      opacity: 1,
      transition: {
        duration: 0.5,
        repeat: Infinity,
        repeatType: 'reverse'
      }
    }
  };

  return (
    <div className="flex justify-center items-center py-16">
      <motion.div
        className="flex space-x-3"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div
          className="w-3 h-3 rounded-full bg-green-500"
          variants={dotVariants}
        />
        <motion.div
          className="w-3 h-3 rounded-full bg-green-500"
          variants={dotVariants}
        />
        <motion.div
          className="w-3 h-3 rounded-full bg-green-500"
          variants={dotVariants}
        />
      </motion.div>
    </div>
  );
};

export default LoadingAnimation; 