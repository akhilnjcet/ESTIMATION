import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User as UserIcon, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useProgram } from '../context/ProgramContext';
import logo from '../assets/logo.jpg';

const Login = () => {
  const navigate = useNavigate();
  const { refreshPrograms } = useProgram();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password flow states
  const [forgotPasswordStep, setForgotPasswordStep] = useState('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [testPreviewUrl, setTestPreviewUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        const { data } = await api.post('/auth/register', { name, email, password });
        // Clear any stale programId from a previous user's session
        localStorage.removeItem('programId');
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('user', JSON.stringify(data));
        await refreshPrograms();
        navigate('/');
      } else {
        const { data } = await api.post('/auth/login', { email, password });
        // Clear any stale programId from a previous user's session
        localStorage.removeItem('programId');
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('user', JSON.stringify(data));
        await refreshPrograms();
        navigate('/');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || (err.message === 'Network Error' || !err.response ? 'Cannot connect to server. Please ensure the backend is running on http://localhost:5000' : err.message);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setMessage('');
    setTestPreviewUrl('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: forgotEmail });
      setMessage(data.message);
      if (data.testPreviewUrl) {
        setTestPreviewUrl(data.testPreviewUrl);
      }
      setForgotPasswordStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please check the email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email: forgotEmail, otp: otpCode });
      setMessage(data.message);
      setForgotPasswordStep('reset');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (newPassword !== confirmNewPassword) {
      return setError('Passwords do not match');
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return setError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
    }

    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0B1220',
      backgroundImage: 'radial-gradient(circle at 50% -20%, rgba(59, 130, 246, 0.12) 0%, transparent 65%)',
      position: 'relative',
      padding: '1.5rem'
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '2.5rem 2rem',
          boxShadow: 'var(--shadow-card)',
          borderRadius: '18px'
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.75rem', textAlign: 'center' }}>
          <div style={{ position: 'relative', marginBottom: '0.85rem' }}>
            <img 
              src={logo} 
              alt="Krishna Logo" 
              style={{ 
                width: '100px', 
                height: '100px', 
                objectFit: 'contain',
                filter: 'drop-shadow(0 6px 18px rgba(59, 130, 246, 0.5))'
              }} 
            />
          </div>

          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, var(--text-primary) 40%, var(--primary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 0.2rem 0'
          }}>
            Krishna Smart Solutions
          </h1>
          <p style={{ fontSize: '0.825rem', color: 'var(--primary)', fontWeight: '700', margin: '0 0 0.15rem 0' }}>
            Powered by Krishna IT Solution
          </p>
          <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', margin: 0 }}>
            A Krishna Group Concern
          </p>
        </div>

        {/* Dynamic Step Views */}
        {forgotPasswordStep === 'login' ? (
          <>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.35rem', textAlign: 'center' }}>
              {isRegistering ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.825rem', marginBottom: '1.25rem' }}>
              {isRegistering ? 'Sign up to manage multi-program estimation.' : 'Sign in to access your workspace.'}
            </p>

            {error && (
              <div style={{
                background: 'var(--danger-light)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--danger)',
                padding: '0.7rem',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: '600',
                marginBottom: '1.1rem',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {isRegistering && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="John Doe" 
                      required 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      style={{ paddingLeft: '2.5rem' }} 
                    />
                    <UserIcon size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="admin@krishna.com" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    style={{ paddingLeft: '2.5rem' }} 
                  />
                  <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                  {!isRegistering && (
                    <button 
                      type="button" 
                      onClick={() => { setForgotPasswordStep('email'); setError(''); setMessage(''); }} 
                      style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer', border: 'none', background: 'none' }}
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="••••••••" 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    style={{ paddingLeft: '2.5rem' }} 
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                className="btn-gradient" 
                disabled={loading}
                style={{ width: '100%', marginTop: '0.85rem', padding: '0.8rem' }}
              >
                {loading ? 'Processing...' : (isRegistering ? 'Create Workspace Account' : 'Sign In to Workspace')}
                <ArrowRight size={16} />
              </motion.button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
              <button 
                onClick={() => { setIsRegistering(!isRegistering); setError(''); }} 
                style={{ color: 'var(--primary)', fontWeight: '800', border: 'none', background: 'none', cursor: 'pointer' }}
              >
                {isRegistering ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </>
        ) : forgotPasswordStep === 'email' ? (
          <>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.35rem', textAlign: 'center' }}>
              Reset Password
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.825rem', marginBottom: '1.25rem' }}>
              Enter your registered email to receive an OTP.
            </p>

            {error && (
              <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '0.7rem', borderRadius: '12px', fontSize: '0.8rem', marginBottom: '1rem', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleRequestOtp}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="admin@krishna.com" 
                    required 
                    value={forgotEmail} 
                    onChange={(e) => setForgotEmail(e.target.value)} 
                    style={{ paddingLeft: '2.5rem' }} 
                  />
                  <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-gradient" disabled={loading} style={{ width: '100%', marginTop: '0.85rem' }}>
                {loading ? 'Sending...' : 'Send Verification OTP'}
              </motion.button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <button 
                onClick={() => { setForgotPasswordStep('login'); setError(''); setMessage(''); }} 
                style={{ color: 'var(--text-secondary)', fontWeight: '700', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.825rem' }}
              >
                ← Return to Login
              </button>
            </div>
          </>
        ) : forgotPasswordStep === 'otp' ? (
          <>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.35rem', textAlign: 'center' }}>
              Verify OTP Code
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.825rem', marginBottom: '1.25rem' }}>
              Verification code sent to <strong style={{ color: 'var(--text-primary)' }}>{forgotEmail}</strong>
            </p>

            {message && <div style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '0.7rem', borderRadius: '12px', fontSize: '0.8rem', marginBottom: '1rem', textAlign: 'center' }}>{message}</div>}
            {error && <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '0.7rem', borderRadius: '12px', fontSize: '0.8rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

            <form onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label className="form-label" style={{ textAlign: 'center' }}>6-Digit OTP Code</label>
                <input 
                  type="text" 
                  maxLength="6"
                  className="form-input" 
                  placeholder="123456" 
                  required 
                  value={otpCode} 
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} 
                  style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '6px', fontWeight: '800' }} 
                />
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-gradient" disabled={loading} style={{ width: '100%', marginTop: '0.85rem' }}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </motion.button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <button 
                onClick={() => { setForgotPasswordStep('email'); setError(''); setMessage(''); setOtpCode(''); }} 
                style={{ color: 'var(--text-secondary)', fontWeight: '700', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.825rem' }}
              >
                ← Back
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.35rem', textAlign: 'center' }}>
              Set New Password
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.825rem', marginBottom: '1.25rem' }}>
              OTP verified! Enter your new password below.
            </p>

            {error && <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '0.7rem', borderRadius: '12px', fontSize: '0.8rem', marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="••••••••" 
                    required 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    style={{ paddingLeft: '2.5rem' }} 
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="••••••••" 
                    required 
                    value={confirmNewPassword} 
                    onChange={(e) => setConfirmNewPassword(e.target.value)} 
                    style={{ paddingLeft: '2.5rem' }} 
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-gradient" disabled={loading} style={{ width: '100%', marginTop: '0.85rem' }}>
                {loading ? 'Updating...' : 'Save New Password'}
              </motion.button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <button 
                onClick={() => { setForgotPasswordStep('login'); setError(''); setMessage(''); }} 
                style={{ color: 'var(--text-secondary)', fontWeight: '700', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.825rem' }}
              >
                Cancel and Return to Login
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
