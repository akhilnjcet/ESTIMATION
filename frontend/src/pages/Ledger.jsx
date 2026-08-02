import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useProgram } from '../context/ProgramContext';
import { FileText, Printer, Filter, Wallet, Receipt, X, ArrowUpRight, ArrowDownRight, BookOpen, Search } from 'lucide-react';

const Ledger = () => {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date_desc');
  const [searchTerm, setSearchTerm] = useState('');
  const { selectedProgram } = useProgram();
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
  }, [filter, sortBy]);

  const fetchAccounts = async () => {
    try {
      const { data } = await api.get('/accounts');
      setAccounts(data);
    } catch (err) { console.error(err); }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let url = `/transactions?sortBy=${sortBy}`;
      if (filter !== 'All') url += `&type=${filter}`;
      const { data } = await api.get(url);
      setTransactions(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filteredTransactions = transactions.filter(t => 
    t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.account?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cashBalance = accounts.filter(a => a.type === 'Cash').reduce((acc, curr) => acc + curr.balance, 0);
  const bankBalance = accounts.filter(a => a.type !== 'Cash').reduce((acc, curr) => acc + curr.balance, 0);
  const cashOpeningBalance = accounts.filter(a => a.type === 'Cash').reduce((acc, curr) => acc + (curr.openingBalance || 0), 0);
  const bankOpeningBalance = accounts.filter(a => a.type !== 'Cash').reduce((acc, curr) => acc + (curr.openingBalance || 0), 0);
  const totalOpeningBalance = accounts.reduce((acc, curr) => acc + (curr.openingBalance || 0), 0);
  const totalCredit = filteredTransactions.filter(t => t.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalDebit = filteredTransactions.filter(t => t.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);
  const netBalance = totalCredit - totalDebit;

  const handlePrint = () => {
    const includeBalances = window.confirm('Include Cash on Hand and Bank Balance in this statement report?');
    setPreviewData({
      transactions: filteredTransactions,
      totalOpeningBalance,
      totalCredit,
      totalDebit,
      netBalance,
      cashBalance,
      bankBalance,
      cashOpeningBalance,
      bankOpeningBalance,
      includeBalances,
      date: new Date().toLocaleDateString('en-GB')
    });
  };

  const triggerPrint = async () => {
    const images = document.querySelectorAll('.preview-overlay img');
    await Promise.all(
      [...images].map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );
    setTimeout(() => { window.print(); }, 500);
  };

  const renderStatementPreview = (data) => {
    return (
      <div className="invoice-container no-shadow" style={{ background: '#FFF', padding: '2.5rem', color: '#0f172a' }}>
        <div className="invoice-header" style={{ marginBottom: '1.5rem' }}>
          <div className="company-section" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {selectedProgram?.showLogo && selectedProgram?.logo && (
              <img src={selectedProgram.logo} alt="Logo" className="company-logo" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
            )}
            <div className="company-details">
              <h1 className="company-name" style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>{selectedProgram?.name}</h1>
              <p className="company-address" style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>{selectedProgram?.address}</p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1rem', borderTop: '2px solid #e2e8f0', paddingTop: '1rem' }}>
            <h2 style={{ margin: 0, color: '#2563eb', fontSize: '22px', fontWeight: '900' }}>ACCOUNT STATEMENT</h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}><b>Date:</b> {data.date}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
          <div style={{ padding: '0.85rem', background: '#f8fafc', borderRight: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Opening</span>
            <div style={{ fontWeight: '800', fontSize: '1rem' }}>&#8377; {data.totalOpeningBalance.toLocaleString()}</div>
          </div>
          <div style={{ padding: '0.85rem', background: '#f0fdf4', borderRight: '1px solid #e2e8f0', color: '#16a34a' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>Credit (+)</span>
            <div style={{ fontWeight: '800', fontSize: '1rem' }}>&#8377; {data.totalCredit.toLocaleString()}</div>
          </div>
          <div style={{ padding: '0.85rem', background: '#fef2f2', borderRight: '1px solid #e2e8f0', color: '#dc2626' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>Debit (-)</span>
            <div style={{ fontWeight: '800', fontSize: '1rem' }}>&#8377; {data.totalDebit.toLocaleString()}</div>
          </div>
          <div style={{ padding: '0.85rem', background: '#eff6ff', color: '#2563eb' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>Net Total</span>
            <div style={{ fontWeight: '800', fontSize: '1rem' }}>&#8377; {data.netBalance.toLocaleString()}</div>
          </div>
        </div>

        {data.includeBalances && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1rem 1.25rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                💵 Cash on Hand
              </span>
              <div style={{ fontWeight: '800', fontSize: '1.15rem', color: '#15803d', marginTop: '0.25rem' }}>
                ₹ {data.cashBalance.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#4ade80', marginTop: '0.25rem', borderTop: '1px dashed #86efac', paddingTop: '0.25rem' }}>
                Opening Balance: ₹ {data.cashOpeningBalance.toLocaleString()}
              </div>
            </div>
            <div style={{ padding: '1rem 1.25rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🏦 Bank Balance
              </span>
              <div style={{ fontWeight: '800', fontSize: '1.15rem', color: '#1d4ed8', marginTop: '0.25rem' }}>
                ₹ {data.bankBalance.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#60a5fa', marginTop: '0.25rem', borderTop: '1px dashed #93c5fd', paddingTop: '0.25rem' }}>
                Opening Balance: ₹ {data.bankOpeningBalance.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '0.6rem', textAlign: 'left', fontSize: '0.75rem' }}>Date</th>
              <th style={{ padding: '0.6rem', textAlign: 'left', fontSize: '0.75rem' }}>Details</th>
              <th style={{ padding: '0.6rem', textAlign: 'left', fontSize: '0.75rem' }}>Account</th>
              <th style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.75rem' }}>Debit (Out)</th>
              <th style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.75rem' }}>Credit (In)</th>
            </tr>
          </thead>
          <tbody>
            {data.transactions.map((t, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.6rem', fontSize: '0.8rem', color: '#64748b' }}>
                  {new Date(t.date).toLocaleDateString('en-GB')}
                </td>
                <td style={{ padding: '0.6rem', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: '600', color: '#0f172a' }}>{t.category}</div>
                  {t.description && <div style={{ fontSize: '11px', color: '#64748b' }}>{t.description}</div>}
                </td>
                <td style={{ padding: '0.6rem', fontSize: '0.8rem', color: '#475569' }}>{t.account?.name}</td>
                <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: '700', color: '#dc2626', fontSize: '0.85rem' }}>
                  {t.type === 'Expense' ? `₹${t.amount.toLocaleString()}` : '-'}
                </td>
                <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: '700', color: '#16a34a', fontSize: '0.85rem' }}>
                  {t.type === 'Income' ? `₹${t.amount.toLocaleString()}` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer Note */}
        <div style={{ marginTop: '2rem', borderTop: '1px dashed #e2e8f0', paddingTop: '1rem', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, fontStyle: 'italic', letterSpacing: '0.02em' }}>
            ✅ This is a digitally generated statement. No signature is required.
          </p>
          <p style={{ fontSize: '10px', color: '#cbd5e1', margin: '0.25rem 0 0', }}>
            Generated on {new Date().toLocaleString('en-GB')} &nbsp;|&nbsp; {selectedProgram?.name}
          </p>
        </div>

      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <BookOpen size={28} style={{ color: 'var(--primary)' }} />
            Party & General Ledger
          </h1>
          <p className="page-subtitle">Unified transaction history and statement reports</p>
        </div>

        <button className="btn-gradient" onClick={handlePrint}>
          <Printer size={18} /> Print Statement PDF
        </button>
      </div>

      {/* Overview Cards */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-card">
          <span className="form-label">Total Credit (+)</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--success)', marginTop: '0.25rem' }}>
            &#8377; {totalCredit.toLocaleString()}
          </h3>
        </div>
        <div className="glass-card">
          <span className="form-label">Total Debit (-)</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--danger)', marginTop: '0.25rem' }}>
            &#8377; {totalDebit.toLocaleString()}
          </h3>
        </div>
        <div className="glass-card">
          <span className="form-label">Net Balance Flow</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: netBalance >= 0 ? 'var(--primary)' : 'var(--danger)', marginTop: '0.25rem' }}>
            &#8377; {netBalance.toLocaleString()}
          </h3>
        </div>
      </div>

      {/* Transaction History Glass Card */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} style={{ color: 'var(--primary)' }} />
            Transaction History Logs
          </h2>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: '1 1 300px', justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative', flex: '1 1 180px', minWidth: '160px' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search transactions..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem', padding: '0.5rem 0.75rem 0.5rem 2.5rem', fontSize: '0.85rem', width: '100%' }}
              />
              <Search size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>

            <select 
              className="form-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ flex: '1 1 120px', minWidth: '120px', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
            >
              <option value="All">All Types</option>
              <option value="Income">Income Only</option>
              <option value="Expense">Expense Only</option>
            </select>

            <select 
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ flex: '1 1 130px', minWidth: '130px', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="table-glass">
            <thead>
              <tr>
                <th style={{ whiteSpace: 'nowrap' }}>Date</th>
                <th style={{ minWidth: '180px' }}>Transaction Details</th>
                <th style={{ whiteSpace: 'nowrap' }}>Payment Account</th>
                <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Debit (-)</th>
                <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Credit (+)</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(txn => (
                <tr key={txn._id}>
                  <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(txn.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td>
                    <div style={{ fontWeight: '700' }}>{txn.category}</div>
                    {txn.description && <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{txn.description}</div>}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className="badge badge-primary" style={{ whiteSpace: 'nowrap' }}>{txn.account?.name || 'Account'}</span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--danger)', whiteSpace: 'nowrap' }}>
                    {txn.type === 'Expense' ? `- ₹${txn.amount.toLocaleString()}` : '-'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--success)', whiteSpace: 'nowrap' }}>
                    {txn.type === 'Income' ? `+ ₹${txn.amount.toLocaleString()}` : '-'}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No matching ledger transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statement Print Modal Overlay */}
      {previewData && (
        <div 
          className="modal-print-overlay labour-preview-overlay"
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
          <div className="printable" style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
            <div 
              className="no-print" 
              style={{ 
                display: 'flex', 
                justify: 'space-between', 
                alignItems: 'center', 
                marginBottom: '1.25rem',
                background: 'rgba(15, 23, 42, 0.95)',
                padding: '1rem 1.5rem',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                position: 'sticky',
                top: 0,
                zIndex: 10
              }}
            >
              <button className="btn-secondary-glass" onClick={() => setPreviewData(null)}>
                <X size={18} /> Close Statement
              </button>
              <button className="btn-gradient" onClick={triggerPrint}>
                <Printer size={18} /> Print Statement PDF
              </button>
            </div>
            <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
              {renderStatementPreview(previewData)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ledger;
