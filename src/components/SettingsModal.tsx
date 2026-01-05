interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  includeNames: boolean;
  showNextLetters: boolean;
  onIncludeNamesChange: (next: boolean) => void;
  onShowNextLettersChange: (next: boolean) => void;
}

export function SettingsModal({
  open,
  onClose,
  includeNames,
  showNextLetters,
  onIncludeNamesChange,
  onShowNextLettersChange,
}: SettingsModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close settings">
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="setting-item">
            <label className="setting-label">
              <span className="setting-title">Include Names</span>
              <span className="setting-description">Allow names to be matched as words</span>
            </label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={includeNames}
                onChange={(e) => onIncludeNamesChange(e.target.checked)}
                aria-label="Toggle include names"
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="setting-item">
            <label className="setting-label">
              <span className="setting-title">Show Next Letters</span>
              <span className="setting-description">Display available next letters during word building</span>
            </label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={showNextLetters}
                onChange={(e) => onShowNextLettersChange(e.target.checked)}
                aria-label="Toggle show next letters"
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
