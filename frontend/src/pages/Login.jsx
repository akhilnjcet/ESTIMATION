import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useProgram } from '../context/ProgramContext';

const Login = () => {
  const navigate = useNavigate();
  const { refreshPrograms } = useProgram();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegistering) {
        const { data } = await api.post('/auth/register', { name, email, password });
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('user', JSON.stringify(data));
        await refreshPrograms();
        navigate('/');
      } else {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('user', JSON.stringify(data));
        await refreshPrograms();
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">{isRegistering ? 'Create Account' : 'Welcome Back'}</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          {isRegistering ? 'Sign up to start managing your business.' : 'Sign in to manage your estimations and invoices.'}
        </p>

        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center', backgroundColor: '#fef2f2', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <input type="text" className="form-control" placeholder="Admin User" required value={name} onChange={(e) => setName(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
                <UserIcon size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input type="email" className="form-control" placeholder="admin@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            </div>
          </div>

          <div className="form-group">
            <div className="flex justify-between items-center mb-2">
              <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
              {!isRegistering && <a href="#" style={{ fontSize: '0.875rem', color: 'var(--primary)' }}>Forgot Password?</a>}
            </div>
            <div style={{ position: 'relative' }}>
              <input type="password" className="form-control" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            {isRegistering ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={() => setIsRegistering(!isRegistering)} style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
            {isRegistering ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
