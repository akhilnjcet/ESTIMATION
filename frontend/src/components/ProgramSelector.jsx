import React from 'react';
import { useProgram } from '../context/ProgramContext';
import { ChevronDown, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProgramSelector = () => {
  const { programs, selectedProgram, selectProgram, loading } = useProgram();
  const navigate = useNavigate();

  return (
    <div className="program-selector" style={{ marginBottom: '1.5rem', padding: '0 1rem' }}>
      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block', fontWeight: 'bold', textTransform: 'uppercase' }}>
        Selected Program
      </label>
      <div style={{ position: 'relative' }}>
        <select 
          className="form-control"
          value={selectedProgram?._id || ''}
          onChange={(e) => {
            if (e.target.value === 'new') {
              navigate('/settings');
            } else {
              const program = programs?.find(p => p._id === e.target.value);
              if (program) selectProgram(program);
            }
          }}
          style={{ appearance: 'none', paddingRight: '2.5rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: '8px', fontWeight: 'bold' }}
        >
          {loading ? (
            <option disabled value="">Loading Programs...</option>
          ) : Array.isArray(programs) && programs.length > 0 ? (
            programs.map(p => (
              <option key={p._id} value={p._id} style={{ color: '#000' }}>{p.name}</option>
            ))
          ) : (
            <option disabled value="">No Programs Found</option>
          )}
          <option value="new" style={{ color: '#000' }}>+ Setup New Program</option>
        </select>
        <ChevronDown size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(255,255,255,0.5)' }} />
      </div>
    </div>
  );
};

export default ProgramSelector;
