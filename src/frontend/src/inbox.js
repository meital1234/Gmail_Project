import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/inbox.css';

const Inbox = () => {
  const [mails,   setMails]   = useState([]); // An array of emails to be received from the server.
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(true);
  const nav = useNavigate(); // Navigation function.

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { nav('/login'); return; } // If there is no token in localStorage, redirects to the login page.

      // Makes a GET call to the server and adds a token in the Authorization header.
      fetch('http://localhost:3000/api/mails', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(async (r) => {
        if (!r.ok) {
         
          const { error } = await r.json().catch(() => ({}));
          throw new Error(error || r.statusText);       
        }
        return r.json();
      })
      .then(setMails) // Saves received emails.
      .catch((err) => setError(err.message))             
      .finally(() => setLoading(false));
  }, [nav]);

  // If the data is still loading, displays loading text.
  if (loading) return <p className="centered-container">Loading…</p>;

  // If there is an error, it displays it in red text.
  if (error) {
    return (
      <p className="centered-container" style={{ color: 'red' }}>
        {error}
      </p>
    );
  }

  return (
    <div className="inbox-container">
      <div className="inbox-header">
        <h2 style={{ margin: 0 }}>Inbox</h2>
        <div className="header-buttons">
          <button className="new-mail-btn" onClick={() => nav('/compose')}>
            + New Mail
          </button>
        </div>
      </div>
      {mails.length === 0 && <p>No mail yet ✉️</p>}
      {mails.map(mail => (
        <div
          key={mail.id}
          className="mail-row"
          onClick={() => nav(`/mail/${mail.id}`)}   // ניווט לעמוד קריאה
        >
          <span className="from">{mail.from}</span>
          <span className="subject">{mail.subject}</span>
          <span className="date">
            {new Date(mail.dateSent).toLocaleString('he-IL')}
          </span>
        </div>
      ))}
    </div>
  );
};

export default Inbox;
