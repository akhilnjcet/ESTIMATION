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

export const ModuleProvider = ({ children }) => {
  const { selectedProgram } = useProgram();
  const role = localStorage.getItem('role') || 'admin';

  // ── helpers ────────────────────────────────────────────────────
  const storageKey = getModuleStorageKey(selectedProgram?._id);

  const loadFromStorage = useCallback(() => {
    // 1. If selectedProgram has saved enabledModules from database (and length > 0), use it!
    if (selectedProgram && Array.isArray(selectedProgram.enabledModules) && selectedProgram.enabledModules.length > 0) {
      const programModules = selectedProgram.enabledModules.includes('dashboard')
        ? selectedProgram.enabledModules
        : ['dashboard', ...selectedProgram.enabledModules];

      return {
        enabledModules: programModules,
        menuOrder: getDefaultMenuOrder(),
        favoriteModules: [],
      };
    }

    // 2. Check local storage cache
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.enabledModules) && parsed.enabledModules.length > 0) {
          return {
            enabledModules: parsed.enabledModules,
            menuOrder: parsed.menuOrder ?? getDefaultMenuOrder(),
            favoriteModules: parsed.favoriteModules ?? [],
          };
        }
      }
    } catch {
      /* ignore malformed data */
    }

    // 3. Fall back to all default modules
    return {
      enabledModules: getDefaultEnabledModules(),
      menuOrder: getDefaultMenuOrder(),
      favoriteModules: [],
    };
  }, [storageKey, selectedProgram]);

  // ── state ──────────────────────────────────────────────────────
  const [enabledModules, setEnabledModules] = useState(() => loadFromStorage().enabledModules);
  const [menuOrder, setMenuOrderState] = useState(() => loadFromStorage().menuOrder);
  const [favoriteModules, setFavoriteModules] = useState(() => loadFromStorage().favoriteModules);

  // Re-load whenever selected program changes
  useEffect(() => {
    const data = loadFromStorage();
    setEnabledModules(data.enabledModules);
    setMenuOrderState(data.menuOrder);
    setFavoriteModules(data.favoriteModules);
  }, [loadFromStorage, selectedProgram?._id, selectedProgram?.enabledModules]);

  // ── persistence ────────────────────────────────────────────────
  const persist = useCallback(
    (enabled, order, favorites) => {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          enabledModules: enabled,
          menuOrder: order,
          favoriteModules: favorites,
        })
      );

      // Also persist to backend database so viewers and other users inherit hidden module settings
      if (selectedProgram?._id) {
        api.put(`/programs/${selectedProgram._id}`, { enabledModules: enabled })
          .catch((err) => console.error('Failed to sync enabledModules to database:', err));
      }
    },
    [storageKey, selectedProgram?._id]
  );

  // ── actions ────────────────────────────────────────────────────
  const toggleModule = (moduleId) => {
    setEnabledModules((prev) => {
      const next = prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId];
      persist(next, menuOrder, favoriteModules);
      return next;
    });
  };

  const setMenuOrder = (newOrder) => {
    setMenuOrderState(newOrder);
    persist(enabledModules, newOrder, favoriteModules);
  };

  const toggleFavorite = (moduleId) => {
    setFavoriteModules((prev) => {
      const next = prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId];
      persist(enabledModules, menuOrder, next);
      return next;
    });
  };

  const enableAll = () => {
    const all = ALL_MODULES.map((m) => m.id);
    setEnabledModules(all);
    persist(all, menuOrder, favoriteModules);
  };

  const disableAll = () => {
    // Dashboard is always kept enabled so the user isn't locked out
    const next = ['dashboard'];
    setEnabledModules(next);
    persist(next, menuOrder, favoriteModules);
  };

  const resetDefaults = () => {
    const defaults = getDefaultEnabledModules();
    const order = getDefaultMenuOrder();
    const faves = [];
    setEnabledModules(defaults);
    setMenuOrderState(order);
    setFavoriteModules(faves);
    persist(defaults, order, faves);
  };

  const saveSettings = (newEnabled, newOrder, newFavorites) => {
    setEnabledModules(newEnabled);
    setMenuOrderState(newOrder);
    setFavoriteModules(newFavorites);
    persist(newEnabled, newOrder, newFavorites);
  };

  /** Returns true if a given path is accessible */
  const isPathEnabled = (pathname) => {
    if (pathname === '/' || pathname === '/login') return true;
    const mod = ALL_MODULES.find((m) => m.path === pathname);
    if (!mod) return true; // unknown routes pass through

    // If module is adminOnly, block non-admins
    if (mod.adminOnly && role !== 'admin') return false;

    // Strictly check if module is enabled in workspace
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
