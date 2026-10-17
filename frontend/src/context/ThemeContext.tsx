import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

export type Theme = 'dark' | 'light';
export type ThemePreference = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  preference: ThemePreference;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'rcb-theme';

const getSystemTheme = (): Theme => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference | null;
        if (stored === 'dark' || stored === 'light' || stored === 'system') {
          return stored;
        }
      } catch (err) {
        console.warn('Error accessing localStorage for theme preference:', err);
      }
    }
    return 'light';
  });

  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme);
  const transitionTimeoutRef = useRef<number | null>(null);

  // Resolved theme
  const resolvedTheme: Theme = preference === 'system' ? systemTheme : preference;

  // Listen to OS preference changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Enable a brief transition class when switching themes
  const triggerTransition = useCallback(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.add('theme-transition');

    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
    }

    transitionTimeoutRef.current = window.setTimeout(() => {
      root.classList.remove('theme-transition');
      transitionTimeoutRef.current = null;
    }, 250);
  }, []);

  // Apply theme to DOM
  const applyTheme = useCallback((themeToApply: Theme, withTransition: boolean = false) => {
    if (typeof document === 'undefined') return;

    if (withTransition) {
      triggerTransition();
    }

    const root = document.documentElement;
    if (themeToApply === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    root.setAttribute('data-theme', themeToApply);

    // Update meta theme-color tag
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeToApply === 'dark' ? '#120D0F' : '#FFFFFF');
    }
  }, [triggerTransition]);

  // Initial and reactive effect
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme, applyTheme]);

  // Toggle between dark and light
  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = resolvedTheme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (err) {
      console.warn('Unable to persist theme to localStorage:', err);
    }
    triggerTransition();
    setPreferenceState(nextTheme);
  }, [resolvedTheme, triggerTransition]);

  // Explicitly set theme (dark or light)
  const setTheme = useCallback((newTheme: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (err) {
      console.warn('Unable to persist theme to localStorage:', err);
    }
    triggerTransition();
    setPreferenceState(newTheme);
  }, [triggerTransition]);

  // Explicitly set preference (dark, light, or system)
  const setPreference = useCallback((newPreference: ThemePreference) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newPreference);
    } catch (err) {
      console.warn('Unable to persist theme to localStorage:', err);
    }
    triggerTransition();
    setPreferenceState(newPreference);
  }, [triggerTransition]);

  return (
    <ThemeContext.Provider
      value={{
        theme: resolvedTheme,
        preference,
        toggleTheme,
        setTheme,
        setPreference,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
