import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Expense = () => {
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ type: 'Expense', amount: '', account: '', category: 'Office Supplies', description: '' });

  useEffect(() => {
    fetchExpenses();
    fetchAccounts();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data } = await api.get('/transactions?type=Expense');
      setExpenses(data);
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
      setFormData({ type: 'Expense', amount: '', account: accounts[0]?._id, category: 'Office Supplies', description: '' });
      setShowForm(false);
      fetchExpenses();
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--danger)' }}>Expense Entries</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ backgroundColor: 'var(--danger)' }}>
          {showForm ? 'Cancel' : '+ Add Expense'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-4" style={{ borderTop: '4px solid var(--danger)' }}>
          <h2 className="text-xl font-bold mb-4">Record Expense</h2>
          {accounts.length === 0 ? (
            <div style={{ color: 'var(--danger)', padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
              <strong>Error:</strong> You must create an Account (e.g., Cash or Bank) in the "Accounts & Balances" tab before recording Expenses!
            </div>
          ) : (
          <form onSubmit={handleSubmit}>
            <div className="dashboard-grid">
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input type="number" className="form-control" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Pay From Account</label>
                <select className="form-control" required value={formData.account} onChange={e => setFormData({...formData, account: e.target.value})}>
                  {accounts.map(acc => <option key={acc._id} value={acc._id}>{acc.name} ({acc.type})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Expense Category</label>
                <input type="text" className="form-control" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} list="expense-categories" />
                <datalist id="expense-categories">
                  <option value="Office Supplies" />
                  <option value="Rent" />
                  <option value="Utilities" />
                  <option value="Travel" />
                  <option value="Vendor Payment" />
                </datalist>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description / Notes</label>
              <input type="text" className="form-control" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--danger)' }}>Save Expense</button>
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
              {expenses.map(exp => (
                <tr key={exp._id}>
                  <td>{new Date(exp.date).toLocaleDateString()}</td>
                  <td>{exp.category} <br/><small style={{color:'gray'}}>{exp.description}</small></td>
                  <td>{exp.account?.name}</td>
                  <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>- ₹ {exp.amount.toLocaleString()}</td>
                  <td><span style={{ color: 'var(--text-secondary)' }}>Cleared</span></td>
                </tr>
              ))}
              {expenses.length === 0 && <tr><td colSpan="5" style={{textAlign:'center'}}>No expense records.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Expense;
