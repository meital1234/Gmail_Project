import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import '../styles/inbox.css';


const Inbox = () => {
  const { searchQuery, searchResults, searching, searchError } = useOutletContext();
  const [mails, setMails] = useState([]);
  const [availableLabels, setAvailableLabels] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const nav = useNavigate();
  const { labelName } = useParams();
  const [addingLabelMailId, setAddingLabelMailId] = useState(null);
  const [labelSearchTerm, setLabelSearchTerm] = useState('');

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

    fetch('http://localhost:3000/api/labels', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async res => {
        if (!res.ok) throw new Error('unauth');
        const data = await res.json();
        const arr = Array.isArray(data) ? data : data.labels;
        setAvailableLabels(Array.isArray(arr) ? arr : []);
      })
      .catch(console.error);
  }, [nav]);

  // decide which list to display
  let displayMails = searchQuery ? searchResults : mails;
  if (labelName) {
    displayMails = displayMails.filter(mail =>
     mail.labels && mail.labels.some(label => label.name.toLowerCase() === labelName.toLowerCase())
    );
  }

  const handleDeleteMail = async (mailId) => {
    if (!window.confirm("Delete this mail?")) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:3000/api/mails/${mailId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setMails(prev => prev.filter(m => m.id !== mailId));
    }
  };

  const handleRemoveLabel = async (mailId, labelId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:3000/api/mails/${mailId}/labels/${labelId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setMails(prev =>
        prev.map(m =>
          m.id === mailId
            ? { ...m, labels: m.labels.filter(l => l.id !== String(labelId)) }
            : m
        )
      );
    }
  };

  const handleAddLabel = async (mailId, labelId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:3000/api/mails/${mailId}/labels/${labelId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.ok) {
      const label = availableLabels.find(l => l.id === labelId);
      setMails(prev =>
        prev.map(m =>
          m.id === mailId ? { ...m, labels: [...m.labels, label] } : m
        )
      );
      setAddingLabelMailId(null);
    }
  };


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
            <div className="mail-labels-row">
              <div className="mail-labels">
                {mail.labels && mail.labels.map(label => (
                  <span key={label.id} className="mail-label">
                    {label.name}
                    <span
                      className="remove-label"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveLabel(mail.id, label.id);
                      }}
                    >
                      &times;
                    </span>
                  </span>
                ))}
                <span
                  className="add-label"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddingLabelMailId(mail.id === addingLabelMailId ? null : mail.id);
                    setLabelSearchTerm('');
                  }}
                >+
                </span>

                {addingLabelMailId === mail.id && (
                  <div className="label-dropdown" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      placeholder="Search labels..."
                      className="label-search"
                      value={labelSearchTerm}
                      onChange={(e) => setLabelSearchTerm(e.target.value)}
                    />
                    <div className="label-list">
                      {availableLabels
                        .filter(label =>
                          !mail.labels.some(l => l.id === label.id) &&
                          label.name.toLowerCase().includes(labelSearchTerm.toLowerCase())
                        )
                        .map(label => (
                          <div
                            key={label.id}
                            className="label-option"
                            onClick={() => handleAddLabel(mail.id, label.id)}
                          >
                            {label.name}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="mail-actions" onClick={(e) => e.stopPropagation()}>
                <span 
                  className="mail-menu-btn"
                  onClick={() => setMenuOpenId(menuOpenId === mail.id ? null : mail.id)}
                >
                  ⋮
                </span>
                {menuOpenId === mail.id && (
                  <div className="mail-dropdown-menu">
                    {mail.labels.some(l => l.name.toLowerCase() === 'drafts') && (
                      <div className="dropdown-item" onClick={() => nav(`/compose?edit=${mail.id}`)}>
                        Edit Mail
                      </div>
                    )}
                    <div className="dropdown-item" onClick={() => handleDeleteMail(mail.id)}>
                      Delete Mail
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Inbox;
