import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import CommandPalette from './components/CommandPalette';
import AmbientBackground from './components/AmbientBackground';
import PageTransition from './components/PageTransition';
import { ThemeProvider } from './context/ThemeContext';
import { ProgramProvider } from './context/ProgramContext';
import { ModuleProvider, useModules } from './context/ModuleContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Quotations from './pages/Quotations';
import Invoices from './pages/Invoices';
import LabourBills from './pages/LabourBills';
import Income from './pages/Income';
import Expense from './pages/Expense';
import Accounts from './pages/Accounts';
import Ledger from './pages/Ledger';
import Settings from './pages/Settings';
import Notes from './pages/Notes';
import UserAccess from './pages/UserAccess';
import AdminSettings from './pages/AdminSettings';
import Documents from './pages/Documents';
import { ShieldAlert, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Disabled Module Toast ─────────────────────────────────────────────────
function DisabledModuleToast({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          style={{
            position: 'fixed',
            top: '5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(239, 68, 68, 0.95)',
            backdropFilter: 'blur(12px)',
            color: '#FFFFFF',
            padding: '0.75rem 1.5rem',
            borderRadius: '999px',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.45)',
            fontSize: '0.85rem',
            fontWeight: '700',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            whiteSpace: 'nowrap',
          }}
        >
          <Ban size={16} />
          This module has been disabled by your administrator.
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── PrivateRoute ──────────────────────────────────────────────────────────
function PrivateRoute({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showAccessBar, setShowAccessBar] = useState(true);
  const [showDisabledToast, setShowDisabledToast] = useState(false);

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role') || 'admin';
  const location = useLocation();

  const { isPathEnabled } = useModules();

  // Show disabled module toast when redirected from a disabled path
  useEffect(() => {
    if (location.state?.disabledModule) {
      setShowDisabledToast(true);
      // Clear the state so it doesn't re-show on next nav
      window.history.replaceState({}, '');
      const timer = setTimeout(() => setShowDisabledToast(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useEffect(() => {
    document.body.setAttribute('data-role', role);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }

    if (role === 'viewer') {
      const timer = setTimeout(() => setShowAccessBar(false), 4000);
      const handleInteraction = () => {
        setShowAccessBar(true);
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

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleCustomOpen = () => setIsCommandPaletteOpen(true);
    window.addEventListener('open-command-palette', handleCustomOpen);
    return () => window.removeEventListener('open-command-palette', handleCustomOpen);
  }, []);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ── Route protection: redirect disabled modules ──
  if (!isPathEnabled(location.pathname)) {
    return <Navigate to="/" state={{ disabledModule: true }} replace />;
  }

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  return (
    <div className={`app-container ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
      <AmbientBackground />

      {/* Disabled module toast */}
      <DisabledModuleToast show={showDisabledToast} />

      {role === 'viewer' && (
        <div
          className={`access-bar ${showAccessBar ? 'show' : 'hide'}`}
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            background: 'rgba(239, 68, 68, 0.95)',
            backdropFilter: 'blur(12px)',
            color: '#FFFFFF',
            padding: '0.6rem 1.4rem',
            borderRadius: '50px',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)',
            fontSize: '0.75rem',
            fontWeight: '800',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: showAccessBar ? 1 : 0,
            pointerEvents: showAccessBar ? 'auto' : 'none',
          }}
        >
          <ShieldAlert size={16} />
          RESTRICTED VIEW-ONLY ACCESS
        </div>
      )}

      {/* Mobile Sidebar Backdrop Overlay */}
      {isSidebarOpen && window.innerWidth < 1024 && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(11, 18, 32, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1050,
          }}
        />
      )}

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="main-content">
        <Navbar
          toggleSidebar={toggleSidebar}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />
        <div className="main-content-inner">
          <PageTransition key={location.pathname}>
            {children}
          </PageTransition>
        </div>
      </main>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}

// ── Admin Only Route Guard ────────────────────────────────────────────────
function AdminOnlyRoute({ children }) {
  const role = localStorage.getItem('role') || 'user';
  if (role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}

// ── App Root ──────────────────────────────────────────────────────────────
function App() {
  return (
    <ThemeProvider>
      <ProgramProvider>
        <ModuleProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route path="/"                element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/customers"       element={<PrivateRoute><Customers /></PrivateRoute>} />
              <Route path="/products"        element={<PrivateRoute><Products /></PrivateRoute>} />
              <Route path="/quotations"      element={<PrivateRoute><Quotations /></PrivateRoute>} />
              <Route path="/invoices"        element={<PrivateRoute><Invoices /></PrivateRoute>} />
              <Route path="/labour-bills"    element={<PrivateRoute><LabourBills category="Labour" /></PrivateRoute>} />
              <Route path="/transport-bills" element={<PrivateRoute><LabourBills category="Transport" /></PrivateRoute>} />
              <Route path="/income"          element={<PrivateRoute><Income /></PrivateRoute>} />
              <Route path="/expense"         element={<PrivateRoute><Expense /></PrivateRoute>} />
              <Route path="/accounts"        element={<PrivateRoute><Accounts /></PrivateRoute>} />
              <Route path="/ledger"          element={<PrivateRoute><Ledger /></PrivateRoute>} />
              <Route path="/settings"        element={<PrivateRoute><Settings /></PrivateRoute>} />
              <Route path="/notes"           element={<PrivateRoute><Notes /></PrivateRoute>} />
              <Route path="/user-access"     element={<PrivateRoute><AdminOnlyRoute><UserAccess /></AdminOnlyRoute></PrivateRoute>} />
              <Route path="/login-manager"   element={<PrivateRoute><AdminOnlyRoute><UserAccess /></AdminOnlyRoute></PrivateRoute>} />
              <Route path="/admin-settings"  element={<PrivateRoute><AdminOnlyRoute><AdminSettings /></AdminOnlyRoute></PrivateRoute>} />
              <Route path="/bill-upload"     element={<PrivateRoute><Documents /></PrivateRoute>} />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
        </ModuleProvider>
      </ProgramProvider>
    </ThemeProvider>
  );
}

export default App;
