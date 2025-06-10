import React from 'react';
import './styles.css'; // including style doc

const Inbox = () => {
  return (
    <div className="centered-container">
      <h2>welcome to your inbox</h2>
      <p>your token is: {localStorage.getItem('token')}</p>
      <p>alsooo meital is the BEST</p>
    </div>
  );
};

export default Inbox;
