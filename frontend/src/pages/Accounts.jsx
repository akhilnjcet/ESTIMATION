import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    type: 'Cash', 
    accountNumber: '', 
    bankName: '', 
    openingBalance: 0,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data } = await api.get('/accounts');
      setAccounts(data);
    } catch (err) { console.error(err); }
  };

  const fetchTransactions = async () => {
    try {
      const { data } = await api.get('/transactions');
      setTransactions(data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/accounts/${editingId}`, formData);
        alert('Account updated successfully!');
      } else {
        await api.post('/accounts', formData);
        alert('Account created successfully!');
      }
      setFormData({ 
        name: '', 
        type: 'Cash', 
        accountNumber: '', 
        bankName: '', 
        balance: 0,
        date: new Date().toISOString().split('T')[0]
      });
      setShowForm(false);
      setEditingId(null);
      fetchAccounts();
    } catch (err) {
      console.error(err);
      alert('Failed to save account: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (acc) => {
    setFormData({
      name: acc.name,
      type: acc.type,
      accountNumber: acc.accountNumber || '',
      bankName: acc.bankName || '',
      openingBalance: acc.openingBalance || 0,
      date: acc.date ? new Date(acc.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setEditingId(acc._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    try {
      await api.delete(`/accounts/${id}`);
      fetchAccounts();
      alert('Account deleted!');
    } catch (err) {
      console.error(err);
      alert('Failed to delete: ' + (err.response?.data?.message || err.message));
    }
  };

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  const totalIncome = transactions.filter(t => t.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Accounts & Balances</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Account'}
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="dashboard-grid mb-8">
        <div className="card flex items-center gap-4" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', color: 'white', border: 'none' }}>
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }}>
            <Wallet size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Available Balance</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>₹ {totalBalance.toLocaleString()}</div>
          </div>
        </div>

        <div className="card flex items-center gap-4" style={{ borderLeft: '4px solid var(--secondary)' }}>
          <div style={{ padding: '1rem', background: '#ecfdf5', color: 'var(--secondary)', borderRadius: '50%' }}>
            <ArrowUpRight size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Business Income</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--secondary)' }}>₹ {totalIncome.toLocaleString()}</div>
          </div>
        </div>

        <div className="card flex items-center gap-4" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div style={{ padding: '1rem', background: '#fef2f2', color: 'var(--danger)', borderRadius: '50%' }}>
            <ArrowDownRight size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Business Expense</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger)' }}>₹ {totalExpense.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-secondary)' }}>Individual Accounts</h2>

      <div className="dashboard-grid">
        {accounts.map(acc => (
          <div key={acc._id} className="card flex justify-between items-center" style={{ borderTop: acc.balance < 0 ? '4px solid var(--danger)' : '4px solid #94a3b8' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{acc.type} • {acc.name}</div>
              <div className="flex items-baseline gap-2">
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: acc.balance < 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                  ₹ {acc.balance.toLocaleString()}
                </span>
                <span className="text-xs text-gray-400"> (Current)</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Opening: ₹{acc.openingBalance?.toLocaleString() || '0'}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-sm btn-outline" onClick={() => handleEdit(acc)}>Edit</button>
              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(acc._id)}>Delete</button>
            </div>
          </div>
        ))}
        {accounts.length === 0 && <div className="card" style={{gridColumn: '1 / -1', textAlign: 'center', color: '#64748b'}}>No accounts found. Please click "Add Account".</div>}
      </div>

      {showForm && (
        <div className="card mb-4 mt-6" id="account-form">
          <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Account' : 'Add New Account'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="dashboard-grid">
              <div className="form-group">
                <label className="form-label">Account Name</label>
                <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Main HDFC Account" />
              </div>
              <div className="form-group">
                <label className="form-label">Account Type</label>
                <select className="form-control" required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="Cash">Cash On Hand</option>
                  <option value="Bank">Bank Account</option>
                  <option value="UPI">UPI Wallet</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Opening Date</label>
                <input type="date" className="form-control" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Opening Balance (₹)</label>
                <input type="number" className="form-control" required value={formData.openingBalance} onChange={e => setFormData({...formData, openingBalance: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Save Account</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Accounts;
