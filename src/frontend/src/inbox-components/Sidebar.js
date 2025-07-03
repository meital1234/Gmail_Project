import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/sidebar.css';

// map default labels to icons to appear in the sidebar
const labelIcons = {
  inbox: <span class="material-symbols-rounded">inbox</span>,
  sent: <span class="material-symbols-rounded">send</span>,
  drafts: <span class="material-symbols-rounded">drafts</span>,
  important: <span class="material-symbols-rounded">exclamation</span>,
  starred: <span class="material-symbols-rounded">family_star</span>,
  spam: <span class="material-symbols-rounded">Sentiment_Dissatisfied</span>
};

const defaultLabelNames = ["inbox", "sent", "drafts", "important", "starred", "spam"];

const Sidebar = () => {
  const [labels, setLabels] = useState([]);
  const [menuOpenId, setMenuOpenId] = useState(null); // Track which label menu is open
  const nav = useNavigate();

    useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      nav('/login', { replace: true });
      return;
    }

    fetch('http://localhost:3000/api/labels', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async res => {
        if (!res.ok) throw new Error('unauth');
        const data = await res.json();

        // always returns array (empty or not)
        const arr = Array.isArray(data) ? data : data.labels;
        setLabels(Array.isArray(arr) ? arr : []); 
      })
      .catch(err => {
        console.error('[Sidebar] fetch labels failed:', err);
        localStorage.removeItem('token');
        nav('/login', { replace: true });
      });
  }, [nav]);

  const safeLabels     = Array.isArray(labels) ? labels : [];
  const defaultLabels  = safeLabels.filter(l =>
    defaultLabelNames.includes(l.name?.toLowerCase())
  );
  const customLabels   = safeLabels.filter(l =>
    !defaultLabelNames.includes(l.name?.toLowerCase())
  );

  const handleRename = async (label) => {
    const newName = prompt("Rename label:", label.name);
    if (!newName || newName === label.name) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:3000/api/labels/${label.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name: newName })
    });
    if (res.ok) {
      setLabels(prev => prev.map(l => l.id === label.id ? { ...l, name: newName } : l));
    }
  };

  const handleDelete = async (labelId) => {
    if (!window.confirm("Are you sure you want to delete this label?")) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:3000/api/labels/${labelId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setLabels(prev => prev.filter(l => l.id !== labelId));
    }
  };

  return (
    <div className="sidebar">
      {/* Compose Button */}
      <button className="new-mail-btn" onClick={() => nav('/compose')}>
          <span class="material-symbols-rounded">edit</span>
          Compose
        </button>
      <ul>
        {defaultLabels.map(label => (
          <li
            key={label.id}
            onClick={() => nav(`/label/${label.name.toLowerCase()}`)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <span>{labelIcons[label.name.toLowerCase()] || <span class="material-symbols-rounded">label</span>}</span>
            <span>{label.name}</span>
          </li>
        ))}
      </ul>
      {/* Section Header for Custom Labels */}
      <div className="sidebar-labels-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
        <h3 style={{ margin: 0 }}>My Labels</h3>
        <span class="material-symbols-rounded"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            const name = prompt("Enter label name:");
            if (!name) return;

            const token = localStorage.getItem('token');
            fetch('http://localhost:3000/api/labels', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ name })
            })
              .then(r => r.ok ? r.json() : Promise.reject(r))
              .then(newLabel => setLabels(prev => [...prev, newLabel]))
              .catch(() => alert('Failed to create label'));
          }}>
          add
        </span>
      </div>

      {/* Custom Labels */}
      <ul>
        {customLabels.map(label => (
          <li
            key={label.id}
            className="custom-label-item"
            onClick={() => nav(`/label/${label.id}`)}
          >
            <span class="material-symbols-rounded">label</span>
            <span className="label-name">{label.name}</span>

            <span
              className="label-options"
              onClick={(e) => {
                e.stopPropagation(); // Don't trigger nav
                setMenuOpenId(menuOpenId === label.id ? null : label.id);
              }}
            >
              <span class="material-symbols-rounded">more_vert</span>
            </span>

            {/* Dropdown menu */}
            {menuOpenId === label.id && (
              <div className="label-dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="dropdown-item" onClick={() => handleRename(label)}>Edit</div>
                <div className="dropdown-item" onClick={() => handleDelete(label.id)}>Remove label</div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;