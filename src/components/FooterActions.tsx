import React from 'react';

interface FooterActionsProps {
  hapticsEnabled: boolean;
  isEditingTask: boolean;
  isSettingsOpen: boolean;
  isActivityExpanded: boolean;
  isCompactView: boolean;
  onToggleTaskEditor: () => void;
  onToggleActivity: () => void;
  onToggleHaptics: () => void;
  onToggleSettings: () => void;
  onToggleCompact: () => void;
}

const FooterActions: React.FC<FooterActionsProps> = ({
  hapticsEnabled,
  isEditingTask,
  isSettingsOpen,
  isActivityExpanded,
  isCompactView,
  onToggleTaskEditor,
  onToggleActivity,
  onToggleHaptics,
  onToggleSettings,
  onToggleCompact,
}) => {
  return (
    <div className="footer-actions">
      <div className="footer-actions-panel">
        <button
          onClick={onToggleActivity}
          className="footer-actions-button"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"></path>
            <path d="M7 14l4-4 4 3 5-6"></path>
          </svg>
          {isActivityExpanded ? 'Hide progress' : 'Show progress'}
        </button>

        <button
          onClick={onToggleTaskEditor}
          className="footer-actions-button"
        >
          <span className="footer-actions-icon">+</span>
          {isEditingTask ? 'Close task' : 'Edit task'}
        </button>

        <button
          onClick={onToggleHaptics}
          className={`footer-actions-button${hapticsEnabled ? '' : ' is-muted'}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" strokeDasharray="3 3"></circle>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          {hapticsEnabled ? 'Feedback on' : 'Feedback off'}
        </button>

        <button
          onClick={onToggleSettings}
          className="footer-actions-button"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          {isSettingsOpen ? 'Close settings' : 'Settings'}
        </button>

        <button
          onClick={onToggleCompact}
          className="footer-actions-button"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="6" rx="1"></rect>
            <rect x="3" y="14" width="10" height="6" rx="1"></rect>
          </svg>
          {isCompactView ? 'Expand view' : 'Compact view'}
        </button>
      </div>
      <div className="footer-shortcuts">
        Shortcuts: Space start/pause · ↑/↓ ±5m · Cmd/Ctrl+, settings
      </div>
    </div>
  );
};

export default FooterActions;
