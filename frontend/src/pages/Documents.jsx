import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Upload, Trash2, Eye, Calendar, Link as LinkIcon,
  X, Download, Plus, Search, AlertCircle, CheckCircle2, File, Pencil
} from 'lucide-react';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploadType, setUploadType] = useState('file');
  const [viewingDoc, setViewingDoc] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);
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

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setFetching(true);
    try {
      const { data } = await api.get('/documents');
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch documents error:', err);
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
    setUploadType('file');
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
      externalLink: doc.externalLink || doc.fileUrl || ''
    });
    setUploadType(doc.fileType === 'Link' ? 'link' : 'file');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Limit file size to 10MB to avoid MongoDB document size limit
    if (file.size > 10 * 1024 * 1024) {
      showToast('File too large. Maximum size is 10MB. Use External URL for larger files.', 'danger');
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

    const payload = { ...formData };
    if (uploadType === 'link') {
      if (!formData.externalLink.trim()) {
        showToast('Please enter a valid URL', 'danger');
        return;
      }
      payload.fileType = 'Link';
      payload.fileUrl = formData.externalLink.trim();
      payload.fileName = 'External Link';
    } else {
      if (!formData.fileUrl) {
        showToast('Please select a file to upload', 'danger');
        return;
      }
    }

    if (!formData.title.trim()) {
      showToast('Please enter a document title', 'danger');
      return;
    }

    setLoading(true);
    try {
      if (editingDoc) {
        await api.put(`/documents/${editingDoc._id}`, payload);
        showToast('Document updated successfully!');
      } else {
        await api.post('/documents', payload);
        showToast('Document saved to vault successfully!');
      }
      resetForm();
      setShowForm(false);
      await fetchDocuments();
    } catch (err) {
      console.error('Save document error:', err);
      const msg = err.response?.data?.message || 'Failed to save document';
      showToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document from the vault?')) return;
    try {
      await api.delete(`/documents/${id}`);
      await fetchDocuments();
      showToast('Document deleted');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete document', 'danger');
    }
  };

  const handleDownload = (doc) => {
    if (doc.fileType === 'Link') {
      const url = doc.externalLink || doc.fileUrl;
      if (url) window.open(url, '_blank');
      return;
    }
    if (!doc.fileUrl) {
      showToast('No file data available to download', 'danger');
      return;
    }
    const link = document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.fileName || doc.title || 'bill-record';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (doc) => {
    if (doc.fileType === 'Link') {
      const url = doc.externalLink || doc.fileUrl;
      if (url) window.open(url, '_blank');
      else showToast('No URL available for this document', 'danger');
    } else {
      if (!doc.fileUrl) {
        showToast('No file data available to view', 'danger');
        return;
      }
      setViewingDoc(doc);
    }
  };

  const filteredDocs = documents.filter(doc =>
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative' }}>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: '5rem', right: '2rem', zIndex: 99999,
              background: toast.type === 'danger' ? '#EF4444' : '#10B981',
              color: '#FFF', padding: '0.75rem 1.25rem', borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)', fontSize: '0.85rem',
              fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            {toast.type === 'danger' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Upload size={28} style={{ color: 'var(--primary)' }} />
            Bill &amp; Document Vault
          </h1>
          <p className="page-subtitle">Upload receipts, vendor bills, tax documents &amp; external drive links</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <button className="btn-gradient" onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}>
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancel' : 'Upload New Document'}
          </button>
        </div>
      </div>

      {/* Upload Form Panel */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="glass-panel"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            style={{ padding: '2rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>
                {editingDoc ? '✏️ Edit Document' : 'Document Upload Station'}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '12px' }}>
                {['file', 'link'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setUploadType(type)}
                    style={{
                      padding: '0.4rem 0.85rem', borderRadius: '8px', border: 'none',
                      fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer',
                      background: uploadType === type ? 'var(--primary)' : 'transparent',
                      color: uploadType === type ? '#FFF' : 'var(--text-muted)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {type === 'file' ? 'File Upload' : 'External URL'}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Document Title *</label>
                  <input
                    type="text" className="form-input" required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="June Vendor Receipt"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹ Optional)</label>
                  <input
                    type="number" className="form-input" min="0" step="0.01"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="12500"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Document Date *</label>
                  <input
                    type="date" className="form-input" required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              {uploadType === 'file' ? (
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Upload PDF or Image File (max 10MB)</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed var(--glass-border-hover)', borderRadius: '16px',
                      padding: '2rem', textAlign: 'center', background: 'rgba(37,99,235,0.04)',
                      cursor: 'pointer', transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border-hover)'}
                  >
                    {formData.fileName ? (
                      <>
                        <File size={32} style={{ color: 'var(--success)', marginBottom: '0.5rem' }} />
                        <p style={{ fontSize: '0.9rem', fontWeight: '700', margin: '0 0 0.25rem 0', color: 'var(--success)' }}>
                          {formData.fileName}
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click to change file</span>
                      </>
                    ) : (
                      <>
                        <Upload size={32} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
                        <p style={{ fontSize: '0.9rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>
                          Click here to select a file
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supports JPG, PNG, PDF — max 4MB</span>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">External File Link (Google Drive / Dropbox URL)</label>
                  <input
                    type="url" className="form-input" required={uploadType === 'link'}
                    value={formData.externalLink}
                    onChange={e => setFormData({ ...formData, externalLink: e.target.value })}
                    placeholder="https://drive.google.com/..."
                  />
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Notes &amp; Description</label>
                <input
                  type="text" className="form-input"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details..."
                />
              </div>

              <button type="submit" className="btn-gradient" disabled={loading} style={{ width: '100%', padding: '0.85rem' }}>
                {loading ? 'Processing...' : editingDoc ? 'Update Document' : 'Save Document to Vault'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Documents Grid */}
      {fetching ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading documents...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {filteredDocs.map(doc => (
            <div key={doc._id} className="glass-card glass-card-interactive">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <span className="badge badge-primary">{doc.fileType || 'Document'}</span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginTop: '0.5rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                    {doc.title}
                  </h3>
                </div>
                <div style={{ width: '38px', height: '38px', flexShrink: 0, borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {doc.fileType === 'Link' ? <LinkIcon size={20} /> : <FileText size={20} />}
                </div>
              </div>

              {doc.description && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  {doc.description}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={12} />
                  {new Date(doc.date).toLocaleDateString('en-GB')}
                </span>
                {doc.amount > 0 && (
                  <span style={{ fontWeight: '800', color: 'var(--primary)' }}>
                    ₹ {Number(doc.amount).toLocaleString()}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)' }}>
                <button
                  className="btn-secondary-glass"
                  onClick={() => handleView(doc)}
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem' }}
                >
                  <Eye size={14} /> View
                </button>
                <button
                  className="btn-secondary-glass"
                  onClick={() => handleEdit(doc)}
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem', color: 'var(--primary)' }}
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  className="btn-secondary-glass"
                  onClick={() => handleDownload(doc)}
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem' }}
                >
                  <Download size={14} /> Save
                </button>
                <button
                  className="btn-secondary-glass"
                  onClick={() => handleDelete(doc._id)}
                  style={{ padding: '0.45rem', fontSize: '0.8rem', color: 'var(--danger)' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {filteredDocs.length === 0 && (
            <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Upload size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p style={{ fontWeight: '700' }}>No documents uploaded yet.</p>
              <p style={{ fontSize: '0.8rem' }}>Click "Upload New Document" to add bills and receipts.</p>
            </div>
          )}
        </div>
      )}

      {/* Document View Modal */}
      <AnimatePresence>
        {viewingDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewingDoc(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 99999,
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(16px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '2rem',
            }}
          >
            <motion.div
              className="glass-panel"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '860px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>{viewingDoc.title}</h3>
                  {viewingDoc.description && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{viewingDoc.description}</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button className="btn-secondary-glass" onClick={() => handleDownload(viewingDoc)} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                    <Download size={14} /> Download
                  </button>
                  <button className="btn-icon" onClick={() => setViewingDoc(null)}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              {viewingDoc.fileType === 'PDF' ? (
                <iframe
                  src={viewingDoc.fileUrl}
                  style={{ width: '100%', height: '65vh', border: 'none', borderRadius: '12px' }}
                  title="PDF Viewer"
                />
              ) : (
                <img
                  src={viewingDoc.fileUrl}
                  alt={viewingDoc.title}
                  style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '12px', display: 'block', margin: '0 auto' }}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Documents;
