import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useProgram } from '../context/ProgramContext';
import { Building2, Plus, Edit2, Trash2, Globe, Phone, Mail, MapPin, Hash, Palette } from 'lucide-react';

const Settings = () => {
  const { programs, setPrograms } = useProgram();
  const [editingProgram, setEditingProgram] = useState(null);
  const [formData, setFormData] = useState({
    name: '', address: '', phone: '', email: '', gstNumber: '', themeColor: '#4f46e5', footerText: '', signatureUrl: '', signatureTitle: 'Authorized Signature', logo: '', showLogo: true, treasurerSignatureUrl: '', treasurerSignatureTitle: 'Treasurer', showTreasurerSignature: true, defaultTerms: '', showTermsByDefault: true
  });
  const [showForm, setShowForm] = useState(false);

  const fetchPrograms = async () => {
    try {
      const { data } = await api.get('/programs');
      setPrograms(data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProgram) {
        await api.put(`/programs/${editingProgram._id}`, formData);
      } else {
        await api.post('/programs', formData);
      }
      setFormData({ name: '', address: '', phone: '', email: '', gstNumber: '', themeColor: '#4f46e5', footerText: '' });
      setEditingProgram(null);
      setShowForm(false);
      fetchPrograms();
    } catch (err) { console.error(err); }
  };

  const handleEdit = (prog) => {
    setEditingProgram(prog);
    setFormData({
      name: prog.name || '',
      address: prog.address || '',
      phone: prog.phone || '',
      email: prog.email || '',
      gstNumber: prog.gstNumber || '',
      themeColor: prog.themeColor || '#4f46e5',
      footerText: prog.footerText || '',
      signatureUrl: prog.signatureUrl || '',
      signatureTitle: prog.signatureTitle || 'Authorized Signature',
      logo: prog.logo || '',
      showLogo: prog.showLogo !== undefined ? prog.showLogo : true,
      treasurerSignatureUrl: prog.treasurerSignatureUrl || '',
      treasurerSignatureTitle: prog.treasurerSignatureTitle || 'Treasurer',
      showTreasurerSignature: prog.showTreasurerSignature !== undefined ? prog.showTreasurerSignature : true,
      defaultTerms: prog.defaultTerms || '',
      showTermsByDefault: prog.showTermsByDefault !== undefined ? prog.showTermsByDefault : true
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (prog) => {
    const password = window.prompt(`To delete "${prog.name}", please enter your login password:`);
    if (password === null) return; // User cancelled

    try {
      // Send password in request body for verification
      await api.delete(`/programs/${prog._id}`, { data: { password } });
      alert('Program deleted successfully!');
      fetchPrograms();
    } catch (err) {
      console.error(err);
      alert('Failed to delete program: ' + (err.response?.data?.message || err.message));
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const maxWidth = 300;
          const scale = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * scale;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File size too large. Max 2MB allowed.');
      return;
    }

    try {
      const compressedBase64 = await compressImage(file);
      setFormData({ ...formData, [field]: compressedBase64 });
    } catch (err) {
      console.error('Image compression failed:', err);
      // Fallback to original reader if compression fails
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, [field]: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Program Management</h1>
          <p className="text-gray-500">Add or edit independent clubs, organizations, and business units</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => { setShowForm(!showForm); setEditingProgram(null); }}>
          <Plus size={18} />
          {showForm ? 'Cancel' : 'Create New Program'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-8 max-w-4xl animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-bold mb-6">{editingProgram ? `Edit ${editingProgram.name}` : 'Setup New Program'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="form-group">
                <label className="form-label">Program Name (e.g. Football Club)</label>
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-gray-400" />
                  <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Theme Color</label>
                <div className="flex items-center gap-2">
                  <Palette size={18} className="text-gray-400" />
                  <input type="color" className="form-control h-10 p-1" value={formData.themeColor} onChange={e => setFormData({...formData, themeColor: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div className="flex items-center gap-2">
                  <Phone size={18} className="text-gray-400" />
                  <input type="text" className="form-control" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="flex items-center gap-2">
                  <Mail size={18} className="text-gray-400" />
                  <input type="email" className="form-control" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">GST Number (Optional)</label>
                <div className="flex items-center gap-2">
                  <Hash size={18} className="text-gray-400" />
                  <input type="text" className="form-control" value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 border-t pt-6">
              <div className="form-group">
                <label className="form-label">Company Logo</label>
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" className="form-control" onChange={e => handleFileUpload(e, 'logo')} />
                  {formData.logo && <img src={formData.logo} className="w-10 h-10 object-contain border rounded" alt="Preview" />}
                </div>
              </div>
              <div className="form-group flex items-center mt-8">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input type="checkbox" className="w-5 h-5 accent-primary rounded" checked={formData.showLogo} onChange={e => setFormData({...formData, showLogo: e.target.checked})} />
                  <span className="font-bold text-sm text-gray-700">Show Logo in Print</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 border-t pt-6">
              <div className="form-group">
                <label className="form-label">Authorized Signature</label>
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" className="form-control" onChange={e => handleFileUpload(e, 'signatureUrl')} />
                  {formData.signatureUrl && <img src={formData.signatureUrl} className="w-10 h-10 object-contain border rounded" alt="Preview" />}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Signature Title</label>
                <input type="text" className="form-control" value={formData.signatureTitle} onChange={e => setFormData({...formData, signatureTitle: e.target.value})} placeholder="Authorized Signatory" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 border-t pt-6">
              <div className="form-group">
                <label className="form-label">Treasurer Signature</label>
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" className="form-control" onChange={e => handleFileUpload(e, 'treasurerSignatureUrl')} />
                  {formData.treasurerSignatureUrl && <img src={formData.treasurerSignatureUrl} className="w-10 h-10 object-contain border rounded" alt="Preview" />}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Treasurer Title</label>
                <input type="text" className="form-control" value={formData.treasurerSignatureTitle} onChange={e => setFormData({...formData, treasurerSignatureTitle: e.target.value})} placeholder="Treasurer" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 border-t pt-6">
              <div className="form-group">
                <label className="form-label">Default Terms & Conditions</label>
                <textarea className="form-control" rows="4" value={formData.defaultTerms} onChange={e => setFormData({...formData, defaultTerms: e.target.value})} placeholder="1. Goods once sold..." />
              </div>
              <div className="form-group flex items-center mt-8">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input type="checkbox" className="w-5 h-5 accent-primary rounded" checked={formData.showTermsByDefault} onChange={e => setFormData({...formData, showTermsByDefault: e.target.checked})} />
                  <span className="font-bold text-sm text-gray-700">Show Terms by Default</span>
                </label>
              </div>
            </div>

            <div className="form-group mb-6 border-t pt-6">
              <label className="form-label">Full Address (for Print Header)</label>
              <textarea className="form-control" rows="3" required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
            </div>

            <button type="submit" className="btn btn-primary px-8">
              {editingProgram ? 'Update Program' : 'Create Program'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map(prog => (
          <div key={prog._id} className="card relative group">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => handleEdit(prog)} className="p-2 bg-white shadow-sm border rounded-lg text-gray-400 hover:text-primary">
                <Edit2 size={14} />
              </button>
              <button onClick={() => handleDelete(prog)} className="p-2 bg-white shadow-sm border rounded-lg text-gray-400 hover:text-danger">
                <Trash2 size={14} />
              </button>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: prog.themeColor || 'var(--primary)' }}>
                {prog.name[0]}
              </div>
              <div>
                <h3 className="font-bold text-lg">{prog.name}</h3>
                <p className="text-xs text-gray-400 font-medium">Program ID: {prog._id.slice(-6).toUpperCase()}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2"><Phone size={14} /> {prog.phone}</div>
              <div className="flex items-center gap-2"><Mail size={14} /> {prog.email}</div>
              <div className="flex items-center gap-2 line-clamp-1"><MapPin size={14} /> {prog.address}</div>
            </div>

            <div className="pt-4 border-t flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase text-gray-400">Branding Color</span>
              <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: prog.themeColor }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;
