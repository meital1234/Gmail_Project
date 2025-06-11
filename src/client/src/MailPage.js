// src/client/src/MailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './styles.css';

const MailPage = () => {
  const { id } = useParams(); // id comes from the URL.
  const [mail, setMail] = useState(null); // The variable in which we will store the content of the email.
  const nav = useNavigate();

  // We will check if there is a token, if there is no token we will go to the login page.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      nav('/login');
      return;
    }

    // Sending a GET request to the server with a token.
    fetch(`http://localhost:3000/api/mails/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => {
        if (!r.ok) throw new Error('Unauthorized');
        return r.json();
      })
      .then(setMail) // If everything is correct, we will save the content of the email in mail.
      .catch(() => nav('/login'));
  }, [id, nav]);
  // While the email is still null, a loading message is displayed.
  if (!mail) return <p>Loading…</p>;

  return (
    <div className="mail-container">
      <button className="back-btn" onClick={() => nav('/inbox')}>
        Go Back
      </button>
      <h3>{mail.subject}</h3>
      <p><strong>From:</strong> {mail.from}</p>
      <p><strong>To:</strong> {mail.to}</p>
      <hr />
      <div className="mail-content">{mail.content}</div>
    </div>
  );
};

export default MailPage;
