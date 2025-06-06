import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div>
      <h1>Welcome!</h1>
      <p>
        <Link to="/login">Log In</Link> or <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
