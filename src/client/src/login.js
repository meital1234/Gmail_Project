import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css'; // including style doc.

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // validetion for cordentional.
    if (!email || !password) {
      setErrorMsg('please fill in every thing');
      return;
    }

    try {
      // navigation to tokens.
      const response = await fetch('http://localhost:3000/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      // if there is no response.
      if (!response.ok) {
        throw new Error(data.error || 'unknoun eror');
      }

      // if token ok, navigate to your inbox.
      localStorage.setItem('token', data.token);
      navigate('/inbox');
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="centered-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        /><br />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        /><br />
        <button type="submit">Login</button>
        {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

        <p>
            You don't have an account? <a href="/register">register</a>
        </p>

      </form>
    </div>
  );
};

export default Login;
