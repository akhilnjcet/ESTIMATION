import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, Package, FileText, Receipt, Truck, HardHat,
  ArrowUpRight, ArrowDownRight, BookOpen, Wallet, Settings as SettingsIcon, 
  LogOut, Shield as ShieldIcon, Download, FileCode, ChevronLeft, Sparkles
} from 'lucide-react';
import ProgramSelector from './ProgramSelector';
import logo from '../assets/logo.jpg';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const [deferredPrompt, setDeferredPrompt] = React.useState(null);
  const [showInstallBtn, setShowInstallBtn] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const navGroups = [
    {
      title: 'CORE MODULES',
      items: [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/customers', label: 'Customers', icon: Users },
        { path: '/products', label: 'Products & Inventory', icon: Package },
      ]
    },
    {
      title: 'BILLING & ESTIMATION',
      items: [
        { path: '/quotations', label: 'Quotations', icon: FileText },
        { path: '/invoices', label: 'Tax Invoices', icon: Receipt },
        { path: '/labour-bills', label: 'Labour Bills', icon: HardHat },
        { path: '/transport-bills', label: 'Transport Bills', icon: Truck },
      ]
    },
    {
      title: 'FINANCE & ACCOUNTS',
      items: [
        { path: '/income', label: 'Income Register', icon: ArrowUpRight, color: '#22C55E' },
        { path: '/expense', label: 'Expense Register', icon: ArrowDownRight, color: '#EF4444' },
        { path: '/accounts', label: 'Accounts & Balances', icon: Wallet, color: '#8B5CF6' },
        { path: '/ledger', label: 'Party Ledger', icon: BookOpen },
        { path: '/bill-upload', label: 'Bill Upload', icon: FileCode },
        { path: '/notes', label: 'Quick Notes', icon: FileText },
      ]
    }
  ];

  if (localStorage.getItem('role') === 'admin') {
    navGroups.push({
      title: 'ADMINISTRATION',
      items: [
        { path: '/user-access', label: 'User Access', icon: ShieldIcon },
        { path: '/settings', label: 'Settings', icon: SettingsIcon }
      ]
    });
  }

  return (
    <motion.aside 
      className="sidebar no-print"
      initial={false}
      animate={{
        width: isOpen ? 'var(--sidebar-width)' : '0px',
        opacity: isOpen ? 1 : 0
      }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        background: 'var(--sidebar-glass)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid var(--glass-border)',
        zIndex: 1100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'background 0.3s ease, border-color 0.3s ease'
      }}
    >
      {/* Header */}
      <div style={{ padding: '1.25rem 1.25rem 1rem 1.25rem', borderBottom: '1px solid var(--glass-border)', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <img 
                src={logo} 
                alt="Krishna Logo" 
                style={{ 
                  width: '50px', 
                  height: '50px', 
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.45))'
                }} 
              />
            </div>
            <div>
              <h1 style={{ fontSize: '0.95rem', fontWeight: '800', margin: 0, color: 'var(--sidebar-title)', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
                Krishna Smart
              </h1>
              <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Enterprise ERP
              </span>
            </div>
          </div>

          <button 
            onClick={() => setIsOpen(false)}
            style={{
              background: 'var(--sidebar-item-hover)',
              border: 'none',
              color: 'var(--text-muted)',
              borderRadius: '8px',
              padding: '0.35rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Collapse Sidebar"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>

      {/* Program Selector */}
      <div style={{ padding: '0.75rem 1rem' }}>
        <ProgramSelector />
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.85rem' }}>
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} style={{ marginBottom: '1.25rem' }}>
            <div style={{
              fontSize: '0.65rem',
              fontWeight: '800',
              color: 'var(--sidebar-group-title)',
              letterSpacing: '0.12em',
              padding: '0.35rem 0.75rem',
              marginBottom: '0.2rem'
            }}>
              {group.title}
            </div>

            {group.items.map((item, iIdx) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <motion.div key={iIdx} whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}>
                  <NavLink 
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: isActive ? '700' : '500',
                      color: isActive ? '#FFFFFF' : 'var(--sidebar-item-color)',
                      background: isActive ? 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' : 'transparent',
                      boxShadow: isActive ? '0 4px 15px rgba(59, 130, 246, 0.35)' : 'none',
                      transition: 'var(--transition-fast)',
                      marginBottom: '0.2rem',
                      textDecoration: 'none'
                    }}
                  >
                    <Icon size={17} style={{ color: isActive ? '#FFF' : (item.color || 'var(--primary)') }} />
                    <span>{item.label}</span>
                  </NavLink>
                </motion.div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Profile & Sign Out */}
      <div style={{ padding: '0.85rem 1rem', borderTop: '1px solid var(--glass-border)', background: 'var(--sidebar-footer-bg)' }}>
        <div style={{
          background: 'var(--sidebar-card-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: '14px',
          padding: '0.75rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--sidebar-title)', display: 'block' }}>Krishna ERP</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>v2.5.0 Enterprise</span>
            </div>
            <button 
              onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                padding: '0.35rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
