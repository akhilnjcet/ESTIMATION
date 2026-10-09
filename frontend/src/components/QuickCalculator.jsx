import React, { useState, useEffect, useRef } from 'react';
import { Calculator as CalcIcon, X, Minus, Delete, RotateCcw } from 'lucide-react';

const QuickCalculator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  
  // Dragging state
  const [position, setPosition] = useState({ x: 20, y: 80 }); // default position
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const calculatorRef = useRef(null);

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
      let finalEquation = equation + display;
      // replace × and ÷ for eval
      finalEquation = finalEquation.replace(/×/g, '*').replace(/÷/g, '/');
      // eslint-disable-next-line
      const result = eval(finalEquation);
      // format result to avoid long decimals
      const formattedResult = Number.isInteger(result) ? result : parseFloat(result.toFixed(8));
      
      if (equation.trim() !== '') {
        setHistory(prev => [...prev, { eq: equation + display, res: formattedResult }]);
      }
      
      setDisplay(String(formattedResult));
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

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleToggleSign = () => {
    if (display !== '0' && display !== 'Error') {
      setDisplay(display.startsWith('-') ? display.substring(1) : '-' + display);
    }
  };

  const handlePercent = () => {
    if (display !== 'Error') {
      setDisplay(String(parseFloat(display) / 100));
    }
  };

  // Keyboard Support & Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showHistory) setShowHistory(false);
        else setIsOpen(false);
      }
      
      if (!isOpen || showHistory) return;

      const key = e.key;
      if (/[0-9.]/.test(key)) {
        handleNum(key);
      } else if (key === '+' || key === '-') {
        handleOp(key);
      } else if (key === '*' || key === 'x') {
        handleOp('×');
      } else if (key === '/') {
        handleOp('÷');
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleCalc();
      } else if (key === 'Backspace') {
        handleBackspace();
      } else if (key.toLowerCase() === 'c') {
        handleClear();
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, display, equation, showHistory]);

  // Drag handlers
  const handlePointerDown = (e) => {
    if (e.target.closest('.calc-btn') || e.target.closest('.calc-controls')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (isDragging) {
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;
      
      // Keep within screen bounds
      if (calculatorRef.current) {
        const rect = calculatorRef.current.getBoundingClientRect();
        newX = Math.max(0, Math.min(newX, window.innerWidth - rect.width));
        newY = Math.max(0, Math.min(newY, window.innerHeight - rect.height));
      }
      
      setPosition({ x: newX, y: newY });
    }
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
  };

  return (
    <>
      {/* Toggle Button */}
      <button 
        className="btn-icon" 
        onClick={() => setIsOpen(!isOpen)}
        title="Quick Calculator"
        style={{ 
          background: isOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          position: 'relative',
          zIndex: 1040
        }}
      >
        <CalcIcon size={17} />
      </button>

      {/* Calculator Window */}
      <div 
        ref={calculatorRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          display: isOpen ? 'flex' : 'none',
          position: 'fixed',
          top: position.y,
          left: position.x,
          width: '280px',
          maxWidth: 'calc(100vw - 20px)',
          background: 'rgba(20, 20, 20, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          padding: '1.2rem',
          zIndex: 1050,
          flexDirection: 'column',
          gap: '1rem',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          touchAction: 'none', // prevent scrolling while dragging
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        {/* Header Controls */}
        <div className="calc-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'default' }}>
          <button className="btn-icon" onClick={() => setShowHistory(!showHistory)} style={{ padding: '0.4rem', color: showHistory ? '#fff' : 'var(--text-secondary)' }} title="History">
            <RotateCcw size={16} />
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-icon" onClick={() => setIsOpen(false)} style={{ padding: '0.4rem', color: 'var(--text-secondary)' }} title="Minimize">
              <Minus size={16} />
            </button>
            <button className="btn-icon" onClick={() => setIsOpen(false)} style={{ padding: '0.4rem', color: 'var(--text-secondary)' }} title="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Display */}
        <div style={{
          padding: '0.5rem 0.5rem',
          textAlign: 'right',
          minHeight: '80px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          cursor: 'default'
        }}>
          <div style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.6)', minHeight: '24px', letterSpacing: '1px' }}>
            {equation}
          </div>
          <div style={{ fontSize: '3rem', fontWeight: '400', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '1.1' }}>
            {display}
          </div>
        </div>

        {/* Keypad or History */}
        {showHistory ? (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: '320px', paddingRight: '4px' }}>
            {history.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: '2rem' }}>No history yet</div>
            ) : (
              history.map((item, i) => (
                <div key={i} style={{ textAlign: 'right', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s' }} 
                     onClick={() => { setDisplay(String(item.res)); setShowHistory(false); setEquation(''); }}
                     onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                     onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{item.eq}</div>
                  <div style={{ fontSize: '1.2rem', color: '#fff' }}>= {item.res}</div>
                </div>
              ))
            )}
            {history.length > 0 && (
              <button onClick={() => setHistory([])} style={{ marginTop: 'auto', background: 'rgba(239, 68, 68, 0.15)', color: '#ff4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.75rem', borderRadius: '12px', cursor: 'pointer', fontWeight: '500' }}>Clear History</button>
            )}
          </div>
        ) : (
          <div className="calc-btn" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px',
            cursor: 'default'
          }}>
          {/* Row 1 */}
          <CalcBtn icon={<Delete size={20} />} onClick={handleBackspace} type="secondary" />
          <CalcBtn val="AC" onClick={handleClear} type="secondary" />
          <CalcBtn val="%" onClick={handlePercent} type="secondary" />
          <CalcBtn val="÷" onClick={() => handleOp('÷')} type="operator" />
          
          {/* Row 2 */}
          <CalcBtn val="7" onClick={() => handleNum('7')} />
          <CalcBtn val="8" onClick={() => handleNum('8')} />
          <CalcBtn val="9" onClick={() => handleNum('9')} />
          <CalcBtn val="×" onClick={() => handleOp('×')} type="operator" />
          
          {/* Row 3 */}
          <CalcBtn val="4" onClick={() => handleNum('4')} />
          <CalcBtn val="5" onClick={() => handleNum('5')} />
          <CalcBtn val="6" onClick={() => handleNum('6')} />
          <CalcBtn val="-" onClick={() => handleOp('-')} type="operator" />
          
          {/* Row 4 */}
          <CalcBtn val="1" onClick={() => handleNum('1')} />
          <CalcBtn val="2" onClick={() => handleNum('2')} />
          <CalcBtn val="3" onClick={() => handleNum('3')} />
          <CalcBtn val="+" onClick={() => handleOp('+')} type="operator" />
          
          {/* Row 5 */}
          <CalcBtn val="+/-" onClick={handleToggleSign} type="number" />
          <CalcBtn val="0" onClick={() => handleNum('0')} />
          <CalcBtn val="." onClick={() => handleNum('.')} />
          <CalcBtn val="=" onClick={handleCalc} type="operator" />
        </div>
        )}
      </div>
    </>
  );
};

const CalcBtn = ({ val, icon, onClick, type = 'number' }) => {
  let bg = 'rgba(255, 255, 255, 0.15)';
  let color = '#fff';

  if (type === 'operator') {
    bg = '#ff9f0a';
    color = '#fff';
  } else if (type === 'secondary') {
    bg = 'rgba(255, 255, 255, 0.3)';
    color = '#fff';
  }

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        aspectRatio: '1/1',
        borderRadius: '50%',
        background: bg,
        color: color,
        border: 'none',
        fontWeight: type === 'operator' ? '600' : '400',
        fontSize: '1.4rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.1s ease',
        userSelect: 'none'
      }}
      onPointerDown={(e) => {
        e.currentTarget.style.filter = 'brightness(1.3)';
      }}
      onPointerUp={(e) => {
        e.currentTarget.style.filter = 'none';
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.filter = 'none';
      }}
    >
      {icon || val}
    </button>
  );
};

export default QuickCalculator;
