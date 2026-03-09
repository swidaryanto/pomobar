import React from 'react';

interface TodayActivityProps {
  currentTask: string;
  timeLeft: number;
  sessionLabel: string;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const TodayActivity: React.FC<TodayActivityProps> = ({ currentTask, timeLeft, sessionLabel }) => {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-yellow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.5px' }}>NOW:</span>
        </div>
        <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          {sessionLabel}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '1.5px solid var(--text-secondary)', opacity: 0.6 }} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{currentTask}</span>
        </div>
        <div style={{ fontSize: '14px', fontWeight: 500 }}>{formatTime(timeLeft)}</div>
      </div>

      <div style={{ width: '100%', height: '1px', borderBottom: '1px dashed var(--divider)', margin: '8px 0', opacity: 0.5 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Timer is live and interactive now</span>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>v0.1</span>
      </div>
    </div>
  );
};

export default TodayActivity;
