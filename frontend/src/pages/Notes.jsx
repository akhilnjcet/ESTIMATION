import React, { useState, useEffect } from 'react';
import api from '../utils/api';

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
      <h1 className="text-2xl font-bold mb-6">Quick Notes (Simple Ledger)</h1>

      <div className="dashboard-grid mb-6">
        <div className="card" style={{ borderLeft: '4px solid var(--secondary)', background: '#ecfdf5' }}>
          <div style={{ color: 'var(--text-secondary)' }}>Total Income</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--secondary)' }}>₹ {totalIncome.toLocaleString()}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--danger)', background: '#fef2f2' }}>
          <div style={{ color: 'var(--text-secondary)' }}>Total Expense</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger)' }}>₹ {totalExpense.toLocaleString()}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)', background: '#eef2ff' }}>
          <div style={{ color: 'var(--text-secondary)' }}>Net Balance</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>₹ {balance.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        <div className="card" style={{ position: 'sticky', top: '1rem', border: editingNote ? '2px solid var(--primary)' : 'none' }}>
          <h2 className="text-xl font-bold mb-4">{editingNote ? 'Edit Note' : 'Add Note'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-control" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="Income">Income (Money In)</option>
                <option value="Expense">Expense (Money Out)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input type="number" className="form-control" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows="3" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="What was this for?"></textarea>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '1rem', background: formData.type === 'Income' ? 'var(--secondary)' : 'var(--danger)' }}>
                {editingNote ? 'Update' : 'Save'} {formData.type} Note
              </button>
              {editingNote && (
                <button type="button" onClick={() => { setEditingNote(null); setFormData({ type: 'Income', amount: '', description: '' }); }} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Recent Notes</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th style={{textAlign:'right'}}>Income</th>
                  <th style={{textAlign:'right'}}>Expense</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {notes.map(note => (
                  <tr key={note._id}>
                    <td style={{fontSize:'0.85rem', color:'gray'}}>{new Date(note.date).toLocaleString()}</td>
                    <td>
                      <strong>{note.description}</strong>
                      {note.editCount > 3 && (
                        <span style={{ marginLeft: '8px', padding: '2px 6px', background: '#fee2e2', color: '#ef4444', fontSize: '10px', borderRadius: '4px', fontWeight: 'bold', border: '1px solid #fecaca' }}>
                          EDITED
                        </span>
                      )}
                    </td>
                    <td style={{textAlign:'right', color:'var(--secondary)', fontWeight:'bold'}}>
                      {note.type === 'Income' ? `+₹ ${note.amount.toLocaleString()}` : '-'}
                    </td>
                    <td style={{textAlign:'right', color:'var(--danger)', fontWeight:'bold'}}>
                      {note.type === 'Expense' ? `-₹ ${note.amount.toLocaleString()}` : '-'}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="admin-only" onClick={() => handleEdit(note)} style={{color:'var(--primary)', fontSize:'0.8rem'}}>Edit</button>
                        <button className="admin-only" onClick={() => handleDelete(note._id)} style={{color:'red', fontSize:'0.8rem'}}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {notes.length === 0 && <tr><td colSpan="5" style={{textAlign:'center'}}>No notes added yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notes;
