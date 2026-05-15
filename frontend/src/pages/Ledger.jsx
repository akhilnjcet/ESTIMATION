import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useProgram } from '../context/ProgramContext';
import { FileText, Download, Printer, Filter, Wallet, Receipt, X } from 'lucide-react';

const Ledger = () => {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date_desc'); // date_desc, date_asc, amount_desc, amount_asc
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

  const handlePrint = () => {
    const includeBalances = window.confirm('Include Cash on Hand and Bank Balance in this report?');
    
    setPreviewData({
      transactions,
      totalOpeningBalance,
      totalCredit,
      totalDebit,
      netBalance,
      cashBalance,
      bankBalance,
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
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const renderStatementPreview = (data) => {
    return (
      <div className="invoice-container no-shadow" style={{ background: 'white', padding: '40px' }}>
        <div className="invoice-header" style={{ marginBottom: '30px' }}>
          <div className="company-section">
            {selectedProgram?.showLogo && selectedProgram?.logo && (
              <img src={selectedProgram.logo} alt="Logo" className="company-logo" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
            )}
            <div className="company-details">
              <h1 className="company-name">{selectedProgram?.name}</h1>
              <p className="company-address">{selectedProgram?.address}</p>
            </div>
          </div>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px', borderTop: '2px solid #eee', paddingTop: '15px' }}>
            <h2 style={{ margin: 0, color: '#111', fontSize: '24px', fontWeight: '900' }}>STATEMENT</h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#111' }}><b>Date:</b> {data.date}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-0 mb-8 border rounded-lg overflow-hidden">
          <div className="p-4 border-r bg-gray-50/50">
            <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Opening</div>
            <div className="font-bold">₹{data.totalOpeningBalance.toLocaleString()}</div>
          </div>
          <div className="p-4 border-r bg-emerald-50/30 text-emerald-600">
            <div className="text-[10px] font-bold uppercase mb-1">Credit (+)</div>
            <div className="font-bold">₹{data.totalCredit.toLocaleString()}</div>
          </div>
          <div className="p-4 border-r bg-rose-50/30 text-rose-600">
            <div className="text-[10px] font-bold uppercase mb-1">Debit (-)</div>
            <div className="font-bold">₹{data.totalDebit.toLocaleString()}</div>
          </div>
          <div className="p-4 bg-primary/5 text-primary">
            <div className="text-[10px] font-bold uppercase mb-1">Net Balance</div>
            <div className="font-bold">₹{data.netBalance.toLocaleString()}</div>
          </div>
        </div>

        {data.includeBalances && (
          <div className="flex gap-4 mb-8">
            <div className="flex-1 p-3 bg-gray-50 rounded-lg border flex justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase">Cash on Hand</span>
              <span className="font-bold text-sm">₹{data.cashBalance.toLocaleString()}</span>
            </div>
            <div className="flex-1 p-3 bg-gray-50 rounded-lg border flex justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase">Bank Balance</span>
              <span className="font-bold text-sm">₹{data.bankBalance.toLocaleString()}</span>
            </div>
          </div>
        )}

        <table className="invoice-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #eee' }}>Date</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #eee' }}>Details</th>
              <th style={{ textAlign: 'right', padding: '10px', borderBottom: '2px solid #eee' }}>Debit</th>
              <th style={{ textAlign: 'right', padding: '10px', borderBottom: '2px solid #eee' }}>Credit</th>
            </tr>
          </thead>
          <tbody>
            {data.transactions.map((t, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '10px', fontSize: '12px' }}>{new Date(t.date).toLocaleDateString('en-GB')}</td>
                <td style={{ padding: '10px' }}>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>{t.category}</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>{t.description}</div>
                </td>
                <td style={{ padding: '10px', textAlign: 'right', color: '#e11d48' }}>{t.type === 'Expense' ? `₹${t.amount.toLocaleString()}` : '-'}</td>
                <td style={{ padding: '10px', textAlign: 'right', color: '#059669' }}>{t.type === 'Income' ? `₹${t.amount.toLocaleString()}` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice-footer" style={{ marginTop: '60px' }}>
          <div style={{ fontSize: '10px', color: '#999' }}>
            This is a computer generated statement.<br/>Generated via Krishna ERP.
          </div>
          {selectedProgram?.showTreasurerSignature && (selectedProgram?.treasurerSignatureUrl || selectedProgram?.treasurerSignatureTitle) && (
            <div className="signature-section" style={{ marginTop: '20px', textAlign: 'right' }}>
              {selectedProgram?.treasurerSignatureUrl && (
                <img src={selectedProgram.treasurerSignatureUrl} alt="Signature" className="signature-image" style={{ width: '120px' }} />
              )}
              <p className="signature-label" style={{ fontWeight: 'bold', margin: '5px 0' }}>{selectedProgram?.treasurerSignatureTitle || 'Treasurer'}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#999' }}>For {selectedProgram?.name}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const totalOpeningBalance = accounts.reduce((sum, acc) => sum + (acc.openingBalance || 0), 0);
  const totalDebit = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
  const totalCredit = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalOpeningBalance + totalCredit - totalDebit;

  const cashBalance = accounts.filter(a => a.type === 'Cash').reduce((sum, a) => sum + (a.balance || 0), 0);
  const bankBalance = accounts.filter(a => a.type !== 'Cash').reduce((sum, a) => sum + (a.balance || 0), 0);

  if (previewData) {
    return (
      <div className="preview-overlay bg-gray-900/60 backdrop-blur-sm min-h-screen p-2 md:p-8 fixed inset-0 z-[2000] overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4 sticky top-0 z-10 p-2 no-print">
            <button className="btn btn-secondary flex items-center gap-2 bg-white/90 backdrop-blur-md" onClick={() => setPreviewData(null)}>
              <X size={18} /> <span>Close</span>
            </button>
            <button className="btn btn-primary flex items-center gap-2 shadow-lg" onClick={triggerPrint}>
              <Printer size={18} /> <span>Print</span>
            </button>
          </div>
          <div className="animate-in fade-in zoom-in-95 duration-300">
            {renderStatementPreview(previewData)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Party Ledger & Statement</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <FileText size={16} />
            Financial history for <span className="font-bold text-primary">{selectedProgram?.name}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="btn btn-primary flex items-center gap-2 shadow-lg">
            <Printer size={18} />
            Export Statement PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 summary-cards">
        <div className="card border-l-4 border-gray-400 shadow-sm">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Opening Balance</div>
          <div className="text-lg font-bold text-gray-900">&#8377; {totalOpeningBalance.toLocaleString()}</div>
        </div>
        <div className="card border-l-4 border-emerald-500 shadow-sm">
          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Credit (+)</div>
          <div className="text-lg font-bold text-emerald-600">&#8377; {totalCredit.toLocaleString()}</div>
        </div>
        <div className="card border-l-4 border-rose-500 shadow-sm">
          <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1">Total Debit (-)</div>
          <div className="text-lg font-bold text-rose-600">&#8377; {totalDebit.toLocaleString()}</div>
        </div>
        <div className={`card border-l-4 shadow-sm ${netBalance >= 0 ? 'border-emerald-500 bg-emerald-50/30' : 'border-rose-500 bg-rose-50/30'}`}>
          <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Net Balance</div>
          <div className={`text-xl font-bold ${netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {netBalance < 0 ? '-' : '+'} &#8377; {Math.abs(netBalance).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Breakdown Bar */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 card py-4 flex justify-between items-center bg-emerald-600 text-white border-none shadow-lg transform hover:scale-[1.01] transition-transform">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase opacity-80">Cash on Hand</span>
            <span className="text-xl font-bold">&#8377; {cashBalance.toLocaleString()}</span>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Wallet size={20} />
          </div>
        </div>
        <div className="flex-1 card py-4 flex justify-between items-center bg-rose-600 text-white border-none shadow-lg transform hover:scale-[1.01] transition-transform">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase opacity-80">Bank Balance</span>
            <span className="text-xl font-bold">&#8377; {bankBalance.toLocaleString()}</span>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Receipt size={20} />
          </div>
        </div>
      </div>

      <div className="card border-none shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 px-2 transaction-header">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText size={20} className="text-gray-400" />
            Transaction History
          </h2>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto filter-row">
            <div className="flex-1 md:flex-none flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border">
              <Filter size={16} className="text-gray-400" />
              <select 
                className="outline-none text-sm font-bold bg-transparent w-full"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="amount_asc">Lowest Amount</option>
              </select>
            </div>
            <div className="flex-1 md:flex-none flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border">
              <Filter size={16} className="text-gray-400" />
              <select 
                className="outline-none text-sm font-bold bg-transparent w-full"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="All">All Transactions</option>
                <option value="Income">Income Only</option>
                <option value="Expense">Expense Only</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="table-container border-none shadow-none transaction-container">
          <table className="data-table transaction-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-4">Date</th>
                <th className="py-4">Transaction Details</th>
                <th className="py-4">Mode</th>
                <th className="py-4 text-right">Debit (Out)</th>
                <th className="py-4 text-right">Credit (In)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map(txn => (
                <tr key={txn._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 font-medium text-gray-600">
                    {new Date(txn.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td className="py-4">
                    <div className="font-bold text-gray-900">{txn.category}</div>
                    <div className="text-xs text-gray-500 italic max-w-xs truncate">{txn.description}</div>
                  </td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wider">
                      {txn.account?.name}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    {txn.type === 'Expense' ? (
                      <span className="font-bold text-rose-600">&#8377; {txn.amount.toLocaleString()}</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="py-4 text-right">
                    {txn.type === 'Income' ? (
                      <span className="font-bold text-emerald-600">&#8377; {txn.amount.toLocaleString()}</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="py-20 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={40} className="opacity-20" />
                      <p>No transactions found for the selected criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Ledger;
