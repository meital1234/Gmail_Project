import { useEffect, useState } from 'react';
import Sidebar from './Sidebar'; 
import NavBar from './NavBar';
import { Outlet } from 'react-router-dom';

// The Layout component accepts children,
// that is, internal content that comes from another page (such as Inbox, Compose..).
const Layout = ({
  searchInput,
  setSearchInput,
  setSearchQuery,
  searchQuery,
  searchResults,
  searching,
  searchError
}) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:3000/api/users/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then(setUser)
      .catch(err => console.error("Failed to load user:", err));
  }, []);
  return (
  <>
    <NavBar
      user={user}
      searchInput={searchInput}
      setSearchInput={setSearchInput}
      setSearchQuery={setSearchQuery}
      searchQuery={searchQuery}
      searchResults={searchResults}
      searching={searching}
      searchError={searchError}
    />
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        {/* This is where the current page will render */}
        <Outlet
          context={{
            searchQuery,
            searchResults,
            searching,
            searchError,
          }}
        />
      </div>
    </div>
  </>
  );
};



export default Layout;

