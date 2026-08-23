import React, { useRef } from 'react';
import QRCode from 'react-qr-code';
import { X, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

const IdCardPreview = ({ data, program, onClose, type = 'member' }) => {
  const cardRef = useRef(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // Higher resolution
        useCORS: true,
        backgroundColor: null
      });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${type === 'member' ? 'Member' : 'Customer'}_ID_${data.memberId || data.customerId || data.name || data.customerName}.png`;
      link.click();
    } catch (err) {
      console.error('Error generating ID card image:', err);
      alert('Failed to download ID card.');
    }
  };

  // Map data fields based on type
  const idNumber = type === 'member' ? data.memberId : (data.customerId || 'N/A');
  const name = type === 'member' ? data.name : data.customerName;
  const subtitle = type === 'member' ? data.designation : (data.gstNumber ? `GST: ${data.gstNumber}` : 'Customer');
  const thirdLine = type === 'member' ? data.memberOf : null;
  const contact = type === 'member' ? data.contactNumber : data.phone;
  const validThru = data.expiryDate ? new Date(data.expiryDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Lifetime';
  const qrValue = `ID:${idNumber}|Name:${name}|Sub:${subtitle}${thirdLine ? `|Grp:${thirdLine}` : ''}|Ph:${contact}`;
  const titleText = type === 'member' ? 'MEMBER IDENTITY' : 'CUSTOMER IDENTITY';
  const isActive = data.isActive !== undefined ? data.isActive : true;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11, 18, 32, 0.9)', zIndex: 1000, overflowY: 'auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={handleDownload} className="btn-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', borderRadius: '50px' }}>
          <Download size={18} /> Download ID Card
        </button>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', padding: '0.8rem 1.5rem', borderRadius: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <X size={18} /> Close
        </button>
      </div>

      <div ref={cardRef} style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', padding: '1rem' }}>
        {/* FRONT OF ID CARD */}
        <div style={{ 
          width: '320px', 
          height: '500px', 
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.1)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          {/* Background Accents */}
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--primary)', filter: 'blur(60px)', opacity: 0.4, borderRadius: '50%' }}></div>
          <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '150px', height: '150px', background: 'var(--secondary)', filter: 'blur(60px)', opacity: 0.4, borderRadius: '50%' }}></div>
          
          {/* Header */}
          <div style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 2 }}>
            <div style={{ fontSize: '0.75rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{program?.name || 'Workspace'}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#FFF', letterSpacing: '1px' }}>{titleText}</div>
          </div>

          {/* Content */}
          <div style={{ padding: '2rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 2, position: 'relative' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: '2.5rem', color: 'rgba(255,255,255,0.8)', fontWeight: 'bold' }}>{name?.charAt(0).toUpperCase()}</div>
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#FFF', margin: '0 0 0.25rem 0', textAlign: 'center' }}>{name}</h2>
            <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '600', marginBottom: thirdLine ? '0.25rem' : '1.5rem', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>{subtitle}</div>
            {thirdLine && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', textAlign: 'center' }}>{thirdLine}</div>}

            <div style={{ width: '100%', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>ID NUMBER</span>
                <b style={{ color: '#FFF', letterSpacing: '1px' }}>{idNumber}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>VALID THRU</span>
                <b style={{ color: '#FFF' }}>{validThru}</b>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', zIndex: 2, display: 'flex', justifyContent: 'center' }}>
             <div style={{ width: '40px', height: '5px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px' }}></div>
          </div>
        </div>

        {/* BACK OF ID CARD */}
        <div style={{ 
          width: '320px', 
          height: '500px', 
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.1)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          {/* Magnetic Stripe Fake */}
          <div style={{ width: '100%', height: '45px', background: '#000', marginTop: '2rem', opacity: 0.8 }}></div>
          
          <div style={{ padding: '2rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: '2rem', lineHeight: '1.5' }}>
              This card is the property of <br/><b style={{ color: 'rgba(255,255,255,0.7)' }}>{program?.name || 'The Company'}</b>.<br/>
              If found, please return to the authorized personnel. Use of this card is governed by company policy.
            </div>

            <div style={{ background: '#FFF', padding: '0.5rem', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', marginBottom: '1rem' }}>
              <QRCode value={qrValue} size={120} />
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>Scan for Validation</div>
            
            <div style={{ marginTop: '2rem', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.75rem' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)' }}>
                <div style={{ fontSize: '0.6rem', marginBottom: '2px' }}>EMERGENCY CONTACT</div>
                <b style={{ color: '#FFF' }}>{contact}</b>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'right' }}>
                <div style={{ fontSize: '0.6rem', marginBottom: '2px' }}>STATUS</div>
                <b style={{ color: isActive ? '#22c55e' : '#ef4444' }}>{isActive ? 'ACTIVE' : 'INACTIVE'}</b>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};

export default IdCardPreview;
