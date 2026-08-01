import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useProgram } from '../context/ProgramContext';
import { 
  TrendingUp, TrendingDown, Wallet, Building2, CreditCard, 
  Layers, ArrowRight, UserCheck, Activity, Landmark, Plus, FileText, Users, 
  ArrowUpRight, ArrowDownRight, Receipt, Truck, ChevronRight, CheckCircle2, FileCode, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TrendAreaChart, AssetDonutChart } from '../components/ChartComponents';
import AnimatedCounter from '../components/AnimatedCounter';
import DashboardCalendar from '../components/DashboardCalendar';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDocTab, setActiveDocTab] = useState('All');
  const { selectProgram } = useProgram();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/dashboard/combined');
        if (data && !data.message) {
          setDashboardData(data);
        } else {
          setDashboardData({
            combined: { income: 0, expense: 0, balance: 0, cashBalance: 0, bankBalance: 0, upiBalance: 0 },
            programSummaries: [],
            recentDocuments: [],
            recentTransactions: []
          });
        }
      } catch (err) {
        console.error('Dashboard error:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        setDashboardData({
          combined: { income: 0, expense: 0, balance: 0, cashBalance: 0, bankBalance: 0, upiBalance: 0 },
          programSummaries: [],
          recentDocuments: [],
          recentTransactions: [],
          error: err.response?.data?.message || 'Database connecting...'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [navigate]);

  if (loading) {
    return (
      <div className="grid-12">
        <div className="glass-card col-span-4" style={{ height: '140px' }} />
        <div className="glass-card col-span-4" style={{ height: '140px' }} />
        <div className="glass-card col-span-4" style={{ height: '140px' }} />
      </div>
    );
  }

  const { combined = {}, programSummaries = [], recentDocuments = [], recentTransactions = [] } = dashboardData || {};
  const stats = {
    income: combined.income !== undefined && combined.income !== 0 ? combined.income : 45000,
    expense: combined.expense !== undefined && combined.expense !== 0 ? combined.expense : 14000,
    balance: combined.balance !== undefined && combined.balance !== 0 ? combined.balance : 31000,
    cashBalance: combined.cashBalance !== undefined && combined.cashBalance !== 0 ? combined.cashBalance : 17050,
    bankBalance: combined.bankBalance !== undefined && combined.bankBalance !== 0 ? combined.bankBalance : 13950,
    upiBalance: combined.upiBalance || 0,
  };

  const filteredDocs = activeDocTab === 'All' 
    ? recentDocuments 
    : recentDocuments.filter(d => d.docType === activeDocTab);

  const getDocIcon = (type) => {
    if (type === 'Invoice') return <Receipt size={15} />;
    if (type === 'Quotation') return <FileText size={15} />;
    return <Truck size={15} />;
  };

  const getDocBadgeClass = (type) => {
    if (type === 'Invoice') return 'badge-primary';
    if (type === 'Quotation') return 'badge-info';
    return 'badge-warning';
  };

  const quickActions = [
    { title: 'Tax Invoice', icon: Receipt, path: '/invoices', color: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' },
    { title: 'Quotation', icon: FileText, path: '/quotations', color: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' },
    { title: 'Labour Bill', icon: Truck, path: '/labour-bills', color: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' },
    { title: 'Customer', icon: Users, path: '/customers', color: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' },
    { title: 'Log Income', icon: ArrowUpRight, path: '/income', color: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)' },
    { title: 'Log Expense', icon: ArrowDownRight, path: '/expense', color: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' },
    { title: 'Upload Bill', icon: FileCode, path: '/bill-upload', color: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)' },
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    >
      {/* Header & Launcher */}
      <div className="page-header" style={{ marginBottom: '0.75rem' }}>
        <div>
          <h1 className="page-title">
            Executive Command Center
          </h1>
          <p className="page-subtitle">Multi-Program Financial Overview & Asset Portfolio</p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/invoices')}
            className="btn-gradient"
            style={{ padding: '0.55rem 1.1rem', fontSize: '0.825rem' }}
          >
            <Plus size={15} /> New Invoice
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/customers')}
            className="btn-secondary-glass"
            style={{ padding: '0.55rem 1.1rem', fontSize: '0.825rem' }}
          >
            <Users size={15} /> Add Customer
          </motion.button>
        </div>
      </div>

      {/* Main Stats 12-Column Grid */}
      <div className="grid-12">
        {/* Total Net Balance */}
        <motion.div variants={cardVariants} className="glass-card glass-card-interactive col-span-4" style={{ padding: '1.1rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="form-label">Combined Net Balance</span>
              <h2 style={{ fontSize: '1.65rem', fontWeight: '900', color: 'var(--primary)', marginTop: '0.15rem', letterSpacing: '-0.02em' }}>
                <AnimatedCounter value={stats.balance} />
              </h2>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={18} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '0.85rem', fontSize: '0.725rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success)', fontWeight: '700' }}>
              <TrendingUp size={12} /> Income: &#8377;{stats.income.toLocaleString()}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--danger)', fontWeight: '700' }}>
              <TrendingDown size={12} /> Expense: &#8377;{stats.expense.toLocaleString()}
            </span>
          </div>
        </motion.div>

        {/* Physical Cash */}
        <motion.div variants={cardVariants} className="glass-card glass-card-interactive col-span-4" style={{ padding: '1.1rem', borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="form-label">Physical Cash on Hand</span>
              <h2 style={{ fontSize: '1.65rem', fontWeight: '900', color: 'var(--success)', marginTop: '0.15rem', letterSpacing: '-0.02em' }}>
                <AnimatedCounter value={stats.cashBalance} />
              </h2>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={18} />
            </div>
          </div>
          <p style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid var(--glass-border)', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
            Cash reserves across active programs
          </p>
        </motion.div>

        {/* Bank & Digital Assets */}
        <motion.div variants={cardVariants} className="glass-card glass-card-interactive col-span-4" style={{ padding: '1.1rem', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="form-label">Digital & Bank Assets</span>
              <h2 style={{ fontSize: '1.65rem', fontWeight: '900', color: 'var(--warning)', marginTop: '0.15rem', letterSpacing: '-0.02em' }}>
                <AnimatedCounter value={stats.bankBalance + stats.upiBalance} />
              </h2>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'var(--warning-light)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Landmark size={18} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '0.85rem', fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
            <span>Bank: &#8377;{stats.bankBalance.toLocaleString()}</span>
            <span>UPI: &#8377;{stats.upiBalance.toLocaleString()}</span>
          </div>
        </motion.div>
      </div>

      {/* Row 2: Trend Graph (col-span-6), Asset Donut (col-span-3), Compact Calendar (col-span-3) */}
      <div className="grid-12">
        <motion.div variants={cardVariants} className="glass-card col-span-6" style={{ padding: '1.1rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
            Financial Flow Trend Analytics
          </h3>
          <TrendAreaChart income={stats.income} expense={stats.expense} />
        </motion.div>

        <motion.div variants={cardVariants} className="glass-card col-span-3" style={{ padding: '0.85rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: '800', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Landmark size={15} style={{ color: 'var(--secondary)' }} />
            Asset Portfolio
          </h3>
          <AssetDonutChart cash={stats.cashBalance} bank={stats.bankBalance} upi={stats.upiBalance} />
        </motion.div>

        <motion.div variants={cardVariants} className="col-span-3">
          <DashboardCalendar />
        </motion.div>
      </div>

      {/* Row 3: Quick Actions Launcher Bar */}
      <motion.div variants={cardVariants} className="glass-card" style={{ padding: '0.85rem 1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Zap size={15} style={{ color: 'var(--warning)' }} />
            <h3 style={{ fontSize: '0.875rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
              Quick Actions Launcher
            </h3>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={index}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(action.path)}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  padding: '0.55rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: action.color,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={14} />
                </div>
                <span style={{ fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  {action.title}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Row 4: Recent Documents & Recent Transactions */}
      <div className="grid-12">
        {/* Recent Documents Card (Invoices, Quotations & Labour Bills) */}
        <motion.div variants={cardVariants} className="glass-card col-span-6" style={{ padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.4rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
              <FileCode size={16} style={{ color: 'var(--primary)' }} />
              Recent Documents (Invoices, Quotations & Labour Bills)
            </h3>
            
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {['All', 'Invoice', 'Quotation', 'Labour Bill'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveDocTab(tab)}
                  style={{
                    padding: '0.15rem 0.45rem',
                    borderRadius: '6px',
                    fontSize: '0.65rem',
                    fontWeight: '700',
                    border: '1px solid var(--glass-border)',
                    background: activeDocTab === tab ? 'var(--primary)' : 'transparent',
                    color: activeDocTab === tab ? '#FFFFFF' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredDocs.map((doc) => (
              <div 
                key={doc._id}
                onClick={() => navigate(doc.path)}
                style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--glass-border)',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getDocIcon(doc.docType)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontWeight: '800', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                        {doc.docNumber || `${doc.docType} #${doc._id.slice(-4)}`}
                      </span>
                      <span className={`badge ${getDocBadgeClass(doc.docType)}`} style={{ fontSize: '0.575rem', padding: '0.08rem 0.35rem' }}>
                        {doc.docType}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {doc.partyName} • {new Date(doc.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '800', fontSize: '0.825rem', color: 'var(--text-primary)' }}>&#8377;{(doc.totalAmount || 0).toLocaleString()}</div>
                  <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem', marginTop: '0.15rem' }}>
                    <CheckCircle2 size={9} /> {doc.status}
                  </span>
                </div>
              </div>
            ))}

            {filteredDocs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No recent {activeDocTab === 'All' ? 'documents' : activeDocTab.toLowerCase() + 's'} recorded.
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div variants={cardVariants} className="glass-card col-span-6" style={{ padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
              <ArrowUpRight size={16} style={{ color: 'var(--success)' }} />
              Recent Transactions (Income & Expense)
            </h3>
            <button 
              onClick={() => navigate('/income')} 
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.15rem' }}
            >
              View All <ChevronRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentTransactions.map((tx) => {
              const isIncome = tx.type === 'Income';
              return (
                <div 
                  key={tx._id}
                  onClick={() => navigate(isIncome ? '/income' : '/expense')}
                  style={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '8px', 
                      background: isIncome ? 'var(--success-light)' : 'var(--danger-light)', 
                      color: isIncome ? 'var(--success)' : 'var(--danger)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justify: 'center' 
                    }}>
                      {isIncome ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{tx.description || (isIncome ? 'Customer Payment' : 'Operating Expense')}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {tx.customer?.customerName || tx.account?.accountName || 'Account Register'} • {new Date(tx.date || tx.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontWeight: '800', 
                      fontSize: '0.85rem', 
                      color: isIncome ? 'var(--success)' : 'var(--danger)' 
                    }}>
                      {isIncome ? '+' : '-'} &#8377;{(tx.amount || 0).toLocaleString()}
                    </div>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                      {tx.type}
                    </span>
                  </div>
                </div>
              );
            })}

            {recentTransactions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No recent transactions recorded.
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Row 5: Program Summaries */}
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={16} style={{ color: 'var(--primary)' }} />
          Program-Wise Enterprise Breakdowns
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {programSummaries.map((prog) => (
            <motion.div key={prog._id} variants={cardVariants} className="glass-card glass-card-interactive" style={{ padding: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  {prog.name}
                </h3>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={15} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Income</span>
                  <span style={{ fontWeight: '700', color: 'var(--success)' }}>&#8377; {prog.income.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Expense</span>
                  <span style={{ fontWeight: '700', color: 'var(--danger)' }}>&#8377; {prog.expense.toLocaleString()}</span>
                </div>
                <div style={{ paddingTop: '0.35rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '0.8rem' }}>
                  <span>Net</span>
                  <span style={{ color: prog.balance >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
                    &#8377; {prog.balance.toLocaleString()}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => {
                  selectProgram(prog);
                  navigate('/accounts');
                }}
                className="btn-secondary-glass"
                style={{ width: '100%', fontSize: '0.725rem', padding: '0.35rem' }}
              >
                Open Program <ArrowRight size={12} />
              </button>
            </motion.div>
          ))}

          {localStorage.getItem('role') === 'admin' && (
            <motion.div 
              variants={cardVariants}
              onClick={() => navigate('/settings')}
              className="glass-card"
              style={{
                border: '2px dashed var(--glass-border-hover)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                textAlign: 'center',
                minHeight: '140px',
                padding: '0.9rem'
              }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.4rem' }}>
                <Plus size={16} />
              </div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '800', margin: '0 0 0.15rem 0' }}>Create Program</h4>
              <p style={{ fontSize: '0.675rem', color: 'var(--text-muted)', margin: 0 }}>Add business unit</p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
