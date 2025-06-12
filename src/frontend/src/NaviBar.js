import React from 'react';
import { useNavigate } from 'react-router-dom';
// import './styles.css';
import { useTheme } from './ThemeContext';

const Navbar = () => {
  const nav = useNavigate(); // Enables navigation.
  const { theme, toggleTheme } = useTheme();

  // Handling when clicking Logout.
  const handleLogout = () => {
    localStorage.removeItem('token');
    nav('/login');
  };

  return (
    <div className="topbar simple">
      <span className="logo">myGmail</span>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button onClick={toggleTheme} className="logout-btn">
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
      </div>
    </div>
  );
};

export default Navbar;
