import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Download, Printer, FileText, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState({ incomeAmount: '', expenseAmount: '', description: '' });

  useEffect(() => {
    fetchNotes();
  }, []);

  const [editingNote, setEditingNote] = useState(null);

  const fetchNotes = async () => {
    try {
      const { data } = await api.get('/notes');
      setNotes(data);
    } catch (err) { console.error(err); }
  };

  const handleDownload = () => {
    const totalIncome = notes.reduce((sum, n) => sum + Number(n.incomeAmount || 0), 0);
    const totalExpense = notes.reduce((sum, n) => sum + Number(n.expenseAmount || 0), 0);
    const balance = totalIncome - totalExpense;

    const printWindow = window.open('', '_blank');
    const tableRows = notes.map(n => `
      <tr>
        <td>${new Date(n.date).toLocaleString()}</td>
        <td>${n.description}</td>
        <td style="text-align: right; color: #10b981">${n.incomeAmount ? '₹ ' + n.incomeAmount.toLocaleString() : '-'}</td>
        <td style="text-align: right; color: #ef4444">${n.expenseAmount ? '₹ ' + n.expenseAmount.toLocaleString() : '-'}</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <title>Notes Statement</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
            .summary { display: flex; gap: 10px; margin: 20px 0; }
            .card { flex: 1; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f8fafc; border-bottom: 2px solid #4f46e5; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; }
            td { border-bottom: 1px solid #eee; padding: 10px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div><h1>Quick Notes Statement</h1></div>
            <div style="text-align:right"><h2>Statement</h2><p>Generated on: ${new Date().toLocaleDateString()}</p></div>
          </div>
          <div class="summary">
            <div class="card">Income: ₹${totalIncome.toLocaleString()}</div>
            <div class="card">Expense: ₹${totalExpense.toLocaleString()}</div>
            <div class="card" style="background:#eef2ff"><b>Net Balance: ₹${balance.toLocaleString()}</b></div>
          </div>
          <table>
            <thead><tr><th>Date/Time</th><th>Description</th><th style="text-align:right">Income</th><th style="text-align:right">Expense</th></tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.incomeAmount && !formData.expenseAmount) return alert('At least one amount is required');
    if (!formData.description) return alert('Description required');
    
    try {
      if (editingNote) {
        await api.put(`/notes/${editingNote._id}`, formData);
        setEditingNote(null);
      } else {
        await api.post('/notes', formData);
      }
      setFormData({ incomeAmount: '', expenseAmount: '', description: '' });
      fetchNotes();
    } catch (err) { console.error(err); }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setFormData({ 
      incomeAmount: note.incomeAmount || '', 
      expenseAmount: note.expenseAmount || '', 
      description: note.description 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this note?')) {
      try {
        await api.delete(`/notes/${id}`);
        fetchNotes();
      } catch (err) { console.error(err); }
    }
  };

  const totalIncome = notes.reduce((sum, n) => sum + Number(n.incomeAmount || 0), 0);
  const totalExpense = notes.reduce((sum, n) => sum + Number(n.expenseAmount || 0), 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="text-primary" /> Quick Notes
        </h1>
        <button onClick={handleDownload} className="btn btn-primary flex items-center gap-2 w-full md:w-auto">
          <Printer size={18} /> Export Notes PDF
        </button>
      </div>

      <div className="dashboard-grid mb-6">
        <div className="card" style={{ borderLeft: '4px solid var(--secondary)', background: 'linear-gradient(135deg, #ecfdf5 0%, #fff 100%)' }}>
          <div className="flex items-center gap-2 text-secondary font-bold uppercase text-[10px] tracking-wider mb-1">
            <TrendingUp size={14} /> Total Income
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--secondary)' }}>&#8377; {totalIncome.toLocaleString()}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--danger)', background: 'linear-gradient(135deg, #fef2f2 0%, #fff 100%)' }}>
          <div className="flex items-center gap-2 text-danger font-bold uppercase text-[10px] tracking-wider mb-1">
            <TrendingDown size={14} /> Total Expense
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--danger)' }}>&#8377; {totalExpense.toLocaleString()}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)', background: 'linear-gradient(135deg, #eef2ff 0%, #fff 100%)' }}>
          <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-wider mb-1">
            <Wallet size={14} /> Net Balance
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>&#8377; {balance.toLocaleString()}</div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="card w-full lg:w-[400px] lg:sticky lg:top-[100px]" style={{ boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
          <h2 className="text-xl font-bold mb-6">{editingNote ? 'Edit Note' : 'Add New Entry'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="form-group mb-0">
                <label className="form-label text-secondary">Income (&#8377;)</label>
                <input 
                  type="number" 
                  className="form-control border-secondary/20 focus:border-secondary" 
                  value={formData.incomeAmount} 
                  onChange={e => setFormData({...formData, incomeAmount: e.target.value})} 
                  placeholder="0" 
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label text-danger">Expense (&#8377;)</label>
                <input 
                  type="number" 
                  className="form-control border-danger/20 focus:border-danger" 
                  value={formData.expenseAmount} 
                  onChange={e => setFormData({...formData, expenseAmount: e.target.value})} 
                  placeholder="0" 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Description / Remarks</label>
              <textarea 
                className="form-control" 
                rows="4" 
                required 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                placeholder="Details of this entry..."
              ></textarea>
            </div>
            
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary w-full py-4 text-lg">
                {editingNote ? 'Update Entry' : 'Save Entry'}
              </button>
              {editingNote && (
                <button 
                  type="button" 
                  onClick={() => { setEditingNote(null); setFormData({ incomeAmount: '', expenseAmount: '', description: '' }); }} 
                  className="btn btn-secondary px-6"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="card flex-1 shadow-lg w-full">
          <h2 className="text-xl font-bold mb-6">Recent Records</h2>
          <div className="table-container border-none shadow-none">
            <table className="data-table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-4">Date/Time</th>
                  <th className="py-4">Description</th>
                  <th className="py-4 text-right">Income</th>
                  <th className="py-4 text-right">Expense</th>
                  <th className="py-4 text-right">Net</th>
                  <th className="py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {notes.map(note => {
                  const net = (note.incomeAmount || 0) - (note.expenseAmount || 0);
                  return (
                    <tr key={note._id} className="hover:bg-gray-50/50 transition-all">
                      <td className="py-4 text-xs text-gray-500">
                        {new Date(note.date).toLocaleString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                      </td>
                      <td className="py-4">
                        <div className="font-bold text-gray-900 leading-tight">{note.description}</div>
                        {note.editCount > 0 && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-bold rounded border border-amber-100 uppercase tracking-tighter">
                            Edited {note.editCount}x
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-right font-bold text-secondary">
                        {note.incomeAmount ? `&#8377; ${note.incomeAmount.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-4 text-right font-bold text-danger">
                        {note.expenseAmount ? `&#8377; ${note.expenseAmount.toLocaleString()}` : '-'}
                      </td>
                      <td className={`py-4 text-right font-bold ${net >= 0 ? 'text-primary' : 'text-danger'}`}>
                        &#8377; {net.toLocaleString()}
                      </td>
                      <td className="py-4">
                        <div className="flex justify-center gap-3">
                          <button onClick={() => handleEdit(note)} className="text-primary hover:text-primary-hover font-bold text-xs uppercase">Edit</button>
                          <button onClick={() => handleDelete(note._id)} className="text-danger hover:text-red-700 font-bold text-xs uppercase">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {notes.length === 0 && <tr><td colSpan="6" className="py-20 text-center text-gray-400 font-medium">No records found.</td></tr>}
              </tbody>
              {notes.length > 0 && (
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan="2" className="py-4 font-bold text-gray-900 text-right uppercase tracking-wider text-xs">Total Summary</td>
                    <td className="py-4 text-right font-black text-secondary">&#8377; {totalIncome.toLocaleString()}</td>
                    <td className="py-4 text-right font-black text-danger">&#8377; {totalExpense.toLocaleString()}</td>
                    <td className={`py-4 text-right font-black ${balance >= 0 ? 'text-primary' : 'text-danger'}`}>
                      &#8377; {balance.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notes;
