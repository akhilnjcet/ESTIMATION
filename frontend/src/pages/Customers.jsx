import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '', phone: '', email: '', address: '', gstNumber: ''
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customers', formData);
      setFormData({ customerName: '', phone: '', email: '', address: '', gstNumber: '' });
      setShowForm(false);
      fetchCustomers();
      alert('Customer saved successfully!');
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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Customers</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Customer'}
        </button>
      </div>
      
      {showForm && (
        <div className="card mb-4" style={{ backgroundColor: '#f8fafc' }}>
          <h2 className="text-xl font-bold mb-4">Add New Customer</h2>
          <form onSubmit={handleSubmit}>
            <div className="dashboard-grid">
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input type="text" className="form-control" required value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="text" className="form-control" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">GST Number</label>
                <input type="text" className="form-control" value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea className="form-control" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
            </div>
            <button type="submit" className="btn btn-primary">Save Customer</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>GST Number</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer._id}>
                  <td>{customer.customerName}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.email || '-'}</td>
                  <td>{customer.gstNumber || '-'}</td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', marginRight: '0.5rem' }}>Edit</button>
                    <button className="btn btn-secondary" onClick={() => handleDelete(customer._id)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>Delete</button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No customers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Customers;
