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
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState(null);

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
    setEditMode(true);
    setNewLabelName(label.name);
    setEditingLabelId(label.id);
    setShowLabelModal(true);
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
            onClick={() => nav(`/labels/${label.name.toLowerCase()}`)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <span>{labelIcons[label.name.toLowerCase()] || <span class="material-symbols-rounded">label</span>}</span>
            <span>{label.name}</span>
          </li>
        ))}
      </ul>
      {/* Section Header for Custom Labels */}
      <div
        className="sidebar-labels-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '20px'
        }}
      >
        <h3 style={{ margin: 0 }}>My Labels</h3>
        <span
          className="material-symbols-rounded"
          style={{ cursor: 'pointer' }}
          onClick={() => setShowLabelModal(true)}
        >
          add
        </span>
      </div>

      {showLabelModal && (
        <div className="sidebar-overlay">
          <div className="sidebar-modal">
            <h3><span style={{ color: '#202124' }}>{editMode ? "Rename Label" : "Create New Label"}</span></h3>
            <input
              type="text"
              placeholder="Label name"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
            />
            <div className="sidebar-modal-buttons">
              <button
                className="add-btn"
                onClick={async () => {
                  const name = newLabelName.trim();
                  if (!name) return;

                  const token = localStorage.getItem('token');

                  try {
                    let res, newLabel;
                    if (editMode) {
                      res = await fetch(`http://localhost:3000/api/labels/${editingLabelId}`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({ name })
                      });

                      if (!res.ok) throw new Error("Failed to rename label");

                      setLabels(prev => prev.map(l =>
                        l.id === editingLabelId ? { ...l, name } : l
                      ));
                    } else {
                      res = await fetch('http://localhost:3000/api/labels', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({ name })
                      });

                      if (!res.ok) throw new Error("Failed to create label");

                      newLabel = await res.json();
                      setLabels(prev => [...prev, newLabel]);
                    }

                    setNewLabelName('');
                    setShowLabelModal(false);
                    setEditMode(false);
                    setEditingLabelId(null);
                  } catch (err) {
                    alert(err.message);
                  }
                }}
              >
                {editMode ? "Rename" : "Add"}
              </button>

              <button
                className="cancel-btn"
                onClick={() => {
                  setNewLabelName('');
                  setShowLabelModal(false);
                  setEditMode(false);
                  setEditingLabelId(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Labels */}
      <ul>
        {customLabels.map(label => (
          <li key={label.id} className="custom-label-item" onClick={() => nav(`/labels/${label.name.toLowerCase()}`)}>
            <div className="label-left">
              <span className="material-symbols-rounded">label</span>
              <span className="label-name">{label.name}</span>
            </div>

            <span className="label-options" onClick={(e) => {
              e.stopPropagation();
              setMenuOpenId(menuOpenId === label.id ? null : label.id);
            }}>
              <span className="material-symbols-rounded">more_vert</span>
            </span>

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