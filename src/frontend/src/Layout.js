// src/frontend/src/Layout.jsx
import React from 'react';
import Navbar from './NaviBar';

// The Layout component accepts children,
// that is, internal content that comes from another page (such as Inbox, Compose..).
const Layout = ({ children }) => {
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '60px', paddingInline: '24px' }}>
        {children}
      </div>
    </>
  );
};

export default Layout;

