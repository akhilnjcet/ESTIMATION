import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useProgram } from '../context/ProgramContext';
import { 
  TrendingUp, TrendingDown, Wallet, Building2, CreditCard, 
  Layers, ArrowRight, UserCheck, Activity, Landmark
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { selectProgram } = useProgram();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/dashboard/combined');
        setDashboardData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="p-12 text-center text-gray-500">Loading Krishva ERP Dashboard...</div>;
  if (!dashboardData || dashboardData.message) {
    return (
      <div className="p-12 text-center">
        <div className="text-red-500 mb-4">{dashboardData?.message || 'Error loading dashboard data.'}</div>
        <button onClick={() => window.location.reload()} className="btn btn-primary">Retry</button>
      </div>
    );
  }

  const { combined = {}, programSummaries = [] } = dashboardData;
  const stats = {
    balance: combined.balance || 0,
    income: combined.income || 0,
    expense: combined.expense || 0,
    cashBalance: combined.cashBalance || 0,
    bankBalance: combined.bankBalance || 0,
    upiBalance: combined.upiBalance || 0,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Krishna Accounting</h1>
        <p className="text-gray-500">Multi-Program Business Management Platform</p>
      </div>

      {/* Main Combined Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card" style={{ borderLeft: '4px solid var(--primary)', background: 'linear-gradient(135deg, #fff 0%, #f0f4ff 100%)' }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Combined Total Balance</p>
              <h2 className="text-3xl font-bold text-primary mt-1">&#8377; {stats.balance.toLocaleString()}</h2>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Wallet size={24} />
            </div>
          </div>
          <div className="mt-4 flex gap-4 text-xs">
            <span className="flex items-center gap-1 text-green-600 font-bold">
              <TrendingUp size={12} /> Income: &#8377; {stats.income.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-red-600 font-bold">
              <TrendingDown size={12} /> Expense: &#8377; {stats.expense.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--secondary)', background: 'linear-gradient(135deg, #fff 0%, #f0fdf4 100%)' }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Cash on Hand</p>
              <h2 className="text-3xl font-bold text-secondary mt-1">&#8377; {stats.cashBalance.toLocaleString()}</h2>
            </div>
            <div className="p-3 bg-secondary/10 rounded-xl text-secondary">
              <Activity size={24} />
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-400 font-medium">Physical cash across all programs</p>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #f59e0b', background: 'linear-gradient(135deg, #fff 0%, #fffbeb 100%)' }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Digital & Bank Assets</p>
              <h2 className="text-3xl font-bold text-[#b45309] mt-1">&#8377; {(stats.bankBalance + stats.upiBalance).toLocaleString()}</h2>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
              <Landmark size={24} />
            </div>
          </div>
          <div className="mt-4 flex gap-4 text-[10px] font-bold uppercase">
            <span className="text-amber-700">Bank: &#8377; {stats.bankBalance.toLocaleString()}</span>
            <span className="text-amber-700">UPI: &#8377; {stats.upiBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Layers size={20} className="text-primary" />
        Program-wise Summary
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programSummaries.map(prog => (
          <div key={prog._id} className="card hover:shadow-xl transition-all border-t-4 border-primary group">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{prog.name}</h3>
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                <Building2 size={20} />
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Income</span>
                <span className="font-bold text-green-600">&#8377; {prog.income.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Expense</span>
                <span className="font-bold text-red-600">&#8377; {prog.expense.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t flex justify-between font-bold">
                <span>Net Balance</span>
                <span className={prog.balance >= 0 ? 'text-primary' : 'text-red-600'}>
                  &#8377; {prog.balance.toLocaleString()}
                </span>
              </div>
            </div>

            <button 
              onClick={() => {
                selectProgram(prog);
                navigate('/accounts');
              }}
              className="w-full py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all"
            >
              Open Program <ArrowRight size={16} />
            </button>
          </div>
        ))}

        {localStorage.getItem('role') === 'admin' && (
          <div 
            onClick={() => navigate('/settings')}
            className="card border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all min-h-[240px]"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
              <Layers size={24} />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900">Create New Program</p>
              <p className="text-xs text-gray-500 px-6">Add another club, tuition center, or organization</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
