import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, ThemePreference } from '../context/ThemeContext';
import { executeThemeViewTransition } from '../utils/themeAnimation';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  allowSystemMenu?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
  allowSystemMenu = true,
}) => {
  const { theme, preference, toggleTheme, setPreference } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  // Close dropdown on click outside
  useEffect(() => {
    if (!allowSystemMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [allowSystemMenu]);

  // Handle keyboard navigation for menu
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsMenuOpen(false);
    }
  };

  const handleToggleTheme = () => {
    executeThemeViewTransition(buttonRef.current, () => {
      toggleTheme();
    });
  };

  const selectPreference = (pref: ThemePreference) => {
    executeThemeViewTransition(buttonRef.current, () => {
      setPreference(pref);
    });
    setIsMenuOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-flex items-center" onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggleTheme}
        onContextMenu={(e) => {
          if (allowSystemMenu) {
            e.preventDefault();
            setIsMenuOpen((prev) => !prev);
          }
        }}
        aria-label={label}
        title={`${label} (Right-click or press menu for system options)`}
        className={`relative inline-flex items-center gap-2 p-2 rounded-full border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C6A15B] ${
          isDark
            ? 'bg-[#24191D] border-[#46343A] text-[#D8B878] hover:border-[#D8B878]/60 hover:bg-[#302126] shadow-[0_2px_12px_rgba(0,0,0,0.35)]'
            : 'bg-[#FAF9F8] border-[#EAE5E6] text-[#450817] hover:border-[#450817]/40 hover:bg-white shadow-[0_1px_3px_rgba(36,27,29,0.06)]'
        } ${className}`}
      >
        <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {isDark ? (
              <motion.div
                key="theme-sun"
                initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="flex items-center justify-center text-current"
              >
                <Sun className="w-4 h-4 text-current" strokeWidth={2} />
              </motion.div>
            ) : (
              <motion.div
                key="theme-moon"
                initial={{ rotate: 90, scale: 0.5, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: -90, scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="flex items-center justify-center text-current"
              >
                <Moon className="w-4 h-4 text-current" strokeWidth={2} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {showLabel && (
          <span className="text-xs font-sans font-medium tracking-wider uppercase pr-1.5 select-none">
            {preference === 'system' ? 'System Theme' : isDark ? 'Dark Theme' : 'Light Theme'}
          </span>
        )}
      </button>

      {/* Optional dropdown menu for choosing Light, Dark, or System */}
      <AnimatePresence>
        {isMenuOpen && allowSystemMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-44 rounded-xl py-1.5 bg-white dark:bg-[#24191D] border border-[#EAE5E6] dark:border-[#46343A] shadow-2xl z-50 text-xs font-sans text-[#241B1D] dark:text-[#F8F3F4]"
          >
            <div className="px-3 py-1.5 border-b border-[#EAE5E6] dark:border-[#46343A] text-[10px] uppercase font-bold tracking-wider text-[#777174] dark:text-[#C1B4B8]">
              Theme Preference
            </div>

            <button
              type="button"
              onClick={() => selectPreference('light')}
              className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors hover:bg-[#FAF9F8] dark:hover:bg-[#302126] ${
                preference === 'light' ? 'font-semibold text-[#450817] dark:text-[#D8B878]' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <Sun className="w-3.5 h-3.5 text-[#C6A15B]" />
                <span>Light Mode</span>
              </div>
              {preference === 'light' && <Check className="w-3.5 h-3.5 text-[#C6A15B]" />}
            </button>

            <button
              type="button"
              onClick={() => selectPreference('dark')}
              className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors hover:bg-[#FAF9F8] dark:hover:bg-[#302126] ${
                preference === 'dark' ? 'font-semibold text-[#450817] dark:text-[#D8B878]' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <Moon className="w-3.5 h-3.5 text-[#C6A15B]" />
                <span>Dark Mode</span>
              </div>
              {preference === 'dark' && <Check className="w-3.5 h-3.5 text-[#C6A15B]" />}
            </button>

            <button
              type="button"
              onClick={() => selectPreference('system')}
              className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors hover:bg-[#FAF9F8] dark:hover:bg-[#302126] ${
                preference === 'system' ? 'font-semibold text-[#450817] dark:text-[#D8B878]' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <Laptop className="w-3.5 h-3.5 text-[#C6A15B]" />
                <span>Follow System</span>
              </div>
              {preference === 'system' && <Check className="w-3.5 h-3.5 text-[#C6A15B]" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeToggle;
