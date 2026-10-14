import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`relative inline-flex items-center gap-2 p-2 rounded-full border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
        isDark
          ? 'bg-zinc-900/80 border-amber-400/25 text-amber-300 hover:border-amber-400/50 hover:bg-zinc-800 shadow-[0_0_12px_rgba(214,179,106,0.15)]'
          : 'bg-[#F2EEE5] border-[#E5DED1] text-[#9B742B] hover:border-[#B58B40] hover:bg-[#FAF8F3] shadow-[0_2px_8px_rgba(155,116,43,0.1)]'
      } ${className}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="dark-sun"
              initial={{ rotate: -90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="flex items-center justify-center text-amber-300"
            >
              <Sun className="w-4 h-4 text-amber-300 drop-shadow-[0_0_6px_rgba(240,217,155,0.6)]" />
            </motion.div>
          ) : (
            <motion.div
              key="light-moon"
              initial={{ rotate: 90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="flex items-center justify-center text-[#9B742B]"
            >
              <Moon className="w-4 h-4 text-[#9B742B]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showLabel && (
        <span className="text-xs font-sans font-medium tracking-wider uppercase pr-1.5 select-none">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
