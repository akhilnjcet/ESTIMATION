import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useProgram } from '../context/ProgramContext';
import { FileText, Download, Printer, Filter } from 'lucide-react';

const Ledger = () => {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const { selectedProgram } = useProgram();

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
  }, [filter]);

  const fetchAccounts = async () => {
    try {
      const { data } = await api.get('/accounts');
      setAccounts(data);
    } catch (err) { console.error(err); }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let url = '/transactions';
      if (filter !== 'All') url += `?type=${filter}`;
      const { data } = await api.get(url);
      setTransactions(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const totalOpeningBalance = accounts.reduce((sum, acc) => sum + (acc.openingBalance || 0), 0);
    const totalDebit = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
    const totalCredit = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const netBalance = totalOpeningBalance + totalCredit - totalDebit;

    printWindow.document.write(`
      <html>
        <head>
          <title>Statement - ${selectedProgram?.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid ${selectedProgram?.themeColor || '#4f46e5'}; padding-bottom: 20px; margin-bottom: 30px; }
            .business-info h1 { margin: 0; color: ${selectedProgram?.themeColor || '#4f46e5'}; font-size: 24px; }
            .business-info p { margin: 2px 0; font-size: 12px; color: #64748b; }
            .statement-title { text-align: right; }
            .statement-title h2 { margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 2px; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
            .summary-card { padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
            .summary-card label { display: block; font-size: 10px; text-transform: uppercase; color: #64748b; margin-bottom: 5px; }
            .summary-card value { display: block; font-size: 18px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
            td { padding: 12px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
            .debit { color: #ef4444; font-weight: bold; }
            .credit { color: #10b981; font-weight: bold; }
            .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 10px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="business-info">
              <h1>${selectedProgram?.name}</h1>
              <p>${selectedProgram?.address || ''}</p>
              <p>Phone: ${selectedProgram?.phone || ''} | Email: ${selectedProgram?.email || ''}</p>
              ${selectedProgram?.gstNumber ? `<p>GST: ${selectedProgram?.gstNumber}</p>` : ''}
            </div>
            <div class="statement-title">
              <h2>Account Statement</h2>
              <p style="font-size: 12px; color: #64748b;">Period: All Time</p>
            </div>
          </div>

          <div class="summary">
            <div class="summary-card">
              <label>Opening Balance</label>
              <value>₹ ${totalOpeningBalance.toLocaleString()}</value>
            </div>
            <div class="summary-card">
              <label>Total Credit (In)</label>
              <value class="credit">₹ ${totalCredit.toLocaleString()}</value>
            </div>
            <div class="summary-card">
              <label>Total Debit (Out)</label>
              <value class="debit">₹ ${totalDebit.toLocaleString()}</value>
            </div>
            <div class="summary-card" style="border-left: 4px solid ${selectedProgram?.themeColor || '#4f46e5'}; grid-column: span 3;">
              <label>Net Balance (Closing)</label>
              <value>₹ ${netBalance.toLocaleString()}</value>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Details / Category</th>
                <th>Account</th>
                <th style="text-align: right">Debit (Out)</th>
                <th style="text-align: right">Credit (In)</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map(t => `
                <tr>
                  <td>${new Date(t.date).toLocaleDateString()}</td>
                  <td>
                    <div style="font-weight: bold">${t.category}</div>
                    <div style="font-size: 10px; color: #64748b">${t.description || ''}</div>
                  </td>
                  <td>${t.account?.name || '-'}</td>
                  <td style="text-align: right" class="debit">${t.type === 'Expense' ? `₹ ${t.amount.toLocaleString()}` : '-'}</td>
                  <td style="text-align: right" class="credit">${t.type === 'Income' ? `₹ ${t.amount.toLocaleString()}` : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>This is a computer generated statement for ${selectedProgram?.name}.</p>
            <p>Powered by Krishna Accounting & IT Solutions</p>
          </div>

          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
          <div className="text-lg font-bold text-gray-900">₹ {totalOpeningBalance.toLocaleString()}</div>
        </div>
        <div className="card border-l-4 border-emerald-500 shadow-sm">
          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Credit (+)</div>
          <div className="text-lg font-bold text-emerald-600">₹ {totalCredit.toLocaleString()}</div>
        </div>
        <div className="card border-l-4 border-rose-500 shadow-sm">
          <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1">Total Debit (-)</div>
          <div className="text-lg font-bold text-rose-600">₹ {totalDebit.toLocaleString()}</div>
        </div>
        <div className={`card border-l-4 shadow-sm ${netBalance >= 0 ? 'border-emerald-500 bg-emerald-50/30' : 'border-rose-500 bg-rose-50/30'}`}>
          <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Net Balance</div>
          <div className={`text-xl font-bold ${netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {netBalance < 0 ? '-' : '+'} ₹ {Math.abs(netBalance).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Breakdown Bar */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 card py-4 flex justify-between items-center bg-emerald-600 text-white border-none shadow-lg transform hover:scale-[1.01] transition-transform">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase opacity-80">Cash on Hand</span>
            <span className="text-xl font-bold">₹ {cashBalance.toLocaleString()}</span>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Wallet size={20} />
          </div>
        </div>
        <div className="flex-1 card py-4 flex justify-between items-center bg-rose-600 text-white border-none shadow-lg transform hover:scale-[1.01] transition-transform">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase opacity-80">Bank Balance</span>
            <span className="text-xl font-bold">₹ {bankBalance.toLocaleString()}</span>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Receipt size={20} />
          </div>
        </div>
      </div>

      <div className="card border-none shadow-xl">
        <div className="flex justify-between items-center mb-6 px-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText size={20} className="text-gray-400" />
            Transaction History
          </h2>
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border">
            <Filter size={16} className="text-gray-400" />
            <select 
              className="outline-none text-sm font-bold bg-transparent"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">All Transactions</option>
              <option value="Income">Income Only</option>
              <option value="Expense">Expense Only</option>
            </select>
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
                    {new Date(txn.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
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
                      <span className="font-bold text-rose-600">₹ {txn.amount.toLocaleString()}</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="py-4 text-right">
                    {txn.type === 'Income' ? (
                      <span className="font-bold text-emerald-600">₹ {txn.amount.toLocaleString()}</span>
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
