import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Package, FileText, Receipt, Truck, HardHat,
  ArrowUpRight, ArrowDownRight, BookOpen, Wallet, Settings as SettingsIcon,
  LogOut, UserCheck, FileCode, StickyNote, ChevronLeft, Star, Shield, CalendarRange, BadgeCheck
} from 'lucide-react';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import logo from '../assets/logo.jpg';
import { useModules } from '../context/ModuleContext';
import { ALL_MODULES, MODULE_CATEGORIES } from '../config/moduleRegistry';

// ── Icon resolver ──────────────────────────────────────────────────────────
const ICON_MAP = {
  LayoutDashboard, Users, Package, FileText, Receipt, Truck, HardHat,
  ArrowUpRight, ArrowDownRight, BookOpen, Wallet, Settings: SettingsIcon,
  UserCheck, FileCode, StickyNote, Shield, CalendarRange, BadgeCheck
};
const getIcon = (name) => ICON_MAP[name] || FileText;

import { useProgram } from '../context/ProgramContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const [deferredPrompt, setDeferredPrompt] = React.useState(null);
  const [showInstallBtn, setShowInstallBtn] = React.useState(false);
  const location = useLocation();
  const { enabledModules, menuOrder, favoriteModules } = useModules();
  const { selectedProgram } = useProgram();
  const role = localStorage.getItem('role') || 'admin';

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

  // ── Compute the authoritative module list ─────────────────────
  // Use program's enabledModules from DB if available (most up-to-date),
  // otherwise fall back to context state.
  const authoritativeEnabled = (
    selectedProgram &&
    Array.isArray(selectedProgram.enabledModules) &&
    selectedProgram.enabledModules.length > 0
  )
    ? selectedProgram.enabledModules
    : enabledModules;

  // ── Build dynamic nav groups ───────────────────────────────────
  // Sort all modules by menuOrder
  const orderedModules = [...ALL_MODULES].sort((a, b) => {
    const ai = menuOrder.indexOf(a.id);
    const bi = menuOrder.indexOf(b.id);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  // Filter: only enabled + role-appropriate modules
  const visibleModules = orderedModules.filter(
    (m) =>
      authoritativeEnabled.includes(m.id) &&
      (!m.adminOnly || role === 'admin')
  );

  // Group by category — only include categories that have ≥1 visible module
  const navGroups = MODULE_CATEGORIES
    .map((cat) => ({
      title: cat.label,
      key: cat.key,
      items: visibleModules.filter((m) => m.categoryKey === cat.key),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <motion.aside
      className="sidebar no-print"
      initial={false}
      animate={{
        x: isOpen ? 0 : -280,
        opacity: isOpen ? 1 : 0,
      }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 'var(--sidebar-width)',
        background: 'var(--sidebar-glass)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid var(--glass-border)',
        zIndex: 1100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible',
        pointerEvents: isOpen ? 'auto' : 'none',
        transition: 'background 0.3s ease, border-color 0.3s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1.25rem 1.25rem 1rem 1.25rem',
          borderBottom: '1px solid var(--glass-border)',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={logo}
                alt="Krishna Logo"
                style={{
                  width: '50px',
                  height: '50px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.45))',
                }}
              />
            </div>
            <div>
              <h1
                style={{
                  fontSize: '0.95rem',
                  fontWeight: '800',
                  margin: 0,
                  color: 'var(--sidebar-title)',
                  letterSpacing: '-0.02em',
                  lineHeight: '1.2',
                }}
              >
                Krishna Smart Solutions
              </h1>
              <div
                style={{
                  fontSize: '0.62rem',
                  color: 'var(--primary)',
                  fontWeight: '700',
                  letterSpacing: '0.02em',
                  lineHeight: '1.2',
                  marginTop: '0.15rem'
                }}
              >
                Powered by Krishna IT Solution
              </div>
              <div
                style={{
                  fontSize: '0.58rem',
                  color: 'var(--text-muted)',
                  fontWeight: '600',
                  letterSpacing: '0.02em',
                  lineHeight: '1.2'
                }}
              >
                A Krishna Group Concern
              </div>
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
              alignItems: 'center',
            }}
            title="Collapse Sidebar"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>

      {/* Workspace Switcher */}
      <div style={{ padding: '0.75rem 1rem', position: 'relative', zIndex: 1200 }}>
        <WorkspaceSwitcher />
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.85rem' }}>
        <AnimatePresence initial={false}>
          {navGroups.map((group, gIdx) => (
            <motion.div
              key={group.key}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              style={{ marginBottom: '1.25rem', overflow: 'hidden' }}
            >
              <div
                style={{
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  color: 'var(--sidebar-group-title)',
                  letterSpacing: '0.12em',
                  padding: '0.35rem 0.75rem',
                  marginBottom: '0.2rem',
                }}
              >
                {group.title}
              </div>

              <AnimatePresence initial={false}>
                {group.items.map((item) => {
                  const Icon = getIcon(item.iconName);
                  const isActive = location.pathname === item.path;
                  const isFav = favoriteModules.includes(item.id);

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.18 }}
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.98 }}
                    >
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
                          background: isActive
                            ? 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)'
                            : 'transparent',
                          boxShadow: isActive
                            ? '0 4px 15px rgba(59, 130, 246, 0.35)'
                            : 'none',
                          transition: 'var(--transition-fast)',
                          marginBottom: '0.2rem',
                          textDecoration: 'none',
                        }}
                      >
                        <Icon
                          size={17}
                          style={{
                            color: isActive ? '#FFF' : (item.color || 'var(--primary)'),
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {isFav && (
                          <Star
                            size={11}
                            fill={isActive ? '#FFF' : '#F59E0B'}
                            style={{ color: isActive ? '#FFF' : '#F59E0B', flexShrink: 0 }}
                          />
                        )}
                      </NavLink>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {navGroups.length === 0 && (
          <div
            style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
            }}
          >
            No modules enabled.
          </div>
        )}
      </nav>

      {/* Footer Profile & Sign Out */}
      <div
        style={{
          padding: '0.85rem 1rem',
          borderTop: '1px solid var(--glass-border)',
          background: 'var(--sidebar-footer-bg)',
        }}
      >
        <div
          style={{
            background: 'var(--sidebar-card-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '14px',
            padding: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: '700',
                  color: 'var(--sidebar-title)',
                  display: 'block',
                }}
              >
                Powered by Krishna IT Solution
              </span>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                A Krishna Group Concern
              </span>
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                padding: '0.35rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
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
