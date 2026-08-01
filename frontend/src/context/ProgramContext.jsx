import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../utils/api';

const ProgramContext = createContext();

// ── Local Storage helpers for favorites and recents ────────────────────────
const FAV_KEY  = 'erp_favorite_programs';
const REC_KEY  = 'erp_recent_programs';
const MAX_RECENT = 5;

const loadFavorites = () => {
  try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch { return []; }
};
const loadRecents = () => {
  try { return JSON.parse(localStorage.getItem(REC_KEY)) || []; } catch { return []; }
};
const saveFavorites = (ids) => localStorage.setItem(FAV_KEY, JSON.stringify(ids));
const saveRecents   = (ids) => localStorage.setItem(REC_KEY, JSON.stringify(ids));

// ── Activity Log helpers ────────────────────────────────────────────────────
const LOG_KEY = 'erp_workspace_log';
const loadLog = () => { try { return JSON.parse(localStorage.getItem(LOG_KEY)) || []; } catch { return []; } };
const appendLog = (entry) => {
  const log = loadLog();
  log.unshift({ ...entry, timestamp: new Date().toISOString() });
  localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(0, 100))); // keep last 100
};

// ─────────────────────────────────────────────────────────────────────────────

export const ProgramProvider = ({ children }) => {
  const [programs, setPrograms]               = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [favoriteIds, setFavoriteIds]         = useState(loadFavorites);
  const [recentIds, setRecentIds]             = useState(loadRecents);

  // ── Fetch all programs ────────────────────────────────────────────────────
  const fetchPrograms = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    try {
      setLoading(true);
      const { data } = await api.get('/programs');
      const programList = Array.isArray(data) ? data : [];
      setPrograms(programList);

      const savedProgramId = localStorage.getItem('programId');
      if (savedProgramId && programList.length > 0) {
        const found = programList.find(p => p._id === savedProgramId);
        if (found) {
          setSelectedProgram(found);
        } else {
          setSelectedProgram(programList[0]);
          localStorage.setItem('programId', programList[0]._id);
        }
      } else if (programList.length > 0) {
        setSelectedProgram(programList[0]);
        localStorage.setItem('programId', programList[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch programs', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
    const handleStorage = () => fetchPrograms();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [fetchPrograms]);

  // ── Select program & track recents ───────────────────────────────────────
  const selectProgram = (program) => {
    setSelectedProgram(program);
    localStorage.setItem('programId', program._id);

    // Track recents
    setRecentIds(prev => {
      const next = [program._id, ...prev.filter(id => id !== program._id)].slice(0, MAX_RECENT);
      saveRecents(next);
      return next;
    });

    window.location.reload();
  };

  // ── Favorites ─────────────────────────────────────────────────────────────
  const toggleFavorite = (programId) => {
    setFavoriteIds(prev => {
      const next = prev.includes(programId)
        ? prev.filter(id => id !== programId)
        : [...prev, programId];
      saveFavorites(next);
      return next;
    });
  };

  // ── Create program ────────────────────────────────────────────────────────
  const createProgram = async (data) => {
    const { data: newProg } = await api.post('/programs', data);
    appendLog({ action: 'Created', programName: newProg.name, programId: newProg._id });
    await fetchPrograms();
    return newProg;
  };

  // ── Rename program ────────────────────────────────────────────────────────
  const renameProgram = async (programId, newName) => {
    const { data: updated } = await api.put(`/programs/${programId}`, { name: newName });
    appendLog({ action: 'Renamed', programName: newName, programId });
    setPrograms(prev => prev.map(p => p._id === programId ? { ...p, name: newName } : p));
    if (selectedProgram?._id === programId) setSelectedProgram(prev => ({ ...prev, name: newName }));
    return updated;
  };

  // ── Archive / Restore ─────────────────────────────────────────────────────
  const setArchiveStatus = async (programId, status) => {
    const { data: updated } = await api.put(`/programs/${programId}/archive`, { status });
    const action = status === 'archived' ? 'Archived' : 'Restored';
    appendLog({ action, programName: updated.name, programId });
    setPrograms(prev => prev.map(p => p._id === programId ? { ...p, status } : p));
    // If we archived the currently selected one, switch to another active program
    if (status === 'archived' && selectedProgram?._id === programId) {
      const next = programs.find(p => p._id !== programId && p.status !== 'archived');
      if (next) selectProgram(next);
    }
    return updated;
  };

  // ── Duplicate program ─────────────────────────────────────────────────────
  const duplicateProgram = async (programId, targetEmail = null) => {
    const body = targetEmail ? { targetEmail } : {};
    const { data: copy } = await api.post(`/programs/${programId}/duplicate`, body);
    appendLog({ action: 'Duplicated', programName: copy.name, programId: copy._id });
    await fetchPrograms();
    return copy;
  };

  // ── Transfer program ──────────────────────────────────────────────────────
  const transferProgram = async (programId, targetEmail, keepAccess, duplicateAndTransfer) => {
    const { data } = await api.post(`/programs/${programId}/transfer`, {
      targetEmail, keepAccess, duplicateAndTransfer
    });
    appendLog({ action: 'Transferred', programName: data.program?.name, programId });
    await fetchPrograms();
    return data;
  };

  // ── Share / Revoke ────────────────────────────────────────────────────────
  const shareProgram = async (programId, email, role) => {
    const { data } = await api.post(`/programs/${programId}/share`, { email, role });
    appendLog({ action: 'Shared', programName: data.program?.name, programId, withUser: email, role });
    setPrograms(prev => prev.map(p => p._id === programId ? data.program : p));
    if (selectedProgram?._id === programId) setSelectedProgram(data.program);
    return data;
  };

  const revokeShare = async (programId, userId) => {
    await api.delete(`/programs/${programId}/share/${userId}`);
    appendLog({ action: 'Access Revoked', programId });
    await fetchPrograms();
  };

  // ── Delete program (password verified on backend) ─────────────────────────
  const deleteProgram = async (programId, password) => {
    const prog = programs.find(p => p._id === programId);
    await api.delete(`/programs/${programId}`, { data: { password } });
    appendLog({ action: 'Deleted', programName: prog?.name, programId });
    setPrograms(prev => prev.filter(p => p._id !== programId));
    if (selectedProgram?._id === programId) {
      const next = programs.find(p => p._id !== programId && p.status !== 'archived');
      if (next) {
        setSelectedProgram(next);
        localStorage.setItem('programId', next._id);
        window.location.reload();
      }
    }
  };

  // ── Activity log ──────────────────────────────────────────────────────────
  const getActivityLog = () => loadLog();

  return (
    <ProgramContext.Provider value={{
      // Existing (unchanged)
      programs,
      selectedProgram,
      selectProgram,
      loading,
      setPrograms,
      refreshPrograms: fetchPrograms,

      // New workspace management
      favoriteIds,
      recentIds,
      toggleFavorite,
      createProgram,
      renameProgram,
      setArchiveStatus,
      duplicateProgram,
      transferProgram,
      shareProgram,
      revokeShare,
      deleteProgram,
      getActivityLog,
    }}>
      {children}
    </ProgramContext.Provider>
  );
};

export const useProgram = () => useContext(ProgramContext);
