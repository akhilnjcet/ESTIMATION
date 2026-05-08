import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { UserPlus, Shield, CheckCircle, XCircle, Key, Trash2, Edit2, Save, X } from 'lucide-react';

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
      password: '', // Keep empty unless changing
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
        if (!payload.password) delete payload.password; // Don't send empty password
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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Access Management</h1>
          <p className="text-gray-500 mt-1">Control staff logins and organizational permissions</p>
        </div>
        <button 
          className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'} flex items-center gap-2`} 
          onClick={() => showForm ? resetForm() : setShowForm(true)}
        >
          {showForm ? <X size={18} /> : <UserPlus size={18} />}
          {showForm ? 'Cancel' : 'Create Staff Login'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-10 border-primary/20 shadow-xl overflow-hidden">
          <div className="bg-primary/5 p-4 border-b border-primary/10 flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              {editingUser ? <Edit2 size={20} className="text-primary" /> : <UserPlus size={20} className="text-primary" />}
              {editingUser ? `Editing: ${editingUser.name}` : 'New Staff Account'}
            </h2>
            {editingUser && <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full font-bold uppercase">Staff ID: {editingUser._id.slice(-6)}</span>}
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-control" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="staff@krishna.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {editingUser ? 'Change Password (leave blank to keep current)' : 'Set Password'}
                  </label>
                  <div className="relative">
                    <input type="password" placeholder="••••••••" className="form-control" required={!editingUser} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    <Key size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="form-label">System Role</label>
                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                      <Shield size={24} />
                    </div>
                    <div>
                      <div className="font-bold text-blue-900">Viewer / Staff</div>
                      <div className="text-xs text-blue-600">Restricted to View-Only access for assigned programs.</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    <strong>Viewer Security Policy:</strong><br />
                    • Cannot Add/Edit/Delete records<br />
                    • Cannot access Admin Panel<br />
                    • Data is isolated based on program assignment.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <label className="form-label mb-4 block font-bold text-lg border-b pb-2">Assigned Program Access</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {programs.map(prog => (
                  <div 
                    key={prog._id} 
                    onClick={() => handleProgramToggle(prog._id)}
                    className={`group p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 relative overflow-hidden ${formData.programAccess.includes(prog._id) ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-100 bg-white hover:border-gray-300'}`}
                  >
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${formData.programAccess.includes(prog._id) ? 'bg-primary border-primary text-white' : 'border-gray-200 text-transparent'}`}>
                      <CheckCircle size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{prog.name}</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider">{prog.gstNumber ? `GST: ${prog.gstNumber}` : 'Standard Account'}</div>
                    </div>
                    {formData.programAccess.includes(prog._id) && <div className="absolute right-0 top-0 w-8 h-8 bg-primary/10 rounded-bl-full flex items-start justify-end p-1 text-primary"><CheckCircle size={10} /></div>}
                  </div>
                ))}
              </div>
              {programs.length === 0 && (
                <div className="p-6 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                   <p className="text-gray-500 font-medium">No programs found in your account.</p>
                   <p className="text-xs text-gray-400">Create a program in Settings before assigning staff access.</p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button type="submit" className="btn btn-primary px-10 py-3 shadow-lg flex items-center gap-2">
                {editingUser ? <Save size={18} /> : <UserPlus size={18} />}
                {editingUser ? 'Update Staff Member' : 'Create Staff Member'}
              </button>
              {editingUser && (
                <button type="button" onClick={resetForm} className="btn btn-secondary px-6">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="card shadow-lg border-none bg-white">
        <div className="table-container border-none shadow-none">
          <table className="data-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-4">Staff Member</th>
                <th className="py-4">Email</th>
                <th className="py-4">Program Access</th>
                <th className="py-4">Status</th>
                <th className="py-4 text-right">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user._id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold border">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{user.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono uppercase">REF: {user._id.slice(-8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-gray-600 font-medium">{user.email}</td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                      {user.programAccess.map(p => (
                        <span key={p._id} className="px-2.5 py-1 bg-white text-gray-700 rounded-lg text-[10px] font-bold border border-gray-200 shadow-sm">
                          {p.name}
                        </span>
                      ))}
                      {user.programAccess.length === 0 && <span className="text-gray-400 italic text-[10px] bg-gray-50 px-2 py-1 rounded">No Access Assigned</span>}
                    </div>
                  </td>
                  <td className="py-4">
                    <button 
                      onClick={() => toggleUserStatus(user)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${user.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100'}`}
                    >
                      {user.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {user.isActive ? 'Active' : 'Suspended'}
                    </button>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button title="Edit Staff" onClick={() => handleEdit(user)} className="p-2.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button title="Suspend / Delete" onClick={() => handleDelete(user._id)} className="p-2.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-20 text-gray-500">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                        <Shield size={40} className="text-gray-300" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-lg">Your Staff List is Empty</p>
                        <p className="text-sm text-gray-400">Click the 'Create Staff Login' button to add viewer accounts.</p>
                      </div>
                    </div>
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
