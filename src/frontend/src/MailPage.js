import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './styles/inbox.css';

const MailPage = () => {
  const { id } = useParams(); // id comes from the URL.
  const [mail, setMail] = useState(null); // The variable in which we will store the content of the email.
  const [availableLabels, setAvailableLabels] = useState([]);
  const [addingLabel, setAddingLabel] = useState(false);
  const [labelSearch, setLabelSearch] = useState('');
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

    fetch('http://localhost:3000/api/labels', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        const arr = Array.isArray(data) ? data : data.labels;
        setAvailableLabels(Array.isArray(arr) ? arr : []);
      })
      .catch(console.error);
  }, [id, nav]);

    const handleRemoveLabel = async (labelId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:3000/api/mails/${id}/labels/${labelId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setMail(prev => ({
        ...prev,
        labels: prev.labels.filter(label => label.id !== labelId)
      }));
    }
  };

  const handleAddLabel = async (labelId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:3000/api/mails/${id}/labels/${labelId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const label = availableLabels.find(l => l.id === labelId);
      setMail(prev => ({
        ...prev,
        labels: [...prev.labels, label]
      }));
      setAddingLabel(false);
    }
  };

  // While the email is still null, a loading message is displayed.
  if (!mail) return <p className="centered-container">Loading…</p>;

  return (
    <div className="inbox-container">
      <div className="mail-box">
        <div className="mail-row mail-expanded">
          <div className="mail-top-row">
            <span className="subject">{mail.subject}</span>
            <span className="date">{new Date(mail.dateSent).toLocaleString('he-IL')}</span>
          </div>

          <div className="mail-meta">
            <p><strong>From:</strong> {mail.from}</p>
            <p><strong>To:</strong> {mail.to}</p>
          </div>

          <div className="mail-labels">
            {mail.labels?.map(label => (
              <span key={label.id} className="mail-label">
                {label.name}
                <span
                  className="remove-label"
                  onClick={() => handleRemoveLabel(label.id)}
                >
                  &times;
                </span>
              </span>
            ))}
            <span className="add-label" onClick={() => setAddingLabel(!addingLabel)}>+</span>
          </div>

          {addingLabel && (
            <div className="label-dropdown">
              <input
                type="text"
                placeholder="Search labels..."
                className="label-search"
                value={labelSearch}
                onChange={(e) => setLabelSearch(e.target.value)}
              />
              <div className="label-list">
                {availableLabels
                  .filter(label =>
                    !mail.labels.some(l => l.id === label.id) &&
                    label.name.toLowerCase().includes(labelSearch.toLowerCase())
                  )
                  .map(label => (
                    <div
                      key={label.id}
                      className="label-option"
                      onClick={() => handleAddLabel(label.id)}
                    >
                      {label.name}
                    </div>
                  ))}
              </div>
            </div>
          )}

          <hr />
          <div className="mail-content">{mail.content}</div>

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
