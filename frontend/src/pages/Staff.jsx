import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, X, Search, QrCode } from 'lucide-react';
import api from '../utils/api';
import { useProgram } from '../context/ProgramContext';
import IdCardPreview from '../components/IdCardPreview';

const Staff = () => {
  const [staffList, setStaffList] = useState([]);
  const [formData, setFormData] = useState({
    name: '', contactNumber: '', designation: '', expiryDate: '', isActive: true
  });
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewStaff, setPreviewStaff] = useState(null);
  
  const { selectedProgram } = useProgram();

  useEffect(() => {
    fetchStaff();
  }, [selectedProgram]);

  const fetchStaff = async () => {
    try {
      const { data } = await api.get('/staff');
      setStaffList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/staff/${editingId}`, formData);
      } else {
        await api.post('/staff', formData);
      }
      fetchStaff();
      resetForm();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error saving staff');
    }
  };

  const handleEdit = (staff) => {
    setEditingId(staff._id);
    setFormData({
      name: staff.name,
      contactNumber: staff.contactNumber,
      designation: staff.designation,
      expiryDate: staff.expiryDate ? new Date(staff.expiryDate).toISOString().split('T')[0] : '',
      isActive: staff.isActive
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await api.delete(`/staff/${id}`);
      fetchStaff();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', contactNumber: '', designation: '', memberOf: '', expiryDate: '', isActive: true });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.memberId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container" style={{ position: 'relative' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Member Directory</h1>
          <p className="page-subtitle">Manage members, generate ID cards, and update details</p>
        </div>
        <button className="btn-gradient" onClick={() => setIsFormOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Add Member
        </button>
      </div>

      <div className="search-bar" style={{ marginBottom: '1.5rem', position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="form-input"
          placeholder="Search by name, ID, or designation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ paddingLeft: '2.5rem', maxWidth: '400px' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
        {filteredStaff.map((staff) => (
          <div key={staff._id} className="glass-card" style={{ padding: '1.25rem', position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>{staff.memberId}</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>{staff.name}</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600', display: 'block' }}>{staff.designation}</span>
                {staff.memberOf && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{staff.memberOf}</span>}
              </div>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button className="btn-icon" title="View ID Card" onClick={() => setPreviewStaff(staff)} style={{ color: 'var(--primary)' }}><QrCode size={16} /></button>
                <button className="btn-icon" onClick={() => handleEdit(staff)}><Edit2 size={16} /></button>
                <button className="btn-icon" onClick={() => handleDelete(staff._id)} style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Contact:</span>
                <b style={{ color: 'var(--text-primary)' }}>{staff.contactNumber}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Status:</span>
                <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', background: staff.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: staff.isActive ? '#22c55e' : '#ef4444' }}>
                  {staff.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {staff.expiryDate && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Valid Until:</span>
                  <b style={{ color: 'var(--text-primary)' }}>{new Date(staff.expiryDate).toLocaleDateString()}</b>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Staff Form Modal */}
      {isFormOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11, 18, 32, 0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>{editingId ? 'Edit Member Details' : 'Add New Member'}</h2>
              <button className="btn-icon" onClick={resetForm}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Designation</label>
                <input type="text" className="form-input" required value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} placeholder="e.g. Manager, Technician" />
              </div>
              <div className="form-group">
                <label className="form-label">Member Of (Optional)</label>
                <input type="text" className="form-input" value={formData.memberOf || ''} onChange={e => setFormData({...formData, memberOf: e.target.value})} placeholder="e.g. Finance Committee" />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Number</label>
                <input type="text" className="form-input" required value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">ID Expiry Date (Optional)</label>
                <input type="date" className="form-input" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                <label htmlFor="isActive" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>Account Active</label>
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <button type="submit" className="btn-gradient" style={{ width: '100%' }}>{editingId ? 'Update Member' : 'Save Member'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff ID Card Preview Modal */}
      {previewStaff && (
        <IdCardPreview
          data={previewStaff}
          program={selectedProgram}
          onClose={() => setPreviewStaff(null)}
          type="member"
        />
      )}
    </div>
  );
};

export default Staff;
