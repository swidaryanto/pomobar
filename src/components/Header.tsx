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
                <div className="header-date-left">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                        <line x1="6" y1="1" x2="6" y2="4"></line>
                        <line x1="10" y1="1" x2="10" y2="4"></line>
                        <line x1="14" y1="1" x2="14" y2="4"></line>
                    </svg>
                </div>
                <div className="text-small text-mono">
                    {todayLabel}
                </div>
            </div>
        </div>
    );
};

export default Header;
