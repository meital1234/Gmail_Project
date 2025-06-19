import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import { HiOutlineSearch } from "react-icons/hi";


const Navbar = ({ searchInput, setSearchInput, setSearchQuery, user }) => {
  const nav = useNavigate(); // Enables navigation.
  const { theme, toggleTheme } = useTheme();

  // Handling when clicking Logout.
  const handleLogout = () => {
    localStorage.removeItem('token');
    nav('/login');
  };

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

      <div className="navbar-section actions-section">
        <button onClick={toggleTheme} className="icon-btn" title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="icon-btn" onClick={handleLogout} title="Logout">
          Logout
        </button>
        <img
          src={user?.image || '/default-avatar.png'}  // dynamically loaded user image
          alt={user?.name || 'Profile'}
          className="user-avatar"
          onClick={() => nav('/profile')}
        />
      </div>
    </header>
  );
};

export default Navbar;
