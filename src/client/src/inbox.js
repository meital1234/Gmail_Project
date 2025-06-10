// src/client/src/Inbox.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';

const Inbox = () => {
  const [mails,   setMails]   = useState([]);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { nav('/login'); return; }

      fetch('http://localhost:3000/api/mails', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(async (r) => {
        if (!r.ok) {
          // מגרדים את הודעת השגיאה מה-JSON (אם יש)
          const { error } = await r.json().catch(() => ({}));
          throw new Error(error || r.statusText);        // <-- תמיד Error עם message
        }
        return r.json();
      })
      .then(setMails)
      .catch((err) => setError(err.message))             // <-- תמיד מחרוזת
      .finally(() => setLoading(false));
  }, [nav]);

  if (loading) return <p className="centered-container">Loading…</p>;
  if (error) {
    return (
      <p className="centered-container" style={{ color: 'red' }}>
        {error}
      </p>
    );
  }



  return (
    <div className="inbox-container">
      <button
        className="fab"
        onClick={() => nav('/compose')}
        title="New mail"
      >
      </button>

      <h2>Inbox</h2>
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
