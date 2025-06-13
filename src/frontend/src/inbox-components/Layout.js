// src/frontend/src/Layout.jsx
import React from 'react';
import Sidebar from './Sidebar'; 
import NaviBar from './NaviBar';


// The Layout component accepts children,
// that is, internal content that comes from another page (such as Inbox, Compose..).
const Layout = ({ children }) => {
  return (
    <>
      <NaviBar />
      <div className="layout">
        <Sidebar />
        <div className="main-content">{children}</div>
      </div>
    </>
  );
};


export default Layout;

