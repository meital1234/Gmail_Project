import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';

const Compose = () => {
  const [to,      setTo]      = useState(''); // The recipient's email address.
  const [subject, setSubject] = useState(''); // The subject of the email.
  const [content, setContent] = useState(''); // The body of the message.
  const [error,   setError]   = useState('');
  const nav = useNavigate();

  const handleSend = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token'); // Gets the token from localStorage.

    // If no recipient address was entered, displays an error.
    if (!to) { setError('Recipient required'); return; }

    try {
      // Sends an email to the server via POST with a token (verifies the user).
      const res = await fetch('http://localhost:3000/api/mails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ toEmail: to, subject, content })
      });
      if (!res.ok) {
        const { error } = await res.json().catch(()=>({}));
        throw new Error(error || res.statusText);
      }
      nav('/inbox');  
    } catch (err) {
      setError(err.message);
    }
  };
  
  return (
  <div className="compose-overlay">
    <div className="compose-box">
      <div className="compose-header">
        <h3>New Message</h3>
        <button className="close-btn" onClick={() => nav('/inbox')}>✖</button>
      </div>
      <form onSubmit={handleSend}>
        <input
          type="email"
          placeholder="To"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setError('');
          }}
        />
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            setError('');
          }}
        />
        <textarea
          placeholder="Message"
          rows={12}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setError('');
          }}
        />
        {error && <p className="compose-error">{error}</p>}
        <div className="compose-actions">
          <button className="send-btn" type="submit">Send</button>
          <button className="discard-btn" type="button" onClick={() => nav('/inbox')}>Discard</button>
        </div>
      </form>
    </div>
  </div>
);


};
export default Compose;
