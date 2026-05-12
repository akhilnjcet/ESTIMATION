import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useProgram } from '../context/ProgramContext';
import { FileText, Download, Printer, Filter, Wallet, Receipt } from 'lucide-react';

const Ledger = () => {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date_desc'); // date_desc, date_asc, amount_desc, amount_asc
  const { selectedProgram } = useProgram();

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
    const totalOpeningBalance = accounts.reduce((sum, acc) => sum + (acc.openingBalance || 0), 0);
    const totalDebit = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
    const totalCredit = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const netBalance = totalOpeningBalance + totalCredit - totalDebit;

    const cashBalance = accounts.filter(a => a.type === 'Cash').reduce((sum, a) => sum + (a.balance || 0), 0);
    const bankBalance = accounts.filter(a => a.type !== 'Cash').reduce((sum, a) => sum + (a.balance || 0), 0);

    // Ask user if they want to include specific account balances
    const includeBalances = window.confirm('Include Cash on Hand and Bank Balance in this report?');

    const printWindow = window.open('', '_blank');
    const tableRows = transactions.map(t => `
      <tr>
        <td>${new Date(t.date).toLocaleDateString('en-GB')}</td>
        <td>
          <div style="font-weight: bold">${t.category}</div>
          <div style="font-size: 10px; color: #64748b">${t.description || ''}</div>
        </td>
        <td>${t.account?.name || '-'}</td>
        <td style="text-align: right; color: #ef4444">${t.type === 'Expense' ? '₹ ' + t.amount.toLocaleString() : '-'}</td>
        <td style="text-align: right; color: #10b981">${t.type === 'Income' ? '₹ ' + t.amount.toLocaleString() : '-'}</td>
      </tr>
    `).join('');

    const balancesHtml = includeBalances ? `
      <div class="summary" style="margin-top: 0; background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 5px 5px;">
        <div class="card" style="background:transparent; border-right: 1px solid #e2e8f0;">Cash on Hand: ₹${cashBalance.toLocaleString()}</div>
        <div class="card" style="background:transparent;">Bank Balance: ₹${bankBalance.toLocaleString()}</div>
      </div>
    ` : '';

    const html = `
      <html>
        <head>
          <title>Statement - ${selectedProgram?.name}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
            .summary { display: flex; gap: 0; margin: 20px 0; border: 1px solid #ddd; border-radius: 5px; overflow: hidden; }
            .card { flex: 1; padding: 15px; background: #fff; font-size: 13px; }
            .card-primary { background: #eef2ff; border-left: 4px solid #4f46e5; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f8fafc; border-bottom: 2px solid #4f46e5; padding: 12px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b; }
            td { border-bottom: 1px solid #eee; padding: 12px 10px; text-align: left; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin:0; color:#4f46e5;">${selectedProgram?.name}</h1>
              <p style="margin:5px 0 0 0; font-size:12px; color:#64748b;">Financial Ledger Statement</p>
            </div>
            <div style="text-align:right">
              <h2 style="margin:0; color:#94a3b8; font-size:24px;">STATEMENT</h2>
              <p style="margin:5px 0 0 0; font-size:12px;">Date: ${new Date().toLocaleDateString('en-GB')}</p>
            </div>
          </div>
          
          <div class="summary">
            <div class="card" style="border-right: 1px solid #ddd;">Opening: ₹${totalOpeningBalance.toLocaleString()}</div>
            <div class="card" style="border-right: 1px solid #ddd; color: #10b981;">Credit (+): ₹${totalCredit.toLocaleString()}</div>
            <div class="card" style="border-right: 1px solid #ddd; color: #ef4444;">Debit (-): ₹${totalDebit.toLocaleString()}</div>
            <div class="card card-primary"><b>Net Balance: ₹${netBalance.toLocaleString()}</b></div>
          </div>

          ${balancesHtml}

          <table>
            <thead><tr><th>Date</th><th>Details</th><th>Account</th><th style="text-align:right">Debit</th><th style="text-align:right">Credit</th></tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
          
          <div style="margin-top: 40px; padding-top: 10px; border-top: 1px solid #eee; font-size: 10px; color: #94a3b8; text-align: center;">
            This is a computer generated statement. Generated via Krishna ERP.
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const totalOpeningBalance = accounts.reduce((sum, acc) => sum + (acc.openingBalance || 0), 0);
  const totalDebit = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
  const totalCredit = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalOpeningBalance + totalCredit - totalDebit;

  const cashBalance = accounts.filter(a => a.type === 'Cash').reduce((sum, a) => sum + (a.balance || 0), 0);
  const bankBalance = accounts.filter(a => a.type !== 'Cash').reduce((sum, a) => sum + (a.balance || 0), 0);

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 px-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText size={20} className="text-gray-400" />
            Transaction History
          </h2>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
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
        
        <div className="table-container border-none shadow-none">
          <table className="data-table">
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
