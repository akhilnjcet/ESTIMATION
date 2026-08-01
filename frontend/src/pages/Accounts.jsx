import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Wallet, ArrowUpRight, ArrowDownRight, Plus, Edit2, Trash2, X, Landmark, CreditCard, ShieldCheck } from 'lucide-react';

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    const password = window.prompt('SECURITY CHECK: Please enter your login password to confirm account deletion:');
    if (password === null) return;
    if (!password) return alert('Password is required to delete an account.');

    try {
      await api.delete(`/accounts/${id}`, {
        headers: { password }
      });
      fetchAccounts();
      alert('Account deleted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to delete: ' + (err.response?.data?.message || err.message));
    }
  };

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  const totalIncome = transactions.filter(t => t.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Wallet size={28} style={{ color: 'var(--primary)' }} />
            Accounts & Treasury Balances
          </h1>
          <p className="page-subtitle">Manage bank accounts, cash registers, and UPI wallets</p>
        </div>

        <button 
          className="btn-gradient"
          onClick={() => { setShowForm(!showForm); setEditingId(null); }}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cancel' : 'Add New Account'}
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-card" style={{ borderLeft: '4px solid var(--primary)', background: 'linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(124,58,237,0.15) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={24} />
            </div>
            <div>
              <span className="form-label">Total Liquid Net Balance</span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                &#8377; {totalBalance.toLocaleString()}
              </h2>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpRight size={24} />
            </div>
            <div>
              <span className="form-label">Total Business Income</span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--success)', marginTop: '0.2rem' }}>
                + &#8377; {totalIncome.toLocaleString()}
              </h2>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--danger-light)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowDownRight size={24} />
            </div>
            <div>
              <span className="form-label">Total Business Expense</span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--danger)', marginTop: '0.2rem' }}>
                - &#8377; {totalExpense.toLocaleString()}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Form Card */}
      {showForm && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem' }}>
            {editingId ? 'Edit Treasury Account' : 'Create New Account'}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Account Label Name</label>
                <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Main HDFC Bank" />
              </div>
              <div className="form-group">
                <label className="form-label">Account Type</label>
                <select className="form-select" required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="Cash">Cash On Hand</option>
                  <option value="Bank">Bank Account</option>
                  <option value="UPI">UPI Wallet</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Opening Date</label>
                <input type="date" className="form-input" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Opening Balance (&#8377;)</label>
                <input type="number" className="form-input" required value={formData.openingBalance} onChange={e => setFormData({...formData, openingBalance: e.target.value})} />
              </div>
            </div>

            <button type="submit" className="btn-gradient" style={{ width: '100%', padding: '0.85rem' }}>
              {editingId ? 'Update Account Details' : 'Save & Initialize Account'}
            </button>
          </form>
        </div>
      )}

      {/* Individual Account Cards */}
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.25rem' }}>
          Individual Treasury Account Portfolios
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {accounts.map(acc => (
            <div 
              key={acc._id} 
              className="glass-card glass-card-interactive"
              style={{ borderLeft: acc.balance < 0 ? '4px solid var(--danger)' : '4px solid var(--primary)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <span className="badge badge-primary">{acc.type}</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginTop: '0.5rem', color: 'var(--text-primary)' }}>
                    {acc.name}
                  </h3>
                </div>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {acc.type === 'Bank' ? <Landmark size={20} /> : (acc.type === 'UPI' ? <CreditCard size={20} /> : <Wallet size={20} />)}
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <span className="form-label">Current Balance</span>
                <div style={{ fontSize: '1.75rem', fontWeight: '900', color: acc.balance < 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                  &#8377; {acc.balance.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Opening: &#8377; {acc.openingBalance?.toLocaleString() || '0'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)' }}>
                <button className="btn-secondary-glass" onClick={() => handleEdit(acc)} style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem' }}>
                  <Edit2 size={14} /> Edit
                </button>
                <button className="btn-secondary-glass" onClick={() => handleDelete(acc._id)} style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem', color: 'var(--danger)' }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
          {accounts.length === 0 && (
            <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No accounts registered yet. Click "Add New Account" above to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Accounts;
