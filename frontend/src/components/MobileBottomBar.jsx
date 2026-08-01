import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, FileText, Users, Menu } from 'lucide-react';

const MobileBottomBar = ({ onToggleSidebar }) => {
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '1rem',
        left: '1rem',
        right: '1rem',
        zIndex: 990,
        background: 'var(--sidebar-glass)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)',
        borderRadius: '24px',
        padding: '0.6rem 1rem',
        display: 'flex',
        justify: 'space-around',
        alignItems: 'center',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
      }}
      className="mobile-bottom-bar"
    >
      <NavLink 
        to="/" 
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        style={({ isActive }) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.2rem',
          fontSize: '0.65rem',
          fontWeight: '600',
          color: isActive ? 'var(--primary)' : 'var(--text-muted)'
        })}
      >
        <LayoutDashboard size={20} />
        <span>Home</span>
      </NavLink>

      <NavLink 
        to="/invoices" 
        style={({ isActive }) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.2rem',
          fontSize: '0.65rem',
          fontWeight: '600',
          color: isActive ? 'var(--primary)' : 'var(--text-muted)'
        })}
      >
        <Receipt size={20} />
        <span>Invoices</span>
      </NavLink>

      <NavLink 
        to="/quotations" 
        style={({ isActive }) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.2rem',
          fontSize: '0.65rem',
          fontWeight: '600',
          color: isActive ? 'var(--primary)' : 'var(--text-muted)'
        })}
      >
        <FileText size={20} />
        <span>Quotes</span>
      </NavLink>

      <NavLink 
        to="/customers" 
        style={({ isActive }) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.2rem',
          fontSize: '0.65rem',
          fontWeight: '600',
          color: isActive ? 'var(--primary)' : 'var(--text-muted)'
        })}
      >
        <Users size={20} />
        <span>Parties</span>
      </NavLink>

      <button
        onClick={onToggleSidebar}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.2rem',
          fontSize: '0.65rem',
          fontWeight: '600',
          color: 'var(--text-muted)',
          background: 'none',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        <Menu size={20} />
        <span>Menu</span>
      </button>
    </div>
  );
};

export default MobileBottomBar;
