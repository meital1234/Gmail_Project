import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/form.css'; // including style doc

const Register = () => {
  const navigate = useNavigate(); // Enables navigation.

  // formData --> An object that contains all the form fields.
  // setFormData --> A function that updates the field values.
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: '',
    phone_number: '',
    email: '',
    password: '',
    confirm_password: '',
    image: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB

  // Any change to a field updates the corresponding field in formData according to the name.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents page refresh by default.
    setErrorMsg('');

    const {
      first_name, last_name, birth_date, gender, phone_number, email, password, confirm_password, image
    } = formData;

    // validetion for variables.
    if (!first_name || !birth_date || !gender || !phone_number || !email || !password || !confirm_password) {
      return setErrorMsg('Please fill in all fields');
    }

    try {
      // navigation to users.
      const response = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          first_name,
          last_name,
          phone_number,
          birthDate: birth_date,
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
      setErrorMsg('Network error ' + err.message);
    }
  };

  // Handle image upload and convert to Data URL
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      setErrorMsg('Image size must be less than 1MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, image: reader.result })); // reader.result is base64 data url
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="form-page">
      <div className="form-card">
        <h1 className="form-title" style={{ textAlign: 'left' }}>Registration</h1>
          
        <div className="progress-bar-outer">
          <div
            className="progress-bar-inner"
            style={{ width: `${(currentStep - 1) * 25}%` }} // 5 steps → 4 jumps = 25% for each step
          />
        </div>

        <form onSubmit={handleSubmit}>
          {currentStep === 1 && (
            <>
              <h3>Step 1: Name</h3>

              <input type="text" name="first_name" placeholder="First name" value={formData.first_name} onChange={handleChange} /><br />
              <input type="text" name="last_name" placeholder="Last name (optional)" value={formData.last_name} onChange={handleChange} /><br />
              <div className="form-buttons">
                      <button
                        type="button"
                        onClick={() => {
                          if (!formData.first_name) {
                            setErrorMsg('Please fill in your first name');
                            return;
                          }
                          setErrorMsg('');
                          setCurrentStep(currentStep + 1);
                        }} > Next </button>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <h3>Step 2: Personal Info</h3>

              <input type="date" name="birth_date" placeholder="birth date" value={formData.birth_date} onChange={handleChange} /><br />
              <select name="gender" value={formData.gender} onChange={handleChange} className="input-field">
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Rather not say">Rather not say</option>
                <option value="Other">Other</option>
              </select>
              <input type="text" name="phone_number" placeholder="phone number" value={formData.phone_number} onChange={handleChange} /><br />

              <div className="form-buttons">
                <button type="button" onClick={() => setCurrentStep(currentStep - 1)}> Back </button>
                <button type="button" onClick={() => {
                    const birthDate = new Date(formData.birth_date);
                    const today = new Date();
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const monthDiff = today.getMonth() - birthDate.getMonth();
                    const dayDiff = today.getDate() - birthDate.getDate();
                    const phonePattern = /^[0-9]{9,15}$/;
                    if (
                      !formData.birth_date || !formData.gender || !formData.phone_number
                    ) {
                      setErrorMsg("Please fill in all personal info fields");
                      return;
                    }
                    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
                      age--;
                    }

                    if (age < 10) {
                      setErrorMsg("You must be at least 10 years old to sign up!");
                      return;
                    }
                    if (!phonePattern.test(formData.phone_number)) {
                      setErrorMsg("Phone number must contain only digits");
                      return;
                    }
                    setErrorMsg('');
                    setCurrentStep(currentStep + 1);
                  }}>
                  Next
                </button>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <h3>Step 3: Email</h3>

              <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} /><br />
              
              <div className="form-buttons">
                <button type="button" onClick={() => setCurrentStep(currentStep - 1)}> Back </button>
                <button type="button" onClick={() => {
                  if (!formData.email) {
                    setErrorMsg("Please enter your chosen email address");
                    return;
                  }
                  if (!formData.email.endsWith('@bloomly.com')) {
                    setErrorMsg("Email must end with @bloomly.com");
                    return;
                  }

                  setErrorMsg('');
                  setCurrentStep(currentStep + 1);
                  }}> Next </button>
              </div>
            </>
          )}

          {currentStep === 4 && (
            <>
              <h3>Step 4: Create a Password</h3>
              <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} /><br />
              <input type="password" name="confirm_password" placeholder=" Confirm Password" value={formData.confirm_password} onChange={handleChange} /><br />

              <div className="form-buttons">
                <button type="button" onClick={() => setCurrentStep(currentStep - 1)}> Back </button>
                <button type="button" onClick={() => {
                  if (!formData.password || !formData.confirm_password) {
                    setErrorMsg("Please fill in both password fields");
                    return;
                  }
                  if (formData.password !== formData.confirm_password) {
                    setErrorMsg("Passwords do not match");
                    return;
                  }
                  const passPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
                  if (!passPattern.test(formData.password)) {
                    setErrorMsg("Password must be at least 8 characters long and include uppercase, lowercase, and a number");
                    return;
                  }

                  setErrorMsg('');
                  setCurrentStep(currentStep + 1);
                  }}> Next </button>
              </div>
            </>
          )}
          
          {currentStep === 5 && (
            <>
              <h3>Step 5: Profile Picture</h3>
              <label> Profile picture: <input type="file" accept="image/*" onChange={handleImageChange} /></label>
            
              <div className="form-buttons">
                <button type="button" onClick={() => setCurrentStep(currentStep - 1)}> Back </button>
                <button type="submit"> Register </button>
              </div>
            </>
          )}

          {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
        </form>
      </div>
    </div>
  );
};

export default Register;
