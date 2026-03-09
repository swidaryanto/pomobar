import React, { useState } from 'react';
import type { HapticType } from '../lib/haptics';
import type { PomodoroState } from '../hooks/usePomodoroTimer';

interface ControlsProps {
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  pomodoroState: PomodoroState;
  setPomodoroState: React.Dispatch<React.SetStateAction<PomodoroState>>;
  onReset: () => void;
  onHaptic: (type: HapticType) => void;
  onPlayFeedback: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  setTimeLeft,
  pomodoroState,
  setPomodoroState,
  onReset,
  onHaptic,
  onPlayFeedback,
}) => {
  const [isPlayPulse, setIsPlayPulse] = useState(false);

  const adjustTime = (minutes: number) => {
    onHaptic('light');
    setTimeLeft((prev) => Math.max(0, prev + minutes * 60));
  };

  const toggleTimer = () => {
    const nextState = pomodoroState === 'running' ? 'paused' : 'running';
    onHaptic('medium');
    setPomodoroState(nextState);

    if (nextState === 'running') {
      onPlayFeedback();
      setIsPlayPulse(true);
      setTimeout(() => setIsPlayPulse(false), 180);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr) minmax(0,1fr)', gap: '8px' }}>
      <button
        onClick={() => adjustTime(-5)}
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--text-primary)',
          fontSize: '20px',
          padding: '12px 0',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-button)',
        }}
      >
        −
      </button>

      <button
        className={isPlayPulse ? 'play-pulse' : ''}
        onClick={toggleTimer}
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--accent-yellow)',
          fontSize: '18px',
          padding: '12px 0',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-button)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {pomodoroState === 'running' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        )}
      </button>

      <button
        onClick={() => adjustTime(5)}
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--text-primary)',
          fontSize: '20px',
          padding: '12px 0',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-button)',
        }}
      >
        ＋
      </button>

      <button
        onClick={() => {
          onHaptic('medium');
          onReset();
        }}
        style={{
          gridColumn: '1 / -1',
          backgroundColor: 'transparent',
          color: 'var(--text-secondary)',
          fontSize: '12px',
          padding: '8px 0',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--divider)',
        }}
      >
        Reset timer
      </button>
    </div>
  );
};

export default Controls;
