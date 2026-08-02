import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Upload, Trash2, Eye, Calendar, Link as LinkIcon,
  X, Download, Plus, Search, AlertCircle, CheckCircle2, File,
  Pencil, LayoutGrid, List, ExternalLink
} from 'lucide-react';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '', description: '', amount: '',
    date: new Date().toISOString().split('T')[0],
    fileName: '', fileUrl: '', fileType: 'Image', externalLink: ''
  });

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => { fetchDocuments(); }, []);

  const fetchDocuments = async () => {
    setFetching(true);
    try {
      const { data } = await api.get('/documents');
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('Failed to load documents', 'danger');
    } finally {
      setFetching(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '', description: '', amount: '',
      date: new Date().toISOString().split('T')[0],
      fileName: '', fileUrl: '', fileType: 'Image', externalLink: ''
    });
    setEditingDoc(null);
  };

  const handleEdit = (doc) => {
    setEditingDoc(doc);
    setFormData({
      title: doc.title || '',
      description: doc.description || '',
      amount: doc.amount || '',
      date: doc.date ? doc.date.split('T')[0] : new Date().toISOString().split('T')[0],
      fileName: doc.fileName || '',
      fileUrl: doc.fileUrl || '',
      fileType: doc.fileType || 'Image',
      externalLink: doc.externalLink || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast('File too large. Maximum size is 10MB.', 'danger');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        fileName: file.name,
        fileUrl: reader.result,
        fileType: file.type.includes('pdf') ? 'PDF' : 'Image'
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { showToast('Please enter a document title', 'danger'); return; }
    const fHasFile = !!formData.fileUrl;
    const fHasLink = !!formData.externalLink.trim();
    if (!fHasFile && !fHasLink) { showToast('Please upload a file or add an external link', 'danger'); return; }
    let fileType = formData.fileType;
    if (fHasFile && fHasLink) fileType = 'Both';
    else if (fHasLink && !fHasFile) fileType = 'Link';
    const payload = { ...formData, fileType, externalLink: formData.externalLink.trim() };
    setLoading(true);
    try {
      if (editingDoc) {
        await api.put(`/documents/${editingDoc._id}`, payload);
        showToast('Document updated successfully!');
      } else {
        await api.post('/documents', payload);
        showToast('Document saved to vault successfully!');
      }
      resetForm(); setShowForm(false); await fetchDocuments();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save document', 'danger');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try { await api.delete(`/documents/${id}`); await fetchDocuments(); showToast('Document deleted'); }
    catch (err) { showToast('Failed to delete document', 'danger'); }
  };

  const hasFile = (doc) => doc.fileUrl && doc.fileType !== 'Link';
  const hasLink = (doc) => !!(doc.externalLink || doc.fileType === 'Link');

  const handleViewFile = (doc) => {
    if (!hasFile(doc)) { showToast('No file available', 'danger'); return; }
    setViewingDoc(doc);
  };
  const handleViewLink = (doc) => {
    const url = doc.externalLink || (doc.fileType === 'Link' ? doc.fileUrl : null);
    if (url) window.open(url, '_blank');
    else showToast('No link available', 'danger');
  };
  const handleDownload = (doc) => {
    if (!doc.fileUrl || doc.fileType === 'Link') return;
    const a = document.createElement('a');
    a.href = doc.fileUrl; a.download = doc.fileName || doc.title || 'document';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const getBadge = (doc) => {
    if (doc.fileType === 'Both') return { label: 'File + Link', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' };
    if (doc.fileType === 'Link') return { label: 'Link', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' };
    if (doc.fileType === 'PDF') return { label: 'PDF', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' };
    return { label: 'Image', color: '#10B981', bg: 'rgba(16,185,129,0.15)' };
  };

  const filteredDocs = documents.filter(doc =>
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ── Reusable action buttons ── */
  const DocActions = ({ doc, compact = false }) => {
    const p = compact ? '0.3rem 0.5rem' : '0.42rem 0.62rem';
    const fs = compact ? '0.73rem' : '0.78rem';
    return (
      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
        {hasFile(doc) && (
          <button className="btn-secondary-glass" onClick={() => handleViewFile(doc)}
            style={{ padding: p, fontSize: fs, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Eye size={12} /> View File
          </button>
        )}
        {hasLink(doc) && (
          <button className="btn-secondary-glass" onClick={() => handleViewLink(doc)}
            style={{ padding: p, fontSize: fs, display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#3B82F6' }}>
            <ExternalLink size={12} /> View Link
          </button>
        )}
        {hasFile(doc) && (
          <button className="btn-secondary-glass" onClick={() => handleDownload(doc)}
            style={{ padding: p, fontSize: fs, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Download size={12} /> Save
          </button>
        )}
        <button className="btn-secondary-glass" onClick={() => handleEdit(doc)}
          style={{ padding: p, fontSize: fs, display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary)' }}>
          <Pencil size={12} /> Edit
        </button>
        <button className="btn-secondary-glass" onClick={() => handleDelete(doc._id)}
          style={{ padding: compact ? '0.3rem 0.45rem' : '0.42rem 0.55rem', color: 'var(--danger)' }}>
          <Trash2 size={12} />
        </button>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative' }}>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ position: 'fixed', top: '5rem', right: '2rem', zIndex: 99999, background: toast.type === 'danger' ? '#EF4444' : '#10B981', color: '#FFF', padding: '0.75rem 1.25rem', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {toast.type === 'danger' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title"><Upload size={28} style={{ color: 'var(--primary)' }} /> Bill &amp; Document Vault</h1>
          <p className="page-subtitle">Upload receipts, vendor bills, tax documents &amp; external drive links</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input type="text" className="form-input" placeholder="Search documents..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ paddingLeft: '2.5rem', width: '220px' }} />
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '0.2rem', border: '1px solid var(--glass-border)' }}>
            {[{ id: 'grid', Icon: LayoutGrid }, { id: 'list', Icon: List }].map(({ id, Icon }) => (
              <button key={id} onClick={() => setViewMode(id)}
                style={{ padding: '0.38rem 0.6rem', border: 'none', borderRadius: '7px', cursor: 'pointer', background: viewMode === id ? 'var(--primary)' : 'transparent', color: viewMode === id ? '#FFF' : 'var(--text-muted)', transition: 'all 0.2s', display: 'flex', alignItems: 'center' }}>
                <Icon size={15} />
              </button>
            ))}
          </div>
          <button className="btn-gradient" onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}>
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancel' : 'Upload New Document'}
          </button>
        </div>
      </div>

      {/* Upload Form — file + link side by side, both optional */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="glass-panel" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem' }}>
              {editingDoc ? '✏️ Edit Document' : '📁 Upload New Document'}
            </h2>
            <form onSubmit={handleSubmit}>
              {/* Meta row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Document Title *</label>
                  <input type="text" className="form-input" required value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="June Vendor Receipt" />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹ Optional)</label>
                  <input type="number" className="form-input" min="0" step="0.01" value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="12500" />
                </div>
                <div className="form-group">
                  <label className="form-label">Document Date *</label>
                  <input type="date" className="form-input" required value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })} />
                </div>
              </div>

              {/* File + Link side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: formData.fileUrl && formData.externalLink ? '0.75rem' : '1.5rem' }}>
                {/* File upload box */}
                <div className="form-group">
                  <label className="form-label">
                    📄 File Upload &nbsp;<span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '500' }}>PDF / Image — max 10MB (Optional)</span>
                  </label>
                  <div onClick={() => fileInputRef.current?.click()}
                    style={{ border: `2px dashed ${formData.fileUrl ? 'var(--success)' : 'var(--glass-border-hover)'}`, borderRadius: '14px', padding: '1.5rem', textAlign: 'center', background: formData.fileUrl ? 'rgba(16,185,129,0.04)' : 'rgba(37,99,235,0.03)', cursor: 'pointer', transition: 'all 0.2s', minHeight: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = formData.fileUrl ? 'var(--success)' : 'var(--glass-border-hover)'}>
                    {formData.fileUrl ? (
                      <>
                        <File size={28} style={{ color: 'var(--success)' }} />
                        <p style={{ fontSize: '0.82rem', fontWeight: '700', margin: 0, color: 'var(--success)' }}>{formData.fileName}</p>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Click to change</span>
                      </>
                    ) : (
                      <>
                        <Upload size={28} style={{ color: 'var(--primary)' }} />
                        <p style={{ fontSize: '0.82rem', fontWeight: '700', margin: 0 }}>Click to select file</p>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>JPG, PNG, PDF</span>
                      </>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </div>
                  {formData.fileUrl && (
                    <button type="button" onClick={() => setFormData(p => ({ ...p, fileUrl: '', fileName: '' }))}
                      style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                      Remove file
                    </button>
                  )}
                </div>

                {/* External link box */}
                <div className="form-group">
                  <label className="form-label">
                    🔗 External Link &nbsp;<span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '500' }}>Google Drive / Dropbox (Optional)</span>
                  </label>
                  <div style={{ border: `2px dashed ${formData.externalLink ? '#3B82F6' : 'var(--glass-border-hover)'}`, borderRadius: '14px', padding: '1.25rem', background: formData.externalLink ? 'rgba(59,130,246,0.04)' : 'transparent', transition: 'all 0.2s', minHeight: '110px', display: 'flex', flexDirection: 'column', gap: '0.65rem', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <LinkIcon size={16} style={{ color: '#3B82F6', flexShrink: 0 }} />
                      <input type="url" className="form-input" value={formData.externalLink}
                        onChange={e => setFormData({ ...formData, externalLink: e.target.value })}
                        placeholder="https://drive.google.com/..."
                        style={{ flex: 1, fontSize: '0.82rem', padding: '0.5rem 0.75rem' }} />
                    </div>
                    {formData.externalLink && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: '#3B82F6', fontWeight: '700' }}>✅ Link ready</span>
                        <button type="button" onClick={() => setFormData(p => ({ ...p, externalLink: '' }))}
                          style={{ fontSize: '0.7rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Remove</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Both banner */}
              {formData.fileUrl && formData.externalLink && (
                <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', fontSize: '0.82rem', fontWeight: '700', color: '#8B5CF6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ✨ Both a file and a link will be saved — the card will show separate <strong>View File</strong> and <strong>View Link</strong> buttons.
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Notes &amp; Description</label>
                <input type="text" className="form-input" value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Additional details..." />
              </div>

              <button type="submit" className="btn-gradient" disabled={loading} style={{ width: '100%', padding: '0.85rem' }}>
                {loading ? 'Processing...' : editingDoc ? 'Update Document' : 'Save Document to Vault'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Documents display */}
      {fetching ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading documents...</div>
      ) : filteredDocs.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <Upload size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ fontWeight: '700' }}>No documents uploaded yet.</p>
          <p style={{ fontSize: '0.8rem' }}>Click "Upload New Document" to get started.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.5rem' }}>
          {filteredDocs.map(doc => {
            const badge = getBadge(doc);
            return (
              <div key={doc._id} className="glass-card glass-card-interactive">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: '800', padding: '0.22rem 0.6rem', borderRadius: '20px', background: badge.bg, color: badge.color }}>
                    {badge.label}
                  </span>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {doc.fileType === 'Link' ? <LinkIcon size={17} /> : <FileText size={17} />}
                  </div>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '0.35rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>{doc.title}</h3>
                {doc.description && <p style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', marginBottom: '0.7rem', lineHeight: 1.4 }}>{doc.description}</p>}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.77rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={12} /> {new Date(doc.date).toLocaleDateString('en-GB')}
                  </span>
                  {doc.amount > 0 && <span style={{ fontWeight: '800', color: 'var(--primary)' }}>₹ {Number(doc.amount).toLocaleString()}</span>}
                </div>
                <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)' }}>
                  <DocActions doc={doc} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List */
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid var(--glass-border)' }}>
                {['Type', 'Title', 'Date', 'Amount', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc, i) => {
                const badge = getBadge(doc);
                return (
                  <tr key={doc._id}
                    style={{ borderBottom: i < filteredDocs.length - 1 ? '1px solid var(--glass-border)' : 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '20px', background: badge.bg, color: badge.color, whiteSpace: 'nowrap' }}>{badge.label}</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text-primary)' }}>{doc.title}</div>
                      {doc.description && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{doc.description}</div>}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(doc.date).toLocaleDateString('en-GB')}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: 'var(--primary)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      {doc.amount > 0 ? `₹ ${Number(doc.amount).toLocaleString()}` : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}><DocActions doc={doc} compact /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* File viewer modal */}
      <AnimatePresence>
        {viewingDoc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setViewingDoc(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <motion.div className="glass-panel"
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '880px', padding: '1.5rem', maxHeight: '92vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>{viewingDoc.title}</h3>
                  {viewingDoc.description && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{viewingDoc.description}</p>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button className="btn-secondary-glass" onClick={() => handleDownload(viewingDoc)} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                    <Download size={14} /> Download
                  </button>
                  {hasLink(viewingDoc) && (
                    <button className="btn-secondary-glass" onClick={() => handleViewLink(viewingDoc)} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', color: '#3B82F6' }}>
                      <ExternalLink size={14} /> Open Link
                    </button>
                  )}
                  <button className="btn-icon" onClick={() => setViewingDoc(null)}><X size={18} /></button>
                </div>
              </div>
              {viewingDoc.fileType === 'PDF' || (viewingDoc.fileUrl && viewingDoc.fileUrl.startsWith('data:application/pdf')) ? (
                <iframe src={viewingDoc.fileUrl} style={{ width: '100%', height: '68vh', border: 'none', borderRadius: '12px' }} title="PDF Viewer" />
              ) : (
                <img src={viewingDoc.fileUrl} alt={viewingDoc.title} style={{ maxWidth: '100%', maxHeight: '68vh', objectFit: 'contain', borderRadius: '12px', display: 'block', margin: '0 auto' }} />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Documents;
