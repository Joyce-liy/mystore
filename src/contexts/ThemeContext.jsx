import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(() => {
        // Récupère le thème sauvegardé dans localStorage
        const saved = localStorage.getItem('theme');
        return saved === 'dark'; // Retourne true si 'dark', false sinon
    });

    useEffect(() => {
        // Sauvegarde le thème en localStorage (simple string, pas JSON)
        localStorage.setItem('theme', isDark ? 'dark' : 'light');

        // Applique la classe au document
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }, [isDark]);

    const toggleTheme = () => {
        setIsDark(!isDark);
    };

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme doit être utilisé dans ThemeProvider');
    }
    return context;
};
