import { useState } from 'react';
import api from '../utils/api';
import { useProgram } from '../context/ProgramContext';
import {
  Building2, Plus, Edit2, Trash2, Phone, Mail, MapPin, Hash,
  Palette, Settings as SettingsIcon, X, Layers
} from 'lucide-react';
import ModuleCustomization from './ModuleCustomization';
import RentalSettings from '../components/RentalSettings';

const Settings = () => {
  const { programs, setPrograms } = useProgram();
  const [activeTab, setActiveTab] = useState('programs'); // 'programs' | 'modules'
  const [editingProgram, setEditingProgram] = useState(null);
  const [formData, setFormData] = useState({
    name: '', address: '', phone: '', email: '', gstNumber: '', themeColor: '#2563eb',
    footerText: '', signatureUrl: '', signatureTitle: 'Authorized Signature',
    logo: '', showLogo: true, treasurerSignatureUrl: '', treasurerSignatureTitle: 'Treasurer',
    showTreasurerSignature: true, defaultTerms: '', showTermsByDefault: true
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
      setFormData({ name: '', address: '', phone: '', email: '', gstNumber: '', themeColor: '#2563eb', footerText: '' });
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
      themeColor: prog.themeColor || '#2563eb',
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
    if (password === null) return;
    try {
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, [field]: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <SettingsIcon size={28} style={{ color: 'var(--primary)' }} />
            Settings
          </h1>
          <p className="page-subtitle">Configure programs, branding and module visibility</p>
        </div>

        {activeTab === 'programs' && (
          <button
            className="btn-gradient"
            onClick={() => { setShowForm(!showForm); setEditingProgram(null); }}
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancel' : 'Create New Program Unit'}
          </button>
        )}
      </div>

      {/* ── Tab Switcher ── */}
      <div
        style={{
          display: 'inline-flex',
          background: 'var(--bg-card)',
          border: '1px solid var(--glass-border)',
          borderRadius: '14px',
          padding: '0.3rem',
          gap: '0.25rem',
          alignSelf: 'flex-start',
        }}
      >
        {[
          { key: 'programs', label: 'Program Units', icon: Building2 },
          { key: 'modules',  label: 'Module Customization', icon: Layers },
          { key: 'rentals',  label: 'Rental Settings', icon: SettingsIcon },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.1rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.85rem',
              transition: 'all 0.2s ease',
              background: activeTab === key
                ? 'linear-gradient(135deg, var(--primary), var(--secondary))'
                : 'transparent',
              color: activeTab === key ? '#FFFFFF' : 'var(--text-muted)',
              boxShadow: activeTab === key ? '0 4px 14px rgba(59,130,246,0.3)' : 'none',
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Program Units (existing content, untouched) ── */}
      {activeTab === 'programs' && (
        <>
          {/* Editor Glass Panel */}
          {showForm && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem' }}>
                {editingProgram ? `Edit ${editingProgram.name}` : 'Setup New Business Unit / Program'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Program Name</label>
                    <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Krishna Tech Solutions" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Theme Color Accent</label>
                    <input type="color" className="form-input" style={{ height: '42px', padding: '0.2rem' }} value={formData.themeColor} onChange={e => setFormData({...formData, themeColor: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input type="text" className="form-input" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91 98765 43210" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-input" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="support@company.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GST Number</label>
                    <input type="text" className="form-input" value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value})} placeholder="33AAAAA0000A1Z5" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                  <div className="form-group">
                    <label className="form-label">Company Logo</label>
                    <input type="file" accept="image/*" className="form-input" onChange={e => handleFileUpload(e, 'logo')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Authorized Signature</label>
                    <input type="file" accept="image/*" className="form-input" onChange={e => handleFileUpload(e, 'signatureUrl')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Signature Title</label>
                    <input type="text" className="form-input" value={formData.signatureTitle} onChange={e => setFormData({...formData, signatureTitle: e.target.value})} placeholder="Authorized Signatory" />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                  <label className="form-label">Default Terms & Conditions</label>
                  <textarea className="form-textarea" rows="3" value={formData.defaultTerms} onChange={e => setFormData({...formData, defaultTerms: e.target.value})} placeholder="1. Payment due upon receipt..." />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Full Organization Address</label>
                  <textarea className="form-textarea" rows="2" required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full address details for print headers..."></textarea>
                </div>

                <button type="submit" className="btn-gradient" style={{ width: '100%', padding: '0.85rem' }}>
                  {editingProgram ? 'Update Program Unit' : 'Save & Register Unit'}
                </button>
              </form>
            </div>
          )}

          {/* Program Units Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {programs.map(prog => (
              <div key={prog._id} className="glass-card glass-card-interactive">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: prog.themeColor || 'var(--primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.2rem' }}>
                      {prog.name[0]}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>{prog.name}</h3>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {prog._id.slice(-6).toUpperCase()}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn-icon" onClick={() => handleEdit(prog)} title="Edit Program"><Edit2 size={14} /></button>
                    <button className="btn-icon" onClick={() => handleDelete(prog)} title="Delete Program" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  <div><Phone size={14} style={{ color: 'var(--primary)', display: 'inline', marginRight: '6px' }} />{prog.phone}</div>
                  <div><Mail size={14} style={{ color: 'var(--secondary)', display: 'inline', marginRight: '6px' }} />{prog.email}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Theme Accent</span>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: prog.themeColor, border: '2px solid #FFF' }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Tab: Module Customization ── */}
      {activeTab === 'modules' && <ModuleCustomization />}

      {/* ── Tab: Rental Settings ── */}
      {activeTab === 'rentals' && <RentalSettings />}
    </div>
  );
};

export default Settings;
