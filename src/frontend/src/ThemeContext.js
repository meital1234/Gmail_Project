import React, { createContext, useContext, useEffect, useState } from 'react';
// Creates the context itself, where we will store the theme value and the function that changes it.
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Trying to read from localStorage the last value we saved, if not the default is light.
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('theme') || 'light'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // If the mode is light, it switches to dark, and vice versa.
  const toggleTheme = () => {
    setTheme(t => (t === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
