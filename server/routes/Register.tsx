import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    contactNumber: '',
    studentId: '',
    password: '',
    confirmPassword: ''
  });
  const [agreeTerms, setAgreeTerms] = useState(false);

  const navigate = useNavigate();
  const { username, email, contactNumber, studentId, password, confirmPassword } = formData;

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreeTerms) {
      alert('You must agree to the Terms and Conditions');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // Validate Contact Number (Must be exactly 11 digits)
    const contactRegex = /^\d{11}$/;
    if (!contactRegex.test(contactNumber)) {
      alert('Contact number must be exactly 11 digits (e.g., 09292009502)');
      return;
    }

    try {
      // Send registration data to backend
      await axios.post('http://localhost:5000/api/auth/register', {
        username,
        email,
        contactNumber,
        studentId, // Optional
        password
      });
      
      alert('Registration Successful! You can now login.');
      navigate('/login');
      
    } catch (err: any) {
      console.error(err.response?.data);
      alert('Registration Failed: ' + (err.response?.data?.msg || 'Server Error'));
    }
  };

  return (
    <div className="login-container">
      <h1>Sign Up</h1>
      <form onSubmit={onSubmit}>
        <div>
          <input type="text" placeholder="Username" name="username" value={username} onChange={onChange} required />
        </div>
        <div>
          <input type="email" placeholder="Email Address" name="email" value={email} onChange={onChange} required />
        </div>
        <div>
          <input 
            type="text" 
            placeholder="Contact Number (11 digits)" 
            name="contactNumber" 
            value={contactNumber} 
            onChange={onChange} 
            maxLength={11}
            required 
          />
        </div>
        <div>
          <input type="text" placeholder="Student ID (Optional)" name="studentId" value={studentId} onChange={onChange} />
        </div>
        <div>
          <input type="password" placeholder="Password" name="password" value={password} onChange={onChange} required />
        </div>
        <div>
          <input type="password" placeholder="Confirm Password" name="confirmPassword" value={confirmPassword} onChange={onChange} required />
        </div>
        
        <div style={{ margin: '10px 0', textAlign: 'left' }}>
          <label>
            <input 
              type="checkbox" 
              checked={agreeTerms} 
              onChange={(e) => setAgreeTerms(e.target.checked)} 
            />
            {' '} I accept the Terms and Conditions
          </label>
        </div>

        <input type="submit" value="Sign Up" />
      </form>
      <p style={{ marginTop: '10px' }}>
        Already have an account? <button type="button" onClick={() => navigate('/login')}>Login</button>
      </p>
    </div>
  );
};

export default Register;