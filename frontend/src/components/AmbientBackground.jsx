import React from 'react';

const AmbientBackground = () => {
  return (
    <div 
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        background: 'var(--bg-main)',
        backgroundImage: `
          var(--bg-radial),
          linear-gradient(var(--bg-grid-line) 1px, transparent 1px),
          linear-gradient(90deg, var(--bg-grid-line) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 32px 32px, 32px 32px',
        transition: 'background 0.3s ease'
      }}
    />
  );
};

export default AmbientBackground;
