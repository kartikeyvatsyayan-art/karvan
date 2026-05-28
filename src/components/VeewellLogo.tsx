import React from 'react';
import { motion } from 'motion/react';

interface VeewellLogoProps {
  collapsed?: boolean;
}

export default function VeewellLogo({ collapsed = false }: VeewellLogoProps) {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const checkmarkVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { 
        duration: 0.9, 
        ease: "easeOut" 
      }
    }
  };

  const textVariants = {
    hidden: { opacity: 0, x: -15 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 15 
      }
    }
  };

  const subtitleVariants = {
    hidden: { opacity: 0, scaleX: 0 },
    visible: { 
      opacity: 1, 
      scaleX: 1,
      transition: { 
        duration: 0.7, 
        ease: "easeOut" 
      }
    }
  };

  if (collapsed) {
    // Elegant small animated emblem for collapsed sidebar
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="flex items-center justify-center w-12 h-12 relative cursor-pointer"
        whileHover={{ scale: 1.08 }}
      >
        <svg
          viewBox="0 0 60 60"
          className="w-10 h-10 drop-shadow-[0_2px_8px_rgba(14,165,233,0.3)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="vBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Glowing back element */}
          <motion.path
            d="M10,28 C8,25 15,22 18,26 L28,42 C36,28 46,14 54,6 C56,4 57,6 55,9 L32,49 C31,51 29,51 28,49 L10,28 Z"
            fill="none"
            stroke="url(#vBlueGrad)"
            strokeWidth="1.5"
            opacity="0.5"
            variants={checkmarkVariants}
          />

          {/* Foreground swooping V tick */}
          <motion.path
            d="M12,30 C10,27 16,24 19,28 C21,31 26,38 28,42 C34,29 44,15 52,7 C54,5 55,7 53,10 C42,24 33,40 31,47 C30.5,49 28.5,49 28,47 C24,41 18,34 12,30 Z"
            fill="url(#vBlueGrad)"
            variants={checkmarkVariants}
            whileHover={{ scale: 1.05 }}
          />
        </svg>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex flex-col items-start select-none py-1 pl-1 cursor-pointer"
    >
      <div className="flex items-center gap-1.5 overflow-visible">
        {/* Animated Brand Emblem wrapper */}
        <motion.div 
          className="relative shrink-0"
          whileHover={{ 
            scale: 1.05,
            rotate: [0, -2, 2, 0],
            transition: { duration: 0.4 }
          }}
        >
          <svg
            viewBox="0 0 65 65"
            className="w-11 h-11 drop-shadow-[0_3px_10px_rgba(14,165,233,0.35)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="vBlueGradFull" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="40%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#025091" />
              </linearGradient>
            </defs>

            {/* Solid stylized checkmark path */}
            <motion.path
              d="M13,32 C11,29 17,26 20,30 C22,33 27,41 29,45 C36,31 46,16 54,8 C56,6 57,8 55,11 C43,26 34,43 32,50 C31.5,52 29.5,52 29,50 C25,44 19,37 13,32 Z"
              fill="url(#vBlueGradFull)"
              variants={checkmarkVariants}
            />
          </svg>
        </motion.div>

        {/* Brand Text Columns */}
        <div className="flex flex-col justify-center -ml-1">
          <div className="flex items-baseline font-extrabold tracking-tight text-2xl leading-none">
            {/* "ee" text block in light-blue */}
            <motion.span 
              variants={textVariants}
              className="bg-gradient-to-r from-sky-400 to-sky-200 bg-clip-text text-transparent font-sans"
            >
              ee
            </motion.span>
            
            {/* "well" block in energetic orange/red */}
            <motion.span 
              variants={textVariants}
              className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent font-sans"
            >
              well
            </motion.span>
          </div>
        </div>
      </div>

      {/* Styled Tagline with flaking horizontal lines */}
      <motion.div 
        variants={subtitleVariants}
        className="w-[172px] flex items-center gap-2 mt-1 px-1 overflow-hidden"
      >
        <span className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-sky-500 to-sky-400 opacity-60" />
        <span className="text-[10px] font-bold tracking-[0.25em] text-cyan-400 uppercase font-mono bg-clip-text">
          Lifescience
        </span>
        <span className="h-[1.5px] flex-1 bg-gradient-to-r from-sky-400 via-sky-500 to-transparent opacity-60" />
      </motion.div>
    </motion.div>
  );
}
