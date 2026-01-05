interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  includeNames: boolean;
  onIncludeNamesChange: (next: boolean) => void;
}

export function SettingsModal({
  open,
  onClose,
  includeNames,
  onIncludeNamesChange,
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
        </div>
      </div>
    </div>
  );
}
