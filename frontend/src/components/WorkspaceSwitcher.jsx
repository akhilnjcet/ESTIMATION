import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, ChevronDown, Search, Star, Clock, Plus, MoreVertical,
  Edit3, Copy, Send, Users, Archive, Trash2, Settings, Layers, Activity,
  Check, Sparkles, Shield
} from 'lucide-react';
import { useProgram } from '../context/ProgramContext';
import { useNavigate } from 'react-router-dom';
import WorkspaceActionModal from './WorkspaceActionModal';

const WorkspaceSwitcher = () => {
  const {
    programs,
    selectedProgram,
    selectProgram,
    loading,
    favoriteIds,
    recentIds,
    toggleFavorite
  } = useProgram();

  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'favorites' | 'recents' | 'archived'
  const [actionMenuProgramId, setActionMenuProgramId] = useState(null);
  
  // Modal state
  const [modalType, setModalType] = useState(null);
  const [targetProgram, setTargetProgram] = useState(null);

  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setActionMenuProgramId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openModal = (type, prog) => {
    setModalType(type);
    setTargetProgram(prog);
    setActionMenuProgramId(null);
    setIsOpen(false);
  };

  // Filter programs
  const filterPrograms = () => {
    if (!Array.isArray(programs)) return [];
    
    return programs.filter((p) => {
      // Archive filter
      if (activeTab === 'archived') {
        if (p.status !== 'archived') return false;
      } else {
        if (p.status === 'archived') return false;
      }

      // Favorites filter
      if (activeTab === 'favorites' && !favoriteIds.includes(p._id)) {
        return false;
      }

      // Recents filter
      if (activeTab === 'recents' && !recentIds.includes(p._id)) {
        return false;
      }

      // Search filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const nameMatch = p.name.toLowerCase().includes(query);
        const emailMatch = p.email?.toLowerCase().includes(query);
        return nameMatch || emailMatch;
      }

      return true;
    });
  };

  const filteredPrograms = filterPrograms();

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%', marginBottom: '1.25rem' }}>
      <label style={{ fontSize: '0.65rem', color: 'var(--sidebar-group-title)', marginBottom: '0.4rem', display: 'block', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Workspace / Company
      </label>

      {/* ── Switcher Trigger Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.6rem 0.85rem',
          background: isOpen ? 'var(--primary-light)' : 'var(--sidebar-item-hover)',
          border: `1px solid ${isOpen ? 'var(--primary)' : 'var(--glass-border)'}`,
          borderRadius: '14px',
          color: 'var(--sidebar-title)',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen ? '0 4px 20px rgba(59,130,246,0.25)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: selectedProgram?.themeColor || 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: '0.95rem',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            {selectedProgram?.logo ? (
              <img src={selectedProgram.logo} alt="" style={{ width: '100%', height: '100%', borderRadius: '10px', objectFit: 'cover' }} />
            ) : (
              selectedProgram?.name ? selectedProgram.name[0].toUpperCase() : 'K'
            )}
          </div>

          <div style={{ textAlign: 'left', overflow: 'hidden' }}>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: '800',
                color: 'var(--sidebar-title)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: '1.2',
              }}
            >
              {loading ? 'Loading...' : selectedProgram?.name || 'Select Workspace'}
            </div>
            <span style={{ fontSize: '0.625rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Enterprise Unit
            </span>
          </div>
        </div>

        <ChevronDown
          size={16}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: 'var(--text-muted)',
            flexShrink: 0,
          }}
        />
      </button>

      {/* ── Switcher Dropdown Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              width: '100%',
              maxHeight: '380px',
              background: 'var(--bg-card-solid)',
              border: '1px solid var(--glass-border-hover)',
              borderRadius: '16px',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6)',
              zIndex: 1200,
              overflow: 'visible',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Search Input */}
            <div style={{ padding: '0.75rem 0.85rem 0.5rem', borderBottom: '1px solid var(--glass-border)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search workspaces..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--sidebar-item-hover)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '10px',
                    padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    outline: 'none',
                  }}
                  autoFocus
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', padding: '0.35rem 0.5rem', borderBottom: '1px solid var(--glass-border)', gap: '0.2rem', overflowX: 'auto', background: 'var(--sidebar-item-hover)' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'favorites', label: 'Starred' },
                { id: 'recents', label: 'Recent' },
                { id: 'archived', label: 'Archived' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: '1 0 auto',
                    padding: '0.3rem 0.5rem',
                    fontSize: '0.68rem',
                    fontWeight: '700',
                    borderRadius: '6px',
                    border: 'none',
                    background: activeTab === tab.id ? 'var(--primary-light)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Workspaces List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
              {filteredPrograms.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  No workspaces found
                </div>
              ) : (
                filteredPrograms.map((p) => {
                  const isSelected = selectedProgram?._id === p._id;
                  const isFav = favoriteIds.includes(p._id);

                  return (
                    <div
                      key={p._id}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '12px',
                        background: isSelected ? 'var(--primary-light)' : 'transparent',
                        marginBottom: '0.2rem',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                      onClick={() => {
                        selectProgram(p);
                        setIsOpen(false);
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'var(--sidebar-item-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* Left info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: p.themeColor || 'var(--primary)',
                            color: '#FFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '800',
                            fontSize: '0.8rem',
                            flexShrink: 0,
                          }}
                        >
                          {p.name[0].toUpperCase()}
                        </div>

                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: isSelected ? 'var(--primary)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.name}
                          </div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {p.isDuplicate ? 'Copied Workspace' : `ID: ${p._id.slice(-4).toUpperCase()}`}
                          </span>
                        </div>
                      </div>

                      {/* Right icons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleFavorite(p._id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: isFav ? '#F59E0B' : 'var(--text-muted)',
                            padding: '0.2rem',
                            display: 'flex',
                          }}
                        >
                          <Star size={13} fill={isFav ? '#F59E0B' : 'none'} />
                        </button>

                        <button
                          onClick={() => setActionMenuProgramId(actionMenuProgramId === p._id ? null : p._id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            padding: '0.2rem',
                            display: 'flex',
                          }}
                        >
                          <MoreVertical size={14} />
                        </button>
                      </div>

                      {/* Context Popover Menu */}
                      <AnimatePresence>
                        {actionMenuProgramId === p._id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: -6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: -6 }}
                            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: 'absolute',
                              right: '0.25rem',
                              top: '2.4rem',
                              width: '210px',
                              background: 'var(--bg-card-solid)',
                              border: '1px solid var(--glass-border-hover)',
                              borderRadius: '16px',
                              boxShadow: '0 20px 40px -8px rgba(0,0,0,0.7)',
                              zIndex: 1300,
                              overflow: 'hidden',
                            }}
                          >
                            {/* Workspace name header */}
                            <div style={{ padding: '0.75rem 0.85rem 0.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                              <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Workspace</div>
                              <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                            </div>

                            <div style={{ padding: '0.4rem' }}>

                              {/* ── Primary Action ── */}
                              <button
                                onClick={(e) => { e.stopPropagation(); selectProgram(p); setIsOpen(false); setActionMenuProgramId(null); }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16,185,129,0.12)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', width: '100%', padding: '0.55rem 0.65rem', border: 'none', background: 'transparent', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.15s' }}
                              >
                                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <Check size={14} style={{ color: '#10B981' }} />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#10B981' }}>Switch Here</div>
                                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Set as active workspace</div>
                                </div>
                              </button>

                              {/* ── Divider ── */}
                              <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.35rem 0' }} />

                              {/* ── Management Actions ── */}
                              <div style={{ fontSize: '0.62rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0.25rem 0.65rem 0.1rem' }}>Manage</div>

                              {[
                                { label: 'Rename', sub: 'Change workspace name', icon: Edit3, color: '#6366F1', bg: 'rgba(99,102,241,0.12)', action: () => openModal('rename', p) },
                                { label: 'Duplicate', sub: 'Copy this workspace', icon: Copy, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', action: () => openModal('duplicate', p) },
                                { label: 'Share & Roles', sub: 'Manage user access', icon: Users, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', action: () => openModal('share', p) },
                                { label: 'Settings', sub: 'Workspace preferences', icon: Settings, color: '#64748B', bg: 'rgba(100,116,139,0.12)', action: () => { setIsOpen(false); navigate('/settings'); } },
                              ].map((item, idx) => {
                                const IconComp = item.icon;
                                return (
                                  <button
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); item.action(); }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--sidebar-item-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', width: '100%', padding: '0.45rem 0.65rem', border: 'none', background: 'transparent', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.15s' }}
                                  >
                                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <IconComp size={13} style={{ color: item.color }} />
                                    </div>
                                    <div style={{ textAlign: 'left' }}>
                                      <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-primary)' }}>{item.label}</div>
                                      <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)' }}>{item.sub}</div>
                                    </div>
                                  </button>
                                );
                              })}

                              {/* ── Divider ── */}
                              <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.35rem 0' }} />

                              {/* ── Danger Zone ── */}
                              <div style={{ fontSize: '0.62rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0.25rem 0.65rem 0.1rem' }}>Danger Zone</div>

                              {[
                                { label: p.status === 'archived' ? 'Restore Workspace' : 'Archive', sub: p.status === 'archived' ? 'Move back to active' : 'Hide from main list', icon: Archive, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', action: () => openModal('archive', p) },
                                { label: 'Delete Workspace', sub: 'Permanently remove', icon: Trash2, color: '#EF4444', bg: 'rgba(239,68,68,0.12)', action: () => openModal('delete', p) },
                              ].map((item, idx) => {
                                const IconComp = item.icon;
                                return (
                                  <button
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); item.action(); }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--sidebar-item-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', width: '100%', padding: '0.45rem 0.65rem', border: 'none', background: 'transparent', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.15s' }}
                                  >
                                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <IconComp size={13} style={{ color: item.color }} />
                                    </div>
                                    <div style={{ textAlign: 'left' }}>
                                      <div style={{ fontSize: '0.78rem', fontWeight: '700', color: item.color }}>{item.label}</div>
                                      <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)' }}>{item.sub}</div>
                                    </div>
                                  </button>
                                );
                              })}

                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>

            {/* Panel Footer */}
            <div style={{ padding: '0.6rem 0.75rem', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.15)' }}>
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/settings');
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  color: '#FFF',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                }}
              >
                <Plus size={15} /> Create New Workspace
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Operation Modals */}
      <WorkspaceActionModal
        isOpen={!!modalType}
        onClose={() => setModalType(null)}
        modalType={modalType}
        program={targetProgram}
      />
    </div>
  );
};

export default WorkspaceSwitcher;
