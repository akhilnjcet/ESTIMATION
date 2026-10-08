import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useProgram } from '../context/ProgramContext';
import { Save } from 'lucide-react';

const RentalSettings = () => {
  const { selectedProgram, fetchPrograms } = useProgram();
  const [formData, setFormData] = useState({
    rentalPrefix: 'RENT-',
    rentalDefaultTerms: '',
    rentalDefaultSecurityDeposit: 0,
    rentalDefaultLateFee: 0,
    showRentalTermsByDefault: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedProgram) {
      setFormData({
        rentalPrefix: selectedProgram.rentalPrefix || 'RENT-',
        rentalDefaultTerms: selectedProgram.rentalDefaultTerms || '',
        rentalDefaultSecurityDeposit: selectedProgram.rentalDefaultSecurityDeposit || 0,
        rentalDefaultLateFee: selectedProgram.rentalDefaultLateFee || 0,
        showRentalTermsByDefault: selectedProgram.showRentalTermsByDefault !== false,
      });
    }
  }, [selectedProgram]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProgram) return;
    setSaving(true);
    try {
      await api.put(`/programs/${selectedProgram._id}`, formData);
      alert('Rental settings updated successfully!');
      if (fetchPrograms) fetchPrograms();
    } catch (err) {
      console.error(err);
      alert('Failed to update rental settings');
    } finally {
      setSaving(false);
    }
  };

  const role = localStorage.getItem('role') || 'admin';
  const isViewer = role === 'viewer';

  if (!selectedProgram) return <div style={{ padding: '2rem' }}>Please select a program first.</div>;

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
        Rental Billing Settings ({selectedProgram.name})
      </h2>
      
      {isViewer && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1.25rem',
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: '12px', fontSize: '0.85rem', color: '#F59E0B', fontWeight: '600', marginBottom: '1.5rem'
        }}>
          You have view-only access. Contact your administrator to modify rental settings.
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Rental Bill Prefix</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.rentalPrefix} 
              onChange={e => setFormData({...formData, rentalPrefix: e.target.value})} 
              placeholder="e.g. RENT-" 
              disabled={isViewer}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
              Used for auto-generating rental bill numbers.
            </small>
          </div>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Default Security Deposit (&#8377;)</label>
            <input 
              type="number" 
              className="form-input" 
              value={formData.rentalDefaultSecurityDeposit} 
              onChange={e => setFormData({...formData, rentalDefaultSecurityDeposit: Number(e.target.value)})} 
              disabled={isViewer}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Default Late Fee Charge (&#8377;)</label>
            <input 
              type="number" 
              className="form-input" 
              value={formData.rentalDefaultLateFee} 
              onChange={e => setFormData({...formData, rentalDefaultLateFee: Number(e.target.value)})} 
              disabled={isViewer}
            />
          </div>
          
          <div className="form-group" style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
             <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', color: 'var(--text-primary)', marginTop: '1.5rem' }}>
                <input 
                  type="checkbox" 
                  checked={formData.showRentalTermsByDefault}
                  onChange={(e) => setFormData({ ...formData, showRentalTermsByDefault: e.target.checked })}
                  disabled={isViewer}
                />
                Show Terms in Print by Default
              </label>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Default Rental Terms & Conditions</label>
          <textarea 
            className="form-textarea" 
            rows="10" 
            value={formData.rentalDefaultTerms} 
            onChange={e => setFormData({...formData, rentalDefaultTerms: e.target.value})} 
            placeholder="Enter the default terms and conditions for rental bills..." 
            style={{ fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.5' }}
            disabled={isViewer}
          />
          <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
            These terms will automatically appear at the bottom of every new rental bill you create.
          </small>
        </div>

        <button type="submit" className="btn-gradient" disabled={saving || isViewer} style={{ padding: '0.85rem 2rem' }}>
          <Save size={18} style={{ marginRight: '8px' }} />
          {saving ? 'Saving...' : 'Save Rental Settings'}
        </button>
      </form>
    </div>
  );
};

export default RentalSettings;
