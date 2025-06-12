import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css'; // including style doc

const Register = () => {
  const navigate = useNavigate(); // Enables navigation.

  // formData --> An object that contains all the form fields.
  // setFormData --> A function that updates the field values.
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone_number: '',
    birthDate: '',
    gender: '',
    image: ''
  });

  const [errorMsg, setErrorMsg] = useState('');

  // Any change to a field updates the corresponding field in formData according to the name.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents page refresh by default.
    setErrorMsg('');

    const {
      email, password, confirmPassword,
      phone_number, birthDate, gender, image
    } = formData;

    // validetion for varubles.
    if (!email || !password || !confirmPassword || !phone_number || !birthDate || !gender) {
      return setErrorMsg('Please fill in all fields');
    }

    // password & confirmPassword must be identical.
    if (password !== confirmPassword) {
      return setErrorMsg('The passwords do not match');
    }

    try {
      // navigation to users.
      const response = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          phone_number,
          birthDate,
          gender,
          image
        })
      });

      // if the response is good, navigate to login.
      if (response.status === 201) {
        navigate('/login');
      } else {
        const data = await response.json();
        setErrorMsg(data.error || 'An error occurred');
      }
    } catch (err) {
      setErrorMsg('Network error' + err.message);
    }
  };

  return (
    <div className="centered-container">
      <h2>Registration</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" name="email" placeholder="Email_name" value={formData.email} onChange={handleChange} /><br />
        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} /><br />
        <input type="password" name="confirmPassword" placeholder=" Confirm Password" value={formData.confirmPassword} onChange={handleChange} /><br />
        <input type="text" name="phone_number" placeholder="phone number" value={formData.phone_number} onChange={handleChange} /><br />
        <input type="date" name="birthDate" placeholder="birthDate" value={formData.birthDate} onChange={handleChange} /><br />
        <input type="text" name="gender" placeholder="gender" value={formData.gender} onChange={handleChange} /><br />
        <input type="text" name="image" placeholder="Profile picture (link)" value={formData.image} onChange={handleChange} /><br />
        <button type="submit">Register</button>
        {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
      </form>
    </div>
  );
};

export default Register;
