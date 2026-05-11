import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Download, Printer, FileText, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState({ type: 'Income', amount: '', description: '' });

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
    const totalIncome = notes.filter(n => n.type === 'Income').reduce((sum, n) => sum + Number(n.amount), 0);
    const totalExpense = notes.filter(n => n.type === 'Expense').reduce((sum, n) => sum + Number(n.amount), 0);
    const balance = totalIncome - totalExpense;

    const printWindow = window.open('', '_blank');
    const tableRows = notes.map(n => `
      <tr>
        <td>${new Date(n.date).toLocaleString()}</td>
        <td>${n.description}</td>
        <td style="text-align: right; color: #10b981">${n.type === 'Income' ? '₹ ' + n.amount.toLocaleString() : '-'}</td>
        <td style="text-align: right; color: #ef4444">${n.type === 'Expense' ? '₹ ' + n.amount.toLocaleString() : '-'}</td>
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
    if (!formData.amount || !formData.description) return alert('Amount and description required');
    try {
      if (editingNote) {
        await api.put(`/notes/${editingNote._id}`, formData);
        setEditingNote(null);
      } else {
        await api.post('/notes', formData);
      }
      setFormData({ type: 'Income', amount: '', description: '' });
      fetchNotes();
    } catch (err) { console.error(err); }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setFormData({ type: note.type, amount: note.amount, description: note.description });
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

  const totalIncome = notes.filter(n => n.type === 'Income').reduce((sum, n) => sum + Number(n.amount), 0);
  const totalExpense = notes.filter(n => n.type === 'Expense').reduce((sum, n) => sum + Number(n.amount), 0);
  const balance = totalIncome - totalExpense;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="text-primary" /> Quick Notes
        </h1>
        <button onClick={handleDownload} className="btn btn-primary flex items-center gap-2">
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        <div className="card" style={{ position: 'sticky', top: '1rem', border: editingNote ? '2px solid var(--primary)' : 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
          <h2 className="text-xl font-bold mb-4">{editingNote ? 'Edit Note' : 'Add New Note'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Note Type</label>
              <select className="form-control" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="Income">Income (+)</option>
                <option value="Expense">Expense (-)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (&#8377;)</label>
              <input type="number" className="form-control" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Description / Remarks</label>
              <textarea className="form-control" rows="4" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="What is this note about?"></textarea>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '1rem', background: formData.type === 'Income' ? 'var(--secondary)' : 'var(--danger)' }}>
                {editingNote ? 'Update' : 'Save'} {formData.type}
              </button>
              {editingNote && (
                <button type="button" onClick={() => { setEditingNote(null); setFormData({ type: 'Income', amount: '', description: '' }); }} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="card shadow-lg">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
             Recent Notes Ledger
          </h2>
          <div className="table-container border-none shadow-none">
            <table className="data-table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-4">Date/Time</th>
                  <th className="py-4">Description</th>
                  <th className="py-4 text-right">Income</th>
                  <th className="py-4 text-right">Expense</th>
                  <th className="py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {notes.map(note => (
                  <tr key={note._id} className="hover:bg-gray-50/50 transition-all">
                    <td className="py-4 text-xs text-gray-500">
                      {new Date(note.date).toLocaleString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                    </td>
                    <td className="py-4">
                      <div className="font-bold text-gray-900">{note.description}</div>
                      {note.editCount > 0 && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-bold rounded border border-amber-100 uppercase tracking-tighter">
                          Edited {note.editCount}x
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right font-bold text-secondary">
                      {note.type === 'Income' ? `+ &#8377; ${note.amount.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-4 text-right font-bold text-danger">
                      {note.type === 'Expense' ? `- &#8377; ${note.amount.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-4">
                      <div className="flex justify-center gap-3">
                        <button onClick={() => handleEdit(note)} className="text-primary hover:text-primary-hover font-bold text-xs uppercase tracking-wider">Edit</button>
                        <button onClick={() => handleDelete(note._id)} className="text-danger hover:text-red-700 font-bold text-xs uppercase tracking-wider">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {notes.length === 0 && <tr><td colSpan="5" className="py-20 text-center text-gray-400">No notes found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notes;
