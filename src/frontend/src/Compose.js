import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/compose.css';

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
  

  // Sends a POST to the server with a label of Draft — that is, saves the email as a draft.
  const saveDraft = async () => {
    const token = localStorage.getItem('token');
    try {
      await fetch('http://localhost:3000/api/mails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          toEmail: to,
          subject,
          content,
          labels: ['Draft']
        })
      });
    } catch (err) {
      console.error('Failed to save draft:', err);
    }
  };

  // Clicking "Discard" — first saves as a draft and then returns to the Inbox.
  const handleDiscard = async () => {
    await saveDraft();
    nav('/inbox');
  };


  // screen display.
  return (
  <div className="compose-overlay">
    <div className="compose-box">
      <div className="compose-header">
        <h3>New Message</h3>
        <button className="close-btn" onClick={handleDiscard}>✖</button>
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
          <button className="discard-btn" type="button" onClick={handleDiscard}>Discard</button>
        </div>
      </form>
    </div>
  </div>
);


};
export default Compose;
