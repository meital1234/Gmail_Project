import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';

const Navbar = ({ searchInput, setSearchInput, setSearchQuery, user }) => {
  const nav = useNavigate(); // Enables navigation.
  const { theme, toggleTheme } = useTheme();

  // sign out user menu - in a dropdown menu
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Handling when clicking Logout.
  const handleLogout = () => {
    localStorage.removeItem('token');
    nav('/login');
  };

  const handleAddAccount = () => {
    nav('/register');
  };

  // Close the dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="topbar">

      <div className="navbar-section logo-area" onClick={() => nav('/inbox')}>
        <img src="/app-logo.png" alt="" className="app-logo" />
        <span className="app-name">Bloomly</span>
      </div>

      <div className="navbar-section search-section">
        <div className="search-bar-wrapper">
          <span className="material-symbols-rounded">search</span>
          <input
            className="search-bar-input"
            placeholder="Search mail"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") setSearchQuery(searchInput);
            }}
          />
        </div>
      </div>

      <div className="navbar-section" ref={dropdownRef}>
          <button
            onClick={toggleTheme}
            className="icon-btn"
            title="Toggle theme"
          >
            {theme === 'dark' ? 
            <span className="material-symbols-rounded">dark_mode</span> : 
            <span className="material-symbols-rounded">light_mode</span>}
          </button>
        <img
          src={user?.image || '/default-avatar.png'}
          alt="Profile"
          className="user-avatar"
          onClick={() => setMenuOpen(!menuOpen)}
        />
        {menuOpen && (
          <div className="profile-dropdown">
            <button className="close-btn" onClick={() => setMenuOpen(false)}>
              <span className="material-symbols-rounded">close</span>
            </button>

            <div className="profile-content">
              <div className="profile-email">{user?.email}</div>

              <div className="profile-header">
                <img src={user?.image || '/default-avatar.png'} alt="avatar" className="profile-pic" />
                <div className="profile-name">Hi, {user?.first_name}!</div>
              </div>

              <div className="dropdown-actions">
                <button className="dropdown-btn" onClick={handleAddAccount}>Add account</button>
                <button className="dropdown-btn" onClick={handleLogout}>Sign out</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
