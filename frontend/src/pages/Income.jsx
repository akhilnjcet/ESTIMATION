import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { ArrowUpRight, Plus, Search, Edit2, Trash2, X, Wallet, Tag } from 'lucide-react';

const Income = () => {
  const [incomes, setIncomes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredIncomes = incomes.filter(inc => 
    inc.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inc.account?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalIncomeSum = filteredIncomes.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ArrowUpRight size={28} style={{ color: 'var(--success)' }} />
            Income & Revenue Register
          </h1>
          <p className="page-subtitle">Record deposits, customer payments, and sales revenue</p>
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
            style={{ background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' }}
            onClick={() => { setShowForm(!showForm); setEditingIncome(null); }}
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancel' : '+ Record Income'}
          </button>
        </div>
      </div>

      {/* Total Summary Banner Card */}
      <div className="glass-card" style={{ borderLeft: '4px solid var(--success)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="form-label">Total Filtered Income</span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--success)', marginTop: '0.2rem' }}>
            + &#8377; {totalIncomeSum.toLocaleString()}
          </h2>
        </div>
        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowUpRight size={22} />
        </div>
      </div>

      {/* Editor Form Card */}
      {showForm && (
        <div className="glass-panel" style={{ padding: '2rem', borderTop: '4px solid var(--success)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem' }}>
            {editingIncome ? 'Edit Income Transaction' : 'Record New Income Entry'}
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
                  <input type="number" className="form-input" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="5000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Deposit To Account</label>
                  <select className="form-select" required value={formData.account} onChange={e => setFormData({...formData, account: e.target.value})}>
                    {accounts.map(acc => <option key={acc._id} value={acc._id}>{acc.name} ({acc.type})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input type="text" className="form-input" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} list="income-categories" placeholder="Sales / Service" />
                  <datalist id="income-categories">
                    <option value="Sales" />
                    <option value="Service Income" />
                    <option value="Other Income" />
                  </datalist>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Description / Remarks</label>
                <input type="text" className="form-input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Client invoice payment..." />
              </div>

              <button type="submit" className="btn-gradient" style={{ width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' }}>
                {editingIncome ? 'Update Record' : 'Save Income Entry'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Income Table */}
      <div className="table-container">
        <table className="table-glass">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category & Description</th>
              <th>Destination Account</th>
              <th>Amount</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredIncomes.map(inc => (
              <tr key={inc._id}>
                <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(inc.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-success" style={{ whiteSpace: 'nowrap' }}>{inc.category}</span>
                    {inc.editCount > 3 && <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>EDITED</span>}
                  </div>
                  {inc.description && <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>{inc.description}</div>}
                </td>
                <td style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Wallet size={14} style={{ color: 'var(--primary)' }} />
                    <span>{inc.account?.name || 'Account'}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--success)', fontWeight: '900', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                  + &#8377; {Number(inc.amount).toLocaleString()}
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button className="btn-icon" onClick={() => handleEdit(inc)} title="Edit Record"><Edit2 size={16} /></button>
                    <button className="btn-icon" onClick={() => handleDelete(inc._id)} title="Delete Record" style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredIncomes.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No income entries recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Income;
