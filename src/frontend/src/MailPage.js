import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './styles/inbox.css';

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
  if (!mail) return <p className="centered-container">Loading…</p>;

  return (
    <div className="inbox-container">
      <div className="mail-box">
        <div className="mail-row mail-expanded">
          {/* Top row with subject and date */}
          <div className="mail-top-row">
            <span className="subject">{mail.subject}</span>
            <span className="date">{new Date(mail.dateSent).toLocaleString('he-IL')}</span>
          </div>

          {/* Metadata */}
          <div className="mail-meta">
            <p><strong>From:</strong> {mail.from}</p>
            <p><strong>To:</strong> {mail.to}</p>
          </div>

          {/* Labels */}
          <div className="mail-labels">
            {mail.labels?.map(label => (
              <span key={label.id} className="mail-label">{label.name}</span>
            ))}
          </div>

          {/* Content */}
          <hr />
          <div className="mail-content">{mail.content}</div>

          {/* Go Back */}
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
            <button className="send-btn" onClick={() => nav('/labels/inbox')}>
              Back to Inbox
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MailPage;
