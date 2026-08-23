import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import {
  ALL_MODULES,
  getModuleStorageKey,
  getDefaultEnabledModules,
  getDefaultMenuOrder,
} from '../config/moduleRegistry';
import { useProgram } from './ProgramContext';
import api from '../utils/api';

const ModuleContext = createContext();

/**
 * Derive enabled modules for the current program.
 * Priority:
 *   1. program.enabledModules from database (if array with items)
 *   2. All default-enabled modules (fallback for unconfigured programs)
 * 
 * NEVER uses localStorage as the source of truth for visibility — only for
 * menu order and favorites which are purely cosmetic.
 */
function deriveEnabledModules(selectedProgram) {
  if (
    selectedProgram &&
    Array.isArray(selectedProgram.enabledModules) &&
    selectedProgram.enabledModules.length > 0
  ) {
    // Always ensure dashboard is present
    if (!selectedProgram.enabledModules.includes('dashboard')) {
      return ['dashboard', ...selectedProgram.enabledModules];
    }
    return selectedProgram.enabledModules;
  }
  // No custom config saved yet → show all default enabled modules
  return getDefaultEnabledModules();
}

export const ModuleProvider = ({ children }) => {
  const { selectedProgram, updateProgramModules } = useProgram();
  const role = localStorage.getItem('role') || 'admin';

  const storageKey = getModuleStorageKey(selectedProgram?._id);

  // ── Load cosmetic prefs (menu order & favorites) from localStorage ─────────
  const loadCosmeticPrefs = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          menuOrder: Array.isArray(parsed.menuOrder) ? parsed.menuOrder : getDefaultMenuOrder(),
          favoriteModules: Array.isArray(parsed.favoriteModules) ? parsed.favoriteModules : [],
        };
      }
    } catch { /* ignore */ }
    return { menuOrder: getDefaultMenuOrder(), favoriteModules: [] };
  }, [storageKey]);

  // ── State ──────────────────────────────────────────────────────────────────
  // enabledModules is derived from selectedProgram — single source of truth
  const [enabledModules, setEnabledModules] = useState(() => deriveEnabledModules(null));
  const [menuOrder, setMenuOrderState] = useState(() => loadCosmeticPrefs().menuOrder);
  const [favoriteModules, setFavoriteModules] = useState(() => loadCosmeticPrefs().favoriteModules);

  // Re-derive enabledModules every time selectedProgram changes
  useEffect(() => {
    const derived = deriveEnabledModules(selectedProgram);
    setEnabledModules(derived);
  }, [selectedProgram, selectedProgram?.enabledModules]);

  // Re-load cosmetic prefs when program changes
  useEffect(() => {
    const prefs = loadCosmeticPrefs();
    setMenuOrderState(prefs.menuOrder);
    setFavoriteModules(prefs.favoriteModules);
  }, [loadCosmeticPrefs, selectedProgram?._id]);

  // ── Persistence ────────────────────────────────────────────────────────────
  // Saves enabled modules to DB (authoritative) AND cosmetic prefs to localStorage
  const persistEnabled = useCallback(async (enabled) => {
    // Update local state immediately
    setEnabledModules(enabled);

    // Sync to MongoDB — this is what viewers read on login
    if (selectedProgram?._id) {
      try {
        const { data: updated } = await api.put(`/programs/${selectedProgram._id}`, { enabledModules: enabled });
        const savedModules = updated?.enabledModules ?? enabled;
        // Update React state in ProgramContext so selectedProgram.enabledModules is correct
        updateProgramModules(selectedProgram._id, savedModules);
      } catch (err) {
        console.error('Failed to sync enabledModules to database:', err);
      }
    }
  }, [selectedProgram, updateProgramModules]);

  const persistCosmetic = useCallback((order, favorites) => {
    localStorage.setItem(storageKey, JSON.stringify({
      menuOrder: order,
      favoriteModules: favorites,
    }));
  }, [storageKey]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const toggleModule = (moduleId) => {
    const next = enabledModules.includes(moduleId)
      ? enabledModules.filter((id) => id !== moduleId)
      : [...enabledModules, moduleId];
    persistEnabled(next);
  };

  const setMenuOrder = (newOrder) => {
    setMenuOrderState(newOrder);
    persistCosmetic(newOrder, favoriteModules);
  };

  const toggleFavorite = (moduleId) => {
    const next = favoriteModules.includes(moduleId)
      ? favoriteModules.filter((id) => id !== moduleId)
      : [...favoriteModules, moduleId];
    setFavoriteModules(next);
    persistCosmetic(menuOrder, next);
  };

  const enableAll = () => {
    const all = ALL_MODULES.map((m) => m.id);
    persistEnabled(all);
  };

  const disableAll = () => {
    persistEnabled(['dashboard']);
  };

  const resetDefaults = () => {
    const defaults = getDefaultEnabledModules();
    persistEnabled(defaults);
    const order = getDefaultMenuOrder();
    setMenuOrderState(order);
    setFavoriteModules([]);
    persistCosmetic(order, []);
  };

  const saveSettings = (newEnabled, newOrder, newFavorites) => {
    persistEnabled(newEnabled);
    setMenuOrderState(newOrder);
    setFavoriteModules(newFavorites);
    persistCosmetic(newOrder, newFavorites);
  };

  /** Returns true if a given path is accessible for current user */
  const isPathEnabled = (pathname) => {
    if (pathname === '/' || pathname === '/login') return true;
    const mod = ALL_MODULES.find((m) => m.path === pathname);
    if (!mod) return true;

    // Block adminOnly routes from non-admins always
    if (mod.adminOnly && role !== 'admin') return false;

    // Block noViewer routes from viewers
    if (mod.noViewer && role === 'viewer') return false;

    // Strict check — module must be in the enabled list
    return enabledModules.includes(mod.id);
  };

  return (
    <ModuleContext.Provider
      value={{
        enabledModules,
        menuOrder,
        favoriteModules,
        toggleModule,
        setMenuOrder,
        toggleFavorite,
        enableAll,
        disableAll,
        resetDefaults,
        saveSettings,
        isPathEnabled,
        role,
      }}
    >
      {children}
    </ModuleContext.Provider>
  );
};

export const useModules = () => useContext(ModuleContext);
