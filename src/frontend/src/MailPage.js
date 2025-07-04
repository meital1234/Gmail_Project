import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './styles/inbox.css';

const MailPage = () => {
  const { id } = useParams(); // Email ID (extracted from the URL).           
  const nav = useNavigate();
  const [mail, setMail] = useState(null); // The content of the email.
  const [error, setError] = useState('');
  const [availableLabels, setAvailableLabels] = useState([]);
  const [addingLabel, setAddingLabel] = useState(false);
  const [labelSearch, setLabelSearch] = useState('');

  // For editing draft
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    const fetchMail = async () => {
      const token = localStorage.getItem('token'); // Take the token (of the logged-in user) from localStorage.
      try {
        // Send a request to the server — retrieve the email by id.
        const res = await fetch(`http://localhost:3000/api/mails/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({}));
          throw new Error(error || res.statusText);
        }
        const data = await res.json();
        setMail(data);

        // If it's Draft — initialize the fields (to, subject, content) so we can edit them.
        const isDraft = data.labels?.some(l => l.name === 'Draft');
        if (isDraft) {
          setTo(data.to);
          setSubject(data.subject);
          setContent(data.content);
        }

      } catch (err) {
        setError(err.message);
      }
    };

    fetchMail();
    const token = localStorage.getItem('token');
    fetch('http://localhost:3000/api/labels', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        const arr = Array.isArray(data) ? data : data.labels;
        setAvailableLabels(Array.isArray(arr) ? arr : []);
      })
      .catch(console.error);
  }, [id]); // The effect will rerun every time the id changes.


  // When clicking the "Discard" button.
  const handleSave = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3000/api/mails/${id}`, {
        // Send PATCH to the server to update the email.
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          toEmail: to,
          subject,
          content,
          labels: mail.labels?.map(l => l.name)
        })
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        throw new Error(error || res.statusText);
      }
      // After saving return to Inbox.
      nav('/');
    } catch (err) {
      setError(err.message);
    }
  };

  // Send a DELETE request to the server, delete the Draft.
  const handleDelete = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3000/api/mails/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        throw new Error(error || res.statusText);
      }
      nav('/');
    } catch (err) {
      setError(err.message);
    }
  };

  // When a user clicks Send, sending process.
  const handleSend = async () => {
    const token = localStorage.getItem('token');

    // Check whether the recipient field is filled.
    if (!to.trim()) {
      setError('Recipient email is required');
      return;
    }

    try {
      // Send a POST to the server to create a new email.
      const res = await fetch(`http://localhost:3000/api/mails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          toEmail: to,
          subject,
          content
        })
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        throw new Error(error || res.statusText);
      }

      // After sending you can delete the old draft.
      await fetch(`http://localhost:3000/api/mails/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // return to Inbox.
      nav('/');
    } catch (err) {
      setError(err.message);
    }
 };

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

 // Displays "Loading..." until the email loads.
  if (!mail) {
    return (
      <div className="mail-container">
        <button className="back-btn" onClick={() => nav('/')}>
          Go Back
        </button>
        <p>Loading...</p>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  const isDraft = mail.labels?.some(l => l.name === 'Draft');

  // Displaying an edit form.
  if (isDraft) {
    return (
      <div className="mail-container">
        <button className="back-btn" onClick={() => nav('/')}>
          Go Back
        </button>

        <h3>Editing Draft</h3>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div>
            <label>To:</label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div>
            <label>Subject:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label>Content:</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
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
          <div className="draft-buttons">
            <button type="submit">Discard</button>
            <button type="button" onClick={handleDelete}>Delete Draft</button>
            <button type="button" onClick={handleSend}>Send</button>
          </div>
        </form>

        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  // Otherwise (not Draft), Show normal view.
  return (
    <div className="mail-container">
      <button className="back-btn" onClick={() => nav('/')}>
        Go Back
      </button>

      <h3>{mail.subject}</h3>
      <p><strong>From:</strong> {mail.from}</p>
      <p><strong>To:</strong> {mail.to}</p>
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

      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default MailPage;