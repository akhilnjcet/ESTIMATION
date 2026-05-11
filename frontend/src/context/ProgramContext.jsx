import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const ProgramContext = createContext();

export const ProgramProvider = ({ children }) => {
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrograms = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data } = await api.get('/programs');
        
        // Ensure data is an array
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
    };

    fetchPrograms();
    
    // Listen for storage changes (login/logout in other tabs)
    const handleStorage = () => fetchPrograms();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const selectProgram = (program) => {
    setSelectedProgram(program);
    localStorage.setItem('programId', program._id);
    window.location.reload(); // Reload to refresh all data with new programId header
  };

  return (
    <ProgramContext.Provider value={{ programs, selectedProgram, selectProgram, loading, setPrograms }}>
      {children}
    </ProgramContext.Provider>
  );
};

export const useProgram = () => useContext(ProgramContext);
