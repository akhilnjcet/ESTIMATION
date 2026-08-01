import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  LayoutDashboard, Users, Package, FileText, Receipt, Truck, HardHat,
  ArrowUpRight, ArrowDownRight, BookOpen, Wallet, Settings as SettingsIcon,
  UserCheck, FileCode, StickyNote, Search, ToggleLeft, ToggleRight,
  Star, GripVertical, ChevronDown, ChevronUp, Eye, EyeOff,
  Sparkles, CheckCircle2, XCircle, RotateCcw, Save, Shield,
  Layers, Zap, Monitor
} from 'lucide-react';
import { ALL_MODULES, MODULE_CATEGORIES } from '../config/moduleRegistry';
import { useModules } from '../context/ModuleContext';
import { useProgram } from '../context/ProgramContext';

// ── Icon resolver ──────────────────────────────────────────────────────────
const ICON_MAP = {
  LayoutDashboard, Users, Package, FileText, Receipt, Truck, HardHat,
  ArrowUpRight, ArrowDownRight, BookOpen, Wallet, Settings: SettingsIcon,
  UserCheck, FileCode, StickyNote,
};
const getIcon = (name) => ICON_MAP[name] || FileText;

// ── Animated Toggle Switch ─────────────────────────────────────────────────
const ToggleSwitch = ({ enabled, onChange, disabled }) => {
  return (
    <motion.button
      onClick={disabled ? undefined : onChange}
      style={{
        width: '48px',
        height: '26px',
        borderRadius: '13px',
        background: enabled
          ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)'
          : 'rgba(255,255,255,0.1)',
        border: enabled ? 'none' : '1px solid rgba(255,255,255,0.15)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        padding: '2px',
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
        boxShadow: enabled ? '0 0 12px rgba(59,130,246,0.5)' : 'none',
      }}
      animate={{
        background: enabled
          ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)'
          : 'rgba(255,255,255,0.1)',
      }}
      transition={{ duration: 0.2 }}
      whileTap={disabled ? {} : { scale: 0.92 }}
    >
      <motion.div
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: enabled ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}
        animate={{ x: enabled ? 22 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
};

// ── Mini Live Preview Sidebar ─────────────────────────────────────────────
const LivePreview = ({ enabledModules, menuOrder, favoriteModules }) => {
  const role = localStorage.getItem('role') || 'admin';

  // Build ordered + filtered list
  const orderedModules = [...ALL_MODULES].sort((a, b) => {
    const ai = menuOrder.indexOf(a.id);
    const bi = menuOrder.indexOf(b.id);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const visibleModules = orderedModules.filter(
    (m) =>
      enabledModules.includes(m.id) &&
      (!m.adminOnly || role === 'admin')
  );

  // Group by category
  const grouped = MODULE_CATEGORIES.map((cat) => ({
    ...cat,
    items: visibleModules.filter((m) => m.categoryKey === cat.key),
  })).filter((g) => g.items.length > 0);

  return (
    <div
      style={{
        background: 'rgba(14, 23, 38, 0.95)',
        border: '1px solid rgba(59,130,246,0.25)',
        borderRadius: '16px',
        overflow: 'hidden',
        height: '100%',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Preview header */}
      <div
        style={{
          padding: '0.85rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <Monitor size={14} style={{ color: '#3B82F6' }} />
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: '800',
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Live Sidebar Preview
        </span>
      </div>

      {/* Mini logo */}
      <div
        style={{
          padding: '0.75rem 1rem 0.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={14} color="#FFF" />
          </div>
          <div>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: '800',
                color: '#FFF',
              }}
            >
              Krishna Smart
            </div>
            <div
              style={{
                fontSize: '0.55rem',
                color: '#3B82F6',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Enterprise ERP
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.5rem 0.6rem',
        }}
      >
        <AnimatePresence>
          {grouped.map((group) => (
            <motion.div
              key={group.key}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              style={{ marginBottom: '0.75rem' }}
            >
              <div
                style={{
                  fontSize: '0.55rem',
                  fontWeight: '800',
                  color: 'rgba(255,255,255,0.3)',
                  letterSpacing: '0.12em',
                  padding: '0.2rem 0.5rem',
                  marginBottom: '0.15rem',
                  textTransform: 'uppercase',
                }}
              >
                {group.label}
              </div>
              <AnimatePresence>
                {group.items.map((item) => {
                  const Icon = getIcon(item.iconName);
                  const isFav = favoriteModules.includes(item.id);
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.35rem 0.5rem',
                        borderRadius: '8px',
                        marginBottom: '0.1rem',
                        background: 'transparent',
                      }}
                    >
                      <Icon
                        size={12}
                        style={{ color: item.color || '#3B82F6', flexShrink: 0 }}
                      />
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          color: 'rgba(255,255,255,0.75)',
                          flex: 1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.label}
                      </span>
                      {isFav && (
                        <Star size={9} style={{ color: '#F59E0B', flexShrink: 0 }} />
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {grouped.length === 0 && (
          <div
            style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              color: 'rgba(255,255,255,0.2)',
              fontSize: '0.7rem',
            }}
          >
            No modules enabled
          </div>
        )}
      </div>
    </div>
  );
};

// ── Module Row inside each category ──────────────────────────────────────
const ModuleRow = ({ module, enabled, isFavorite, onToggle, onFavorite, readOnly }) => {
  const Icon = getIcon(module.iconName);

  return (
    <Reorder.Item
      value={module}
      id={module.id}
      style={{ listStyle: 'none' }}
    >
      <motion.div
        layout
        whileHover={readOnly ? {} : { y: -1, scale: 1.005 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          padding: '0.85rem 1rem',
          borderRadius: '12px',
          background: enabled ? 'rgba(59,130,246,0.05)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${enabled ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)'}`,
          marginBottom: '0.5rem',
          cursor: 'default',
          transition: 'background 0.2s, border-color 0.2s',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Enabled glow strip */}
        {enabled && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '3px',
              background: `linear-gradient(to bottom, #3B82F6, #8B5CF6)`,
              borderRadius: '12px 0 0 12px',
            }}
          />
        )}

        {/* Drag handle */}
        {!readOnly && (
          <div
            style={{
              color: 'rgba(255,255,255,0.2)',
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <GripVertical size={16} />
          </div>
        )}

        {/* Icon */}
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: enabled
              ? `linear-gradient(135deg, ${module.color || '#3B82F6'}22, ${module.color || '#3B82F6'}11)`
              : 'rgba(255,255,255,0.04)',
            border: `1px solid ${enabled ? (module.color || '#3B82F6') + '33' : 'rgba(255,255,255,0.06)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={17} style={{ color: enabled ? (module.color || '#3B82F6') : 'rgba(255,255,255,0.25)' }} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: '700',
              color: enabled ? 'var(--text-primary)' : 'rgba(255,255,255,0.35)',
              marginBottom: '0.15rem',
              transition: 'color 0.2s',
            }}
          >
            {module.label}
          </div>
          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {module.description}
          </div>
        </div>

        {/* Status badge */}
        <div
          style={{
            fontSize: '0.65rem',
            fontWeight: '700',
            padding: '0.2rem 0.6rem',
            borderRadius: '999px',
            background: enabled ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.1)',
            color: enabled ? '#22C55E' : '#EF444488',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}
        >
          {enabled ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
          {enabled ? 'ON' : 'OFF'}
        </div>

        {/* Favorite */}
        {!readOnly && (
          <motion.button
            onClick={() => onFavorite(module.id)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.85 }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isFavorite ? '#F59E0B' : 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              padding: '0.25rem',
              borderRadius: '6px',
              flexShrink: 0,
              transition: 'color 0.2s',
            }}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star size={15} fill={isFavorite ? '#F59E0B' : 'none'} />
          </motion.button>
        )}

        {/* Toggle */}
        <ToggleSwitch
          enabled={enabled}
          onChange={() => onToggle(module.id)}
          disabled={readOnly || module.id === 'dashboard'}
        />
      </motion.div>
    </Reorder.Item>
  );
};

// ── Category Card ─────────────────────────────────────────────────────────
const CategoryCard = ({
  category, modules, enabledModules, favoriteModules,
  onToggle, onFavorite, onReorder, readOnly, defaultExpanded,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const enabledCount = modules.filter((m) => enabledModules.includes(m.id)).length;
  const total = modules.length;

  const CATEGORY_ICONS = {
    core: Layers,
    billing: FileText,
    finance: Wallet,
    admin: Shield,
  };
  const CatIcon = CATEGORY_ICONS[category.key] || Layers;

  return (
    <motion.div
      layout
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--glass-border)',
        borderRadius: '18px',
        overflow: 'hidden',
        marginBottom: '1rem',
      }}
    >
      {/* Category header */}
      <motion.div
        onClick={() => setExpanded((p) => !p)}
        whileHover={{ background: 'rgba(59,130,246,0.04)' }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem 1.25rem',
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid var(--glass-border)' : 'none',
          transition: 'border-color 0.2s',
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
            border: '1px solid rgba(59,130,246,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CatIcon size={19} style={{ color: '#3B82F6' }} />
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: '0.9rem',
              fontWeight: '800',
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            {category.label}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
            {enabledCount} of {total} modules enabled
          </div>
        </div>

        {/* Progress pill */}
        <div
          style={{
            width: '80px',
            height: '6px',
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}
        >
          <motion.div
            animate={{ width: `${(enabledCount / total) * 100}%` }}
            transition={{ duration: 0.4 }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
              borderRadius: '999px',
            }}
          />
        </div>

        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          style={{ color: 'var(--text-muted)' }}
        >
          <ChevronDown size={18} />
        </motion.div>
      </motion.div>

      {/* Module rows */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '1rem 1.25rem' }}>
              <Reorder.Group
                axis="y"
                values={modules}
                onReorder={onReorder}
                style={{ padding: 0, margin: 0 }}
              >
                {modules.map((mod) => (
                  <ModuleRow
                    key={mod.id}
                    module={mod}
                    enabled={enabledModules.includes(mod.id)}
                    isFavorite={favoriteModules.includes(mod.id)}
                    onToggle={onToggle}
                    onFavorite={onFavorite}
                    readOnly={readOnly}
                  />
                ))}
              </Reorder.Group>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Main ModuleCustomization Component ────────────────────────────────────
const ModuleCustomization = () => {
  const {
    enabledModules, menuOrder, favoriteModules,
    toggleModule, setMenuOrder, toggleFavorite,
    enableAll, disableAll, resetDefaults, role,
  } = useModules();
  const { selectedProgram } = useProgram();

  const [searchQuery, setSearchQuery] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);

  const canEdit = role === 'admin';

  // Build per-category ordered module lists
  const getModulesForCategory = useCallback(
    (categoryKey) => {
      const catMods = ALL_MODULES.filter(
        (m) =>
          m.categoryKey === categoryKey &&
          (!m.adminOnly || role === 'admin') &&
          (searchQuery === '' ||
            m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      // Apply menuOrder sorting
      return catMods.sort((a, b) => {
        const ai = menuOrder.indexOf(a.id);
        const bi = menuOrder.indexOf(b.id);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });
    },
    [menuOrder, searchQuery, role]
  );

  const handleReorder = (categoryKey, newItems) => {
    // Build new full order by replacing the items in this category
    const otherIds = menuOrder.filter(
      (id) => !ALL_MODULES.find((m) => m.id === id && m.categoryKey === categoryKey)
    );
    const newOrder = [...otherIds];
    // Insert new category order at the right position
    const firstCatIdx = menuOrder.findIndex(
      (id) => ALL_MODULES.find((m) => m.id === id && m.categoryKey === categoryKey)
    );
    const insertAt = firstCatIdx === -1 ? newOrder.length : firstCatIdx;
    newOrder.splice(insertAt, 0, ...newItems.map((m) => m.id));
    setMenuOrder(newOrder);
  };

  const handleSave = () => {
    // State is already persisted live; this just gives user feedback
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2200);
  };

  const enabledCount = ALL_MODULES.filter(
    (m) => enabledModules.includes(m.id) && (!m.adminOnly || role === 'admin')
  ).length;
  const totalCount = ALL_MODULES.filter((m) => !m.adminOnly || role === 'admin').length;

  const visibleCategories = MODULE_CATEGORIES.filter((cat) => {
    if (cat.key === 'admin' && role !== 'admin') return false;
    return getModulesForCategory(cat.key).length > 0;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── Page Header ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.08) 100%)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: '20px',
          padding: '1.75rem 2rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(59,130,246,0.35)',
            }}
          >
            <Sparkles size={26} color="#FFF" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '900', margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Module Customization
            </h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {selectedProgram?.name
                ? `Configuring modules for ${selectedProgram.name}`
                : 'Choose which modules appear in the sidebar'}
            </p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: '900',
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1,
              }}
            >
              {enabledCount}
              <span style={{ fontSize: '1rem', color: 'var(--text-muted)', WebkitTextFillColor: 'var(--text-muted)' }}>
                /{totalCount}
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              modules enabled
            </div>
          </div>
        </div>
      </div>

      {/* ── Role Notice ── */}
      {!canEdit && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1.25rem',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '12px',
            fontSize: '0.85rem',
            color: '#F59E0B',
            fontWeight: '600',
          }}
        >
          <Shield size={18} />
          You have view-only access. Contact your administrator to customize modules.
        </motion.div>
      )}

      {/* ── Save Flash Notification ── */}
      <AnimatePresence>
        {savedFlash && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            style={{
              position: 'fixed',
              top: '5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(34,197,94,0.95)',
              color: '#FFF',
              padding: '0.75rem 1.5rem',
              borderRadius: '999px',
              fontWeight: '700',
              fontSize: '0.875rem',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 8px 24px rgba(34,197,94,0.4)',
            }}
          >
            <CheckCircle2 size={18} />
            Settings saved! Sidebar updated instantly.
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Search + Action Bar ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
        }}
      >
        {/* Search */}
        <div
          style={{
            flex: 1,
            minWidth: '220px',
            position: 'relative',
          }}
        >
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-card)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '0.7rem 1rem 0.7rem 2.6rem',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--glass-border)')}
          />
        </div>

        {/* Action buttons */}
        {canEdit && (
          <>
            <motion.button
              onClick={enableAll}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1rem',
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: '10px',
                color: '#22C55E',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Eye size={15} /> Enable All
            </motion.button>

            <motion.button
              onClick={disableAll}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1rem',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '10px',
                color: '#EF4444',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <EyeOff size={15} /> Disable All
            </motion.button>

            <motion.button
              onClick={resetDefaults}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1rem',
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: '10px',
                color: '#F59E0B',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <RotateCcw size={15} /> Reset Default
            </motion.button>

            <motion.button
              onClick={handleSave}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1.2rem',
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                border: 'none',
                borderRadius: '10px',
                color: '#FFF',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 14px rgba(59,130,246,0.35)',
              }}
            >
              <Save size={15} /> Save Changes
            </motion.button>
          </>
        )}
      </div>

      {/* ── Main 2-column Layout ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 280px',
          gap: '1.5rem',
          alignItems: 'start',
        }}
        className="module-customization-grid"
      >
        {/* Left — Category Cards */}
        <div>
          {visibleCategories.length === 0 ? (
            <div
              style={{
                padding: '3rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                background: 'var(--bg-card)',
                borderRadius: '18px',
                border: '1px solid var(--glass-border)',
              }}
            >
              <Search size={36} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                No modules match "{searchQuery}"
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {visibleCategories.map((cat, idx) => {
                const catModules = getModulesForCategory(cat.key);
                return (
                  <motion.div
                    key={cat.key}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                  >
                    <CategoryCard
                      category={cat}
                      modules={catModules}
                      enabledModules={enabledModules}
                      favoriteModules={favoriteModules}
                      onToggle={canEdit ? toggleModule : () => {}}
                      onFavorite={canEdit ? toggleFavorite : () => {}}
                      onReorder={(newItems) => handleReorder(cat.key, newItems)}
                      readOnly={!canEdit}
                      defaultExpanded={idx < 2}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Right — Live Preview Panel (sticky) */}
        <div style={{ position: 'sticky', top: '5rem' }}>
          <LivePreview
            enabledModules={enabledModules}
            menuOrder={menuOrder}
            favoriteModules={favoriteModules}
          />
        </div>
      </div>

      {/* Responsive style for the grid */}
      <style>{`
        @media (max-width: 900px) {
          .module-customization-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ModuleCustomization;
