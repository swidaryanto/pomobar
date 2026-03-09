import React from 'react';

interface TimerProps {
    timeLeft: number;
    currentTask: string;
}

const Timer: React.FC<TimerProps> = ({ timeLeft, currentTask }) => {
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '8px 0' }}>
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                {currentTask}
            </div>
            <div style={{ fontSize: '64px', fontWeight: 400, letterSpacing: '-2px', lineHeight: 1 }}>
                {m}:{s}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} style={{
                        width: '4px',
                        height: '6px',
                        borderRadius: '2px',
                        backgroundColor: i === 1 ? 'var(--text-secondary)' : 'var(--divider)',
                        opacity: i === 1 ? 1 : 0.4
                    }} />
                ))}
            </div>
        </div>
    );
};

export default Timer;
