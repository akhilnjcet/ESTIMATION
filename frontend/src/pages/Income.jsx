import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Income = () => {
  const [incomes, setIncomes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ type: 'Income', amount: '', account: '', category: 'Sales', description: '' });

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
      if (data.length > 0) setFormData(f => ({ ...f, account: data[0]._id }));
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transactions', formData);
      setFormData({ type: 'Income', amount: '', account: accounts[0]?._id, category: 'Sales', description: '' });
      setShowForm(false);
      fetchIncomes();
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--secondary)' }}>Income Entries</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ backgroundColor: 'var(--secondary)' }}>
          {showForm ? 'Cancel' : '+ Add Income'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-4" style={{ borderTop: '4px solid var(--secondary)' }}>
          <h2 className="text-xl font-bold mb-4">Record Income</h2>
          {accounts.length === 0 ? (
            <div style={{ color: 'var(--danger)', padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
              <strong>Error:</strong> You must create an Account (e.g., Cash or Bank) in the "Accounts & Balances" tab before recording Income!
            </div>
          ) : (
          <form onSubmit={handleSubmit}>
            <div className="dashboard-grid">
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
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--secondary)' }}>Save Income</button>
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
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {incomes.map(inc => (
                <tr key={inc._id}>
                  <td>{new Date(inc.date).toLocaleDateString()}</td>
                  <td>{inc.category} <br/><small style={{color:'gray'}}>{inc.description}</small></td>
                  <td>{inc.account?.name}</td>
                  <td style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>+ ₹ {inc.amount.toLocaleString()}</td>
                  <td><span style={{ color: 'var(--secondary)' }}>Cleared</span></td>
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
