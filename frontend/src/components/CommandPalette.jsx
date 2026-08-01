import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, LayoutDashboard, Users, Package, FileText, Receipt, Truck, 
  ArrowUpRight, ArrowDownRight, Wallet, BookOpen, Settings, Shield, FileCode, X
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, category: 'Main' },
  { name: 'Customers Directory', path: '/customers', icon: Users, category: 'Main' },
  { name: 'Products & Inventory', path: '/products', icon: Package, category: 'Main' },
  { name: 'Quotations Builder', path: '/quotations', icon: FileText, category: 'Billing' },
  { name: 'Tax Invoices', path: '/invoices', icon: Receipt, category: 'Billing' },
  { name: 'Labour Bills', path: '/labour-bills', icon: Truck, category: 'Billing' },
  { name: 'Income Register', path: '/income', icon: ArrowUpRight, category: 'Finance' },
  { name: 'Expense Register', path: '/expense', icon: ArrowDownRight, category: 'Finance' },
  { name: 'Accounts & Balances', path: '/accounts', icon: Wallet, category: 'Finance' },
  { name: 'Party Ledger', path: '/ledger', icon: BookOpen, category: 'Finance' },
  { name: 'Bill Upload & Documents', path: '/bill-upload', icon: FileCode, category: 'Tools' },
  { name: 'Quick Notes', path: '/notes', icon: FileText, category: 'Tools' },
  { name: 'User Access Control', path: '/user-access', icon: Shield, category: 'System' },
  { name: 'System Settings', path: '/settings', icon: Settings, category: 'System' },
];

const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open via parent or event
          window.dispatchEvent(new CustomEvent('open-command-palette'));
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = navItems.filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path) => {
    navigate(path);
    onClose();
    setQuery('');
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(12px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '640px',
          background: 'var(--card-bg-solid)',
          border: '1px solid var(--glass-border-hover)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          margin: '0 1rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
          <Search size={20} style={{ color: 'var(--primary)', marginRight: '1rem' }} />
          <input 
            type="text"
            placeholder="Type a command or search modules..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '1.1rem',
              fontWeight: '500'
            }}
          />
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              color: 'var(--text-muted)',
              padding: '0.4rem 0.6rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '0.75rem' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No matching modules or commands found for "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    marginBottom: '0.25rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--primary-light)';
                    e.currentTarget.style.color = 'var(--primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(37, 99, 235, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)'
                    }}>
                      <Icon size={18} />
                    </div>
                    <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{item.name}</span>
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '20px',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'var(--text-muted)',
                    fontWeight: '600'
                  }}>
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div style={{
          padding: '0.75rem 1.5rem',
          background: 'rgba(0,0,0,0.15)',
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <span>Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>ESC</kbd> to exit</span>
          <span>Krishna ERP Quick Navigator</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
