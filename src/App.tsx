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
const STORAGE_KEY = 'pomobar-preferences';

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
}

const readStoredPreferences = (): StoredPreferences => {
  if (typeof window === 'undefined') {
    return {
      breakMinutes: DEFAULT_BREAK_MIN,
      currentTask: DEFAULT_TASK,
      focusMinutes: DEFAULT_FOCUS_MIN,
      hapticsEnabled: true,
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      throw new Error('Missing saved preferences');
    }

    const parsed = JSON.parse(raw) as Partial<StoredPreferences>;

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
    };
  } catch {
    return {
      breakMinutes: DEFAULT_BREAK_MIN,
      currentTask: DEFAULT_TASK,
      focusMinutes: DEFAULT_FOCUS_MIN,
      hapticsEnabled: true,
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
      const played = playFeedbackTone('success', hapticsEnabled);
      if (!played && window.electronAPI) {
        window.electronAPI.playFeedback();
      }

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
    const timeString = `${currentTask} | ${formatTime(timeLeft)}`;
    if (window.electronAPI) {
      window.electronAPI.updateTimer(timeString);
    }
  }, [timeLeft, currentTask]);

  const fireFeedback = async (type: Parameters<typeof playFeedbackTone>[0]) => {
    if (!hapticsEnabled) {
      setSoundError('Sound is off.');
      return;
    }

    triggerHaptic(type, hapticsEnabled);
    const played = playFeedbackTone(type, hapticsEnabled);
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
      setSoundError('Sound is blocked by the browser.');
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
    fireFeedback('light');
  };

  const handleSettingsSave = () => {
    const resolvedFocus = clampMinutesInput(focusDraft);
    const resolvedBreak = clampMinutesInput(breakDraft);

    if (!resolvedFocus || !resolvedBreak) {
      setFocusDraft(String(focusMinutes));
      setBreakDraft(String(breakMinutes));
      setIsSettingsOpen(false);
      return;
    }

    setPreferences((previous) => ({
      ...previous,
      breakMinutes: resolvedBreak,
      focusMinutes: resolvedFocus,
    }));
    updateDurations(resolvedFocus, resolvedBreak);
    resetTimer('focus');
    setIsSettingsOpen(false);
    fireFeedback('light');
  };

  const isElectron = Boolean(window.electronAPI);

  return (
    <div className={`app-container${isElectron ? ' electron' : ''}`}>
      <div className="card top-card">
        <Header />
        <Timer timeLeft={timeLeft} currentTask={`${sessionLabel}: ${currentTask}`} />
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
            setPreferences((previous) => ({
              ...previous,
              hapticsEnabled: !previous.hapticsEnabled,
            }));
            void fireFeedback('light');
          }}
          onToggleSettings={() => {
            setIsEditingTask(false);
            setFocusDraft(String(focusMinutes));
            setBreakDraft(String(breakMinutes));
            setIsSettingsOpen((previous) => !previous);
            void fireFeedback('light');
          }}
        />
      </div>
    </div>
  );
}

export default App;
