
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AlertNotificationProps {
  message: string;
  type: "success" | "error" | "info" | "warning";
  position?: "top-left" | "top-right" | "top-center" | "bottom-left" | "bottom-right" | "bottom-center" | "left-center" | "right-center";
  duration?: number;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  autoHide?: boolean;
  onClose?: () => void;
}

const AlertNotification: React.FC<AlertNotificationProps> = ({ 
  message, 
  type, 
  position = "top-center",
  duration = 10000,
  size = "md",
  showProgress = true,
  autoHide = true,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!autoHide) return;

    const interval = 50;
    const decrement = (100 / duration) * interval;

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - decrement;
        if (newProgress <= 0) {
          clearInterval(progressTimer);
          return 0;
        }
        return newProgress;
      });
    }, interval);

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, autoHide, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const getTypeConfig = () => {
    switch (type) {
      case "success":
        return {
          bgGradient: "from-emerald-50/95 via-green-50/95 to-teal-50/95",
          borderGradient: "from-emerald-200 via-green-200 to-teal-200",
          textColor: "text-emerald-800",
          secondaryColor: "text-emerald-600",
          progressColor: "from-emerald-400 to-green-500",
          icon: "✓",
          glowColor: "shadow-emerald-500/25"
        };
      case "error":
        return {
          bgGradient: "from-red-50/95 via-rose-50/95 to-pink-50/95",
          borderGradient: "from-red-200 via-rose-200 to-pink-200",
          textColor: "text-red-800",
          secondaryColor: "text-red-600",
          progressColor: "from-red-400 to-rose-500",
          icon: "✕",
          glowColor: "shadow-red-500/25"
        };
      case "info":
        return {
          bgGradient: "from-blue-50/95 via-cyan-50/95 to-sky-50/95",
          borderGradient: "from-blue-200 via-cyan-200 to-sky-200",
          textColor: "text-blue-800",
          secondaryColor: "text-blue-600",
          progressColor: "from-blue-400 to-cyan-500",
          icon: "i",
          glowColor: "shadow-blue-500/25"
        };
      case "warning":
        return {
          bgGradient: "from-amber-50/95 via-yellow-50/95 to-orange-50/95",
          borderGradient: "from-amber-200 via-yellow-200 to-orange-200",
          textColor: "text-amber-800",
          secondaryColor: "text-amber-600",
          progressColor: "from-amber-400 to-yellow-500",
          icon: "⚠",
          glowColor: "shadow-amber-500/25"
        };
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case "sm":
        return {
          container: "max-w-xs",
          padding: "px-3 py-2",
          iconSize: "w-6 h-6 text-xs",
          textSize: "text-xs",
          closeSize: "w-5 h-5 text-xs",
          spacing: "gap-2"
        };
      case "md":
        return {
          container: "max-w-sm",
          padding: "px-4 py-3",
          iconSize: "w-8 h-8 text-sm",
          textSize: "text-sm",
          closeSize: "w-6 h-6 text-sm",
          spacing: "gap-3"
        };
      case "lg":
        return {
          container: "max-w-md",
          padding: "px-6 py-4",
          iconSize: "w-10 h-10 text-base",
          textSize: "text-base",
          closeSize: "w-8 h-8 text-base",
          spacing: "gap-4"
        };
    }
  };

  const getPositionConfig = () => {
    const baseClasses = "fixed z-50 px-4";
    
    switch (position) {
      case "top-left":
        return {
          containerClass: `${baseClasses} top-5 left-0`,
          justifyClass: "justify-start",
          animation: { initial: { x: -100, y: -50, opacity: 0 }, animate: { x: 0, y: 0, opacity: 1 }, exit: { x: -100, y: -50, opacity: 0 } }
        };
      case "top-right":
        return {
          containerClass: `${baseClasses} top-5 right-0`,
          justifyClass: "justify-end",
          animation: { initial: { x: 100, y: -50, opacity: 0 }, animate: { x: 0, y: 0, opacity: 1 }, exit: { x: 100, y: -50, opacity: 0 } }
        };
      case "top-center":
        return {
          containerClass: `${baseClasses} top-5 left-0 right-0`,
          justifyClass: "justify-center",
          animation: { initial: { y: -100, opacity: 0, scale: 0.9 }, animate: { y: 0, opacity: 1, scale: 1 }, exit: { y: -100, opacity: 0, scale: 0.9 } }
        };
      case "bottom-left":
        return {
          containerClass: `${baseClasses} bottom-5 left-0`,
          justifyClass: "justify-start",
          animation: { initial: { x: -100, y: 50, opacity: 0 }, animate: { x: 0, y: 0, opacity: 1 }, exit: { x: -100, y: 50, opacity: 0 } }
        };
      case "bottom-right":
        return {
          containerClass: `${baseClasses} bottom-5 right-0`,
          justifyClass: "justify-end",
          animation: { initial: { x: 100, y: 50, opacity: 0 }, animate: { x: 0, y: 0, opacity: 1 }, exit: { x: 100, y: 50, opacity: 0 } }
        };
      case "bottom-center":
        return {
          containerClass: `${baseClasses} bottom-5 left-0 right-0`,
          justifyClass: "justify-center",
          animation: { initial: { y: 100, opacity: 0, scale: 0.9 }, animate: { y: 0, opacity: 1, scale: 1 }, exit: { y: 100, opacity: 0, scale: 0.9 } }
        };
      case "left-center":
        return {
          containerClass: `${baseClasses} left-0 top-1/2 -translate-y-1/2`,
          justifyClass: "justify-start",
          animation: { initial: { x: -100, opacity: 0, scale: 0.9 }, animate: { x: 0, opacity: 1, scale: 1 }, exit: { x: -100, opacity: 0, scale: 0.9 } }
        };
      case "right-center":
        return {
          containerClass: `${baseClasses} right-0 top-1/2 -translate-y-1/2`,
          justifyClass: "justify-end",
          animation: { initial: { x: 100, opacity: 0, scale: 0.9 }, animate: { x: 0, opacity: 1, scale: 1 }, exit: { x: 100, opacity: 0, scale: 0.9 } }
        };
      default:
        return {
          containerClass: `${baseClasses} top-5 left-0 right-0`,
          justifyClass: "justify-center",
          animation: { initial: { y: -100, opacity: 0, scale: 0.9 }, animate: { y: 0, opacity: 1, scale: 1 }, exit: { y: -100, opacity: 0, scale: 0.9 } }
        };
    }
  };

  const typeConfig = getTypeConfig();
  const sizeConfig = getSizeConfig();
  const positionConfig = getPositionConfig();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={positionConfig.animation.initial}
          animate={positionConfig.animation.animate}
          exit={positionConfig.animation.exit}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 400,
            mass: 0.8
          }}
          className={`${positionConfig.containerClass} flex items-center ${positionConfig.justifyClass}`}
        >
          <div className={`relative ${sizeConfig.container} w-full`}>
            {/* Main notification container */}
            <div className={`
              relative overflow-hidden rounded-2xl 
              bg-gradient-to-br ${typeConfig.bgGradient}
              backdrop-blur-xl border-2 border-transparent
              bg-clip-padding
              shadow-xl ${typeConfig.glowColor}
              hover:shadow-2xl transition-all duration-300
            `}>
              {/* Gradient border effect */}
              <div className={`
                absolute inset-0 rounded-2xl p-[2px]
                bg-gradient-to-br ${typeConfig.borderGradient}
                -z-10
              `}>
                <div className={`
                  w-full h-full rounded-[14px]
                  bg-gradient-to-br ${typeConfig.bgGradient}
                `} />
              </div>

              {/* Content */}
              <div className={`${sizeConfig.padding} flex items-center ${sizeConfig.spacing} relative z-10`}>
                {/* Animated icon */}
                <motion.div 
                  className={`
                    flex-shrink-0 ${sizeConfig.iconSize} rounded-full
                    bg-white/70 backdrop-blur-sm
                    flex items-center justify-center
                    shadow-lg font-bold ${typeConfig.secondaryColor}
                    border border-white/30
                  `}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                >
                  {typeConfig.icon}
                </motion.div>

                {/* Message */}
                <div className="flex-1 min-w-0">
                  <motion.p 
                    className={`font-medium ${typeConfig.textColor} ${sizeConfig.textSize} leading-snug`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {message}
                  </motion.p>
                </div>

                {/* Close button */}
                <motion.button
                  onClick={handleClose}
                  className={`
                    flex-shrink-0 ${sizeConfig.closeSize} rounded-full
                    bg-white/40 hover:bg-white/60
                    backdrop-blur-sm transition-all duration-200
                    flex items-center justify-center
                    group hover:scale-110 active:scale-95
                    border border-white/20 hover:border-white/40
                    font-bold ${typeConfig.secondaryColor}
                  `}
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  ×
                </motion.button>
              </div>

              {/* Progress bar */}
              {showProgress && autoHide && (
                <div className="h-1 bg-white/20 backdrop-blur-sm">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${typeConfig.progressColor} shadow-sm`}
                    initial={{ width: "100%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.05, ease: "linear" }}
                  />
                </div>
              )}
            </div>

            {/* Ambient glow effect */}
            <div className={`
              absolute inset-0 -z-20 blur-3xl opacity-30
              bg-gradient-to-br ${typeConfig.bgGradient}
              transform scale-125 rounded-3xl
            `} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AlertNotification;