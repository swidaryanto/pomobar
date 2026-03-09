import { useCallback, useEffect, useState } from 'react';

export type PomodoroState = 'idle' | 'running' | 'paused';
export type SessionType = 'focus' | 'break';

interface UsePomodoroTimerOptions {
  focusMinutes: number;
  breakMinutes: number;
  onSessionComplete?: (completedSession: SessionType, nextSession: SessionType) => void;
}

const toSeconds = (minutes: number) => minutes * 60;

export function usePomodoroTimer({
  focusMinutes,
  breakMinutes,
  onSessionComplete,
}: UsePomodoroTimerOptions) {
  const [sessionType, setSessionType] = useState<SessionType>('focus');
  const [timeLeft, setTimeLeft] = useState(toSeconds(focusMinutes));
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>('idle');

  const getDuration = useCallback(
    (session: SessionType) => toSeconds(session === 'focus' ? focusMinutes : breakMinutes),
    [breakMinutes, focusMinutes]
  );

  const resetTimer = useCallback(
    (nextSession: SessionType = sessionType) => {
      setSessionType(nextSession);
      setTimeLeft(getDuration(nextSession));
      setPomodoroState('idle');
    },
    [getDuration, sessionType]
  );

  const switchSession = useCallback(() => {
    const completedSession = sessionType;
    const nextSession: SessionType = completedSession === 'focus' ? 'break' : 'focus';

    setSessionType(nextSession);
    setTimeLeft(getDuration(nextSession));
    setPomodoroState('idle');
    onSessionComplete?.(completedSession, nextSession);
  }, [getDuration, onSessionComplete, sessionType]);

  const updateDurations = useCallback(
    (nextFocusMinutes: number, nextBreakMinutes: number) => {
      const activeDuration =
        sessionType === 'focus' ? toSeconds(nextFocusMinutes) : toSeconds(nextBreakMinutes);

      setTimeLeft(activeDuration);
      setPomodoroState('idle');
    },
    [sessionType]
  );

  useEffect(() => {
    if (pomodoroState !== 'running') {
      return;
    }

    const interval = window.setInterval(() => {
      setTimeLeft((previousTime) => {
        if (previousTime <= 1) {
          window.clearInterval(interval);
          switchSession();
          return 0;
        }

        return previousTime - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [pomodoroState, switchSession]);

  useEffect(() => {
    if (pomodoroState === 'running') {
      return;
    }

    setTimeLeft(getDuration(sessionType));
  }, [breakMinutes, focusMinutes, getDuration, pomodoroState, sessionType]);

  return {
    pomodoroState,
    resetTimer,
    sessionType,
    setPomodoroState,
    setTimeLeft,
    timeLeft,
    updateDurations,
  };
}
