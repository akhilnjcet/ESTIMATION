import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { FileText, Upload, Trash2, Eye, Calendar, DollarSign } from 'lucide-react';

const Invoices = () => {
  const [documents, setDocuments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', amount: '', date: new Date().toISOString().split('T')[0],
    fileName: '', fileUrl: '', fileType: 'Image'
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
        fileUrl: reader.result, // Base64
        fileType: file.type.includes('pdf') ? 'PDF' : 'Image'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fileUrl) return alert('Please select a file to upload');
    
    setLoading(true);
    try {
      await api.post('/documents', formData);
      setFormData({
        title: '', description: '', amount: '', date: new Date().toISOString().split('T')[0],
        fileName: '', fileUrl: '', fileType: 'Image'
      });
      setShowForm(false);
      fetchDocuments();
      alert('Invoice uploaded successfully!');
    } catch (err) {
      console.error(err);
      alert('Upload failed');
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">External Invoices & Bills</h1>
          <p className="text-gray-500">Upload and manage purchase bills, petrol receipts, etc.</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowForm(!showForm)}>
          <Upload size={18} />
          {showForm ? 'Cancel' : 'Upload New Invoice'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-8 max-w-2xl">
          <h2 className="text-xl font-bold mb-4">Upload Invoice Details</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Invoice Title (e.g. Petrol Bill, Office Rent)</label>
              <input type="text" className="form-control" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input type="number" className="form-control" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-control" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Select File (Photo or PDF)</label>
              <input type="file" className="form-control" accept="image/*,application/pdf" onChange={handleFileUpload} />
              {formData.fileName && <p className="text-xs text-secondary mt-2">Selected: {formData.fileName}</p>}
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Uploading...' : 'Save & Upload'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map(doc => (
          <div key={doc._id} className="card group relative">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => window.open(doc.fileUrl)} className="p-2 bg-white shadow-sm border rounded-lg text-primary hover:bg-primary hover:text-white">
                <Eye size={14} />
              </button>
              <button onClick={() => handleDelete(doc._id)} className="p-2 bg-white shadow-sm border rounded-lg text-danger hover:bg-danger hover:text-white">
                <Trash2 size={14} />
              </button>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                <FileText size={24} />
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-bold text-lg truncate" title={doc.title}>{doc.title}</h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <div className="flex items-center gap-1"><Calendar size={14} /> {new Date(doc.date).toLocaleDateString()}</div>
                  {doc.amount && <div className="flex items-center gap-1 font-semibold text-gray-700"><DollarSign size={14} /> ₹{doc.amount.toLocaleString()}</div>}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t flex justify-between items-center text-xs text-gray-400">
              <span>{doc.fileType} Document</span>
              <span className="italic">{doc.fileName.length > 20 ? doc.fileName.slice(0, 20) + '...' : doc.fileName}</span>
            </div>
          </div>
        ))}
        {documents.length === 0 && <div className="col-span-full py-12 text-center text-gray-400">No uploaded invoices found.</div>}
      </div>
    </div>
  );
};

export default Invoices;
