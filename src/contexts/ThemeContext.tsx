import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    isDarkMode: boolean;
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    toggleTheme: () => void; // Keep for backward compatibility
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as ThemeMode;
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
            setThemeModeState(savedTheme);
        }
    }, []);

    useEffect(() => {
        const updateTheme = () => {
            let effectiveDark = false;
            if (themeMode === 'dark') {
                effectiveDark = true;
            } else if (themeMode === 'system') {
                effectiveDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            } else {
                effectiveDark = false; // light
            }

            setIsDarkMode(effectiveDark);

            if (effectiveDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        updateTheme();
        localStorage.setItem('theme', themeMode);

        // Listen for system changes if system mode is active
        if (themeMode === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => updateTheme();
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [themeMode]);

    const setThemeMode = (mode: ThemeMode) => {
        setThemeModeState(mode);
    };

    // Keep toggleTheme for existing components, it cycles or toggles
    const toggleTheme = () => {
        setThemeModeState(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, themeMode, setThemeMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
