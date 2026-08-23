import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Users, Plus, Search, Edit2, Trash2, X, Phone, Mail, QrCode } from 'lucide-react';
import { useProgram } from '../context/ProgramContext';
import IdCardPreview from '../components/IdCardPreview';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    customerName: '', phone: '', email: '', address: '', gstNumber: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [previewCustomer, setPreviewCustomer] = useState(null);
  
  const { selectedProgram } = useProgram();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get('/customers');
      setCustomers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (customer) => {
    setEditingId(customer._id);
    setFormData({
      customerName: customer.customerName,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      gstNumber: customer.gstNumber || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/customers/${editingId}`, formData);
        alert('Customer updated successfully!');
      } else {
        await api.post('/customers', formData);
        alert('Customer saved successfully!');
      }
      setFormData({ customerName: '', phone: '', email: '', address: '', gstNumber: '' });
      setEditingId(null);
      setShowForm(false);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      alert('Failed to save customer: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await api.delete(`/customers/${id}`);
        fetchCustomers();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Users size={28} style={{ color: 'var(--primary)' }} />
            Customer & Client Directory
          </h1>
          <p className="page-subtitle">Manage business partners, contacts, and tax registrations</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by party name or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <button 
            className="btn-gradient"
            onClick={() => {
              if (showForm && editingId) {
                setEditingId(null);
                setFormData({ customerName: '', phone: '', email: '', address: '', gstNumber: '' });
              } else {
                setShowForm(!showForm);
              }
            }}
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancel Editor' : 'Add New Customer'}
          </button>
        </div>
      </div>

      {/* Add / Edit Form Card */}
      {showForm && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
            {editingId ? 'Edit Customer Details' : 'Register New Client'}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input type="text" className="form-input" required value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} placeholder="Acme Corp / John Doe" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-input" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91 98765 43210" />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="contact@domain.com" />
              </div>
              <div className="form-group">
                <label className="form-label">GST Number</label>
                <input type="text" className="form-input" value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value})} placeholder="22AAAAA0000A1Z5" />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Billing Address</label>
              <textarea className="form-textarea" rows="3" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Street address, city, state, pincode..."></textarea>
            </div>

            <button type="submit" className="btn-gradient" style={{ width: '100%', padding: '0.85rem' }}>
              {editingId ? 'Update Customer Profile' : 'Save & Add Customer'}
            </button>
          </form>
        </div>
      )}

      {/* Customer Directory Glass Table */}
      <div className="table-container">
        <table className="table-glass">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Customer Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>GST Number</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(customer => (
              <tr key={customer._id}>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {customer.customerId || 'N/A'}
                </td>
                <td style={{ fontWeight: '800' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem' }}>
                      {customer.customerName.charAt(0).toUpperCase()}
                    </div>
                    <span>{customer.customerName}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Phone size={14} style={{ color: 'var(--primary)' }} /> {customer.phone}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  {customer.email ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Mail size={14} style={{ color: 'var(--secondary)' }} /> {customer.email}
                    </span>
                  ) : '-'}
                </td>
                <td>
                  {customer.gstNumber ? (
                    <span className="badge badge-info">{customer.gstNumber}</span>
                  ) : <span style={{ color: 'var(--text-muted)' }}>Unregistered</span>}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button 
                      className="btn-icon" 
                      onClick={() => setPreviewCustomer(customer)} 
                      title="View ID Card"
                      style={{ color: 'var(--primary)' }}
                    >
                      <QrCode size={16} />
                    </button>
                    <button 
                      className="btn-icon" 
                      onClick={() => handleEdit(customer)} 
                      title="Edit Customer"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="btn-icon" 
                      onClick={() => handleDelete(customer._id)} 
                      title="Delete Customer" 
                      style={{ color: 'var(--danger)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No customer records found matching your query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Customer ID Card Preview Modal */}
      {previewCustomer && (
        <IdCardPreview
          data={previewCustomer}
          program={selectedProgram}
          onClose={() => setPreviewCustomer(null)}
          type="customer"
        />
      )}
    </div>
  );
};

export default Customers;
