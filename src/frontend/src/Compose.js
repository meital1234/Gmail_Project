import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/compose.css';

const defaultLabelNames = ["inbox", "sent", "drafts", "important", "starred", "spam"];

const Compose = () => {
  const [to,      setTo]      = useState(''); // The recipient's email address.
  const [subject, setSubject] = useState(''); // The subject of the email.
  const [content, setContent] = useState(''); // The body of the message.
  const [error,   setError]   = useState('');
  const [availableLabels, setAvailableLabels] = useState([]);
  const [selectedLabels, setSelectedLabels] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:3000/api/labels', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(async res => {
      if (!res.ok) throw new Error('unauth');
      const data = await res.json();

      const arr = Array.isArray(data) ? data : data.labels;
      setAvailableLabels(Array.isArray(arr) ? arr : []);
    })
    .catch(() => alert('Failed to load labels'));
}, []);

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
      nav('/');  
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
          labels: ['Drafts']
        })
      });
    } catch (err) {
      console.error('Failed to save draft:', err);
    }
  };

  // Clicking "Discard" — first saves as a draft and then returns to the Inbox.
  const handleDiscard = async () => {
    await saveDraft();
    nav('/');
  };

  const handleAddLabel = async () => {
  const name = prompt("Enter new label name:");
  if (!name) return;

  const token = localStorage.getItem('token');
  try {
    const res = await fetch('http://localhost:3000/api/labels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });

    if (!res.ok) throw new Error("Failed to create label");

    const newLabel = await res.json();
    setAvailableLabels(prev => [...prev, newLabel]);
  } catch (err) {
    alert("Could not create label");
  }
};

  // screen display.
  return (
  <div className="compose-overlay">
    <div className="compose-box">
      <div className="compose-header">
        <h3>New Message</h3>
        <button className="close-btn" onClick={handleDiscard}><span className="material-symbols-rounded">close</span></button>
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

        <div className="compose-labels">
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Labels:
            <span
              className="label-add-btn"
              title="Add new label"
              onClick={handleAddLabel}
            >
              +
            </span>
          </h4>
          <div className="label-pills">
            {availableLabels
              .filter(label => !defaultLabelNames.includes(label.name?.toLowerCase()))
              .map(label => {
                const selected = selectedLabels.includes(label.name);
                return (
                  <span
                    key={label.id}
                    className={`pill ${selected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedLabels(prev =>
                        selected
                          ? prev.filter(l => l !== label.name)
                          : [...prev, label.name]
                      );
                    }}
                  >
                  {label.name}
                </span>
              );
            })}
          </div>
        </div>

        {error && <p className="compose-error">{error}</p>}
        <div className="compose-actions">
          <button className="send-btn" type="submit">Send</button>
          <button className="discard-btn" type="button" onClick={(handleDiscard)}>Discard</button>
        </div>
      </form>
    </div>
  </div>
);


};
export default Compose;
