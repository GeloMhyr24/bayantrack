import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
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
      // Send credentials to your backend
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        username,
        password
      });

      // If successful, save the token (e.g., to localStorage)
      localStorage.setItem('token', res.data.token);
      alert('Login Successful!');
      
      // Redirect user to dashboard or home
      navigate('/dashboard');
      
    } catch (err: any) {
      console.error(err.response.data);
      alert('Login Failed: ' + (err.response?.data?.msg || 'Server Error'));
    }
  };

  return (
    <div className="login-container">
      <h1>Sign In</h1>
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
        <input type="submit" value="Login" />
      </form>
      <p style={{ marginTop: '10px' }}>
        Don't have an account? <button type="button" onClick={() => navigate('/register')}>Register Account</button>
      </p>
    </div>
  );
};

export default Login;