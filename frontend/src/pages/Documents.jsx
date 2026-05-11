import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { FileText, Upload, Trash2, Eye, Calendar, DollarSign, Link as LinkIcon, X } from 'lucide-react';

const Invoices = () => {
  const [documents, setDocuments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadType, setUploadType] = useState('file'); // 'file' or 'link'
  const [viewingDoc, setViewingDoc] = useState(null);
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
      alert('Invoice saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await api.delete(`/documents/${id}`);
      fetchDocuments();
    } catch (err) { console.error(err); }
  };

  const handleView = (doc) => {
    if (doc.fileType === 'Link') {
      window.open(doc.externalLink, '_blank');
    } else {
      setViewingDoc(doc);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">External Invoices & Bills</h1>
          <p className="text-gray-500">Upload photos, PDFs or save Google Drive links for your bills.</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowForm(!showForm)}>
          <Upload size={18} />
          {showForm ? 'Cancel' : 'Add New Bill'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-8 max-w-2xl animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-bold mb-6">Record Bill Details</h2>
          
          <div className="flex gap-4 mb-6 p-1 bg-gray-100 rounded-lg">
            <button 
              className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${uploadType === 'file' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
              onClick={() => setUploadType('file')}
            >
              Upload File (Photo/PDF)
            </button>
            <button 
              className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${uploadType === 'link' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
              onClick={() => setUploadType('link')}
            >
              Paste Drive Link
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Bill Description / Title</label>
              <input type="text" className="form-control" required placeholder="e.g. Office Stationery, Fuel Receipt" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input type="number" className="form-control" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Bill Date</label>
                <input type="date" className="form-control" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
            </div>

            {uploadType === 'file' ? (
              <div className="form-group p-4 border-2 border-dashed border-gray-200 rounded-xl text-center">
                <input type="file" id="file-upload" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-sm font-medium text-gray-700">Click to upload photo or PDF</p>
                  <p className="text-xs text-gray-400 mt-1">{formData.fileName || 'Max size 5MB recommended'}</p>
                </label>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Google Drive / Web Link</label>
                <div className="flex items-center gap-2">
                  <LinkIcon size={18} className="text-gray-400" />
                  <input type="url" className="form-control" placeholder="https://drive.google.com/..." value={formData.externalLink} onChange={e => setFormData({...formData, externalLink: e.target.value})} />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full mt-4 py-3" disabled={loading}>
              {loading ? 'Processing...' : 'Save Record'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map(doc => (
          <div key={doc._id} className="card group relative overflow-hidden">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
              <button onClick={() => handleView(doc)} className="p-2 bg-white shadow-md border rounded-lg text-primary hover:bg-primary hover:text-white transition-colors">
                <Eye size={16} />
              </button>
              <button onClick={() => handleDelete(doc._id)} className="p-2 bg-white shadow-md border rounded-lg text-danger hover:bg-danger hover:text-white transition-colors">
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 border border-gray-100">
                {doc.fileType === 'Link' ? <LinkIcon size={24} /> : <FileText size={24} />}
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-bold text-lg truncate mb-1" title={doc.title}>{doc.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <div className="flex items-center gap-1"><Calendar size={14} /> {new Date(doc.date).toLocaleDateString()}</div>
                  {doc.amount && <div className="font-bold text-gray-900">₹{doc.amount.toLocaleString()}</div>}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <span className={doc.fileType === 'Link' ? 'text-blue-500' : 'text-gray-400'}>{doc.fileType}</span>
              <span className="truncate max-w-[150px]">{doc.fileName}</span>
            </div>
          </div>
        ))}
        {documents.length === 0 && <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-2xl border border-dashed">No records found. Click "Add New Bill" to start.</div>}
      </div>

      {/* Internal File Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[9999] flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-white">
              <h2 className="font-bold text-lg">{viewingDoc.title}</h2>
              <button onClick={() => setViewingDoc(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 bg-gray-100 overflow-auto flex items-center justify-center">
              {viewingDoc.fileType === 'PDF' ? (
                <iframe src={viewingDoc.fileUrl} className="w-full h-full" title="PDF Viewer"></iframe>
              ) : (
                <img src={viewingDoc.fileUrl} className="max-w-full max-h-full object-contain" alt="Invoice Preview" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
