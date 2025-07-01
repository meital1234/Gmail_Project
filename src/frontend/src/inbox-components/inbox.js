import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import '../styles/inbox.css';


const Inbox = () => {
  const { searchQuery, searchResults, searching, searchError } = useOutletContext();
  const [mails,   setMails]   = useState([]); // An array of emails to be received from the server.
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const nav = useNavigate(); // Navigation function.
  const { id: labelId } = useParams();

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

      fetch('http://localhost:3000/api/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(setUser)
      .catch(console.error);
  }, [nav]);

  // decide which list to display
  let displayMails = searchQuery ? searchResults : mails;
  if (labelId) {
    displayMails = displayMails.filter(mail =>
     mail.labels && mail.labels.some(label => label.id === labelId)
    );
  }

  if (loading) return <p className="centered-container">Loading…</p>;
  if (error) return <p className="centered-container" style={{ color: 'red' }}>{error}</p>;
  if (searchError) return <p className="centered-container" style={{ color: 'red' }}>{searchError}</p>;

  return (
    <div className="inbox-container">
      <div className="inbox-header">
        <h2 style={{ margin: 0 }}>
          Hello {user?.first_name || 'User'}, welcome to your Bloomly Mail!
        </h2>
      </div>
      
      {searching && <div>Searching…</div>}
      {!searching && searchQuery && displayMails.length === 0 && <p>No mail found ✉️</p>}
      <div className="mail-box">
        {displayMails.map(mail => (
          <div
            key={mail.id}
            className="mail-row"
            onClick={() => nav(`/mail/${mail.id}`)}
          >
            <div className="mail-top-row">
              <span className="from">{mail.from}</span>
              <span className="subject">{mail.subject}</span>
              <span className="date">
                {new Date(mail.dateSent).toLocaleString('he-IL')}
              </span>
            </div>

            <div className="mail-labels">
              {mail.labels && mail.labels.map(label => (
                <span key={label.id} className="mail-label">
                  {label.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Inbox;
