import React from 'react';
import { useProgram } from '../context/ProgramContext';
import { ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProgramSelector = () => {
  const { programs, selectedProgram, selectProgram, loading } = useProgram();
  const navigate = useNavigate();

  return (
    <div className="program-selector" style={{ marginBottom: '1.25rem', padding: '0 0.25rem' }}>
      <label style={{ fontSize: '0.65rem', color: 'var(--sidebar-group-title)', marginBottom: '0.4rem', display: 'block', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Selected Program
      </label>
      <div style={{ position: 'relative' }}>
        <select 
          className="form-input"
          value={selectedProgram?._id || ''}
          onChange={(e) => {
            if (e.target.value === 'new') {
              navigate('/settings');
            } else {
              const program = programs?.find(p => p._id === e.target.value);
              if (program) selectProgram(program);
            }
          }}
          style={{ 
            appearance: 'none', 
            paddingRight: '2.2rem', 
            paddingLeft: '0.85rem',
            paddingTop: '0.55rem',
            paddingBottom: '0.55rem',
            border: '1px solid var(--glass-border)', 
            background: 'var(--sidebar-item-hover)', 
            color: 'var(--sidebar-title)', 
            borderRadius: '12px', 
            fontWeight: '700',
            fontSize: '0.825rem',
            width: '100%',
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          {loading ? (
            <option disabled value="">Loading Programs...</option>
          ) : Array.isArray(programs) && programs.length > 0 ? (
            programs.map(p => (
              <option key={p._id} value={p._id} style={{ background: 'var(--bg-card-solid)', color: 'var(--text-primary)' }}>{p.name}</option>
            ))
          ) : (
            <option disabled value="">No Programs Found</option>
          )}
          <option value="new" style={{ background: 'var(--bg-card-solid)', color: 'var(--primary)', fontWeight: 'bold' }}>+ Setup New Program</option>
        </select>
        <ChevronDown size={16} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
      </div>
    </div>
  );
};

export default ProgramSelector;
