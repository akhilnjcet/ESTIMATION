import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import CommandPalette from './components/CommandPalette';
import AmbientBackground from './components/AmbientBackground';
import PageTransition from './components/PageTransition';
import { ThemeProvider } from './context/ThemeContext';
import { ProgramProvider } from './context/ProgramContext';
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
import Documents from './pages/Documents';
import { ShieldAlert } from 'lucide-react';

function PrivateRoute({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showAccessBar, setShowAccessBar] = useState(true);
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role') || 'admin';
  const location = useLocation();

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

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className={`app-container ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
      <AmbientBackground />

      {role === 'viewer' && (
        <div 
          className={`access-bar ${showAccessBar ? 'show' : 'hide'}`}
          style={{ 
            position: 'fixed', 
            top: '1rem', 
            left: '50%', 
            transform: 'translateX(-50%)', 
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
            pointerEvents: showAccessBar ? 'auto' : 'none'
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
            zIndex: 1050
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

function App() {
  return (
    <ThemeProvider>
      <ProgramProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
            <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
            <Route path="/quotations" element={<PrivateRoute><Quotations /></PrivateRoute>} />
            <Route path="/invoices" element={<PrivateRoute><Invoices /></PrivateRoute>} />
            <Route path="/labour-bills" element={<PrivateRoute><LabourBills category="Labour" /></PrivateRoute>} />
            <Route path="/transport-bills" element={<PrivateRoute><LabourBills category="Transport" /></PrivateRoute>} />
            <Route path="/income" element={<PrivateRoute><Income /></PrivateRoute>} />
            <Route path="/expense" element={<PrivateRoute><Expense /></PrivateRoute>} />
            <Route path="/accounts" element={<PrivateRoute><Accounts /></PrivateRoute>} />
            <Route path="/ledger" element={<PrivateRoute><Ledger /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/notes" element={<PrivateRoute><Notes /></PrivateRoute>} />
            <Route path="/user-access" element={<PrivateRoute><UserAccess /></PrivateRoute>} />
            <Route path="/login-manager" element={<PrivateRoute><UserAccess /></PrivateRoute>} />
            <Route path="/bill-upload" element={<PrivateRoute><Documents /></PrivateRoute>} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </ProgramProvider>
    </ThemeProvider>
  );
}

export default App;
