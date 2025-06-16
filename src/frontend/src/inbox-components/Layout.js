import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar'; 
import NavBar from './NavBar';


// The Layout component accepts children,
// that is, internal content that comes from another page (such as Inbox, Compose..).
const Layout = ({ children }) => {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Search effect
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    const token = localStorage.getItem('token');
    const timeoutId = setTimeout(() => {
      setSearching(true);
      fetch(`http://localhost:3000/api/mails/search/${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(async (r) => {
          if (!r.ok) {
            const { error } = await r.json().catch(() => ({}));
            throw new Error(error || r.statusText);
          }
          return r.json();
        })
        .then(setSearchResults)
        .catch(err => setSearchError(err.message))
        .finally(() => setSearching(false));
    }, 400); // debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <>
      <NavBar searchInput={searchInput} setSearchInput={setSearchInput} setSearchQuery={setSearchQuery}/>
      <div className="layout">
        <Sidebar />
        <div className="main-content">
          {React.Children.map(children, child =>
            React.isValidElement(child)
              ? React.cloneElement(child, {
                  searchQuery,
                  searchResults,
                  searching,
                  searchError,
                })
              : child
          )}
        </div>
      </div>
    </>
  );
};


export default Layout;

