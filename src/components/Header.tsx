import React from 'react';

const Header: React.FC = () => {
    const todayLabel = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
    }).format(new Date()).toUpperCase();

    return (
        <div className="drag-region header">
            {/* Top bar with traffic lights and More */}
            <div className="header-top">
                <div className="header-lights">
                    <div className="header-light header-light--red" />
                    <div className="header-light header-light--yellow" />
                    <div className="header-light header-light--green" />
                </div>
                <div className="header-more">
                    <div className="header-more-dot" />
                    <div className="header-more-dot" />
                    <div className="header-more-dot" />
                </div>
            </div>

            {/* Date and icon */}
            <div className="header-date-row">
                <div className="text-small text-mono">
                    {todayLabel}
                </div>
            </div>
        </div>
    );
};

export default Header;
