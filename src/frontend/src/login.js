import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/form.css'; // including style doc.

const Login = () => {
  const [email, setEmail] = useState(''); // Holds the values ​​from the fields in the form.
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate(); // Enables navigation.

  // A function that handles submitting the form.
  const handleSubmit = async (e) => { 
    e.preventDefault();
    setErrorMsg('');

    // validetion for cordentional.
    if (!email || !password) {
      setErrorMsg('Please fill in your credentials');
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
        throw new Error(data.error || 'unknown error');
      }

      // The token is saved in local storage for later use.
      localStorage.setItem('token', data.token);
      navigate('/labels/inbox');
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="form-page">
      <div className="form-card">
        <h1 className="form-title">Login</h1>

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
          <div className="form-buttons">
            <button type="submit">Sign in</button>
          </div>
          {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

          <p>
              Don't have an account yet? <a href="/register">register</a>
          </p>

        </form>
      </div>
    </div>
  );
};

export default Login;
