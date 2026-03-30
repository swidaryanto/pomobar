import React from 'react';

interface TodayActivityProps {
  currentTask: string;
  timeLeft: number;
  sessionLabel: string;
  history: Array<{
    id: string;
    type: 'focus' | 'break';
    durationMinutes: number;
    completedAt: number;
  }>;
  weeklySummary: {
    totalSessions: number;
    totalMinutes: number;
    focusSessions: number;
    breakSessions: number;
  };
  onClearHistory: () => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const TodayActivity: React.FC<TodayActivityProps> = ({
  currentTask,
  timeLeft,
  sessionLabel,
  history,
  weeklySummary,
  onClearHistory,
}) => {
  const summary =
    history.length === 0
      ? 'No completed sessions yet.'
      : `${history.length} sessions completed today.`;
  const weeklyLabel =
    weeklySummary.totalSessions === 0
      ? 'No sessions in the past 7 days.'
      : `Last 7 days: ${weeklySummary.totalSessions} sessions · ${weeklySummary.totalMinutes}m (Focus ${weeklySummary.focusSessions} / Break ${weeklySummary.breakSessions})`;

  return (
    <div className="activity">
      <div className="activity-row">
        <div className="activity-row-left">
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
          <span className="activity-now">NOW:</span>
        </div>
        <div className="activity-pill">
          {sessionLabel}
        </div>
      </div>

      <div className="activity-row">
        <div className="activity-row-left">
          <div className="activity-dot" />
          <span className="activity-task">{currentTask}</span>
        </div>
        <div className="activity-time">{formatTime(timeLeft)}</div>
      </div>

      <div className="activity-divider" />

      <div className="activity-history">
        {history.length === 0 ? (
          <div className="activity-history-empty">{summary}</div>
        ) : (
          history.slice(0, 4).map((item) => (
            <div key={item.id} className="activity-history-row">
              <span className="activity-history-type">{item.type.toUpperCase()}</span>
              <span className="activity-history-meta">
                {item.durationMinutes}m · {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="activity-weekly">
        <span className="activity-weekly-text">{weeklyLabel}</span>
        <button className="activity-clear" onClick={onClearHistory}>
          Clear history
        </button>
      </div>

      <div className="activity-footer">
        <span className="activity-footer-text">v0.1</span>
      </div>
    </div>
  );
};

export default TodayActivity;
