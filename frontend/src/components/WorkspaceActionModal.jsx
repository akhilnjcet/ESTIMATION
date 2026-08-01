import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Edit3, Copy, Send, Users, Archive, Trash2, Activity,
  CheckCircle2, AlertTriangle, Shield, Mail, Key, Sparkles, RefreshCw
} from 'lucide-react';
import { useProgram } from '../context/ProgramContext';

const WorkspaceActionModal = ({ isOpen, onClose, modalType, program }) => {
  const {
    renameProgram,
    duplicateProgram,
    transferProgram,
    shareProgram,
    revokeShare,
    setArchiveStatus,
    deleteProgram,
    getActivityLog
  } = useProgram();

  // Form states
  const [name, setName] = useState(program?.name || '');
  const [targetEmail, setTargetEmail] = useState('');
  const [duplicateOption, setDuplicateOption] = useState('same'); // 'same' | 'other'
  const [transferMode, setTransferMode] = useState('direct'); // 'direct' | 'duplicate'
  const [keepAccess, setKeepAccess] = useState(true);
  const [shareRole, setShareRole] = useState('viewer');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sync state when program changes
  React.useEffect(() => {
    if (program) {
      setName(program.name || '');
    }
    setError('');
    setSuccess('');
    setPassword('');
    setTargetEmail('');
  }, [program, modalType, isOpen]);

  if (!isOpen || !program) return null;

  const handleRename = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      await renameProgram(program._id, name.trim());
      setSuccess('Program renamed successfully!');
      setTimeout(() => { onClose(); }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to rename program');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (e) => {
    e.preventDefault();
    if (duplicateOption === 'other' && !targetEmail.trim()) {
      setError('Please enter a target email address');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const email = duplicateOption === 'other' ? targetEmail.trim() : null;
      await duplicateProgram(program._id, email);
      setSuccess('Program duplicated successfully!');
      setTimeout(() => { onClose(); }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to duplicate program');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!targetEmail.trim()) {
      setError('Please enter the target user email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const duplicateAndTransfer = transferMode === 'duplicate';
      await transferProgram(program._id, targetEmail.trim(), keepAccess, duplicateAndTransfer);
      setSuccess('Program ownership transferred successfully!');
      setTimeout(() => { onClose(); }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to transfer program');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!targetEmail.trim()) {
      setError('Please enter email to share with');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await shareProgram(program._id, targetEmail.trim(), shareRole);
      setSuccess(`Access granted to ${targetEmail} as ${shareRole}`);
      setTargetEmail('');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to share program');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeShare = async (userId) => {
    setLoading(true);
    setError('');
    try {
      await revokeShare(program._id, userId);
      setSuccess('Access revoked');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to revoke access');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    setLoading(true);
    setError('');
    try {
      const newStatus = program.status === 'archived' ? 'active' : 'archived';
      await setArchiveStatus(program._id, newStatus);
      setSuccess(`Program ${newStatus === 'archived' ? 'archived' : 'restored'} successfully!`);
      setTimeout(() => { onClose(); }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required for program deletion');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await deleteProgram(program._id, password);
      setSuccess('Program deleted successfully');
      setTimeout(() => { onClose(); }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete program');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (modalType) {
      case 'rename': return 'Rename Program';
      case 'duplicate': return 'Duplicate Program Workspace';
      case 'transfer': return 'Transfer Program Ownership';
      case 'share': return 'Share & Collaborate';
      case 'archive': return program.status === 'archived' ? 'Restore Program' : 'Archive Program';
      case 'delete': return 'Delete Program';
      case 'activity': return 'Workspace Activity Log';
      default: return 'Program Operations';
    }
  };

  const getIcon = () => {
    switch (modalType) {
      case 'rename': return Edit3;
      case 'duplicate': return Copy;
      case 'transfer': return Send;
      case 'share': return Users;
      case 'archive': return Archive;
      case 'delete': return Trash2;
      case 'activity': return Activity;
      default: return Sparkles;
    }
  };

  const IconComp = getIcon();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(11, 18, 32, 0.8)',
        backdropFilter: 'blur(12px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--bg-card-solid)',
          border: '1px solid var(--glass-border)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF',
              }}
            >
              <IconComp size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                {getTitle()}
              </h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {program.name}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              color: 'var(--text-muted)',
              padding: '0.4rem',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
          {error && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                fontSize: '0.825rem',
                fontWeight: '600',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#22C55E',
                fontSize: '0.825rem',
                fontWeight: '600',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <CheckCircle2 size={16} />
              {success}
            </div>
          )}

          {/* RENAME MODAL */}
          {modalType === 'rename' && (
            <form onSubmit={handleRename}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">New Program Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Krishna Traders"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="btn-gradient"
                disabled={loading}
                style={{ width: '100%', padding: '0.75rem' }}
              >
                {loading ? 'Renaming...' : 'Save New Name'}
              </button>
            </form>
          )}

          {/* DUPLICATE MODAL */}
          {modalType === 'duplicate' && (
            <form onSubmit={handleDuplicate}>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Duplicating creates an independent copy of this program workspace.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Duplicate Target:
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="dupTarget"
                    value="same"
                    checked={duplicateOption === 'same'}
                    onChange={() => setDuplicateOption('same')}
                  />
                  <span>Same Account (My Workspaces)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="dupTarget"
                    value="other"
                    checked={duplicateOption === 'other'}
                    onChange={() => setDuplicateOption('other')}
                  />
                  <span>Another Registered User</span>
                </label>
              </div>

              {duplicateOption === 'other' && (
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Recipient User Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    placeholder="user@company.com"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                className="btn-gradient"
                disabled={loading}
                style={{ width: '100%', padding: '0.75rem' }}
              >
                {loading ? 'Duplicating...' : 'Create Copy'}
              </button>
            </form>
          )}

          {/* TRANSFER MODAL */}
          {modalType === 'transfer' && (
            <form onSubmit={handleTransfer}>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Transfer ownership of "{program.name}" to another user.
              </p>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">New Owner Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="newowner@company.com"
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Transfer Mode:
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="transMode"
                    value="direct"
                    checked={transferMode === 'direct'}
                    onChange={() => setTransferMode('direct')}
                  />
                  <span>Transfer Ownership (Direct Transfer)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="transMode"
                    value="duplicate"
                    checked={transferMode === 'duplicate'}
                    onChange={() => setTransferMode('duplicate')}
                  />
                  <span>Duplicate & Transfer Copy (Keep Original)</span>
                </label>
              </div>

              {transferMode === 'direct' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={keepAccess}
                    onChange={(e) => setKeepAccess(e.target.checked)}
                  />
                  <span>Retain View-Only Access after Transfer</span>
                </label>
              )}

              <button
                type="submit"
                className="btn-gradient"
                disabled={loading}
                style={{ width: '100%', padding: '0.75rem' }}
              >
                {loading ? 'Processing Transfer...' : 'Confirm Transfer'}
              </button>
            </form>
          )}

          {/* SHARE MODAL */}
          {modalType === 'share' && (
            <div>
              <form onSubmit={handleShare} style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">User Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Permission Role</label>
                    <select
                      className="form-input"
                      value={shareRole}
                      onChange={(e) => setShareRole(e.target.value)}
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="editor">Editor</option>
                      <option value="accountant">Accountant</option>
                      <option value="sales">Sales</option>
                      <option value="staff">Staff</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-gradient"
                  disabled={loading}
                  style={{ width: '100%', padding: '0.65rem' }}
                >
                  {loading ? 'Adding...' : 'Invite User to Workspace'}
                </button>
              </form>

              {/* Shared users list */}
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Collaborators & Shared Access
                </h4>

                {(!program.sharedUsers || program.sharedUsers.length === 0) ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No users currently have shared access to this workspace.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {program.sharedUsers.map((su, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.6rem 0.85rem',
                          borderRadius: '10px',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--glass-border)',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', display: 'block' }}>
                            {su.userId?.email || su.userId?.name || su.userId || 'Shared User'}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'capitalize' }}>
                            Role: {su.role || 'Viewer'}
                          </span>
                        </div>

                        <button
                          onClick={() => handleRevokeShare(su.userId?._id || su.userId)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#EF4444',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ARCHIVE MODAL */}
          {modalType === 'archive' && (
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                {program.status === 'archived'
                  ? `Restoring "${program.name}" will make it visible in the workspace switcher again.`
                  : `Archiving "${program.name}" will hide it from the active workspace switcher. Nothing will be deleted.`}
              </p>

              <button
                onClick={handleArchive}
                className="btn-gradient"
                disabled={loading}
                style={{ width: '100%', padding: '0.75rem' }}
              >
                {loading
                  ? 'Processing...'
                  : program.status === 'archived' ? 'Restore Workspace' : 'Archive Workspace'}
              </button>
            </div>
          )}

          {/* DELETE MODAL */}
          {modalType === 'delete' && (
            <form onSubmit={handleDelete}>
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#EF4444',
                  fontSize: '0.825rem',
                  marginBottom: '1.25rem',
                  lineHeight: '1.4',
                }}
              >
                <strong>Warning:</strong> Deleting "{program.name}" will permanently delete this program workspace. If other users have duplicated copies, their copies will remain safe.
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Enter your password to confirm deletion</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your admin password"
                  required
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '999px',
                  background: '#EF4444',
                  color: '#FFF',
                  border: 'none',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(239,68,68,0.4)',
                }}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Permanently Delete Program'}
              </button>
            </form>
          )}

          {/* ACTIVITY LOG */}
          {modalType === 'activity' && (
            <div>
              <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Recent Workspace Events
              </h4>

              {getActivityLog().length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>
                  No activity logged yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {getActivityLog().slice(0, 15).map((log, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.6rem 0.85rem',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: '700', color: 'var(--primary)', marginRight: '0.5rem' }}>
                          {log.action}
                        </span>
                        <span style={{ color: 'var(--text-primary)' }}>
                          {log.programName || log.programId}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default WorkspaceActionModal;
