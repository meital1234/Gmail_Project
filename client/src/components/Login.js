import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiPost } from '../api/apiClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const response = await apiPost('/tokens', { email, password });

      if (!response.ok) {
        const data = await response.json();
        setErrorMsg(data.error || 'Login failed');
        return;
      }

      const { token } = await response.json();
      localStorage.setItem('jwtToken', token);
      navigate('/inbox');
    } catch (err) {
      console.error('Network error:', err);
      setErrorMsg('Network error');
    }
  };

  return (
    <div>
      <h1>Log In</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Log In</button>
      </form>
      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
      <p>
        Don’t have an account? <Link to="/register">Register here</Link>.
      </p>
    </div>
  );
}
