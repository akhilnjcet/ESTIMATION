import React, { useState, useEffect } from 'react';
import { Calculator as CalcIcon, X } from 'lucide-react';

const QuickCalculator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  const handleNum = (num) => {
    if (display === '0' || display === 'Error') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOp = (op) => {
    if (display === 'Error') return;
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleCalc = () => {
    try {
      // eslint-disable-next-line
      const result = eval(equation + display);
      setDisplay(String(result));
      setEquation('');
    } catch (e) {
      setDisplay('Error');
      setEquation('');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div style={{ position: 'relative' }}>
      <button 
        className="btn-icon" 
        onClick={() => setIsOpen(!isOpen)}
        title="Quick Calculator"
        style={{ background: isOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent' }}
      >
        <CalcIcon size={17} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '120%',
          right: '0',
          width: '240px',
          background: 'var(--bg-card)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          padding: '1rem',
          zIndex: 1050,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Calculator</span>
            <button className="btn-icon" onClick={() => setIsOpen(false)} style={{ padding: '0.2rem' }}>
              <X size={14} />
            </button>
          </div>

          <div style={{
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            textAlign: 'right',
            border: '1px solid var(--glass-border)',
            minHeight: '60px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minHeight: '18px' }}>
              {equation}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {display}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.5rem'
          }}>
            {['7', '8', '9', '/'].map(btn => (
              <CalcBtn key={btn} val={btn} onClick={() => isNaN(btn) ? handleOp(btn) : handleNum(btn)} op={isNaN(btn)} />
            ))}
            {['4', '5', '6', '*'].map(btn => (
              <CalcBtn key={btn} val={btn} onClick={() => isNaN(btn) ? handleOp(btn) : handleNum(btn)} op={isNaN(btn)} />
            ))}
            {['1', '2', '3', '-'].map(btn => (
              <CalcBtn key={btn} val={btn} onClick={() => isNaN(btn) ? handleOp(btn) : handleNum(btn)} op={isNaN(btn)} />
            ))}
            {['C', '0', '=', '+'].map(btn => (
              <CalcBtn 
                key={btn} 
                val={btn} 
                onClick={() => {
                  if (btn === 'C') handleClear();
                  else if (btn === '=') handleCalc();
                  else if (btn === '+') handleOp(btn);
                  else handleNum(btn);
                }} 
                op={isNaN(btn) && btn !== 'C' && btn !== '='}
                primary={btn === '='}
                danger={btn === 'C'}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CalcBtn = ({ val, onClick, op, primary, danger }) => {
  let bg = 'rgba(255,255,255,0.05)';
  let color = 'var(--text-primary)';
  let border = '1px solid var(--glass-border)';

  if (primary) {
    bg = 'var(--primary)';
    color = '#fff';
    border = 'none';
  } else if (danger) {
    bg = 'rgba(239, 68, 68, 0.1)';
    color = 'var(--danger)';
    border = '1px solid rgba(239, 68, 68, 0.2)';
  } else if (op) {
    bg = 'rgba(255,255,255,0.1)';
    color = 'var(--secondary)';
  }

  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.5rem 0',
        borderRadius: 'var(--radius-sm)',
        background: bg,
        color: color,
        border: border,
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'var(--transition-fast)',
        fontSize: '0.9rem'
      }}
      onMouseOver={(e) => {
        if(!primary && !danger) e.target.style.background = 'rgba(255,255,255,0.15)';
      }}
      onMouseOut={(e) => {
        if(!primary && !danger) e.target.style.background = bg;
      }}
    >
      {val}
    </button>
  );
};

export default QuickCalculator;
