// src/client/src/MailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './styles.css';

const MailPage = () => {
  const { id } = useParams();
  const [mail, setMail] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`http://localhost:3000/api/mails/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then(setMail)
      .catch(() => nav('/inbox'));
  }, [id, nav]);

  if (!mail) return <p>Loading…</p>;

  return (
    <div className="mail-container">
      <h3>{mail.subject}</h3>
      <p><strong>From:</strong> {mail.from}</p>
      <p><strong>To:</strong> {mail.to}</p>
      <hr />
      <pre>{mail.content}</pre>
    </div>
  );
};

export default MailPage;
