import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

const ThemeContext = createContext();
const STORAGE_KEY = 'fk_theme';

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    // No saved preference: sync with system preference
    return getSystemTheme();
  });

  // Tracks whether the user has explicitly chosen a theme (manual override).
  // Until they do, the theme follows the system preference in real time.
  const userOverrideRef = useRef(!!localStorage.getItem(STORAGE_KEY));

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for real-time system theme changes when user hasn't set a manual preference
  useEffect(() => {
    if (userOverrideRef.current) return;
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setThemeState(e.matches ? 'dark' : 'light');
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const setTheme = useCallback((t) => {
    userOverrideRef.current = true;
    const resolved = t === 'auto' ? getSystemTheme() : t;
    localStorage.setItem(STORAGE_KEY, resolved);
    setThemeState(resolved);
  }, []);

  const cycleTheme = useCallback(() => {
    userOverrideRef.current = true;
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);