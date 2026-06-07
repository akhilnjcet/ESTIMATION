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

  // Forgot password flow states
  const [forgotPasswordStep, setForgotPasswordStep] = useState('login'); // 'login', 'email', 'otp', 'reset'
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [testPreviewUrl, setTestPreviewUrl] = useState('');

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

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setMessage('');
    setTestPreviewUrl('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email: forgotEmail });
      setMessage(data.message);
      if (data.testPreviewUrl) {
        setTestPreviewUrl(data.testPreviewUrl);
      }
      setForgotPasswordStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please check the email.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const { data } = await api.post('/auth/verify-otp', { email: forgotEmail, otp: otpCode });
      setMessage(data.message);
      setForgotPasswordStep('reset');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (newPassword !== confirmNewPassword) {
      return setError('Passwords do not match');
    }
    
    // Validate password strength: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return setError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (e.g. @$!%*?&#).');
    }

    try {
      const { data } = await api.post('/auth/reset-password', { 
        email: forgotEmail, 
        password: newPassword, 
        confirmPassword: confirmNewPassword 
      });
      alert(data.message || 'Password reset successful! You can now log in.');
      setForgotPasswordStep('login');
      setForgotEmail('');
      setOtpCode('');
      setNewPassword('');
      setConfirmNewPassword('');
      setError('');
      setMessage('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ transition: 'all 0.3s ease' }}>
        
        {forgotPasswordStep === 'login' ? (
          <>
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
                  {!isRegistering && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setForgotPasswordStep('email');
                        setError('');
                        setMessage('');
                      }} 
                      style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', border: 'none', background: 'none' }}
                    >
                      Forgot Password?
                    </button>
                  )}
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
          </>
        ) : forgotPasswordStep === 'email' ? (
          <>
            <h1 className="login-title">Forgot Password</h1>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Enter your registered email address to receive a 6-digit verification code.
            </p>

            {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center', backgroundColor: '#fef2f2', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}

            <form onSubmit={handleRequestOtp}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="admin@example.com" 
                    required 
                    value={forgotEmail} 
                    onChange={(e) => setForgotEmail(e.target.value)} 
                    style={{ paddingLeft: '2.5rem' }} 
                  />
                  <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Send Code
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
              <button 
                onClick={() => {
                  setForgotPasswordStep('login');
                  setError('');
                  setMessage('');
                }} 
                style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}
              >
                Back to Login
              </button>
            </div>
          </>
        ) : forgotPasswordStep === 'otp' ? (
          <>
            <h1 className="login-title">Verify OTP</h1>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              We've sent a 6-digit verification code to <strong style={{ color: 'var(--text-primary)' }}>{forgotEmail}</strong>. Please enter it below.
            </p>

            {message && <div style={{ color: '#047857', marginBottom: '1rem', textAlign: 'center', backgroundColor: '#ecfdf5', padding: '0.5rem', borderRadius: '4px', fontSize: '0.875rem' }}>{message}</div>}
            {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center', backgroundColor: '#fef2f2', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}

            {testPreviewUrl && (
              <div style={{ marginBottom: '1.5rem', textAlign: 'center', backgroundColor: '#eff6ff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <p style={{ fontSize: '0.75rem', color: '#1d4ed8', margin: '0 0 4px 0', fontWeight: 'bold' }}>[TESTING MODE]</p>
                <a href={testPreviewUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.875rem', color: '#2563eb', textDecoration: 'underline', fontWeight: 'bold' }}>
                  Click to open test email inbox ↗
                </a>
              </div>
            )}

            <form onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>Enter 6-Digit Code</label>
                <input 
                  type="text" 
                  maxLength="6"
                  className="form-control" 
                  placeholder="123456" 
                  required 
                  value={otpCode} 
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} 
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', fontWeight: 'bold', padding: '0.5rem' }} 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Verify Code
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between' }}>
              <button 
                type="button"
                onClick={() => {
                  setForgotPasswordStep('email');
                  setOtpCode('');
                  setError('');
                  setMessage('');
                }} 
                style={{ color: 'var(--text-secondary)' }}
              >
                Change Email
              </button>
              <button 
                type="button"
                onClick={handleRequestOtp}
                style={{ color: 'var(--primary)', fontWeight: 'bold' }}
              >
                Resend Code
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="login-title">Set New Password</h1>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Your verification was successful. Choose a strong new password below.
            </p>

            {error && <div style={{ color: 'var(--danger)', marginBottom: '1.5rem', textAlign: 'left', backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8125rem', lineHeight: '1.4' }}>{error}</div>}

            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password" 
                    className="form-control" 
                    placeholder="••••••••" 
                    required 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    style={{ paddingLeft: '2.5rem' }} 
                  />
                  <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                </div>
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Must contain: 8+ chars, uppercase, lowercase, number, & special char.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password" 
                    className="form-control" 
                    placeholder="••••••••" 
                    required 
                    value={confirmNewPassword} 
                    onChange={(e) => setConfirmNewPassword(e.target.value)} 
                    style={{ paddingLeft: '2.5rem' }} 
                  />
                  <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Reset Password
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
};

export default Login;
