import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import Timer from './components/Timer';
import Controls from './components/Controls';
import TodayActivity from './components/TodayActivity';
import FooterActions from './components/FooterActions';
import { triggerHaptic } from './lib/haptics';
import { getFeedbackState, playFeedbackTone, testFeedbackTone } from './lib/feedback';
import { usePomodoroTimer } from './hooks/usePomodoroTimer';
import './App.css';

declare global {
  interface Window {
    electronAPI?: {
      updateTimer: (time: string) => void;
      playFeedback: () => void;
      quitApp: () => void;
    };
  }
}

const DEFAULT_FOCUS_MIN = 25;
const DEFAULT_BREAK_MIN = 5;
const DEFAULT_TASK = 'Focus Task';
const DEFAULT_THEME = 'analog';
const STORAGE_KEY = 'pomobar-preferences';
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
}

const readStoredPreferences = (): StoredPreferences => {
  if (typeof window === 'undefined') {
    return {
      breakMinutes: DEFAULT_BREAK_MIN,
      currentTask: DEFAULT_TASK,
      focusMinutes: DEFAULT_FOCUS_MIN,
      hapticsEnabled: true,
      theme: DEFAULT_THEME,
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
    };
  } catch {
    return {
      breakMinutes: DEFAULT_BREAK_MIN,
      currentTask: DEFAULT_TASK,
      focusMinutes: DEFAULT_FOCUS_MIN,
      hapticsEnabled: true,
      theme: DEFAULT_THEME,
    };
  }
};

const clampMinutesInput = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
};

function App() {
  const [preferences, setPreferences] = useState(readStoredPreferences);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [taskDraft, setTaskDraft] = useState(preferences.currentTask);
  const [focusDraft, setFocusDraft] = useState(String(preferences.focusMinutes));
  const [breakDraft, setBreakDraft] = useState(String(preferences.breakMinutes));
  const [themeDraft, setThemeDraft] = useState<ThemeName>(preferences.theme);
  const [soundError, setSoundError] = useState<string | null>(null);
  const { breakMinutes, currentTask, focusMinutes, hapticsEnabled } = preferences;
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
    onSessionComplete: (completedSession, nextSession) => {
      triggerHaptic('success', hapticsEnabled);
      void (async () => {
        const played = await playFeedbackTone('success', hapticsEnabled);
        if (!played && window.electronAPI) {
          window.electronAPI.playFeedback();
        }
      })();

      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          const completedLabel = completedSession === 'focus' ? 'Focus' : 'Break';
          const nextLabel = nextSession === 'focus' ? 'Focus' : 'Break';

          new Notification(`${completedLabel} done`, {
            body: `Next: ${nextLabel} session`,
          });
        }
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
    if (typeof document === 'undefined') {
      return;
    }

    document.body.dataset.theme = themeDraft;

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
    setTaskDraft(currentTask);
  }, [currentTask]);

  useEffect(() => {
    setFocusDraft(String(focusMinutes));
    setBreakDraft(String(breakMinutes));
  }, [focusMinutes, breakMinutes]);

  useEffect(() => {
    setThemeDraft(preferences.theme);
  }, [preferences.theme]);

  useEffect(() => {
    const timeString = `${currentTask} | ${formatTime(timeLeft)}`;
    if (window.electronAPI) {
      window.electronAPI.updateTimer(timeString);
    }
  }, [timeLeft, currentTask]);

  const fireFeedback = async (
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
  };

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

    if (!resolvedFocus || !resolvedBreak) {
      setFocusDraft(String(focusMinutes));
      setBreakDraft(String(breakMinutes));
      setThemeDraft(preferences.theme);
      setIsSettingsOpen(false);
      return;
    }

    setPreferences((previous) => ({
      ...previous,
      breakMinutes: resolvedBreak,
      focusMinutes: resolvedFocus,
      theme: themeDraft,
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
        <TodayActivity currentTask={currentTask} timeLeft={timeLeft} sessionLabel={sessionLabel} />
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
