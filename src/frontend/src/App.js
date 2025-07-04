import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login';
import Register from './Register';
import Inbox from './inbox-components/inbox';
import Compose from './Compose';
import Layout from './inbox-components/Layout';
import MailPage from './MailPage';
import { ThemeProvider } from './ThemeContext';
import RequireAuth from './RequireAuth';


function App() {
  // added search related states
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  useEffect(() => {
  if (!searchQuery) {
    setSearchResults([]);
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) return;

  setSearching(true);
  setSearchError('');

  fetch(`http://localhost:3000/api/mails/search/${encodeURIComponent(searchQuery)}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => {
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    })
    .then(setSearchResults)
    .catch(err => setSearchError(err.message))
    .finally(() => setSearching(false));
}, [searchQuery]);

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public pages */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected pages with layout */}
          <Route element={<RequireAuth />}>
            <Route
              path="/"
              element={
                <Layout
                  searchInput={searchInput}
                  setSearchInput={setSearchInput}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  searchResults={searchResults}
                  searching={searching}
                  searchError={searchError}
                />
              }
            >
              <Route index element={<Navigate to="labels/inbox" replace />} />
              <Route path="labels/:labelName" element={<Inbox />} />
              <Route path="compose" element={<Compose />} /> 
              <Route path="mail/:id" element={<MailPage />} />     
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
