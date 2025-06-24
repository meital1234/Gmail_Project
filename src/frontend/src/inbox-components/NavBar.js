import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import { HiOutlineSearch } from "react-icons/hi";
import { FiSun, FiX, FiMoon } from "react-icons/fi";

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
          <span className="search-icon"><HiOutlineSearch /></span>
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

      <div className="navbar-section actions-section" ref={dropdownRef}>
        <button onClick={toggleTheme} className="icon-btn" title="Toggle theme">
          {theme === 'dark' ? <FiSun /> : <FiMoon />}
        </button>
        <img
          src={user?.image || '/default-avatar.png'}
          alt="Profile"
          className="user-avatar"
          onClick={() => setMenuOpen(!menuOpen)}
        />
        {menuOpen && (
          <div className="profile-dropdown">
            <button className="close-btn" onClick={() => setMenuOpen(false)}><FiX size={20} /></button>
            <div className="profile-email">{user?.username || 'user@email.com'}</div>
            <div className="profile-pic-ring">
              <img src={user?.image || '/default-avatar.png'} alt="avatar" className="profile-pic" />
            </div>
            <div className="profile-name">Hi, {user?.name || 'User'}!</div>
            <button className="google-settings-btn">Google Account settings</button>
            <div className="dropdown-actions">
              <button className="dropdown-btn">➕ Add account</button>
              <button className="dropdown-btn" onClick={handleLogout}>⇨ Sign out</button>
            </div>
            <div className="storage-info">☁️ 34% of 100 GB used</div>
            <div className="privacy-links">
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
