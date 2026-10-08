import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { ArrowUpRight, Plus, Search, Edit2, Trash2, X, Wallet, UserCheck, User, Printer } from 'lucide-react';
import { useProgram } from '../context/ProgramContext';

const Income = () => {
  const [incomes, setIncomes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [memberFilter, setMemberFilter] = useState('ALL');
  const [previewData, setPreviewData] = useState(null);
  const { selectedProgram } = useProgram();

  const [formData, setFormData] = useState({ 
    type: 'Income', 
    amount: '', 
    account: '', 
    category: 'Sales', 
    description: '',
    date: new Date().toISOString().split('T')[0],
    partyType: 'Member', // 'Member' or 'Others'
    partyMember: '',
    partyName: ''
  });

  const [editingIncome, setEditingIncome] = useState(null);

  useEffect(() => {
    fetchIncomes();
    fetchAccounts();
    fetchStaff();
  }, [selectedProgram]);

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

      if (editingIncome) {
        await api.put(`/transactions/${editingIncome._id}`, payload);
        setEditingIncome(null);
      } else {
        await api.post('/transactions', payload);
        localStorage.setItem('lastUsedIncomeAccount', payload.account);
      }
      
      resetForm();
      fetchIncomes();
    } catch (err) { console.error(err); }
  };

  const resetForm = () => {
    const lastUsed = localStorage.getItem('lastUsedIncomeAccount');
    const defaultStaff = staffList[0];
    setFormData({ 
      type: 'Income', 
      amount: '', 
      account: lastUsed || accounts[0]?._id || '', 
      category: 'Sales', 
      description: '',
      date: new Date().toISOString().split('T')[0],
      partyType: 'Member',
      partyMember: defaultStaff ? defaultStaff._id : '',
      partyName: defaultStaff ? `${defaultStaff.name} (${defaultStaff.memberId})` : ''
    });
    setShowForm(false);
    setEditingIncome(null);
  };

  const handleEdit = (inc) => {
    setEditingIncome(inc);
    const pType = inc.partyType || (inc.partyMember ? 'Member' : 'Others');
    const memberIdVal = inc.partyMember?._id || inc.partyMember || '';
    
    setFormData({ 
      type: 'Income', 
      amount: inc.amount, 
      account: inc.account?._id || inc.account, 
      category: inc.category, 
      description: inc.description || '',
      date: inc.date ? new Date(inc.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      partyType: pType,
      partyMember: memberIdVal,
      partyName: inc.partyName || (inc.partyMember ? `${inc.partyMember.name} (${inc.partyMember.memberId})` : '')
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

  const filteredIncomes = incomes.filter(inc => {
    const matchesSearch = 
      inc.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.account?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.partyMember?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.partyMember?.memberId?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (memberFilter === 'ALL') return true;
    if (memberFilter === 'MEMBERS_ONLY') return inc.partyType === 'Member' || inc.partyMember;
    if (memberFilter === 'OTHERS_ONLY') return inc.partyType === 'Others' && !inc.partyMember;
    return (inc.partyMember?._id || inc.partyMember) === memberFilter;
  });

  const totalIncomeSum = filteredIncomes.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  
  // Calculate member-wise summary breakdown
  const memberWiseIncome = incomes.reduce((acc, inc) => {
    if (inc.partyType === 'Member' || inc.partyMember) {
      const name = inc.partyMember?.name 
        ? `${inc.partyMember.name} (${inc.partyMember.memberId})` 
        : inc.partyName || 'Registered Member';
      acc[name] = (acc[name] || 0) + Number(inc.amount || 0);
    }
    return acc;
  }, {});

  const handlePrintRegister = () => {
    const selectedMemberObj = staffList.find(m => m._id === memberFilter);
    setPreviewData({
      incomes: filteredIncomes,
      totalIncomeSum,
      filterTitle: memberFilter === 'ALL' 
        ? 'All Income Records' 
        : memberFilter === 'MEMBERS_ONLY' 
        ? 'Registered Members Income' 
        : memberFilter === 'OTHERS_ONLY' 
        ? 'External / Others Income' 
        : `Member Statement: ${selectedMemberObj ? `${selectedMemberObj.name} (${selectedMemberObj.memberId})` : 'Selected Member'}`,
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
            <ArrowUpRight size={28} style={{ color: 'var(--success)' }} />
            Income & Revenue Register
          </h1>
          <p className="page-subtitle">Record deposits, member contributions, customer payments, and sales revenue</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search income, member..." 
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
            style={{ background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancel' : '+ Record Income'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-card" style={{ borderLeft: '4px solid var(--success)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="form-label">Total Filtered Income</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--success)', marginTop: '0.2rem' }}>
              + &#8377; {totalIncomeSum.toLocaleString()}
            </h2>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowUpRight size={22} />
          </div>
        </div>

        {/* Member-Wise Income Highlights */}
        {Object.keys(memberWiseIncome).length > 0 && (
          <div className="glass-card" style={{ borderLeft: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <UserCheck size={14} style={{ color: 'var(--primary)' }} /> Member Contributions Total
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary)', marginTop: '0.2rem' }}>
              + &#8377; {Object.values(memberWiseIncome).reduce((a, b) => a + b, 0).toLocaleString()}
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              From {Object.keys(memberWiseIncome).length} active member(s)
            </div>
          </div>
        )}
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
                    <option value="Member Contribution" />
                    <option value="Service Income" />
                    <option value="Donation / Grant" />
                    <option value="Other Income" />
                  </datalist>
                </div>
              </div>

              {/* Income From: Party / Member selection logic */}
              <div className="form-group" style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)', marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: '700', color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <UserCheck size={16} /> Income From (Payer / Source)
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
                    Others (External Person / Client)
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
                    <label className="form-label">Manual Payer Name / Source</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required
                      placeholder="e.g. John Doe / Global Enterprises / Walk-in Customer" 
                      value={formData.partyName} 
                      onChange={e => setFormData({ ...formData, partyName: e.target.value })} 
                    />
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Description / Remarks</label>
                <input type="text" className="form-input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Remarks or payment notes..." />
              </div>

              <button type="submit" className="btn-gradient" style={{ width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' }}>
                {editingIncome ? 'Update Income Record' : 'Save Income Entry'}
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
              <th>Income From (Party)</th>
              <th>Category & Description</th>
              <th>Destination Account</th>
              <th>Amount</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredIncomes.map(inc => {
              const isMember = inc.partyType === 'Member' || inc.partyMember;
              const memberObj = inc.partyMember;
              const displayPartyName = memberObj 
                ? `${memberObj.name} (${memberObj.memberId})` 
                : (inc.partyName || 'N/A');

              return (
                <tr key={inc._id}>
                  <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(inc.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td>
                    {isMember ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.6rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontWeight: '600', fontSize: '0.825rem' }}>
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
              );
            })}
            {filteredIncomes.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No income entries found matching criteria.
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
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Income Register Statement</h3>
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
                <h2 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#16a34a', margin: 0 }}>INCOME REGISTER REPORT</h2>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Date: {previewData.date}</p>
                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#2563eb', margin: 0 }}>{previewData.filterTitle}</p>
              </div>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '700', color: '#16a34a' }}>Total Filtered Income Sum:</span>
              <span style={{ fontWeight: '900', color: '#16a34a', fontSize: '1.2rem' }}>₹ {previewData.totalIncomeSum.toLocaleString()}</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', minWidth: '500px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '0.6rem', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '0.6rem', textAlign: 'left' }}>Income From (Party)</th>
                    <th style={{ padding: '0.6rem', textAlign: 'left' }}>Category</th>
                    <th style={{ padding: '0.6rem', textAlign: 'left' }}>Account</th>
                    <th style={{ padding: '0.6rem', textAlign: 'left' }}>Description</th>
                    <th style={{ padding: '0.6rem', textAlign: 'right' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.incomes.map((inc, i) => {
                    const mObj = inc.partyMember;
                    const partyStr = mObj ? `${mObj.name} (${mObj.memberId})` : (inc.partyName || 'Others');
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.6rem' }}>{new Date(inc.date).toLocaleDateString('en-GB')}</td>
                        <td style={{ padding: '0.6rem', fontWeight: '600' }}>{partyStr}</td>
                        <td style={{ padding: '0.6rem' }}>{inc.category}</td>
                        <td style={{ padding: '0.6rem' }}>{inc.account?.name}</td>
                        <td style={{ padding: '0.6rem', color: '#64748b' }}>{inc.description || '-'}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: '800', color: '#16a34a' }}>₹{Number(inc.amount).toLocaleString()}</td>
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

export default Income;
