import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, RefreshCw, Download, ExternalLink, Activity, Cloud, CloudOff, CheckCircle2, XCircle, Clock } from 'lucide-react';
import api from '../utils/api';

const ExcelSync = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [excelFileName, setExcelFileName] = useState('backup.xlsx');
  const [stats, setStats] = useState({
    isConnected: false,
    lastSync: null,
    totalTransactions: 0,
    totalIncome: 0,
    totalExpense: 0,
    overallBalance: 0,
    history: []
  });

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/excel/status');
      setStats(res.data);
      if (res.data.excelFileName) {
        setExcelFileName(res.data.excelFileName);
      }
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Handle OAuth callback redirect params
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const error = params.get('error');

    if (connected === 'true') {
      showNotification('success', '✅ OneDrive connected successfully!');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      showNotification('error', `OneDrive connection failed: ${error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    fetchStatus();
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleConnect = async () => {
    try {
      const res = await api.get('/excel/auth-url');
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      showNotification('error', 'Failed to initialize OneDrive connection');
    }
  };

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      await api.post('/excel/sync-now');
      showNotification('success', 'Synchronization completed');
      fetchStatus();
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleResetSync = async () => {
    if (!window.confirm('This will wipe all existing data in the Excel sheet and re-sync all transactions from scratch. Continue?')) {
      return;
    }
    
    try {
      setSyncing(true);
      showNotification('success', 'Wiping template data and syncing everything... This may take a minute.');
      await api.post('/excel/reset-sync');
      showNotification('success', 'Excel sheet successfully wiped and fully updated!');
      fetchStatus();
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Reset & Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect OneDrive? You will need to log in again.')) {
      return;
    }
    try {
      setSyncing(true);
      await api.post('/excel/disconnect');
      showNotification('success', 'Disconnected from OneDrive.');
      fetchStatus();
    } catch (error) {
      showNotification('error', 'Failed to disconnect');
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenExcel = async () => {
    try {
      const res = await api.get('/excel/file-link');
      if (res.data.webUrl) {
        window.open(res.data.webUrl, '_blank');
      }
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Failed to get file link. Is OneDrive connected?');
    }
  };

  const handleDownload = async () => {
    try {
      const res = await api.get('/excel/file-link');
      if (res.data.downloadUrl) {
        // Direct download URL provided by Microsoft Graph
        window.location.href = res.data.downloadUrl;
      } else if (res.data.webUrl) {
        // Fallback to opening in web view
        window.open(res.data.webUrl, '_blank');
      }
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Failed to get file link. Is OneDrive connected?');
    }
  };

  const handleUpdateFileName = async () => {
    try {
      setSyncing(true);
      const res = await api.post('/excel/update-filename', { fileName: excelFileName });
      setExcelFileName(res.data.fileName);
      showNotification('success', 'Excel file preference saved!');
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Failed to save preference');
    } finally {
      setSyncing(false);
    }
  };

  const handleGenerateTemplate = async () => {
    if (!window.confirm(`This will create a new file named '${excelFileName}' in your OneDrive. Continue?`)) return;
    try {
      setSyncing(true);
      showNotification('success', 'Generating Excel template in your OneDrive... Please wait.');
      await api.post('/excel/generate-template');
      showNotification('success', 'Template created successfully! You can now Sync your data.');
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Failed to generate template');
    } finally {
      setSyncing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-IN');
  };

  return (
    <div className="page-container" style={{ paddingBottom: '4rem' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Excel / OneDrive Sync</h1>
      </div>
      
      {notification && (
        <div style={{
          padding: '1rem', 
          marginBottom: '1rem', 
          borderRadius: '8px',
          backgroundColor: notification.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          color: notification.type === 'error' ? '#EF4444' : '#10B981',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>×</button>
        </div>
      )}
      
      <div className="page-content" style={{ padding: '0', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Status Card */}
        <motion.div 
          className="dashboard-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '2rem', padding: '2rem' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
            
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <FileSpreadsheet size={40} color="#107C41" />
                <div>
                  <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-color)' }}>{excelFileName}</h2>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>OneDrive Synchronized Database</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-color)' }}>Status:</span>
                {stats.isConnected ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    <Cloud size={16} /> Connected
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    <CloudOff size={16} /> Disconnected
                  </span>
                )}
              </div>
              
              <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-color)' }}>Last Sync:</span> {formatDate(stats.lastSync)}
              </div>
              
              {stats.isConnected && (
                  <div style={{ marginTop: '1.5rem', background: 'var(--surface-color)', padding: '1rem', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        value={excelFileName} 
                        onChange={(e) => setExcelFileName(e.target.value)}
                        className="form-input"
                        placeholder="e.g. expenses.xlsx"
                        style={{ flex: 1, padding: '0.5rem' }}
                      />
                      <button className="primary-button" onClick={handleUpdateFileName} disabled={syncing} style={{ padding: '0.5rem 1rem' }}>
                        Save
                      </button>
                    </div>
                    <button className="secondary-button" onClick={handleGenerateTemplate} disabled={syncing} style={{ width: '100%', borderColor: '#107C41', color: '#107C41' }}>
                      Generate Excel Template
                    </button>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-color)', opacity: 0.7, margin: 0 }}>
                      If the file doesn't exist, enter your desired name and click Generate to create it in OneDrive.
                    </p>
                  </div>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '200px' }}>
               {!stats.isConnected ? (
                 <button className="primary-button" onClick={handleConnect} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                   Connect to OneDrive
                 </button>
               ) : (
                 <>
                   <button className="primary-button" onClick={handleSyncNow} disabled={syncing} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                     <RefreshCw size={18} className={syncing ? "spin" : ""} /> {syncing ? 'Syncing...' : 'Sync Now'}
                   </button>
                   <button className="secondary-button" onClick={handleResetSync} disabled={syncing} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', borderColor: '#ffcdd2', color: '#d32f2f' }} title="Wipe template data and re-sync everything">
                     <RefreshCw size={18} className={syncing ? "spin" : ""} /> Reset & Sync All
                   </button>
                   <button className="secondary-button" onClick={handleOpenExcel} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                     <ExternalLink size={18} /> Open Excel
                   </button>
                   <button className="secondary-button" onClick={handleDownload} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                     <Download size={18} /> Download Excel
                   </button>
                   <button className="secondary-button" onClick={handleDisconnect} disabled={syncing} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', color: '#6b7280', marginTop: '0.5rem' }}>
                     <CloudOff size={18} /> Disconnect
                   </button>
                 </>
               )}
            </div>
            
          </div>
        </motion.div>

        {/* Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
           <MetricCard title="Transactions" value={stats.totalTransactions} icon={<Activity size={24} color="var(--primary)" />} />
           <MetricCard title="Total Income" value={formatCurrency(stats.totalIncome)} icon={<CheckCircle2 size={24} color="#10B981" />} />
           <MetricCard title="Total Expenses" value={formatCurrency(stats.totalExpense)} icon={<XCircle size={24} color="#EF4444" />} />
           <MetricCard title="Overall Balance" value={formatCurrency(stats.overallBalance)} icon={<FileSpreadsheet size={24} color="#8B5CF6" />} />
        </div>

        {/* History Table */}
        <motion.div 
          className="dashboard-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ padding: '1.5rem' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-color)' }}>Recent Synchronization History</h3>
            <button className="icon-button" onClick={fetchStatus} title="Refresh History">
              <RefreshCw size={18} />
            </button>
          </div>
          
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Transaction</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Sync Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
                ) : stats.history.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No recent sync history found.</td></tr>
                ) : (
                  stats.history.map((tx, idx) => (
                    <tr key={idx}>
                      <td>{new Date(tx.date).toLocaleDateString()}</td>
                      <td>{tx.description || tx.type}</td>
                      <td>
                         <span style={{ color: tx.type === 'Income' ? '#10B981' : tx.type === 'Expense' ? '#EF4444' : 'inherit' }}>
                           {tx.type === 'Income' ? '+' : tx.type === 'Expense' ? '-' : ''}{formatCurrency(tx.amount)}
                         </span>
                      </td>
                      <td>
                        <span style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '1rem',
                          background: tx.excelSyncStatus === 'Synced' ? 'rgba(16, 185, 129, 0.1)' : tx.excelSyncStatus === 'Failed' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: tx.excelSyncStatus === 'Synced' ? '#10B981' : tx.excelSyncStatus === 'Failed' ? '#EF4444' : '#F59E0B'
                        }}>
                          {tx.excelSyncStatus === 'Synced' ? <CheckCircle2 size={12}/> : tx.excelSyncStatus === 'Failed' ? <XCircle size={12}/> : <Clock size={12}/>}
                          {tx.excelSyncStatus}
                        </span>
                      </td>
                      <td>{formatDate(tx.excelSyncTime)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon }) => (
  <motion.div 
    className="dashboard-card"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
  >
    <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: '500' }}>{title}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-color)' }}>{value}</div>
    </div>
  </motion.div>
);

export default ExcelSync;
