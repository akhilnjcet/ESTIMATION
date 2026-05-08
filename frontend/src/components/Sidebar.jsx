import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Package, FileText, Receipt, ArrowUpRight, ArrowDownRight, BookOpen, Wallet, Settings as SettingsIcon, LogOut, Shield as ShieldIcon } from 'lucide-react';
import ProgramSelector from './ProgramSelector';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h1 style={{ fontSize: '1rem', fontWeight: '800', margin: 0, color: '#fff', lineHeight: '1.2' }}>
            Welcome to <br /> Krishna Accounting
          </h1>
          <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Powered by Krishna IT Solutions
          </p>
          <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', margin: 0, fontStyle: 'italic' }}>
            a krishna group concern
          </p>
        </div>
      </div>
      
      <ProgramSelector />
      
      <nav className="sidebar-nav" style={{ overflowY: 'auto' }}>
        <NavLink to="/" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <LayoutDashboard />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/customers" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <Users />
          <span>Customers</span>
        </NavLink>
        <NavLink to="/products" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <Package />
          <span>Products</span>
        </NavLink>
        <NavLink to="/quotations" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <FileText />
          <span>Quotations</span>
        </NavLink>
        <NavLink to="/invoices" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <Receipt />
          <span>Invoices</span>
        </NavLink>

        <div style={{ margin: '1rem 0', borderTop: '1px solid var(--border)' }}></div>

        <NavLink to="/income" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <ArrowUpRight style={{ color: 'var(--secondary)' }} />
          <span>Income</span>
        </NavLink>
        <NavLink to="/expense" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <ArrowDownRight style={{ color: 'var(--danger)' }} />
          <span>Expense</span>
        </NavLink>
        <NavLink to="/accounts" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <Wallet />
          <span>Accounts & Balances</span>
        </NavLink>
        <NavLink to="/ledger" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <BookOpen />
          <span>Party Ledger</span>
        </NavLink>
        <NavLink to="/notes" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <FileText />
          <span>Quick Notes</span>
        </NavLink>
        {localStorage.getItem('role') === 'admin' && (
          <>
            <NavLink to="/user-access" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <ShieldIcon />
              <span>User Access</span>
            </NavLink>
            <NavLink to="/settings" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <SettingsIcon />
              <span>Settings</span>
            </NavLink>
          </>
        )}
      </nav>

      <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Version 2.1.0 - Enterprise</p>
          <p style={{ fontSize: '0.75rem', color: '#fff', margin: '0.25rem 0 0.75rem 0', fontWeight: 'bold' }}>Krishna Accounting</p>
          <button 
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-bold transition-colors"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
