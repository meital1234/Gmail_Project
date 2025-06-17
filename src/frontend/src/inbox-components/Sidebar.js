import { useNavigate } from 'react-router-dom';
import '../styles/sidebar.css';
import React, { useEffect, useState } from 'react';
import { MdInbox, MdSend, MdDrafts, MdStar, MdReport, MdLabel } from 'react-icons/md';
import { Link } from 'react-router-dom';


// map default labels to icons to appear in the sidebar
const labelIcons = {
  inbox: <MdInbox />,
  sent: <MdSend />,
  drafts: <MdDrafts />,
  important: <MdStar />,
  starred: <MdStar />,
  spam: <MdReport />
};

const Sidebar = () => {
  const [labels, setLabels] = useState([]);
  const nav = useNavigate();


  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:3000/api/labels', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setLabels)
      .catch(console.error);
  }, []);

  return (
    <div className="sidebar">
      <h2>Labels</h2>
      <ul>
        {labels.map(label => (
          <li
            key={label.id}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <Link to={`/label/${label.id}`}>{label.name}</Link>
            <span>{labelIcons[label.name.toLowerCase()] || <MdLabel />}</span>
            <span>{label.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;