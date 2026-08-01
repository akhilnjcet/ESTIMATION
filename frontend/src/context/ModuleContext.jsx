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
    // If selectedProgram has saved enabledModules from database, use it!
    if (selectedProgram && Array.isArray(selectedProgram.enabledModules) && selectedProgram.enabledModules.length > 0) {
      return {
        enabledModules: selectedProgram.enabledModules,
        menuOrder: getDefaultMenuOrder(),
        favoriteModules: [],
      };
    }

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          enabledModules: parsed.enabledModules ?? getDefaultEnabledModules(role),
          menuOrder: parsed.menuOrder ?? getDefaultMenuOrder(),
          favoriteModules: parsed.favoriteModules ?? [],
        };
      }
    } catch {
      /* ignore malformed data */
    }
    return {
      enabledModules: getDefaultEnabledModules(role),
      menuOrder: getDefaultMenuOrder(),
      favoriteModules: [],
    };
  }, [storageKey, role, selectedProgram]);

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
    const all = ALL_MODULES
      .filter((m) => !m.adminOnly || role === 'admin')
      .map((m) => m.id);
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
    const defaults = getDefaultEnabledModules(role);
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
