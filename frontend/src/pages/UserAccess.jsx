import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { UserPlus, Shield, CheckCircle, XCircle, Key, Trash2, Edit2, Save, X, Users } from 'lucide-react';

const UserAccess = () => {
  const [users, setUsers] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', programAccess: [] });

  useEffect(() => {
    fetchUsers();
    fetchPrograms();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) { console.error(err); }
  };

  const fetchPrograms = async () => {
    try {
      const { data } = await api.get('/programs');
      setPrograms(data);
    } catch (err) { console.error(err); }
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
      name: user.name,
      email: user.email,
      password: '',
      programAccess: user.programAccess.map(p => p._id || p)
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
        alert('User updated successfully');
      } else {
        await api.post('/users', formData);
        alert('User created successfully');
      }
      resetForm();
      fetchUsers();
    } catch (err) { alert(err.response?.data?.message || 'Error processing request'); }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', programAccess: [] });
    setEditingUser(null);
    setShowForm(false);
  };

  const toggleUserStatus = async (user) => {
    try {
      await api.put(`/users/${user._id}`, { isActive: !user.isActive });
      fetchUsers();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this staff account?')) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (err) { console.error(err); }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Shield size={28} style={{ color: 'var(--primary)' }} />
            User Access & Permissions Control
          </h1>
          <p className="page-subtitle">Manage staff logins, viewer roles, and program assignments</p>
        </div>

        <button className="btn-gradient" onClick={() => showForm ? resetForm() : setShowForm(true)}>
          {showForm ? <X size={18} /> : <UserPlus size={18} />}
          {showForm ? 'Cancel' : 'Create Staff Member'}
        </button>
      </div>

      {/* Editor Form Panel */}
      {showForm && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {editingUser ? <Edit2 size={20} /> : <UserPlus size={20} />}
            {editingUser ? `Edit ${editingUser.name}` : 'Setup Staff Account'}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Staff Full Name</label>
                <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Alex Smith" />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="staff@company.com" />
              </div>
              <div className="form-group">
                <label className="form-label">
                  {editingUser ? 'New Password (Optional)' : 'Account Password'}
                </label>
                <input type="password" className="form-input" required={!editingUser} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
              </div>
            </div>

            {/* Program Assignment Selectors */}
            <div style={{ marginBottom: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
              <span className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Assigned Program Access</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
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
                        {isChecked && <CheckCircle size={14} />}
                      </div>
                      <span style={{ fontWeight: '700', fontSize: '0.875rem' }}>{prog.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn-gradient" style={{ width: '100%', padding: '0.85rem' }}>
              {editingUser ? 'Update Staff Member' : 'Save Staff Account'}
            </button>
          </form>
        </div>
      )}

      {/* Staff Members Table */}
      <div className="table-container">
        <table className="table-glass">
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Email</th>
              <th>Assigned Programs</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td style={{ fontWeight: '800' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div>{user.name}</div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>REF: {user._id.slice(-6)}</span>
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {user.programAccess.map(p => (
                      <span key={p._id} className="badge badge-primary">
                        {p.name}
                      </span>
                    ))}
                    {user.programAccess.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No Access</span>}
                  </div>
                </td>
                <td>
                  <button 
                    onClick={() => toggleUserStatus(user)}
                    className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}
                    style={{ border: 'none', cursor: 'pointer' }}
                  >
                    {user.isActive ? 'Active' : 'Suspended'}
                  </button>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button className="btn-icon" onClick={() => handleEdit(user)} title="Edit Staff"><Edit2 size={16} /></button>
                    <button className="btn-icon" onClick={() => handleDelete(user._id)} title="Delete Staff" style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No staff accounts configured.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserAccess;
