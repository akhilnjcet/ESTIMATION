import React from 'react';
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
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role') || 'admin';
  const location = useLocation();

  React.useEffect(() => {
    document.body.setAttribute('data-role', role);
  }, [role]);

  // Close sidebar on route change (mobile)
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="app-container">
      {role === 'viewer' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#fef2f2', color: '#dc2626', padding: '0.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', zIndex: 9999, borderBottom: '1px solid #fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={14} />
          VIEW ONLY ACCESS - You do not have permission to add, edit or delete records.
        </div>
      )}
      
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}
      
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="main-content" style={{ marginTop: role === 'viewer' ? '2.5rem' : '0' }}>
        {/* Mobile Header */}
        <div className="mobile-header">
          <button className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>
            <div style={{ width: 20, height: 2, background: 'currentColor', marginBottom: 4 }}></div>
            <div style={{ width: 20, height: 2, background: 'currentColor', marginBottom: 4 }}></div>
            <div style={{ width: 20, height: 2, background: 'currentColor' }}></div>
          </button>
          <span className="font-bold text-primary">Krishna ERP</span>
        </div>
        {children}
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
