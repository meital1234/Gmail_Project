import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/sidebar.css';

const Sidebar = () => {
  const nav = useNavigate();

  return (
    <aside className="sidebar">
      <ul>
        <li onClick={() => nav('/inbox')}>Inbox</li>
        <li onClick={() => nav('/compose')}>Compose</li>
        <li onClick={() => nav('/sent')}>Sent</li>
        <li onClick={() => nav('/logout')}>Logout</li>
      </ul>
    </aside>
  );
};

export default Sidebar;