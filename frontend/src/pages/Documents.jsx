import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { FileText, Upload, Trash2, Eye, Calendar, Link as LinkIcon, X, Download, Plus, Search } from 'lucide-react';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadType, setUploadType] = useState('file');
  const [viewingDoc, setViewingDoc] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '', description: '', amount: '', date: new Date().toISOString().split('T')[0],
    fileName: '', fileUrl: '', fileType: 'Image', externalLink: ''
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data } = await api.get('/documents');
      setDocuments(data);
    } catch (err) { console.error(err); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({
        ...formData,
        fileName: file.name,
        fileUrl: reader.result,
        fileType: file.type.includes('pdf') ? 'PDF' : 'Image'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = { ...formData };
    if (uploadType === 'link') {
      if (!formData.externalLink) return alert('Please enter a link');
      payload.fileType = 'Link';
      payload.fileUrl = '';
      payload.fileName = 'External Link';
    } else {
      if (!formData.fileUrl) return alert('Please select a file');
    }

    setLoading(true);
    try {
      await api.post('/documents', payload);
      setFormData({
        title: '', description: '', amount: '', date: new Date().toISOString().split('T')[0],
        fileName: '', fileUrl: '', fileType: 'Image', externalLink: ''
      });
      setShowForm(false);
      fetchDocuments();
      alert('Document saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bill document?')) return;
    try {
      await api.delete(`/documents/${id}`);
      fetchDocuments();
    } catch (err) { console.error(err); }
  };

  const handleDownload = (doc) => {
    if (doc.fileType === 'Link') {
      window.open(doc.externalLink, '_blank');
      return;
    }
    const link = document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.title || 'bill-record';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (doc) => {
    if (doc.fileType === 'Link') {
      window.open(doc.externalLink, '_blank');
    } else {
      setViewingDoc(doc);
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Upload size={28} style={{ color: 'var(--primary)' }} />
            Bill & Document Vault
          </h1>
          <p className="page-subtitle">Upload receipts, vendor bills, tax documents, & external drive links</p>
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

          <button className="btn-gradient" onClick={() => setShowForm(!showForm)}>
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancel Editor' : 'Upload New Document'}
          </button>
        </div>
      </div>

      {/* Upload Editor Glass Panel */}
      {showForm && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Document Upload Station</h2>
            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '12px' }}>
              <button 
                type="button" 
                onClick={() => setUploadType('file')}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: uploadType === 'file' ? 'var(--primary)' : 'transparent',
                  color: uploadType === 'file' ? '#FFF' : 'var(--text-muted)'
                }}
              >
                File Upload
              </button>
              <button 
                type="button" 
                onClick={() => setUploadType('link')}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: uploadType === 'link' ? 'var(--primary)' : 'transparent',
                  color: uploadType === 'link' ? '#FFF' : 'var(--text-muted)'
                }}
              >
                External URL
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Document Title</label>
                <input type="text" className="form-input" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="June Vendor Receipt" />
              </div>
              <div className="form-group">
                <label className="form-label">Amount (&#8377; Optional)</label>
                <input type="number" className="form-input" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="12500" />
              </div>
              <div className="form-group">
                <label className="form-label">Document Date</label>
                <input type="date" className="form-input" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
            </div>

            {uploadType === 'file' ? (
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Upload PDF or Image File</label>
                <div style={{
                  border: '2px dashed var(--glass-border-hover)',
                  borderRadius: '16px',
                  padding: '2rem',
                  textAlign: 'center',
                  background: 'rgba(37,99,235,0.04)',
                  cursor: 'pointer'
                }}>
                  <Upload size={32} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.9rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>
                    {formData.fileName ? formData.fileName : 'Click or drop file here to attach'}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supports JPG, PNG, PDF formats</span>
                  <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} style={{ display: 'none' }} id="file-uploader" />
                  <label htmlFor="file-uploader" style={{ display: 'block', position: 'absolute', inset: 0, cursor: 'pointer' }} />
                </div>
              </div>
            ) : (
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">External File Link (Google Drive / Dropbox URL)</label>
                <input type="url" className="form-input" required value={formData.externalLink} onChange={e => setFormData({...formData, externalLink: e.target.value})} placeholder="https://drive.google.com/..." />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Notes & Description</label>
              <input type="text" className="form-input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Additional details..." />
            </div>

            <button type="submit" className="btn-gradient" disabled={loading} style={{ width: '100%', padding: '0.85rem' }}>
              {loading ? 'Processing...' : 'Save Document to Vault'}
            </button>
          </form>
        </div>
      )}

      {/* Documents Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {filteredDocs.map(doc => (
          <div key={doc._id} className="glass-card glass-card-interactive">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span className="badge badge-primary">{doc.fileType || 'Document'}</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginTop: '0.5rem', color: 'var(--text-primary)' }}>
                  {doc.title}
                </h3>
              </div>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={20} />
              </div>
            </div>

            {doc.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{doc.description}</p>}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              <span>{new Date(doc.date).toLocaleDateString('en-GB')}</span>
              {doc.amount && <span style={{ fontWeight: '800', color: 'var(--primary)' }}>&#8377; {Number(doc.amount).toLocaleString()}</span>}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)' }}>
              <button className="btn-secondary-glass" onClick={() => handleView(doc)} style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem' }}>
                <Eye size={14} /> View
              </button>
              <button className="btn-secondary-glass" onClick={() => handleDownload(doc)} style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem' }}>
                <Download size={14} /> Save
              </button>
              <button className="btn-secondary-glass" onClick={() => handleDelete(doc._id)} style={{ padding: '0.45rem', fontSize: '0.8rem', color: 'var(--danger)' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {filteredDocs.length === 0 && (
          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No bill documents uploaded yet.
          </div>
        )}
      </div>

      {/* Document View Modal */}
      {viewingDoc && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            padding: '2rem',
            display: 'flex',
            alignItems: 'center',
            justify: 'center'
          }}
          onClick={() => setViewingDoc(null)}
        >
          <div 
            className="glass-panel" 
            style={{ width: '100%', maxWidth: '800px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>{viewingDoc.title}</h3>
              <button className="btn-icon" onClick={() => setViewingDoc(null)}><X size={18} /></button>
            </div>

            {viewingDoc.fileType === 'PDF' ? (
              <iframe src={viewingDoc.fileUrl} style={{ width: '100%', height: '600px', border: 'none', borderRadius: '12px' }} title="Doc View" />
            ) : (
              <img src={viewingDoc.fileUrl} alt={viewingDoc.title} style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain', borderRadius: '12px', display: 'block', margin: '0 auto' }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
