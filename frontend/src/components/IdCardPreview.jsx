import React, { useRef, useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { X, Download, Crown, Sparkles, ShieldCheck, User } from 'lucide-react';
import html2canvas from 'html2canvas';
import { downloadCanvasAsImage } from '../utils/downloadHelper';

const IdCardPreview = ({ data, program, onClose, type = 'member' }) => {
  const cardRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [cardSide, setCardSide] = useState('both'); // 'both', 'front', 'back'
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const updateScale = () => {
      const vw = window.innerWidth;
      const horizPadding = vw < 480 ? 20 : vw < 768 ? 32 : 48;
      const availableWidth = Math.min(520, vw - horizPadding);
      const computedScale = Math.max(0.35, availableWidth / 520);
      setScale(computedScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, // Ultra-sharp 3x DPI export
        useCORS: true,
        backgroundColor: null,
        windowWidth: 1200,
        onclone: (clonedDoc) => {
          // Reset scalers so the cloned DOM is rendered at original unscaled 520x325 dimensions
          const scalers = clonedDoc.querySelectorAll('.id-card-scaler');
          scalers.forEach(el => {
            el.style.transform = 'none';
            el.style.position = 'static';
            el.style.width = '520px';
            el.style.height = '325px';
          });
          const outers = clonedDoc.querySelectorAll('.id-card-outer');
          outers.forEach(el => {
            el.style.width = '520px';
            el.style.height = '325px';
            el.style.position = 'static';
            el.style.display = 'block';
            el.style.margin = '0 auto';
          });
          const container = clonedDoc.querySelector('.id-card-capture-container');
          if (container) {
            container.style.width = '520px';
            container.style.padding = '10px';
          }
        }
      });
      const sideLabel = cardSide === 'both' ? '' : `_${cardSide.toUpperCase()}`;
      const filename = `${type === 'member' ? 'VIP_Member' : 'VIP_Customer'}_ID${sideLabel}_${data.memberId || data.customerId || data.name || data.customerName}.png`;
      downloadCanvasAsImage(canvas, filename, 'image/png');
    } catch (err) {
      console.error('Error generating ID card image:', err);
      alert('Failed to download ID card image.');
    } finally {
      setDownloading(false);
    }
  };

  const idNumber = type === 'member' ? (data.memberId || 'YUV-0001') : (data.customerId || 'CUST-0001');
  const name = type === 'member' ? data.name : data.customerName;
  const designation = type === 'member' ? (data.designation || 'MEMBER') : (data.gstNumber ? `GST: ${data.gstNumber}` : 'VIP CUSTOMER');
  const groupName = type === 'member' ? data.memberOf : null;
  const contact = type === 'member' ? data.contactNumber : data.phone;
  const validThru = data.expiryDate ? new Date(data.expiryDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'LIFETIME';
  const qrValue = `ID:${idNumber}|Name:${name}|Title:${designation}${groupName ? `|Group:${groupName}` : ''}|Contact:${contact}`;
  const isActive = data.isActive !== undefined ? data.isActive : true;

  // Format ID string with spacious layout (e.g. YUV  0001  2026)
  const formattedId = idNumber.includes('-') 
    ? idNumber.replace('-', '  ')
    : idNumber.match(/.{1,4}/g)?.join('  ') || idNumber;

  const isLongName = (program?.name?.length || 0) > 28;

  return (
    <div 
      className="modal-overlay" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        background: 'rgba(11, 18, 32, 0.94)', 
        backdropFilter: 'blur(16px)', 
        zIndex: 1000, 
        overflowY: 'auto', 
        overflowX: 'hidden',
        padding: '1.25rem 0.5rem 3rem', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center' 
      }}
    >
      
      {/* Action Toolbar & Side Switcher */}
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '0.85rem', 
          marginBottom: '1.5rem', 
          width: '100%', 
          maxWidth: '520px', 
          zIndex: 10 
        }}
      >
        {/* Mobile-Friendly View Switcher Tabs */}
        <div 
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.08)',
            padding: '4px',
            borderRadius: '30px',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => setCardSide('both')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '25px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: cardSide === 'both' ? 'linear-gradient(135deg, #D4AF37 0%, #AA771C 100%)' : 'transparent',
              color: cardSide === 'both' ? '#000' : 'rgba(255, 255, 255, 0.8)',
            }}
          >
            Both Sides
          </button>
          <button
            type="button"
            onClick={() => setCardSide('front')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '25px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: cardSide === 'front' ? 'linear-gradient(135deg, #D4AF37 0%, #AA771C 100%)' : 'transparent',
              color: cardSide === 'front' ? '#000' : 'rgba(255, 255, 255, 0.8)',
            }}
          >
            Front Side
          </button>
          <button
            type="button"
            onClick={() => setCardSide('back')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '25px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: cardSide === 'back' ? 'linear-gradient(135deg, #D4AF37 0%, #AA771C 100%)' : 'transparent',
              color: cardSide === 'back' ? '#000' : 'rgba(255, 255, 255, 0.8)',
            }}
          >
            Back Side
          </button>
        </div>

        {/* Buttons Row */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
          <button 
            onClick={handleDownload} 
            disabled={downloading}
            className="btn-gradient" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '0.6rem', 
              padding: '0.8rem 1.6rem', 
              borderRadius: '50px', 
              fontSize: '0.9rem', 
              fontWeight: '700', 
              background: 'linear-gradient(135deg, #D4AF37 0%, #AA771C 100%)', 
              boxShadow: '0 8px 25px rgba(212, 175, 55, 0.35)', 
              color: '#000',
              cursor: downloading ? 'not-allowed' : 'pointer',
              opacity: downloading ? 0.75 : 1,
              flex: '1 1 auto',
              maxWidth: '320px'
            }}
          >
            <Download size={18} /> {downloading ? 'Exporting ID Card...' : `Download ${cardSide === 'both' ? 'VIP Gold ID Card' : cardSide === 'front' ? 'Front Side' : 'Back Side'}`}
          </button>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'rgba(255,255,255,0.1)', 
              border: '1px solid rgba(255,255,255,0.2)', 
              color: '#FFF', 
              padding: '0.8rem 1.4rem', 
              borderRadius: '50px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '0.5rem', 
              fontWeight: '600',
              fontSize: '0.9rem'
            }}
          >
            <X size={18} /> Close
          </button>
        </div>
      </div>

      {/* Container Captured by html2canvas */}
      <div 
        ref={cardRef} 
        className="id-card-capture-container"
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: `${1.75 * scale + 0.5}rem`, 
          alignItems: 'center', 
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        
        {/* ======================================================== */}
        {/* FRONT SIDE OF LUXURY VIP GOLD CARD (CR-80 Standard Layout) */}
        {/* ======================================================== */}
        {(cardSide === 'both' || cardSide === 'front') && (
          <div 
            className="id-card-outer"
            style={{
              width: `${520 * scale}px`,
              height: `${325 * scale}px`,
              position: 'relative',
              boxSizing: 'border-box',
              margin: '0 auto',
              flexShrink: 0
            }}
          >
            <div 
              className="id-card-scaler"
              style={{
                width: '520px',
                height: '325px',
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0,
                background: 'linear-gradient(135deg, #121824 0%, #0A0D14 50%, #151C2A 100%)', 
                borderRadius: '20px',
                boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8), inset 0 0 0 1px rgba(212, 175, 55, 0.35)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.75rem 2rem',
                fontFamily: "'Cinzel', 'Playfair Display', Georgia, 'Times New Roman', serif",
                boxSizing: 'border-box'
              }}
            >
              
              {/* Subtle Palm Leaf Watermark Shadow Silhouettes (Left & Right) */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', opacity: 0.12, mixBlendMode: 'overlay' }}>
                <svg width="100%" height="100%" viewBox="0 0 520 325" fill="none">
                  {/* Palm Silhouette Left */}
                  <path d="M-40 200 C 20 150, 80 180, 110 120 C 130 80, 80 30, 20 0 C 80 50, 130 110, 80 180 Z" fill="#FFF" />
                  <path d="M-60 140 C 0 110, 60 130, 80 80 C 100 40, 50 10, 0 -20 Z" fill="#FFF" />
                  <path d="M-20 250 C 40 200, 100 230, 130 170 C 150 130, 100 80, 40 50 Z" fill="#FFF" />
                  
                  {/* Palm Silhouette Right */}
                  <path d="M560 100 C 500 150, 440 120, 410 180 C 390 220, 440 270, 500 300 C 440 250, 390 190, 440 120 Z" fill="#FFF" />
                  <path d="M580 160 C 520 190, 460 170, 440 220 C 420 260, 470 290, 520 320 Z" fill="#FFF" />
                </svg>
              </div>

              {/* Ambient Gold Glow Circles */}
              <div style={{ position: 'absolute', top: '-60px', left: '-60px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(212,175,55,0.25) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(30px)' }}></div>
              <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(212,175,55,0.25) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(30px)' }}></div>

              {/* Golden Sweeping Metallic Arcs (SVG Layer) */}
              <svg width="520" height="325" viewBox="0 0 520 325" fill="none" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <defs>
                  <linearGradient id="goldArcGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFE899" stopOpacity="0.9" />
                    <stop offset="35%" stopColor="#D4AF37" stopOpacity="0.8" />
                    <stop offset="70%" stopColor="#AA771C" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#553A04" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="goldArcGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#553A04" stopOpacity="0.1" />
                    <stop offset="40%" stopColor="#AA771C" stopOpacity="0.6" />
                    <stop offset="75%" stopColor="#D4AF37" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#FFF2B2" stopOpacity="1" />
                  </linearGradient>
                  <linearGradient id="goldBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFE58F" />
                    <stop offset="50%" stopColor="#B8860B" />
                    <stop offset="100%" stopColor="#FFE58F" />
                  </linearGradient>
                  <linearGradient id="goldTextGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF099" />
                    <stop offset="50%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#AA771C" />
                  </linearGradient>
                </defs>

                {/* Top-Left Golden Sweeping Arc */}
                <path d="M -10 110 Q 110 35 270 -10 L 250 -10 Q 100 32 -10 100 Z" fill="url(#goldArcGrad1)" />
                <path d="M -10 115 Q 112 38 272 -7 L 275 -7 Q 113 40 -10 118 Z" fill="#FFF5C0" opacity="0.8" />

                {/* Bottom-Right Golden Sweeping Arc */}
                <path d="M 40 335 Q 280 290 535 140 L 535 152 Q 278 302 40 347 Z" fill="url(#goldArcGrad2)" />
                <path d="M 45 338 Q 282 292 535 143 L 535 146 Q 280 295 45 341 Z" fill="#FFF2B2" opacity="0.9" />

                {/* Top Left Sparkle Star Effect */}
                <circle cx="95" cy="42" r="2.5" fill="#FFF" />
                <path d="M 95 34 L 95 50 M 87 42 L 103 42" stroke="#FFF" strokeWidth="1" strokeLinecap="round" opacity="0.85" />
                
                {/* Bottom Right Sparkle Star Effect */}
                <circle cx="440" cy="245" r="2" fill="#FFF" />
                <path d="M 440 239 L 440 251 M 434 245 L 446 245" stroke="#FFF" strokeWidth="0.8" strokeLinecap="round" opacity="0.75" />
              </svg>

              {/* ── TOP HEADER SECTION ── */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', zIndex: 2, position: 'relative' }}>
                {/* Tropical Palm / Crest Logo Header Emblem */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                  <svg width="34" height="26" viewBox="0 0 40 30" fill="none">
                    <path d="M 20 2 C 14 8, 8 18, 2 22 C 12 20, 18 16, 20 12 C 22 16, 28 20, 38 22 C 32 18, 26 8, 20 2 Z" fill="url(#goldTextGrad)" />
                    <path d="M 20 12 L 20 28" stroke="url(#goldTextGrad)" strokeWidth="2" strokeLinecap="round" />
                    <path d="M 12 28 C 16 26, 24 26, 28 28" stroke="url(#goldTextGrad)" strokeWidth="1.5" />
                  </svg>
                </div>

                {/* Workspace / Company Name */}
                <div style={{ 
                  fontSize: isLongName ? '0.82rem' : '1rem', 
                  fontWeight: '800', 
                  letterSpacing: isLongName ? '1.5px' : '3px', 
                  textTransform: 'uppercase',
                  background: 'linear-gradient(135deg, #FFF099 0%, #F1C40F 40%, #D4AF37 70%, #AA771C 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                  maxWidth: '460px',
                  lineHeight: '1.25'
                }}>
                  {program?.name || 'YUVATHA ENTERPRISE'}
                </div>
                
                <div style={{ fontSize: '0.55rem', letterSpacing: '2px', color: '#B8973D', textTransform: 'uppercase', marginTop: '2px', fontWeight: '600' }}>
                  OFFICIAL MEMBERSHIP DIRECTORY
                </div>
              </div>

              {/* ── CENTER DESIGNATION & MEMBER NAME SECTION ── */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', zIndex: 2, margin: '4px 0', position: 'relative' }}>
                
                {/* Ornament: Golden Crown + Flanking Stars */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#D4AF37', marginBottom: '4px' }}>
                  <span style={{ fontSize: '9px', opacity: 0.8 }}>★</span>
                  <span style={{ fontSize: '11px', opacity: 0.9 }}>★</span>
                  <Crown size={18} style={{ color: '#F1C40F', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }} />
                  <span style={{ fontSize: '11px', opacity: 0.9 }}>★</span>
                  <span style={{ fontSize: '9px', opacity: 0.8 }}>★</span>
                </div>

                {/* Main Member Name or VIP Title */}
                <div style={{ 
                  fontSize: (name?.length || 0) > 22 ? '1.2rem' : '1.45rem', 
                  fontWeight: '900', 
                  letterSpacing: (name?.length || 0) > 22 ? '1.5px' : '2.5px', 
                  textTransform: 'uppercase',
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF5C0 35%, #D4AF37 75%, #996D13 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.7))',
                  lineHeight: 1.15,
                  maxWidth: '460px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {name || 'VIP MEMBER'}
                </div>

                {/* Member Designation Badge */}
                <div style={{ 
                  fontSize: '0.725rem', 
                  fontWeight: '800', 
                  letterSpacing: '2.5px', 
                  color: '#F1C40F', 
                  textTransform: 'uppercase', 
                  marginTop: '4px',
                  maxWidth: '460px'
                }}>
                  {designation} {groupName ? `• ${groupName}` : ''}
                </div>

                {/* 5 Golden Stars Below */}
                <div style={{ display: 'flex', gap: '5px', color: '#F1C40F', fontSize: '10px', marginTop: '6px' }}>
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
              </div>

              {/* ── BOTTOM FOOTER SECTION ── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 2, position: 'relative' }}>
                
                {/* Bottom Left: Formatted Metallic Gold Member ID */}
                <div>
                  <div style={{ fontSize: '0.5rem', letterSpacing: '1.5px', color: '#A38430', textTransform: 'uppercase', marginBottom: '2px', fontWeight: '700' }}>
                    MEMBER ID NUMBER
                  </div>
                  <div style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: '800', 
                    letterSpacing: '3.5px', 
                    fontFamily: "'Courier New', Courier, monospace",
                    background: 'linear-gradient(135deg, #FFF099 0%, #F1C40F 50%, #B8860B 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                  }}>
                    {formattedId}
                  </div>
                </div>

                {/* Bottom Right: Golden Laurel Wreath Emblem Seal */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="48" height="48" viewBox="0 0 50 50" fill="none">
                    <circle cx="25" cy="25" r="23" stroke="url(#goldArcGrad1)" strokeWidth="1.5" strokeDasharray="3 2" />
                    <circle cx="25" cy="25" r="20" stroke="#D4AF37" strokeWidth="1" />
                    
                    {/* Laurel Leaves Outer Ring */}
                    <path d="M 12 28 C 10 22, 14 14, 22 10 C 18 16, 18 24, 22 28" fill="url(#goldTextGrad)" opacity="0.8" />
                    <path d="M 38 28 C 40 22, 36 14, 28 10 C 32 16, 32 24, 28 28" fill="url(#goldTextGrad)" opacity="0.8" />
                    
                    {/* Globe / Emblem Center */}
                    <circle cx="25" cy="25" r="11" fill="#0E131F" stroke="#D4AF37" strokeWidth="1" />
                    <path d="M 16 25 Q 25 20 34 25 Q 25 30 16 25 Z" stroke="#F1C40F" strokeWidth="0.8" fill="none" />
                    <path d="M 25 14 L 25 36 M 14 25 L 36 25" stroke="#F1C40F" strokeWidth="0.8" opacity="0.6" />
                  </svg>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* BACK SIDE OF LUXURY VIP GOLD CARD                        */}
        {/* ======================================================== */}
        {(cardSide === 'both' || cardSide === 'back') && (
          <div 
            className="id-card-outer"
            style={{
              width: `${520 * scale}px`,
              height: `${325 * scale}px`,
              position: 'relative',
              boxSizing: 'border-box',
              margin: '0 auto',
              flexShrink: 0
            }}
          >
            <div 
              className="id-card-scaler"
              style={{
                width: '520px',
                height: '325px',
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0,
                background: 'linear-gradient(135deg, #121824 0%, #0A0D14 50%, #151C2A 100%)', 
                borderRadius: '20px',
                boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8), inset 0 0 0 1px rgba(212, 175, 55, 0.35)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.25rem 2rem 1.5rem',
                fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif",
                boxSizing: 'border-box'
              }}
            >
              
              {/* Black Magnetic Stripe Simulation with Gold Foil Borders */}
              <div style={{ 
                width: 'calc(100% + 4rem)', 
                height: '42px', 
                background: 'linear-gradient(180deg, #000000 0%, #1A1A1A 50%, #050505 100%)', 
                margin: '-1.25rem -2rem 1rem -2rem',
                borderTop: '1px solid #D4AF37',
                borderBottom: '1px solid #D4AF37',
                boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.9)'
              }}></div>

              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flex: 1, zIndex: 2 }}>
                
                {/* Left Side: Member Details */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div>
                    <div style={{ fontSize: '0.55rem', color: '#A38430', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>FULL MEMBER NAME</div>
                    <div style={{ fontSize: '1rem', fontWeight: '800', color: '#FFF', letterSpacing: '1px' }}>{name}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.5rem', color: '#A38430', textTransform: 'uppercase', letterSpacing: '1px' }}>DESIGNATION</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#F1C40F' }}>{designation}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.5rem', color: '#A38430', textTransform: 'uppercase', letterSpacing: '1px' }}>CONTACT</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#FFF' }}>{contact}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.5rem', color: '#A38430', textTransform: 'uppercase', letterSpacing: '1px' }}>VALID UNTIL</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#FFF' }}>{validThru}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.5rem', color: '#A38430', textTransform: 'uppercase', letterSpacing: '1px' }}>STATUS</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '800', color: isActive ? '#22c55e' : '#ef4444' }}>
                        {isActive ? 'ACTIVE VIP' : 'INACTIVE'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: QR Code inside Gold Laurel Wreath Frame */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ 
                    background: '#FFFFFF', 
                    padding: '8px', 
                    borderRadius: '12px', 
                    border: '2px solid #D4AF37', 
                    boxShadow: '0 8px 20px rgba(0,0,0,0.6)' 
                  }}>
                    <QRCode value={qrValue} size={90} />
                  </div>
                  <div style={{ fontSize: '0.5rem', color: '#D4AF37', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '6px', fontWeight: '700' }}>
                    DIGITAL VALIDATION
                  </div>
                </div>

              </div>

              {/* Footer Terms & Legal Notice */}
              <div style={{ borderTop: '1px solid rgba(212, 175, 55, 0.25)', paddingTop: '0.6rem', textAlign: 'center', zIndex: 2 }}>
                <p style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: '1.3' }}>
                  This identity card remains the property of <b>{program?.name || 'Organization'}</b>. If found, please return immediately to authorized office personnel.
                </p>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default IdCardPreview;
