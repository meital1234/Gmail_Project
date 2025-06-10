// src/client/src/Compose.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';

const Compose = () => {
  const [to,      setTo]      = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [error,   setError]   = useState('');
  const nav = useNavigate();

  const handleSend = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    if (!to) { setError('Recipient required'); return; }

    try {
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
      nav('/inbox');   // חזרה לאינבוקס
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="centered-container">
      <h2>Compose</h2>
      <form onSubmit={handleSend}>
        <input
          type="email"
          placeholder="To"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        /><br/>
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        /><br/>
        <textarea
          placeholder="Message"
          rows={10}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        /><br/>
        <button type="submit">Send</button>
        <button type="button" onClick={() => nav(-1)}>Cancel</button>
        {error && <p style={{color:'red'}}>{error}</p>}
      </form>
    </div>
  );
};
export default Compose;
