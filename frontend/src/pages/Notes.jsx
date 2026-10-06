import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { downloadElementAsPdf } from '../utils/downloadHelper';
import { Download, Printer, FileText, TrendingUp, TrendingDown, Wallet, Plus, Edit2, Trash2, X } from 'lucide-react';

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

  const handleDownload = async () => {
    const totalIncome = notes.reduce((sum, n) => sum + Number(n.incomeAmount || 0), 0);
    const totalExpense = notes.reduce((sum, n) => sum + Number(n.expenseAmount || 0), 0);
    const balance = totalIncome - totalExpense;

    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.background = '#ffffff';
    container.style.color = '#0f172a';
    container.style.fontFamily = 'system-ui, sans-serif';

    const tableRows = notes.map(n => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px; font-size: 12px; color: #64748b;">${new Date(n.date).toLocaleString()}</td>
        <td style="padding: 10px; font-size: 13px; font-weight: 600; color: #0f172a;">${n.description}</td>
        <td style="padding: 10px; text-align: right; color: #16a34a; font-weight: bold; font-size: 13px;">${n.incomeAmount ? '₹ ' + n.incomeAmount.toLocaleString() : '-'}</td>
        <td style="padding: 10px; text-align: right; color: #dc2626; font-weight: bold; font-size: 13px;">${n.expenseAmount ? '₹ ' + n.expenseAmount.toLocaleString() : '-'}</td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; border-bottom: 3px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px;">
        <div><h1 style="margin:0; color:#2563eb; font-size: 20px;">Quick Notes Statement</h1><p style="margin:5px 0 0 0; color:#64748b; font-size: 12px;">ERP Note Register</p></div>
        <div style="text-align:right"><h2 style="margin:0; font-size: 16px;">STATEMENT</h2><p style="margin:5px 0 0 0; color:#64748b; font-size: 11px;">Generated: ${new Date().toLocaleDateString('en-GB')}</p></div>
      </div>
      <div style="display: flex; gap: 15px; margin-bottom: 25px;">
        <div style="flex: 1; padding: 12px; border: 1px solid #bbf7d0; background: #f0fdf4; border-radius: 10px; color:#16a34a; font-weight: bold;">Income: ₹${totalIncome.toLocaleString()}</div>
        <div style="flex: 1; padding: 12px; border: 1px solid #fecaca; background: #fef2f2; border-radius: 10px; color:#dc2626; font-weight: bold;">Expense: ₹${totalExpense.toLocaleString()}</div>
        <div style="flex: 1; padding: 12px; border: 1px solid #bfdbfe; background: #eff6ff; border-radius: 10px; color:#2563eb; font-weight: bold;">Net Balance: ₹${balance.toLocaleString()}</div>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f8fafc; border-bottom: 2px solid #2563eb;">
            <th style="padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase;">Date/Time</th>
            <th style="padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase;">Description</th>
            <th style="padding: 10px; text-align: right; font-size: 11px; text-transform: uppercase;">Income</th>
            <th style="padding: 10px; text-align: right; font-size: 11px; text-transform: uppercase;">Expense</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    `;

    document.body.appendChild(container);
    await downloadElementAsPdf(container, `Notes-Statement-${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.removeChild(container);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const income = parseFloat(formData.incomeAmount) || 0;
    const expense = parseFloat(formData.expenseAmount) || 0;
    
    if (income === 0 && expense === 0) return alert('At least one amount (Income or Expense) is required');
    if (!formData.description.trim()) return alert('Description is required');
    
    const payload = {
      ...formData,
      incomeAmount: income,
      expenseAmount: expense,
      description: formData.description.trim()
    };

    try {
      if (editingNote) {
        await api.put(`/notes/${editingNote._id}`, payload);
        setEditingNote(null);
      } else {
        await api.post('/notes', payload);
      }
      setFormData({ incomeAmount: '', expenseAmount: '', description: '' });
      fetchNotes();
    } catch (err) { 
      console.error(err); 
      alert('Failed to save entry');
    }
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FileText size={28} style={{ color: 'var(--primary)' }} />
            Quick Notes & Petty Cash Log
          </h1>
          <p className="page-subtitle">Instant memorandum notes and daily cash entries</p>
        </div>

        <button className="btn-gradient" onClick={handleDownload}>
          <Printer size={18} /> Export Notes PDF
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <span className="form-label">Total Note Income</span>
          <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--success)', marginTop: '0.25rem' }}>
            &#8377; {totalIncome.toLocaleString()}
          </h3>
        </div>
        <div className="glass-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <span className="form-label">Total Note Expense</span>
          <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--danger)', marginTop: '0.25rem' }}>
            &#8377; {totalExpense.toLocaleString()}
          </h3>
        </div>
        <div className="glass-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <span className="form-label">Net Balance Difference</span>
          <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: balance >= 0 ? 'var(--primary)' : 'var(--danger)', marginTop: '0.25rem' }}>
            &#8377; {balance.toLocaleString()}
          </h3>
        </div>
      </div>

      {/* Split Form & Records Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Form Card */}
        <div className="glass-panel" style={{ padding: '1.75rem', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.25rem' }}>
            {editingNote ? 'Edit Note Entry' : 'Add Quick Memorandum Entry'}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--success)' }}>Income (&#8377;)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={formData.incomeAmount} 
                  onChange={e => setFormData({...formData, incomeAmount: e.target.value})} 
                  placeholder="0" 
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--danger)' }}>Expense (&#8377;)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={formData.expenseAmount} 
                  onChange={e => setFormData({...formData, expenseAmount: e.target.value})} 
                  placeholder="0" 
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Description / Remarks</label>
              <textarea 
                className="form-textarea" 
                rows="4" 
                required 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                placeholder="Details of cash transaction or note..."
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn-gradient" style={{ flex: 1, padding: '0.8rem' }}>
                {editingNote ? 'Update Note' : 'Save Quick Note'}
              </button>
              {editingNote && (
                <button 
                  type="button" 
                  onClick={() => { setEditingNote(null); setFormData({ incomeAmount: '', expenseAmount: '', description: '' }); }} 
                  className="btn-secondary-glass"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Table Card */}
        <div className="table-container">
          <table className="table-glass">
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Income</th>
                <th style={{ textAlign: 'right' }}>Expense</th>
                <th style={{ textAlign: 'right' }}>Net</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {notes.map(note => {
                const net = (note.incomeAmount || 0) - (note.expenseAmount || 0);
                return (
                  <tr key={note._id}>
                    <td style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      {new Date(note.date).toLocaleString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                    </td>
                    <td>
                      <div style={{ fontWeight: '700' }}>{note.description}</div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--success)' }}>
                      {note.incomeAmount > 0 ? `₹${note.incomeAmount.toLocaleString()}` : '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--danger)' }}>
                      {note.expenseAmount > 0 ? `₹${note.expenseAmount.toLocaleString()}` : '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: net >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
                      &#8377; {net.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                        <button className="btn-icon" onClick={() => handleEdit(note)} title="Edit Note"><Edit2 size={14} /></button>
                        <button className="btn-icon" onClick={() => handleDelete(note._id)} title="Delete Note" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {notes.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No quick notes recorded yet.
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

export default Notes;
