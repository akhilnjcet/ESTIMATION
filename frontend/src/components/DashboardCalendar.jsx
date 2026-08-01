import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';

const DashboardCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    return (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    );
  };

  const calendarDays = [];

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      key: `prev-${i}`
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: true,
      key: `curr-${day}`
    });
  }

  const remainingCells = (calendarDays.length > 35 ? 42 : 35) - calendarDays.length;
  for (let day = 1; day <= remainingCells; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: false,
      key: `next-${day}`
    });
  }

  return (
    <div className="glass-card" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <CalendarIcon size={16} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '0.875rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
            {monthNames[month].slice(0, 3)} {year}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <button 
            onClick={handleToday}
            style={{ padding: '0.15rem 0.45rem', fontSize: '0.65rem', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '700' }}
          >
            Today
          </button>
          <button onClick={handlePrevMonth} style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={14} />
          </button>
          <button onClick={handleNextMonth} style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Days of Week */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.15rem', textAlign: 'center', marginBottom: '0.25rem' }}>
        {daysOfWeek.map((day, idx) => (
          <div 
            key={idx} 
            style={{ 
              fontSize: '0.65rem', 
              fontWeight: '800', 
              color: idx === 0 || idx === 6 ? 'var(--secondary)' : 'var(--text-muted)',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.15rem' }}>
        {calendarDays.map((cell) => {
          const currentDayToday = cell.isCurrentMonth && isToday(cell.day);
          const currentDaySelected = cell.isCurrentMonth && isSelected(cell.day);

          return (
            <motion.div
              key={cell.key}
              whileHover={{ scale: cell.isCurrentMonth ? 1.05 : 1 }}
              onClick={() => {
                if (cell.isCurrentMonth) {
                  setSelectedDate(new Date(year, month, cell.day));
                }
              }}
              style={{
                height: '24px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.725rem',
                fontWeight: currentDayToday || currentDaySelected ? '800' : '500',
                cursor: cell.isCurrentMonth ? 'pointer' : 'default',
                background: currentDayToday 
                  ? 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' 
                  : currentDaySelected 
                  ? 'var(--primary-light)' 
                  : 'transparent',
                color: currentDayToday 
                  ? '#FFFFFF' 
                  : cell.isCurrentMonth 
                  ? 'var(--text-primary)' 
                  : 'rgba(255, 255, 255, 0.18)',
                border: currentDaySelected && !currentDayToday ? '1px solid var(--primary)' : '1px solid transparent'
              }}
            >
              <span>{cell.day}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardCalendar;
