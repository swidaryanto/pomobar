import React, { useEffect, useRef, useState } from 'react';
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
  const pulseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current) {
        window.clearTimeout(pulseTimeoutRef.current);
      }
    };
  }, []);

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
      if (pulseTimeoutRef.current) {
        window.clearTimeout(pulseTimeoutRef.current);
      }
      pulseTimeoutRef.current = window.setTimeout(() => setIsPlayPulse(false), 180);
    }
  };

  return (
    <div className="controls">
      <div className="controls-row">
        <button className="control-button" onClick={() => adjustTime(-5)} aria-label="Decrease 5 minutes">
          −5
        </button>

        <button
          className={`control-button control-button--accent${isPlayPulse ? ' play-pulse' : ''}`}
          onClick={toggleTimer}
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

        <button className="control-button" onClick={() => adjustTime(5)} aria-label="Increase 5 minutes">
          +5
        </button>
      </div>

      <div className="controls-meta">
        <span className="controls-hint">Adjust ±5m</span>
        <button
          className="control-reset"
          onClick={() => {
            onHaptic('medium');
            onReset();
          }}
        >
          Reset timer
        </button>
      </div>
    </div>
  );
};

export default Controls;
