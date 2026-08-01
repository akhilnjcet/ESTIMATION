import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  UserPlus, Shield, CheckCircle, XCircle, Key, Trash2, Edit2, Save, X, 
  Users, Search, UserCheck, ShieldAlert, Sparkles, Calendar, Lock, Unlock, Check
} from 'lucide-react';

const UserAccess = () => {
  const [users, setUsers] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Quick Password Change Modal state
  const [pwdModalUser, setPwdModalUser] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form Data
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'viewer', 
    isActive: true, 
    programAccess: [] 
  });

  useEffect(() => {
    fetchUsers();
    fetchPrograms();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) { 
      console.error('Fetch users error:', err); 
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const { data } = await api.get('/programs');
      setPrograms(data);
    } catch (err) { 
      console.error('Fetch programs error:', err); 
    }
  };

  const handleProgramToggle = (programId) => {
    const access = [...formData.programAccess];
    if (access.includes(programId)) {
      setFormData({ ...formData, programAccess: access.filter(id => id !== programId) });
    } else {
      setFormData({ ...formData, programAccess: [...access, programId] });
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'viewer',
      isActive: user.isActive !== undefined ? user.isActive : true,
      programAccess: (user.programAccess || []).map(p => p._id || p)
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${editingUser._id}`, payload);
        alert('Login credentials updated successfully!');
      } else {
        await api.post('/users', formData);
        alert('New login account created successfully!');
      }
      resetForm();
      fetchUsers();
    } catch (err) { 
      alert(err.response?.data?.message || 'Error processing request'); 
    }
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    if (!newPasswordInput || newPasswordInput.length < 4) {
      alert('Password must be at least 4 characters long.');
      return;
    }
    try {
      setPwdSaving(true);
      const { data } = await api.put(`/users/${pwdModalUser._id}/change-password`, { newPassword: newPasswordInput });
      alert(data.message || 'Password changed successfully!');
      setPwdModalUser(null);
      setNewPasswordInput('');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwdSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'viewer', isActive: true, programAccess: [] });
    setEditingUser(null);
    setShowForm(false);
  };

  const toggleUserStatus = async (user) => {
    try {
      await api.put(`/users/${user._id}`, { isActive: !user.isActive });
      fetchUsers();
    } catch (err) { 
      alert(err.response?.data?.message || 'Failed to toggle status'); 
    }
  };

  const handleDelete = async (user) => {
    const currentUserId = localStorage.getItem('userId');
    if (currentUserId && currentUserId === user._id) {
      alert('Security Alert: You cannot delete your own logged-in admin account.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete the login account for ${user.name} (${user.email})?`)) {
      try {
        await api.delete(`/users/${user._id}`);
        fetchUsers();
        alert('User login deleted successfully.');
      } catch (err) { 
        alert(err.response?.data?.message || 'Failed to delete user'); 
      }
    }
  };

  // Filtered Users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'All' ? true : user.role === roleFilter;
    const matchesStatus = statusFilter === 'All' ? true : (statusFilter === 'Active' ? user.isActive : !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalUsers = users.length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const viewerUsers = users.filter(u => u.role === 'viewer').length;
  
  // Calculate newly registered in last 30 days
  const now = new Date();
  const newUsersCount = users.filter(u => {
    if (!u.createdAt) return false;
    const created = new Date(u.createdAt);
    const diffDays = (now - created) / (1000 * 60 * 60 * 24);
    return diffDays <= 30;
  }).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <UserCheck size={28} style={{ color: 'var(--primary)' }} />
            Login Manager & Access Portal
          </h1>
          <p className="page-subtitle">Create logins, manage usernames, update passwords, and control system permissions</p>
        </div>

        <button className="btn-gradient" onClick={() => showForm ? resetForm() : setShowForm(true)}>
          {showForm ? <X size={18} /> : <UserPlus size={18} />}
          {showForm ? 'Close Panel' : 'Create New Login'}
        </button>
      </div>

      {/* KPI Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <span className="form-label">Total Registered Logins</span>
          <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {totalUsers}
          </h3>
        </div>
        <div className="glass-card" style={{ borderLeft: '4px solid var(--secondary)' }}>
          <span className="form-label">Admin Accounts</span>
          <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--secondary)', marginTop: '0.25rem' }}>
            {adminUsers}
          </h3>
        </div>
        <div className="glass-card" style={{ borderLeft: '4px solid var(--info)' }}>
          <span className="form-label">Staff & Viewers</span>
          <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--info)', marginTop: '0.25rem' }}>
            {viewerUsers}
          </h3>
        </div>
        <div className="glass-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="form-label">Newly Registered (30 Days)</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--success)', marginTop: '0.25rem' }}>
                {newUsersCount}
              </h3>
            </div>
            {newUsersCount > 0 && (
              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                <Sparkles size={12} /> Recent
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Editor Form Panel */}
      {showForm && (
        <div className="glass-panel" style={{ padding: '2rem', borderLeft: '5px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {editingUser ? <Edit2 size={20} style={{ color: 'var(--primary)' }} /> : <UserPlus size={20} style={{ color: 'var(--primary)' }} />}
              {editingUser ? `Edit Account Login: ${editingUser.name}` : 'Create New System Login'}
            </h2>
            <button className="btn-icon" onClick={resetForm}><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Rahul Nair" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email / Login Username</label>
                <input 
                  type="email" 
                  className="form-input" 
                  required 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  placeholder="e.g. rahul@company.com" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {editingUser ? 'New Password (Leave blank to keep existing)' : 'Account Password'}
                </label>
                <input 
                  type="password" 
                  className="form-input" 
                  required={!editingUser} 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  placeholder="••••••••" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">System Role</label>
                <select 
                  className="form-select" 
                  value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="user">User / Customer (Full ERP Access, No Login Mgmt)</option>
                  <option value="admin">Administrator (Full Access & Program Mgmt)</option>
                  <option value="manager">Manager (Operations & Data Management)</option>
                  <option value="accountant">Accountant (Finance, Income & Expense Control)</option>
                  <option value="sales">Sales Staff (Invoices, Quotations & Customer Records)</option>
                  <option value="viewer">Staff Viewer (Read-only mutations blocked)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Account Login Status</label>
                <select 
                  className="form-select" 
                  value={formData.isActive ? 'active' : 'suspended'} 
                  onChange={e => setFormData({...formData, isActive: e.target.value === 'active'})}
                >
                  <option value="active">Active (Can Log in)</option>
                  <option value="suspended">Suspended / Blocked</option>
                </select>
              </div>
            </div>

            {/* Program Access Selectors */}
            <div style={{ marginBottom: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="form-label">Assigned Program Access Permissions</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Select programs this user can switch into</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                {programs.map(prog => {
                  const isChecked = formData.programAccess.includes(prog._id);
                  return (
                    <div 
                      key={prog._id} 
                      onClick={() => handleProgramToggle(prog._id)}
                      className="glass-card glass-card-interactive"
                      style={{
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        borderColor: isChecked ? 'var(--primary)' : 'var(--glass-border)',
                        background: isChecked ? 'var(--primary-light)' : 'var(--card-bg)'
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        border: '2px solid var(--primary)',
                        background: isChecked ? 'var(--primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFF'
                      }}>
                        {isChecked && <Check size={14} />}
                      </div>
                      <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>{prog.name}</span>
                    </div>
                  );
                })}
                {programs.length === 0 && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No programs created yet.</p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary-glass" onClick={resetForm}>Cancel</button>
              <button type="submit" className="btn-gradient" style={{ minWidth: '160px' }}>
                <Save size={16} /> {editingUser ? 'Save Credentials' : 'Create Login'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Direct Change Password Modal */}
      {pwdModalUser && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={20} style={{ color: 'var(--warning)' }} />
                Change Password
              </h3>
              <button className="btn-icon" onClick={() => setPwdModalUser(null)}><X size={18} /></button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Set a new login password for <b>{pwdModalUser.name}</b> (<i>{pwdModalUser.email}</i>).
            </p>

            <form onSubmit={handlePasswordChangeSubmit}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">New Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  required 
                  minLength={4}
                  value={newPasswordInput} 
                  onChange={e => setNewPasswordInput(e.target.value)} 
                  placeholder="Enter at least 4 characters" 
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary-glass" onClick={() => setPwdModalUser(null)}>Cancel</button>
                <button type="submit" className="btn-gradient" disabled={pwdSaving}>
                  {pwdSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Accounts Data Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} style={{ color: 'var(--primary)' }} />
            Registered User Logins
          </h2>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search name/username..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem', padding: '0.5rem 0.75rem 0.5rem 2.5rem', fontSize: '0.85rem' }}
              />
              <Search size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>

            <select 
              className="form-select" 
              value={roleFilter} 
              onChange={e => setRoleFilter(e.target.value)}
              style={{ width: '160px', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
            >
              <option value="All">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="user">User / Customer</option>
              <option value="manager">Manager</option>
              <option value="accountant">Accountant</option>
              <option value="sales">Sales Staff</option>
              <option value="viewer">Staff Viewer</option>
            </select>

            <select 
              className="form-select" 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              style={{ width: '140px', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="table-glass">
            <thead>
              <tr>
                <th>User Account</th>
                <th>Role</th>
                <th>Assigned Programs</th>
                <th>Registered Date</th>
                <th>Login Status</th>
                <th style={{ textAlign: 'right' }}>Manage Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => {
                const isNew = user.createdAt && ((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)) <= 7;
                return (
                  <tr key={user._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ 
                          width: '38px', 
                          height: '38px', 
                          borderRadius: '12px', 
                          background: user.role === 'admin' 
                            ? 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' 
                            : user.role === 'user'
                            ? 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)'
                            : user.role === 'manager'
                            ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                            : user.role === 'accountant'
                            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                            : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', 
                          color: '#FFF', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontWeight: '800',
                          fontSize: '0.95rem'
                        }}>
                          {(user.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {user.name}
                            {isNew && (
                              <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem' }}>
                                NEW
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${
                        user.role === 'admin' ? 'badge-secondary' :
                        user.role === 'user' ? 'badge-info' :
                        user.role === 'manager' ? 'badge-warning' :
                        user.role === 'accountant' ? 'badge-success' :
                        user.role === 'sales' ? 'badge-info' : 'badge-primary'
                      }`}>
                        {user.role === 'admin' ? 'Administrator' :
                         user.role === 'user' ? 'User / Customer' :
                         user.role === 'manager' ? 'Manager' :
                         user.role === 'accountant' ? 'Accountant' :
                         user.role === 'sales' ? 'Sales Staff' : 'Staff Viewer'}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {(user.programAccess || []).map(p => (
                          <span key={p._id || p} className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                            {p.name || 'Program'}
                          </span>
                        ))}
                        {(!user.programAccess || user.programAccess.length === 0) && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.775rem' }}>Full / Default Access</span>
                        )}
                      </div>
                    </td>

                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB') : 'Prior Record'}
                    </td>

                    <td>
                      <button 
                        onClick={() => toggleUserStatus(user)}
                        className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}
                        style={{ border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        title="Click to toggle status"
                      >
                        {user.isActive ? <Unlock size={12} /> : <Lock size={12} />}
                        {user.isActive ? 'Active' : 'Suspended'}
                      </button>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button 
                          className="btn-icon" 
                          onClick={() => setPwdModalUser(user)} 
                          title="Change Password"
                          style={{ color: 'var(--warning)' }}
                        >
                          <Key size={15} />
                        </button>

                        <button 
                          className="btn-icon" 
                          onClick={() => handleEdit(user)} 
                          title="Edit Login Details"
                        >
                          <Edit2 size={15} />
                        </button>

                        <button 
                          className="btn-icon" 
                          onClick={() => handleDelete(user)} 
                          title="Delete Login Account" 
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No matching user logins found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserAccess;
