import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Income = () => {
  const [incomes, setIncomes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ 
    type: 'Income', 
    amount: '', 
    account: '', 
    category: 'Sales', 
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [editingIncome, setEditingIncome] = useState(null);

  useEffect(() => {
    fetchIncomes();
    fetchAccounts();
  }, []);

  const fetchIncomes = async () => {
    try {
      const { data } = await api.get('/transactions?type=Income');
      setIncomes(data);
    } catch (err) { console.error(err); }
  };

  const fetchAccounts = async () => {
    try {
      const { data } = await api.get('/accounts');
      setAccounts(data);
      
      const lastUsed = localStorage.getItem('lastUsedIncomeAccount');
      if (lastUsed && data.find(a => a._id === lastUsed)) {
        setFormData(f => ({ ...f, account: lastUsed }));
      } else if (data.length > 0 && !editingIncome) {
        setFormData(f => ({ ...f, account: data[0]._id }));
      }
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingIncome) {
        await api.put(`/transactions/${editingIncome._id}`, formData);
        setEditingIncome(null);
      } else {
        await api.post('/transactions', formData);
        // Save last used account
        localStorage.setItem('lastUsedIncomeAccount', formData.account);
      }
      
      const lastUsed = localStorage.getItem('lastUsedIncomeAccount');
      setFormData({ 
        type: 'Income', 
        amount: '', 
        account: lastUsed || accounts[0]?._id, 
        category: 'Sales', 
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowForm(false);
      fetchIncomes();
    } catch (err) { console.error(err); }
  };

  const handleEdit = (inc) => {
    setEditingIncome(inc);
    setFormData({ 
      type: 'Income', 
      amount: inc.amount, 
      account: inc.account?._id, 
      category: inc.category, 
      description: inc.description || '',
      date: inc.date ? new Date(inc.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this income record? This will also revert the account balance.')) {
      try {
        await api.delete(`/transactions/${id}`);
        fetchIncomes();
      } catch (err) { console.error(err); }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--secondary)' }}>Income Entries</h1>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditingIncome(null); }} style={{ backgroundColor: 'var(--secondary)' }}>
          {showForm ? 'Cancel' : '+ Add Income'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-4" style={{ borderTop: '4px solid var(--secondary)' }}>
          <h2 className="text-xl font-bold mb-4">{editingIncome ? 'Edit Income' : 'Record Income'}</h2>
          {accounts.length === 0 ? (
            <div style={{ color: 'var(--danger)', padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
              <strong>Error:</strong> You must create an Account (e.g., Cash or Bank) in the "Accounts & Balances" tab before recording Income!
            </div>
          ) : (
          <form onSubmit={handleSubmit}>
            <div className="dashboard-grid">
              <div className="form-group">
                <label className="form-label">Transaction Date</label>
                <input type="date" className="form-control" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input type="number" className="form-control" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Deposit To Account</label>
                <select className="form-control" required value={formData.account} onChange={e => setFormData({...formData, account: e.target.value})}>
                  {accounts.map(acc => <option key={acc._id} value={acc._id}>{acc.name} ({acc.type})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Income Category</label>
                <input type="text" className="form-control" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} list="income-categories" />
                <datalist id="income-categories">
                  <option value="Sales" />
                  <option value="Service Income" />
                  <option value="Other Income" />
                </datalist>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description / Notes</label>
              <input type="text" className="form-control" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--secondary)' }}>
              {editingIncome ? 'Update' : 'Save'} Income
            </button>
          </form>
          )}
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Account</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {incomes.map(inc => (
                <tr key={inc._id}>
                  <td>{new Date(inc.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span>{inc.category}</span>
                      {inc.editCount > 3 && (
                        <span style={{ padding: '1px 5px', background: '#fee2e2', color: '#ef4444', fontSize: '9px', borderRadius: '4px', fontWeight: 'bold' }}>
                          EDITED
                        </span>
                      )}
                    </div>
                    <small style={{color:'gray'}}>{inc.description}</small>
                  </td>
                  <td>{inc.account?.name}</td>
                  <td style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>+ ₹ {inc.amount.toLocaleString()}</td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(inc)} style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>Edit</button>
                      <button onClick={() => handleDelete(inc._id)} style={{ color: 'red', fontSize: '0.8rem' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {incomes.length === 0 && <tr><td colSpan="5" style={{textAlign:'center'}}>No income records.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Income;
