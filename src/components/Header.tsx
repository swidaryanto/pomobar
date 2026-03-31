import React from 'react';

const Header: React.FC = () => {
    const todayLabel = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
    }).format(new Date()).toUpperCase();

    return (
        <div className="drag-region header">
            {/* Date */}
            <div className="header-date-row">
                <div className="text-small text-mono">
                    {todayLabel}
                </div>
            </div>
        </div>
    );
};

export default Header;
