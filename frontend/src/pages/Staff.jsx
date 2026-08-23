import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, X, Search, QrCode } from 'lucide-react';
import api from '../utils/api';
import { useProgram } from '../context/ProgramContext';
import QRCode from 'react-qr-code';

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
    setFormData({ name: '', contactNumber: '', designation: '', expiryDate: '', isActive: true });
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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Staff Directory</h1>
          <p className="page-subtitle">Manage staff, generate ID cards, and update details</p>
        </div>
        <button className="btn-gradient" onClick={() => setIsFormOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Add Staff
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {filteredStaff.map((staff) => (
          <div key={staff._id} className="glass-card" style={{ padding: '1.5rem', position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>{staff.memberId}</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>{staff.name}</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600' }}>{staff.designation}</span>
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
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11, 18, 32, 0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>{editingId ? 'Edit Staff Details' : 'Add New Staff'}</h2>
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
                <button type="submit" className="btn-gradient" style={{ width: '100%' }}>{editingId ? 'Update Staff' : 'Save Staff'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Premium ID Card Preview Modal */}
      {previewStaff && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11, 18, 32, 0.9)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', flexWrap: 'wrap', gap: '2rem' }}>
          
          <button onClick={() => setPreviewStaff(null)} style={{ position: 'absolute', top: '1.5rem', right: '2rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', zIndex: 1001 }}>
            <X size={24} />
          </button>

          {/* FRONT OF ID CARD */}
          <div style={{ 
            width: '320px', 
            height: '500px', 
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.1)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            {/* Background Accents */}
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--primary)', filter: 'blur(60px)', opacity: 0.4, borderRadius: '50%' }}></div>
            <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '150px', height: '150px', background: 'var(--secondary)', filter: 'blur(60px)', opacity: 0.4, borderRadius: '50%' }}></div>
            
            {/* Header */}
            <div style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 2 }}>
              <div style={{ fontSize: '0.75rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{selectedProgram?.name || 'Workspace'}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#FFF', letterSpacing: '1px' }}>STAFF IDENTITY</div>
            </div>

            {/* Content */}
            <div style={{ padding: '2rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 2, position: 'relative' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                <div style={{ fontSize: '2.5rem', color: 'rgba(255,255,255,0.8)', fontWeight: 'bold' }}>{previewStaff.name.charAt(0).toUpperCase()}</div>
              </div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#FFF', margin: '0 0 0.25rem 0', textAlign: 'center' }}>{previewStaff.name}</h2>
              <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '600', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{previewStaff.designation}</div>

              <div style={{ width: '100%', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>MEMBER ID</span>
                  <b style={{ color: '#FFF', letterSpacing: '1px' }}>{previewStaff.memberId}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>VALID THRU</span>
                  <b style={{ color: '#FFF' }}>{previewStaff.expiryDate ? new Date(previewStaff.expiryDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'N/A'}</b>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', zIndex: 2, display: 'flex', justifyContent: 'center' }}>
               <div style={{ width: '40px', height: '5px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px' }}></div>
            </div>
          </div>


          {/* BACK OF ID CARD */}
          <div style={{ 
            width: '320px', 
            height: '500px', 
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.1)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            {/* Magnetic Stripe Fake */}
            <div style={{ width: '100%', height: '45px', background: '#000', marginTop: '2rem', opacity: 0.8 }}></div>
            
            <div style={{ padding: '2rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: '2rem', lineHeight: '1.5' }}>
                This card is the property of <br/><b style={{ color: 'rgba(255,255,255,0.7)' }}>{selectedProgram?.name || 'The Company'}</b>.<br/>
                If found, please return to the authorized personnel. Use of this card is governed by company policy.
              </div>

              <div style={{ background: '#FFF', padding: '0.5rem', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', marginBottom: '1rem' }}>
                <QRCode value={`ID:${previewStaff.memberId}|Name:${previewStaff.name}|Desg:${previewStaff.designation}|Ph:${previewStaff.contactNumber}`} size={120} />
              </div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>Scan for Validation</div>
              
              <div style={{ marginTop: '2rem', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.75rem' }}>
                <div style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <div style={{ fontSize: '0.6rem', marginBottom: '2px' }}>EMERGENCY CONTACT</div>
                  <b style={{ color: '#FFF' }}>{previewStaff.contactNumber}</b>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'right' }}>
                  <div style={{ fontSize: '0.6rem', marginBottom: '2px' }}>STATUS</div>
                  <b style={{ color: previewStaff.isActive ? '#22c55e' : '#ef4444' }}>{previewStaff.isActive ? 'ACTIVE' : 'INACTIVE'}</b>
                </div>
              </div>

            </div>
          </div>
          
        </div>
      )}
    </div>
  );
};

export default Staff;
