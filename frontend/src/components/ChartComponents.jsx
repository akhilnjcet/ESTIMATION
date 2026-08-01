import React from 'react';

// Reusable Financial Revenue & Expense Trend Area Chart (SVG Animated)
export const TrendAreaChart = ({ income = 0, expense = 0 }) => {
  const pointsIncome = "0,120 50,90 100,105 150,60 200,75 250,30 300,45 350,15 400,30";
  const pointsExpense = "0,130 50,110 100,125 150,95 200,105 250,80 300,85 350,65 400,70";

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ width: '100%', height: '125px' }}>
        <svg width="100%" height="100%" viewBox="0 0 400 150" preserveAspectRatio="none">
          <defs>
            <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1="30" x2="400" y2="30" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
          <line x1="0" y1="70" x2="400" y2="70" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
          <line x1="0" y1="110" x2="400" y2="110" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

          {/* Income Area & Line */}
          <polygon points={`0,150 ${pointsIncome} 400,150`} fill="url(#gradIncome)" />
          <polyline points={pointsIncome} fill="none" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />

          {/* Expense Area & Line */}
          <polygon points={`0,150 ${pointsExpense} 400,150`} fill="url(#gradExpense)" />
          <polyline points={pointsExpense} fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.725rem', fontWeight: '700' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#3B82F6' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6' }} />
          Income (&#8377; {income.toLocaleString()})
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#EF4444' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
          Expense (&#8377; {expense.toLocaleString()})
        </span>
      </div>
    </div>
  );
};

// Donut Chart for Asset Distribution (Cash vs Bank vs Digital)
export const AssetDonutChart = ({ cash = 0, bank = 0, upi = 0 }) => {
  const total = cash + bank + upi || 1;
  const cashPct = Math.round((cash / total) * 100);
  const bankPct = Math.round((bank / total) * 100);
  const upiPct = 100 - cashPct - bankPct;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
      <div style={{ position: 'relative', width: '130px', height: '130px' }}>
        <svg width="130" height="130" viewBox="0 0 42 42" className="donut">
          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="4.5" />
          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#22C55E" strokeWidth="4.5" 
            strokeDasharray={`${cashPct} ${100 - cashPct}`} strokeDashoffset="25" />
          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#2563EB" strokeWidth="4.5" 
            strokeDasharray={`${bankPct} ${100 - bankPct}`} strokeDashoffset={`${25 - cashPct}`} />
          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#7C3AED" strokeWidth="4.5" 
            strokeDasharray={`${upiPct} ${100 - upiPct}`} strokeDashoffset={`${25 - cashPct - bankPct}`} />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', 
          alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-muted)'
        }}>
          <span style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-primary)' }}>100%</span>
          <span>Assets</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Cash:</span>
          <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>&#8377; {cash.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Bank:</span>
          <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>&#8377; {bank.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7C3AED' }} />
          <span style={{ color: 'var(--text-secondary)' }}>UPI / Digital:</span>
          <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>&#8377; {upi.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
