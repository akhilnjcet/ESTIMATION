import React, { useState, useEffect } from 'react';
import { 
  Search, Sun, Moon, Bell, Menu, Shield, User, Clock, Command
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ toggleSidebar, onOpenCommandPalette }) => {
  const { theme, toggleTheme } = useTheme();
  const [time, setTime] = useState(new Date());
  const role = localStorage.getItem('role') || 'admin';
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header 
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'var(--glass-header)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)',
        padding: '0.75rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'var(--transition-normal)'
      }}
    >
      {/* Left section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={toggleSidebar}
          className="btn-icon"
          title="Toggle Navigation Menu"
        >
          <Menu size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.825rem', fontWeight: '500' }}>
          <Clock size={15} style={{ color: 'var(--primary)' }} />
          <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{formattedTime}</span>
          <span className="navbar-date-text" style={{ opacity: 0.4 }}>|</span>
          <span className="navbar-date-text" style={{ color: 'var(--text-muted)' }}>{formattedDate}</span>
        </div>
      </div>

      {/* Center Search Trigger */}
      <div 
        onClick={onOpenCommandPalette}
        className="navbar-search-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-full)',
          padding: '0.45rem 1.1rem',
          width: '100%',
          maxWidth: '360px',
          cursor: 'pointer',
          transition: 'var(--transition-fast)',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <Search size={15} style={{ color: 'var(--text-muted)' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.825rem', flex: 1 }}>
          Quick Search...
        </span>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.2rem',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid var(--glass-border)',
          borderRadius: '6px',
          padding: '0.15rem 0.4rem',
          fontSize: '0.675rem',
          fontWeight: '700',
          color: 'var(--text-secondary)'
        }}>
          <Command size={10} /> K
        </div>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <button 
          onClick={toggleTheme}
          className="btn-icon"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={17} style={{ color: '#F59E0B' }} /> : <Moon size={17} style={{ color: '#8B5CF6' }} />}
        </button>

        <div style={{ position: 'relative' }}>
          <button className="btn-icon" title="Notifications">
            <Bell size={17} />
          </button>
          <span style={{
            position: 'absolute',
            top: '3px',
            right: '3px',
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: 'var(--danger)',
            boxShadow: '0 0 6px var(--danger)'
          }} />
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-full)',
          padding: '0.3rem 0.8rem 0.3rem 0.35rem',
          marginLeft: '0.2rem'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: '800',
            fontSize: '0.8rem'
          }}>
            {user.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.1' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {user.name || 'Krishna Admin'}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase' }}>
              {role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
