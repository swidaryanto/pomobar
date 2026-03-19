import React from 'react';

interface TimerProps {
    timeLeft: number;
    currentTask: string;
    sessionLabel: string;
    nextSessionLabel: string;
    nextSessionMinutes: number;
    isEditingTask: boolean;
    taskDraft: string;
    onTaskChange: (value: string) => void;
    onTaskEditStart: () => void;
    onTaskSave: () => void;
    onTaskCancel: () => void;
}

const Timer: React.FC<TimerProps> = ({
    timeLeft,
    currentTask,
    sessionLabel,
    nextSessionLabel,
    nextSessionMinutes,
    isEditingTask,
    taskDraft,
    onTaskChange,
    onTaskEditStart,
    onTaskSave,
    onTaskCancel,
}) => {
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');

    return (
        <div className="timer-block">
            <div className="timer-header">
                <span className="timer-session">{sessionLabel}</span>
                {isEditingTask ? (
                    <input
                        className="timer-task-input"
                        value={taskDraft}
                        onChange={(event) => onTaskChange(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                onTaskSave();
                            }
                            if (event.key === 'Escape') {
                                onTaskCancel();
                            }
                        }}
                        maxLength={60}
                        autoFocus
                    />
                ) : (
                    <button className="timer-task" onClick={onTaskEditStart}>
                        {currentTask}
                    </button>
                )}
            </div>
            {isEditingTask ? (
                <div className="timer-task-actions">
                    <button className="secondary-button" onClick={onTaskCancel}>
                        Cancel
                    </button>
                    <button className="primary-button" onClick={onTaskSave}>
                        Save
                    </button>
                </div>
            ) : null}
            <div className="timer-clock">
                {m}:{s}
            </div>
            <div className="timer-next">
                Next: {nextSessionLabel} {nextSessionMinutes}m
            </div>
            <div className="timer-ticks">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div
                        key={i}
                        className={`timer-tick${i === 1 ? ' is-active' : ''}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default Timer;
