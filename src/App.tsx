import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header';
import Timer from './components/Timer';
import Controls from './components/Controls';
import TodayActivity from './components/TodayActivity';
import FooterActions from './components/FooterActions';
import { triggerHaptic } from './lib/haptics';
import { getFeedbackState, playFeedbackTone, testFeedbackTone } from './lib/feedback';
import { usePomodoroTimer } from './hooks/usePomodoroTimer';
import './App.css';

const DEFAULT_FOCUS_MIN = 25;
const DEFAULT_BREAK_MIN = 5;
const DEFAULT_TASK = 'Focus Task';
const DEFAULT_THEME = 'analog';
const DEFAULT_DAILY_GOAL = 6;
const STORAGE_KEY = 'pomobar-preferences';
const SESSION_KEY = 'pomobar-session';
type ThemeName = 'dark' | 'analog';

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${secs}`;
};

interface StoredPreferences {
  breakMinutes: number;
  currentTask: string;
  focusMinutes: number;
  hapticsEnabled: boolean;
  theme: ThemeName;
  dailyGoal: number;
}

interface StoredSession {
  sessionType: 'focus' | 'break';
  pomodoroState: 'idle' | 'running' | 'paused';
  timeLeft: number;
  lastUpdated: number;
}

interface SessionHistoryItem {
  id: string;
  type: 'focus' | 'break';
  durationMinutes: number;
  completedAt: number;
}

type SessionHistoryMap = Record<string, SessionHistoryItem[]>;

interface WeeklySummary {
  totalSessions: number;
  totalMinutes: number;
  focusSessions: number;
  breakSessions: number;
}

const readStoredPreferences = (): StoredPreferences => {
  if (typeof window === 'undefined') {
    return {
      breakMinutes: DEFAULT_BREAK_MIN,
      currentTask: DEFAULT_TASK,
      focusMinutes: DEFAULT_FOCUS_MIN,
      hapticsEnabled: true,
      theme: DEFAULT_THEME,
      dailyGoal: DEFAULT_DAILY_GOAL,
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      throw new Error('Missing saved preferences');
    }

    const parsed = JSON.parse(raw) as Partial<StoredPreferences>;

    const resolvedTheme =
      parsed.theme === 'dark' || parsed.theme === 'analog' ? parsed.theme : DEFAULT_THEME;

    return {
      breakMinutes:
        typeof parsed.breakMinutes === 'number' && parsed.breakMinutes > 0
          ? Math.round(parsed.breakMinutes)
          : DEFAULT_BREAK_MIN,
      currentTask:
        typeof parsed.currentTask === 'string' && parsed.currentTask.trim()
          ? parsed.currentTask.trim()
          : DEFAULT_TASK,
      focusMinutes:
        typeof parsed.focusMinutes === 'number' && parsed.focusMinutes > 0
          ? Math.round(parsed.focusMinutes)
          : DEFAULT_FOCUS_MIN,
      hapticsEnabled:
        typeof parsed.hapticsEnabled === 'boolean' ? parsed.hapticsEnabled : true,
      theme: resolvedTheme,
      dailyGoal:
        typeof parsed.dailyGoal === 'number' && parsed.dailyGoal > 0
          ? Math.round(parsed.dailyGoal)
          : DEFAULT_DAILY_GOAL,
    };
  } catch {
    return {
      breakMinutes: DEFAULT_BREAK_MIN,
      currentTask: DEFAULT_TASK,
      focusMinutes: DEFAULT_FOCUS_MIN,
      hapticsEnabled: true,
      theme: DEFAULT_THEME,
      dailyGoal: DEFAULT_DAILY_GOAL,
    };
  }
};

const clampMinutesInput = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
};

const readStoredSession = (preferences: StoredPreferences) => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    const sessionType =
      parsed.sessionType === 'focus' || parsed.sessionType === 'break'
        ? parsed.sessionType
        : null;
    const pomodoroState =
      parsed.pomodoroState === 'idle' ||
      parsed.pomodoroState === 'running' ||
      parsed.pomodoroState === 'paused'
        ? parsed.pomodoroState
        : null;

    if (!sessionType || !pomodoroState || typeof parsed.timeLeft !== 'number') {
      return null;
    }

    const durationFor = (session: 'focus' | 'break') =>
      session === 'focus'
        ? preferences.focusMinutes * 60
        : preferences.breakMinutes * 60;

    let timeLeft = Math.max(0, Math.floor(parsed.timeLeft));
    let nextSession = sessionType;
    let nextState = pomodoroState;

    if (pomodoroState === 'running' && typeof parsed.lastUpdated === 'number') {
      const elapsed = Math.floor((Date.now() - parsed.lastUpdated) / 1000);
      const remaining = timeLeft - elapsed;
      if (remaining <= 0) {
        nextSession = sessionType === 'focus' ? 'break' : 'focus';
        nextState = 'idle';
        timeLeft = durationFor(nextSession);
      } else {
        timeLeft = remaining;
      }
    }

    const maxDuration = durationFor(nextSession);
    if (timeLeft <= 0 || timeLeft > maxDuration) {
      timeLeft = maxDuration;
      if (nextState === 'running') {
        nextState = 'idle';
      }
    }

    return {
      sessionType: nextSession,
      pomodoroState: nextState,
      timeLeft,
    };
  } catch {
    return null;
  }
};

function App() {
  const initialPreferences = useMemo(readStoredPreferences, []);
  const initialSession = useMemo(
    () => readStoredSession(initialPreferences),
    [initialPreferences]
  );
  const [preferences, setPreferences] = useState(initialPreferences);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [taskDraft, setTaskDraft] = useState(preferences.currentTask);
  const [focusDraft, setFocusDraft] = useState(String(preferences.focusMinutes));
  const [breakDraft, setBreakDraft] = useState(String(preferences.breakMinutes));
  const [themeDraft, setThemeDraft] = useState<ThemeName>(preferences.theme);
  const [dailyGoalDraft, setDailyGoalDraft] = useState(String(preferences.dailyGoal));
  const [soundError, setSoundError] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState<string | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryMap>(() => {
    if (typeof window === 'undefined') {
      return {};
    }
    try {
      const raw = window.localStorage.getItem('pomobar-history');
      return raw ? (JSON.parse(raw) as SessionHistoryMap) : {};
    } catch {
      return {};
    }
  });
  const { breakMinutes, currentTask, focusMinutes, hapticsEnabled, dailyGoal } = preferences;
  const lastSessionPersistAtRef = useRef(0);
  const pendingSessionPersistRef = useRef<number | null>(null);
  const latestSessionStateRef = useRef<{
    sessionType: 'focus' | 'break';
    timeLeft: number;
    pomodoroState: 'idle' | 'running' | 'paused';
  } | null>(null);
  const {
    pomodoroState,
    resetTimer,
    sessionType,
    setPomodoroState,
    setTimeLeft,
    timeLeft,
    updateDurations,
  } = usePomodoroTimer({
    focusMinutes,
    breakMinutes,
    initialState: initialSession ?? undefined,
    onSessionComplete: (completedSession, nextSession) => {
      triggerHaptic('success', hapticsEnabled);
      void (async () => {
        const played = await playFeedbackTone('success', hapticsEnabled);
        if (!played && window.electronAPI) {
          window.electronAPI.playFeedback();
        }
      })();

      if (typeof window !== 'undefined' && 'Notification' in window) {
        const notify = () => {
          const completedLabel = completedSession === 'focus' ? 'Focus' : 'Break';
          const nextLabel = nextSession === 'focus' ? 'Focus' : 'Break';

          new Notification(`${completedLabel} done`, {
            body: `Next: ${nextLabel} session`,
          });
        };

        if (Notification.permission === 'granted') {
          notify();
        } else if (Notification.permission === 'default') {
          void Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              notify();
            }
          });
        }
      }

      const completedLabel = completedSession === 'focus' ? 'Focus' : 'Break';
      const nextLabel = nextSession === 'focus' ? 'Focus' : 'Break';
      setCompletionNote(`${completedLabel} complete · Next: ${nextLabel}`);

      const now = Date.now();
      const dateKey = new Date(now).toLocaleDateString('sv-SE');
      const durationMinutes = completedSession === 'focus' ? focusMinutes : breakMinutes;
      const item: SessionHistoryItem = {
        id: `${now}-${completedSession}`,
        type: completedSession,
        durationMinutes,
        completedAt: now,
      };
      setSessionHistory((previous) => {
        const next = { ...previous };
        const day = next[dateKey] ? [...next[dateKey]] : [];
        day.unshift(item);
        next[dateKey] = day.slice(0, 20);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('pomobar-history', JSON.stringify(next));
        }
        return next;
      });
    },
    onStateChange: (state) => {
      if (typeof window === 'undefined') {
        return;
      }
      latestSessionStateRef.current = state;
      const now = Date.now();

      const write = (lastUpdated: number) => {
        const latest = latestSessionStateRef.current ?? state;
        const payload: StoredSession = {
          ...latest,
          lastUpdated,
        };
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
        lastSessionPersistAtRef.current = lastUpdated;
        if (pendingSessionPersistRef.current) {
          window.clearTimeout(pendingSessionPersistRef.current);
          pendingSessionPersistRef.current = null;
        }
      };

      if (state.pomodoroState !== 'running') {
        write(now);
        return;
      }

      const elapsed = now - lastSessionPersistAtRef.current;
      const throttleMs = 5000;

      if (elapsed >= throttleMs) {
        write(now);
        return;
      }

      if (!pendingSessionPersistRef.current) {
        pendingSessionPersistRef.current = window.setTimeout(() => {
          write(Date.now());
        }, throttleMs - elapsed);
      }
    },
  });

  const sessionLabel = useMemo(
    () => (sessionType === 'focus' ? 'Focus' : 'Break'),
    [sessionType]
  );

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    return () => {
      if (pendingSessionPersistRef.current) {
        window.clearTimeout(pendingSessionPersistRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.body.dataset.theme = themeDraft;
    if (window.electronAPI) {
      window.electronAPI.setTrayTheme(themeDraft === 'dark' ? 'light' : 'dark');
    }

    return () => {
      delete document.body.dataset.theme;
    };
  }, [themeDraft]);

  useEffect(() => {
    const unlockAudio = () => {
      void testFeedbackTone();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (!completionNote) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setCompletionNote(null);
    }, 2200);
    return () => window.clearTimeout(timeout);
  }, [completionNote]);

  useEffect(() => {
    setTaskDraft(currentTask);
  }, [currentTask]);

  useEffect(() => {
    setFocusDraft(String(focusMinutes));
    setBreakDraft(String(breakMinutes));
  }, [focusMinutes, breakMinutes]);

  useEffect(() => {
    setThemeDraft(preferences.theme);
    setDailyGoalDraft(String(preferences.dailyGoal));
  }, [preferences.dailyGoal, preferences.theme]);

  useEffect(() => {
    const timeString = `${currentTask} | ${formatTime(timeLeft)}`;
    if (window.electronAPI) {
      window.electronAPI.updateTimer(timeString);
    }
  }, [timeLeft, currentTask]);

  const todayKey = new Date().toLocaleDateString('sv-SE');
  const todayHistory = sessionHistory[todayKey] ?? [];
  const todayFocusSessions = todayHistory.filter((item) => item.type === 'focus').length;
  const dailyGoalCount = Math.max(1, dailyGoal);
  const dailyProgress = Math.min(1, todayFocusSessions / dailyGoalCount);
  const weeklySummary = useMemo<WeeklySummary>(() => {
    const now = new Date();
    const keys: string[] = [];
    for (let i = 0; i < 7; i += 1) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      keys.push(day.toLocaleDateString('sv-SE'));
    }

    let totalSessions = 0;
    let totalMinutes = 0;
    let focusSessions = 0;
    let breakSessions = 0;

    keys.forEach((key) => {
      const items = sessionHistory[key] ?? [];
      items.forEach((item) => {
        totalSessions += 1;
        totalMinutes += item.durationMinutes;
        if (item.type === 'focus') {
          focusSessions += 1;
        } else {
          breakSessions += 1;
        }
      });
    });

    return { totalSessions, totalMinutes, focusSessions, breakSessions };
  }, [sessionHistory]);

  const fireFeedback = useCallback(async (
    type: Parameters<typeof playFeedbackTone>[0],
    options: { enabledOverride?: boolean; showError?: boolean } = {}
  ) => {
    const enabled = options.enabledOverride ?? hapticsEnabled;
    if (!enabled) {
      if (options.showError) {
        setSoundError('Sound is off.');
      }
      return;
    }

    triggerHaptic(type, enabled);
    const played = await playFeedbackTone(type, enabled);
    if (played) {
      setSoundError(null);
      return;
    }

    if (window.electronAPI) {
      window.electronAPI.playFeedback();
      setSoundError(null);
      return;
    }

    const fallback = await testFeedbackTone();
    if (!fallback.ok) {
      if (options.showError) {
        setSoundError('Sound is blocked by the browser.');
      }
      return;
    }

    setSoundError(null);
  }, [hapticsEnabled]);

  const handleTaskSave = () => {
    const nextTask = taskDraft.trim();
    if (!nextTask) {
      setTaskDraft(currentTask);
      setIsEditingTask(false);
      return;
    }

    setPreferences((previous) => ({
      ...previous,
      currentTask: nextTask,
    }));
    setIsEditingTask(false);
    void fireFeedback('light');
  };

  const handleSettingsSave = () => {
    const resolvedFocus = clampMinutesInput(focusDraft);
    const resolvedBreak = clampMinutesInput(breakDraft);
    const resolvedGoal = clampMinutesInput(dailyGoalDraft);

    if (!resolvedFocus || !resolvedBreak || !resolvedGoal) {
      setFocusDraft(String(focusMinutes));
      setBreakDraft(String(breakMinutes));
      setThemeDraft(preferences.theme);
      setDailyGoalDraft(String(preferences.dailyGoal));
      setIsSettingsOpen(false);
      return;
    }

    setPreferences((previous) => ({
      ...previous,
      breakMinutes: resolvedBreak,
      focusMinutes: resolvedFocus,
      theme: themeDraft,
      dailyGoal: resolvedGoal,
    }));
    updateDurations(resolvedFocus, resolvedBreak);
    resetTimer('focus');
    setIsSettingsOpen(false);
    void fireFeedback('light');
  };

  const isElectron = Boolean(window.electronAPI);

  return (
    <div className={`app-container${isElectron ? ' electron' : ''}`}>
      <div className="card top-card">
        <Header />
        <div className="timer-layout">
          <Timer timeLeft={timeLeft} currentTask={`${sessionLabel}: ${currentTask}`} />
          <Controls
            setTimeLeft={setTimeLeft}
            pomodoroState={pomodoroState}
            setPomodoroState={setPomodoroState}
            onReset={() => resetTimer()}
            onHaptic={(type) => {
              void fireFeedback(type);
            }}
            onPlayFeedback={() => {
              void fireFeedback('medium');
            }}
          />
        </div>
        {isEditingTask ? (
          <div className="inline-panel">
            <label className="field-label" htmlFor="task-name-input">
              Current task
            </label>
            <input
              id="task-name-input"
              className="inline-input"
              type="text"
              value={taskDraft}
              onChange={(event) => setTaskDraft(event.target.value)}
              maxLength={60}
              autoFocus
            />
            <div className="inline-panel-actions">
              <button
                className="secondary-button"
                onClick={() => {
                  setTaskDraft(currentTask);
                  setIsEditingTask(false);
                }}
              >
                Cancel
              </button>
              <button className="primary-button" onClick={handleTaskSave}>
                Save task
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="card activity-card">
        {completionNote ? (
          <div className="completion-toast" role="status" aria-live="polite">
            {completionNote}
          </div>
        ) : null}
        <TodayActivity
          currentTask={currentTask}
          timeLeft={timeLeft}
          sessionLabel={sessionLabel}
          history={todayHistory}
          weeklySummary={weeklySummary}
          dailyGoal={dailyGoalCount}
          dailyProgress={dailyProgress}
          focusSessionsToday={todayFocusSessions}
          onClearHistory={() => {
            if (typeof window !== 'undefined') {
              const confirmed = window.confirm('Clear today history? This cannot be undone.');
              if (!confirmed) {
                return;
              }
            }
            setSessionHistory({});
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem('pomobar-history');
            }
          }}
        />
        {isSettingsOpen ? (
          <div className="inline-panel settings-panel">
            <div className="settings-grid">
              <label className="settings-field" htmlFor="focus-duration-input">
                <span className="field-label">Focus</span>
                <input
                  id="focus-duration-input"
                  className="inline-input"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={focusDraft}
                  onChange={(event) => setFocusDraft(event.target.value)}
                />
              </label>
              <label className="settings-field" htmlFor="break-duration-input">
                <span className="field-label">Break</span>
                <input
                  id="break-duration-input"
                  className="inline-input"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={breakDraft}
                  onChange={(event) => setBreakDraft(event.target.value)}
                />
              </label>
            </div>
            <div className="settings-grid">
              <label className="settings-field" htmlFor="daily-goal-input">
                <span className="field-label">Daily goal</span>
                <input
                  id="daily-goal-input"
                  className="inline-input"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={dailyGoalDraft}
                  onChange={(event) => setDailyGoalDraft(event.target.value)}
                />
              </label>
            </div>
            <div className="settings-field">
              <span className="field-label">Theme</span>
              <div className="theme-toggle" role="group" aria-label="Theme">
                <button
                  type="button"
                  className={`theme-option${themeDraft === 'dark' ? ' is-active' : ''}`}
                  onClick={() => setThemeDraft('dark')}
                >
                  Dark
                </button>
                <button
                  type="button"
                  className={`theme-option${themeDraft === 'analog' ? ' is-active' : ''}`}
                  onClick={() => setThemeDraft('analog')}
                >
                  Analog
                </button>
              </div>
            </div>
            <div className="settings-debug">
              <span className="field-label">Sound</span>
              <span className="settings-debug-text">
                {`AudioContext: ${getFeedbackState()}`}
              </span>
            </div>
            {soundError ? <div className="settings-error">{soundError}</div> : null}
            <div className="inline-panel-actions">
              <button
                className="secondary-button"
                onClick={async () => {
                  setSoundError(null);
                  if (!hapticsEnabled) {
                    setSoundError('Sound is off.');
                    return;
                  }
                  const result = await testFeedbackTone();
                  if (!result.ok) {
                    setSoundError(
                      result.reason === 'unavailable'
                        ? 'Sound API unavailable in this browser.'
                        : 'Sound is blocked by the browser.'
                    );
                    return;
                  }
                  setSoundError(null);
                }}
              >
                Test sound
              </button>
              <button
                className="secondary-button"
                onClick={() => {
                  setFocusDraft(String(focusMinutes));
                  setBreakDraft(String(breakMinutes));
                  setThemeDraft(preferences.theme);
                  setIsSettingsOpen(false);
                }}
              >
                Cancel
              </button>
              <button className="primary-button" onClick={handleSettingsSave}>
                Save settings
              </button>
            </div>
          </div>
        ) : null}
        <FooterActions
          hapticsEnabled={hapticsEnabled}
          isEditingTask={isEditingTask}
          isSettingsOpen={isSettingsOpen}
          onToggleTaskEditor={() => {
            setIsSettingsOpen(false);
            setTaskDraft(currentTask);
            setIsEditingTask((previous) => !previous);
            void fireFeedback('light');
          }}
          onToggleHaptics={() => {
            setSoundError(null);
            setPreferences((previous) => {
              const nextEnabled = !previous.hapticsEnabled;
              if (nextEnabled) {
                void fireFeedback('light', { enabledOverride: true });
              }
              return {
                ...previous,
                hapticsEnabled: nextEnabled,
              };
            });
          }}
          onToggleSettings={() => {
            setIsEditingTask(false);
            setFocusDraft(String(focusMinutes));
            setBreakDraft(String(breakMinutes));
            setThemeDraft(preferences.theme);
            setIsSettingsOpen((previous) => !previous);
            void fireFeedback('light');
          }}
        />
      </div>
    </div>
  );
}

export default App;
