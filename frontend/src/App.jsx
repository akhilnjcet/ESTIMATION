import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Quotations from './pages/Quotations';
import Invoices from './pages/Invoices';
import Income from './pages/Income';
import Expense from './pages/Expense';
import Accounts from './pages/Accounts';
import Ledger from './pages/Ledger';
import Settings from './pages/Settings';
import Notes from './pages/Notes';
import UserAccess from './pages/UserAccess';
import Documents from './pages/Documents';
import { ProgramProvider } from './context/ProgramContext';
import { ShieldAlert } from 'lucide-react';

function PrivateRoute({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAccessBar, setShowAccessBar] = useState(true);
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role') || 'admin';
  const location = useLocation();

  useEffect(() => {
    document.body.setAttribute('data-role', role);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
    
    if (role === 'viewer') {
      const timer = setTimeout(() => setShowAccessBar(false), 4000);
      
      const handleInteraction = () => {
        setShowAccessBar(true);
        // Reset timer
        clearTimeout(window.accessBarTimer);
        window.accessBarTimer = setTimeout(() => setShowAccessBar(false), 3000);
      };

      window.addEventListener('mousedown', handleInteraction);
      window.addEventListener('touchstart', handleInteraction);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(window.accessBarTimer);
        window.removeEventListener('mousedown', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
      };
    }
  }, [role]);

  // Close sidebar on route change ONLY on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  }, [location.pathname]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="app-container">
      {role === 'viewer' && (
        <div 
          className={`access-bar ${showAccessBar ? 'show' : 'hide'}`}
          style={{ 
            position: 'fixed', 
            top: '1rem', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            background: 'rgba(254, 242, 242, 0.9)', 
            backdropFilter: 'blur(4px)',
            color: '#dc2626', 
            padding: '0.6rem 1.2rem', 
            borderRadius: '50px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            fontSize: '0.75rem', 
            fontWeight: 'bold', 
            zIndex: 9999, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: showAccessBar ? 1 : 0,
            pointerEvents: showAccessBar ? 'auto' : 'none'
          }}
        >
          <ShieldAlert size={14} />
          VIEW ONLY ACCESS - Permission restricted
        </div>
      )}
      
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && window.innerWidth < 1024 && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}
      
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="main-content">
        {/* Universal Header */}
        <div className="mobile-header">
          <button className="menu-toggle" onClick={toggleSidebar}>
            <span></span>
            <span></span>
            <span></span>
          </button>
          <span className="font-bold text-primary">Krishna ERP</span>
        </div>
        <div className="main-content-inner">
          {children}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <ProgramProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
          <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
          <Route path="/quotations" element={<PrivateRoute><Quotations /></PrivateRoute>} />
          <Route path="/invoices" element={<PrivateRoute><Invoices /></PrivateRoute>} />
          <Route path="/income" element={<PrivateRoute><Income /></PrivateRoute>} />
          <Route path="/expense" element={<PrivateRoute><Expense /></PrivateRoute>} />
          <Route path="/accounts" element={<PrivateRoute><Accounts /></PrivateRoute>} />
          <Route path="/ledger" element={<PrivateRoute><Ledger /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/notes" element={<PrivateRoute><Notes /></PrivateRoute>} />
          <Route path="/user-access" element={<PrivateRoute><UserAccess /></PrivateRoute>} />
          <Route path="/bill-upload" element={<PrivateRoute><Documents /></PrivateRoute>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </ProgramProvider>
  );
}

export default App;
