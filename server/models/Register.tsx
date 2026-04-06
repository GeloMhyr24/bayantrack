import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const navigate = useNavigate();
  const { username, password } = formData;

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Send registration data to backend
      await axios.post('http://localhost:5000/api/auth/register', {
        username,
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
      <h1>Register</h1>
      <form onSubmit={onSubmit}>
        <div>
          <input
            type="text"
            placeholder="Username"
            name="username"
            value={username}
            onChange={onChange}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            name="password"
            value={password}
            onChange={onChange}
            required
          />
        </div>
        <input type="submit" value="Register" />
      </form>
      <p style={{ marginTop: '10px' }}>
        Already have an account? <button onClick={() => navigate('/login')}>Login</button>
      </p>
    </div>
  );
};

export default Register;