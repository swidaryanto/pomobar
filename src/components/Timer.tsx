import React from 'react';

interface TimerProps {
    timeLeft: number;
    currentTask: string;
}

const Timer: React.FC<TimerProps> = ({ timeLeft, currentTask }) => {
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');

    return (
        <div className="timer-block">
            <div className="timer-task">{currentTask}</div>
            <div className="timer-clock">
                {m}:{s}
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
