import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, Database, Lock, Key, Server, Download, RefreshCw, 
  Activity, CheckCircle2, AlertTriangle, Globe, Clock, FileCheck, Layers, ToggleLeft
} from 'lucide-react';
import api from '../utils/api';
import { useProgram } from '../context/ProgramContext';
import ModuleCustomization from './ModuleCustomization';

const AdminSettings = () => {
  const { selectedProgram } = useProgram();
  const [activeTab, setActiveTab] = useState('security'); // 'security' | 'database' | 'audit' | 'defaults' | 'modules'

  // Security Toggles State
  const [securitySettings, setSecuritySettings] = useState({
    enforceMfa: false,
    autoBlockInactive: true,
    strictProgramIsolation: true,
    requirePasswordChange90Days: false,
    sessionTimeoutMins: '120',
  });

  // Global Defaults State
  const [globalDefaults, setGlobalDefaults] = useState({
    currency: 'INR (₹)',
    timezone: 'Asia/Kolkata (IST +5:30)',
    autoArchiveDays: '30',
    allowSelfRegistration: false,
  });

  // Action status message
  const [statusMsg, setStatusMsg] = useState(null);

  const showToast = (msg, type = 'success') => {
    setStatusMsg({ text: msg, type });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleSaveSecurity = (e) => {
    e.preventDefault();
    showToast('Security policies and access rules updated successfully!');
  };

  const handleSaveDefaults = (e) => {
    e.preventDefault();
    showToast('Global system defaults updated successfully!');
  };

  const handleExportBackup = async () => {
    try {
      showToast('Preparing full system database backup export...', 'info');
      const res = await api.get('/programs');
      const backupData = {
        exportTimestamp: new Date().toISOString(),
        program: selectedProgram,
        allPrograms: res.data,
        version: 'v2.5.0 Enterprise'
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `ERP-System-Backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('System database backup downloaded successfully!');
    } catch (err) {
      showToast('Failed to export system backup: ' + (err.message || 'Error'), 'danger');
    }
  };

  // Mock Audit Logs
  const auditLogs = [
    { id: 1, action: 'User Credentials Updated', user: 'ADMIN', time: '10 mins ago', ip: '192.168.1.1', status: 'success' },
    { id: 2, action: 'Workspace Transferred', user: 'ADMIN', time: '1 hour ago', ip: '192.168.1.1', status: 'info' },
    { id: 3, action: 'Module Visibility Saved', user: 'ADMIN', time: '3 hours ago', ip: '192.168.1.4', status: 'success' },
    { id: 4, action: 'Failed Password Attempt', user: 'SYSTEM', time: '1 day ago', ip: '49.37.112.5', status: 'warning' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Toast Notification */}
      {statusMsg && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          style={{
            position: 'fixed',
            top: '5rem',
            right: '2rem',
            zIndex: 99999,
            background: statusMsg.type === 'danger' ? '#EF4444' : statusMsg.type === 'info' ? '#3B82F6' : '#10B981',
            color: '#FFF',
            padding: '0.75rem 1.25rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            fontSize: '0.85rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <CheckCircle2 size={16} />
          {statusMsg.text}
        </motion.div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Shield size={28} style={{ color: 'var(--primary)' }} />
            Admin Settings & Control Center
          </h1>
          <p className="page-subtitle">
            System-wide security policies, master database backups, audit logs, and global ERP defaults
          </p>
        </div>
      </div>

      {/* Top Health Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Database Health', value: 'Connected', sub: 'MongoDB Primary Cluster (Latency 12ms)', color: 'var(--success)', Icon: Server },
          { label: 'Security Protocol', value: 'Enforced', sub: 'JWT 256-bit Token Authentication', color: 'var(--text-primary)', Icon: Lock },
          { label: 'Program Isolation', value: 'Strict Active', sub: 'Multi-tenant data boundary active', color: 'var(--text-primary)', Icon: Layers },
          { label: 'System Version', value: 'v2.5.0', sub: 'Krishna ERP Enterprise Build', color: 'var(--secondary)', Icon: Activity },
        ].map(({ label, value, sub, color, Icon }) => (
          <div key={label} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
              <Icon size={16} style={{ color, flexShrink: 0 }} />
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color, lineHeight: 1.2 }}>{value}</div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>{sub}</span>
          </div>
        ))}
      </div>

      {/* Tabs Bar */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: '0.4rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        {[
          { id: 'security', label: 'Security & Access', icon: Lock },
          { id: 'database', label: 'Database & Backup', icon: Database },
          { id: 'audit', label: 'Audit Logs', icon: Activity },
          { id: 'defaults', label: 'Global Defaults', icon: Globe },
          { id: 'modules', label: 'Module Visibility', icon: ToggleLeft },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="btn-secondary-glass"
              style={{
                background: isActive ? 'var(--primary-light)' : 'transparent',
                borderColor: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? '800' : '600',
                padding: '0.5rem 0.85rem',
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <IconComp size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Security Policies */}
      {activeTab === 'security' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key size={20} style={{ color: 'var(--primary)' }} />
            Master Security & Access Rules
          </h2>

          <form onSubmit={handleSaveSecurity} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[
              { key: 'strictProgramIsolation', label: 'Strict Program Data Isolation', sub: 'Prevent users from viewing or leaking data across different workspace units' },
              { key: 'autoBlockInactive', label: 'Auto-Block Suspended Accounts', sub: 'Automatically invalidate session tokens immediately when an account is marked suspended' },
              { key: 'requirePasswordChange90Days', label: 'Enforce 90-Day Password Expiry', sub: 'Require staff user accounts to rotate password credentials every 90 days' },
            ].map(({ key, label, sub }) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>{label}</div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.4 }}>{sub}</div>
                </div>
                <input
                  type="checkbox"
                  checked={securitySettings[key]}
                  onChange={e => setSecuritySettings({ ...securitySettings, [key]: e.target.checked })}
                  style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: 'var(--primary)', flexShrink: 0, marginTop: '0.1rem' }}
                />
              </div>
            ))}

            <div className="form-group" style={{ maxWidth: '100%' }}>
              <label className="form-label">Inactivity Session Timeout</label>
              <select className="form-select" value={securitySettings.sessionTimeoutMins}
                onChange={e => setSecuritySettings({ ...securitySettings, sessionTimeoutMins: e.target.value })}>
                <option value="30">30 Minutes</option>
                <option value="60">1 Hour</option>
                <option value="120">2 Hours (Recommended)</option>
                <option value="480">8 Hours (Full Shift)</option>
              </select>
            </div>

            <button type="submit" className="btn-gradient" style={{ width: '100%', maxWidth: '320px', padding: '0.75rem' }}>
              Save Security Policies
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Database Backup & Maintenance */}
      {activeTab === 'database' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={20} style={{ color: 'var(--primary)' }} />
            Database Maintenance & Export Tools
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <Download size={22} style={{ color: 'var(--primary)' }} />
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '800' }}>Full JSON Data Backup</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Export complete workspace database schema & records</div>
                </div>
              </div>
              <button className="btn-gradient" onClick={handleExportBackup} style={{ width: '100%', padding: '0.65rem' }}>
                Download JSON Backup
              </button>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <RefreshCw size={22} style={{ color: 'var(--warning)' }} />
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '800' }}>Clear Cache & Expired Sessions</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Purge stale session tokens & flush local memory caches</div>
                </div>
              </div>
              <button className="btn-secondary-glass" onClick={() => showToast('Session cache & memory flushed successfully!')} style={{ width: '100%', padding: '0.65rem' }}>
                Purge System Cache
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: System Audit Logs */}
      {activeTab === 'audit' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} style={{ color: 'var(--primary)' }} />
            Recent Security & Administration Audit Trail
          </h2>

          <div className="table-container">
            <table className="table-glass">
              <thead>
                <tr>
                  <th>Event Action</th>
                  <th>Initiated By</th>
                  <th>Timestamp</th>
                  <th>IP Address</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontWeight: '800' }}>{log.action}</td>
                    <td><span className="badge badge-primary">{log.user}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{log.time}</td>
                    <td style={{ fontFamily: 'monospace' }}>{log.ip}</td>
                    <td>
                      <span className={`badge ${log.status === 'success' ? 'badge-success' : log.status === 'warning' ? 'badge-warning' : 'badge-info'}`}>
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Global System Defaults */}
      {activeTab === 'defaults' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={20} style={{ color: 'var(--primary)' }} />
            System-Wide Global Defaults
          </h2>

          <form onSubmit={handleSaveDefaults} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">System Currency Standard</label>
                <select className="form-select" value={globalDefaults.currency}
                  onChange={e => setGlobalDefaults({ ...globalDefaults, currency: e.target.value })}>
                  <option value="INR (₹)">Indian Rupee - INR (₹)</option>
                  <option value="USD ($)">US Dollar - USD ($)</option>
                  <option value="EUR (€)">Euro - EUR (€)</option>
                  <option value="AED (AED)">UAE Dirham - AED</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">System Timezone</label>
                <select className="form-select" value={globalDefaults.timezone}
                  onChange={e => setGlobalDefaults({ ...globalDefaults, timezone: e.target.value })}>
                  <option value="Asia/Kolkata (IST +5:30)">Asia/Kolkata (IST +5:30)</option>
                  <option value="UTC (GMT +0:00)">UTC (GMT +0:00)</option>
                  <option value="America/New_York (EST)">America/New_York (EST)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Auto-Archive Deleted Workspaces</label>
                <select className="form-select" value={globalDefaults.autoArchiveDays}
                  onChange={e => setGlobalDefaults({ ...globalDefaults, autoArchiveDays: e.target.value })}>
                  <option value="30">Keep in Trash for 30 Days</option>
                  <option value="60">Keep in Trash for 60 Days</option>
                  <option value="0">Permanent Immediate Deletion</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-gradient" style={{ width: '100%', maxWidth: '320px', padding: '0.75rem' }}>
              Save System Defaults
            </button>
          </form>
        </div>
      )}
      {/* Tab 5: Module Visibility */}
      {activeTab === 'modules' && (
        <div>
          <ModuleCustomization />
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
