import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const ProgramContext = createContext();

export const ProgramProvider = ({ children }) => {
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchPrograms = async () => {
      try {
        const { data } = await api.get('/programs');
        setPrograms(data);
        
        const savedProgramId = localStorage.getItem('programId');
        if (savedProgramId) {
          const found = data.find(p => p._id === savedProgramId);
          if (found) {
            setSelectedProgram(found);
          } else if (data.length > 0) {
            setSelectedProgram(data[0]);
            localStorage.setItem('programId', data[0]._id);
          }
        } else if (data.length > 0) {
          setSelectedProgram(data[0]);
          localStorage.setItem('programId', data[0]._id);
        }
      } catch (err) {
        console.error('Failed to fetch programs', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, [localStorage.getItem('token')]);

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
