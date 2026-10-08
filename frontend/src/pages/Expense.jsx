import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { ArrowDownRight, Plus, Search, Edit2, Trash2, X, Wallet, UserCheck, User, Printer } from 'lucide-react';
import { useProgram } from '../context/ProgramContext';

const Expense = () => {
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [memberFilter, setMemberFilter] = useState('ALL');
  const [previewData, setPreviewData] = useState(null);
  const { selectedProgram } = useProgram();

  const [formData, setFormData] = useState({ 
    type: 'Expense', 
    amount: '', 
    account: '', 
    category: 'Office Supplies', 
    description: '',
    date: new Date().toISOString().split('T')[0],
    partyType: 'Member', // 'Member' or 'Others'
    partyMember: '',
    partyName: ''
  });

  const [editingExpense, setEditingExpense] = useState(null);

  useEffect(() => {
    fetchExpenses();
    fetchAccounts();
    fetchStaff();
  }, [selectedProgram]);

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

  const fetchStaff = async () => {
    try {
      const { data } = await api.get('/staff');
      setStaffList(data);
      if (data.length > 0 && !formData.partyMember && formData.partyType === 'Member') {
        setFormData(f => ({ 
          ...f, 
          partyMember: data[0]._id, 
          partyName: `${data[0].name} (${data[0].memberId})` 
        }));
      }
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (payload.partyType === 'Member') {
        const selectedStaff = staffList.find(s => s._id === payload.partyMember);
        if (selectedStaff) {
          payload.partyName = `${selectedStaff.name} (${selectedStaff.memberId})`;
        }
      } else {
        payload.partyMember = null;
      }

      if (editingExpense) {
        await api.put(`/transactions/${editingExpense._id}`, payload);
        setEditingExpense(null);
      } else {
        await api.post('/transactions', payload);
        localStorage.setItem('lastUsedExpenseAccount', payload.account);
      }
      
      resetForm();
      fetchExpenses();
    } catch (err) { console.error(err); }
  };

  const resetForm = () => {
    const lastUsed = localStorage.getItem('lastUsedExpenseAccount');
    const defaultStaff = staffList[0];
    setFormData({ 
      type: 'Expense', 
      amount: '', 
      account: lastUsed || accounts[0]?._id || '', 
      category: 'Office Supplies', 
      description: '',
      date: new Date().toISOString().split('T')[0],
      partyType: 'Member',
      partyMember: defaultStaff ? defaultStaff._id : '',
      partyName: defaultStaff ? `${defaultStaff.name} (${defaultStaff.memberId})` : ''
    });
    setShowForm(false);
    setEditingExpense(null);
  };

  const handleEdit = (exp) => {
    setEditingExpense(exp);
    const pType = exp.partyType || (exp.partyMember ? 'Member' : 'Others');
    const memberIdVal = exp.partyMember?._id || exp.partyMember || '';

    setFormData({ 
      type: 'Expense', 
      amount: exp.amount, 
      account: exp.account?._id || exp.account, 
      category: exp.category, 
      description: exp.description || '',
      date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      partyType: pType,
      partyMember: memberIdVal,
      partyName: exp.partyName || (exp.partyMember ? `${exp.partyMember.name} (${exp.partyMember.memberId})` : '')
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

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = 
      exp.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.account?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.partyMember?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.partyMember?.memberId?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (memberFilter === 'ALL') return true;
    if (memberFilter === 'MEMBERS_ONLY') return exp.partyType === 'Member' || exp.partyMember;
    if (memberFilter === 'OTHERS_ONLY') return exp.partyType === 'Others' && !exp.partyMember;
    return (exp.partyMember?._id || exp.partyMember) === memberFilter;
  });

  const totalExpenseSum = filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  // Calculate member-wise expense summary breakdown
  const memberWiseExpense = expenses.reduce((acc, exp) => {
    if (exp.partyType === 'Member' || exp.partyMember) {
      const name = exp.partyMember?.name 
        ? `${exp.partyMember.name} (${exp.partyMember.memberId})` 
        : exp.partyName || 'Registered Member';
      acc[name] = (acc[name] || 0) + Number(exp.amount || 0);
    }
    return acc;
  }, {});

  const handlePrintRegister = () => {
    const selectedMemberObj = staffList.find(m => m._id === memberFilter);
    setPreviewData({
      expenses: filteredExpenses,
      totalExpenseSum,
      filterTitle: memberFilter === 'ALL' 
        ? 'All Expense Records' 
        : memberFilter === 'MEMBERS_ONLY' 
        ? 'Expenses Handed To Members' 
        : memberFilter === 'OTHERS_ONLY' 
        ? 'External / Others Expenses' 
        : `Member Outflow Statement: ${selectedMemberObj ? `${selectedMemberObj.name} (${selectedMemberObj.memberId})` : 'Selected Member'}`,
      date: new Date().toLocaleDateString('en-GB')
    });
  };

  const triggerPrint = () => {
    setTimeout(() => { window.print(); }, 500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ArrowDownRight size={28} style={{ color: 'var(--danger)' }} />
            Expense & Outflow Register
          </h1>
          <p className="page-subtitle">Track operational costs, member disbursements, vendor payouts, and overheads</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search category, recipient..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', padding: '0.5rem 0.75rem 0.5rem 2.5rem', fontSize: '0.85rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <select
            className="form-select"
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            style={{ width: '190px', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
          >
            <option value="ALL">Filter: All Parties</option>
            <option value="MEMBERS_ONLY">Filter: All Registered Members</option>
            <option value="OTHERS_ONLY">Filter: Others / External</option>
            {staffList.length > 0 && <optgroup label="Specific Member">
              {staffList.map(m => (
                <option key={m._id} value={m._id}>{m.name} ({m.memberId})</option>
              ))}
            </optgroup>}
          </select>

          <button 
            className="btn-secondary-glass" 
            onClick={handlePrintRegister}
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
          >
            <Printer size={16} /> Print Register
          </button>

          <button 
            className="btn-gradient"
            style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancel' : '+ Record Expense'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-card" style={{ borderLeft: '4px solid var(--danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="form-label">Total Filtered Expenses</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--danger)', marginTop: '0.2rem' }}>
              - &#8377; {totalExpenseSum.toLocaleString()}
            </h2>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--danger-light)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowDownRight size={22} />
          </div>
        </div>

        {/* Member-Wise Expense Highlights */}
        {Object.keys(memberWiseExpense).length > 0 && (
          <div className="glass-card" style={{ borderLeft: '4px solid var(--warning)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <UserCheck size={14} style={{ color: 'var(--warning)' }} /> Handed To Members Total
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--warning)', marginTop: '0.2rem' }}>
              - &#8377; {Object.values(memberWiseExpense).reduce((a, b) => a + b, 0).toLocaleString()}
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Disbursed across {Object.keys(memberWiseExpense).length} member(s)
            </div>
          </div>
        )}
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
                    <option value="Member Advance / Payout" />
                    <option value="Rent & Utilities" />
                    <option value="Salaries & Wages" />
                    <option value="Vendor Payment" />
                    <option value="Maintenance" />
                  </datalist>
                </div>
              </div>

              {/* Fund Handed Over To: Party / Member selection logic */}
              <div className="form-group" style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)', marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: '700', color: 'var(--danger)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <UserCheck size={16} /> Fund Handed Over To (Recipient / Party)
                </label>
                
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>
                    <input 
                      type="radio" 
                      name="partyType" 
                      value="Member" 
                      checked={formData.partyType === 'Member'} 
                      onChange={() => {
                        const firstStaff = staffList[0];
                        setFormData({ 
                          ...formData, 
                          partyType: 'Member', 
                          partyMember: firstStaff ? firstStaff._id : '',
                          partyName: firstStaff ? `${firstStaff.name} (${firstStaff.memberId})` : ''
                        });
                      }} 
                    />
                    Registered Member
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>
                    <input 
                      type="radio" 
                      name="partyType" 
                      value="Others" 
                      checked={formData.partyType === 'Others'} 
                      onChange={() => setFormData({ ...formData, partyType: 'Others', partyMember: '', partyName: '' })} 
                    />
                    Others (External Person / Vendor)
                  </label>
                </div>

                {formData.partyType === 'Member' ? (
                  <div className="form-group">
                    <label className="form-label">Select Registered Member</label>
                    {staffList.length === 0 ? (
                      <div style={{ fontSize: '0.825rem', color: 'var(--warning)', padding: '0.5rem 0' }}>
                        No registered members found. You can add members in the Member Directory.
                      </div>
                    ) : (
                      <select 
                        className="form-select" 
                        required 
                        value={formData.partyMember} 
                        onChange={e => {
                          const m = staffList.find(s => s._id === e.target.value);
                          setFormData({
                            ...formData,
                            partyMember: e.target.value,
                            partyName: m ? `${m.name} (${m.memberId})` : ''
                          });
                        }}
                      >
                        {staffList.map(member => (
                          <option key={member._id} value={member._id}>
                            {member.name} ({member.memberId}) - {member.designation}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Manual Recipient Name / Person</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required
                      placeholder="e.g. Jane Smith / Vendor / Driver / Service Person" 
                      value={formData.partyName} 
                      onChange={e => setFormData({ ...formData, partyName: e.target.value })} 
                    />
                  </div>
                )}
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
              <th>Fund Handed Over To (Party)</th>
              <th>Category & Description</th>
              <th>Source Account</th>
              <th>Amount</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map(exp => {
              const isMember = exp.partyType === 'Member' || exp.partyMember;
              const memberObj = exp.partyMember;
              const displayPartyName = memberObj 
                ? `${memberObj.name} (${memberObj.memberId})` 
                : (exp.partyName || 'N/A');

              return (
                <tr key={exp._id}>
                  <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td>
                    {isMember ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.6rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: '600', fontSize: '0.825rem' }}>
                        <UserCheck size={14} />
                        <span>{displayPartyName}</span>
                      </div>
                    ) : (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.6rem', borderRadius: '8px', background: 'rgba(241, 245, 249, 0.1)', color: 'var(--text-primary)', fontWeight: '500', fontSize: '0.825rem' }}>
                        <User size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>{displayPartyName}</span>
                      </div>
                    )}
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
              );
            })}
            {filteredExpenses.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No expense records found matching criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Print Register Modal */}
      {previewData && (
        <div 
          className="modal-print-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            padding: '2rem 1rem',
            overflowY: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start'
          }}
        >
          <div className="printable" style={{ width: '100%', maxWidth: '900px', margin: '0 auto', background: '#fff', padding: '1rem', borderRadius: '16px', color: '#0f172a' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: '#0f172a', padding: '1rem 1.5rem', borderRadius: '12px', color: '#fff' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Expense Register Statement</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-secondary-glass" onClick={() => setPreviewData(null)}><X size={16} /> Close</button>
                <button className="btn-gradient" onClick={triggerPrint}><Printer size={16} /> Print PDF</button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h1 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0 }}>{selectedProgram?.name}</h1>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>{selectedProgram?.address}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#dc2626', margin: 0 }}>EXPENSE REGISTER REPORT</h2>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Date: {previewData.date}</p>
                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#2563eb', margin: 0 }}>{previewData.filterTitle}</p>
              </div>
            </div>

            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '700', color: '#dc2626' }}>Total Filtered Expense Sum:</span>
              <span style={{ fontWeight: '900', color: '#dc2626', fontSize: '1.2rem' }}>₹ {previewData.totalExpenseSum.toLocaleString()}</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', minWidth: '500px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '0.6rem', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '0.6rem', textAlign: 'left' }}>Fund Handed Over To</th>
                    <th style={{ padding: '0.6rem', textAlign: 'left' }}>Category</th>
                    <th style={{ padding: '0.6rem', textAlign: 'left' }}>Account</th>
                    <th style={{ padding: '0.6rem', textAlign: 'left' }}>Description</th>
                    <th style={{ padding: '0.6rem', textAlign: 'right' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.expenses.map((exp, i) => {
                    const mObj = exp.partyMember;
                    const partyStr = mObj ? `${mObj.name} (${mObj.memberId})` : (exp.partyName || 'Others');
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.6rem' }}>{new Date(exp.date).toLocaleDateString('en-GB')}</td>
                        <td style={{ padding: '0.6rem', fontWeight: '600' }}>{partyStr}</td>
                        <td style={{ padding: '0.6rem' }}>{exp.category}</td>
                        <td style={{ padding: '0.6rem' }}>{exp.account?.name}</td>
                        <td style={{ padding: '0.6rem', color: '#64748b' }}>{exp.description || '-'}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: '800', color: '#dc2626' }}>₹{Number(exp.amount).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expense;
