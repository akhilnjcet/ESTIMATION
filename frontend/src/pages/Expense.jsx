import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { ArrowDownRight, Plus, Search, Edit2, Trash2, X, Wallet } from 'lucide-react';

const Expense = () => {
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ 
    type: 'Expense', 
    amount: '', 
    account: '', 
    category: 'Office Supplies', 
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [editingExpense, setEditingExpense] = useState(null);

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
      
      const lastUsed = localStorage.getItem('lastUsedExpenseAccount');
      if (lastUsed && data.find(a => a._id === lastUsed)) {
        setFormData(f => ({ ...f, account: lastUsed }));
      } else if (data.length > 0 && !editingExpense) {
        setFormData(f => ({ ...f, account: data[0]._id }));
      }
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await api.put(`/transactions/${editingExpense._id}`, formData);
        setEditingExpense(null);
      } else {
        await api.post('/transactions', formData);
        localStorage.setItem('lastUsedExpenseAccount', formData.account);
      }
      
      const lastUsed = localStorage.getItem('lastUsedExpenseAccount');
      setFormData({ 
        type: 'Expense', 
        amount: '', 
        account: lastUsed || accounts[0]?._id, 
        category: 'Office Supplies', 
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowForm(false);
      fetchExpenses();
    } catch (err) { console.error(err); }
  };

  const handleEdit = (exp) => {
    setEditingExpense(exp);
    setFormData({ 
      type: 'Expense', 
      amount: exp.amount, 
      account: exp.account?._id, 
      category: exp.category, 
      description: exp.description || '',
      date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this expense record? This will also revert the account balance.')) {
      try {
        await api.delete(`/transactions/${id}`);
        fetchExpenses();
      } catch (err) { console.error(err); }
    }
  };

  const filteredExpenses = expenses.filter(exp => 
    exp.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.account?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpenseSum = filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ArrowDownRight size={28} style={{ color: 'var(--danger)' }} />
            Expense & Outflow Register
          </h1>
          <p className="page-subtitle">Track operational costs, vendor payouts, and overheads</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search category or account..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <button 
            className="btn-gradient"
            style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }}
            onClick={() => { setShowForm(!showForm); setEditingExpense(null); }}
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancel' : '+ Record Expense'}
          </button>
        </div>
      </div>

      {/* Total Summary Banner Card */}
      <div className="glass-card" style={{ borderLeft: '4px solid var(--danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="form-label">Total Filtered Expenses</span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--danger)', marginTop: '0.2rem' }}>
            - &#8377; {totalExpenseSum.toLocaleString()}
          </h2>
        </div>
        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--danger-light)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowDownRight size={22} />
        </div>
      </div>

      {/* Editor Form Card */}
      {showForm && (
        <div className="glass-panel" style={{ padding: '2rem', borderTop: '4px solid var(--danger)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem' }}>
            {editingExpense ? 'Edit Expense Record' : 'Record New Expense Outflow'}
          </h2>
          {accounts.length === 0 ? (
            <div style={{ color: 'var(--danger)', padding: '1rem', background: 'var(--danger-light)', borderRadius: '12px', fontSize: '0.85rem' }}>
              <strong>Notice:</strong> Please add an Account (e.g. Cash or Bank) in the "Accounts & Balances" section first!
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Transaction Date</label>
                  <input type="date" className="form-input" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (&#8377;)</label>
                  <input type="number" className="form-input" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="1500" />
                </div>
                <div className="form-group">
                  <label className="form-label">Deduct From Account</label>
                  <select className="form-select" required value={formData.account} onChange={e => setFormData({...formData, account: e.target.value})}>
                    {accounts.map(acc => <option key={acc._id} value={acc._id}>{acc.name} ({acc.type})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input type="text" className="form-input" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} list="expense-categories" placeholder="Supplies / Rent" />
                  <datalist id="expense-categories">
                    <option value="Office Supplies" />
                    <option value="Rent & Utilities" />
                    <option value="Salaries & Wages" />
                    <option value="Vendor Payment" />
                    <option value="Maintenance" />
                  </datalist>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Description / Remarks</label>
                <input type="text" className="form-input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Hardware purchase receipt..." />
              </div>

              <button type="submit" className="btn-gradient" style={{ width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }}>
                {editingExpense ? 'Update Expense' : 'Save Expense Outflow'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Expense Table */}
      <div className="table-container">
        <table className="table-glass">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category & Description</th>
              <th>Source Account</th>
              <th>Amount</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map(exp => (
              <tr key={exp._id}>
                <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-danger" style={{ whiteSpace: 'nowrap' }}>{exp.category}</span>
                    {exp.editCount > 3 && <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>EDITED</span>}
                  </div>
                  {exp.description && <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>{exp.description}</div>}
                </td>
                <td style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Wallet size={14} style={{ color: 'var(--primary)' }} />
                    <span>{exp.account?.name || 'Account'}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--danger)', fontWeight: '900', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                  - &#8377; {Number(exp.amount).toLocaleString()}
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button className="btn-icon" onClick={() => handleEdit(exp)} title="Edit Record"><Edit2 size={16} /></button>
                    <button className="btn-icon" onClick={() => handleDelete(exp._id)} title="Delete Record" style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredExpenses.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No expense records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Expense;
