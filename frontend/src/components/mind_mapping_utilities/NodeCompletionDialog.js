import { useEffect, useState } from 'react';
import '../../styles/components/mind_mapping_utilities/NodeCompletionDialog.css';

const NodeCompletionDialog = ({ 
  open, 
  onClose, 
  onUpdateCompletion, 
  currentCompletion = 0,
  hasIncompleteChildren = false 
}) => {
  const [completion, setCompletion] = useState(currentCompletion);
  const [showWarning, setShowWarning] = useState(false);
  const [warningLevel, setWarningLevel] = useState('info'); // 'info', 'warning', or 'error'

  // Initialize the dialog with the current completion value
  useEffect(() => {
    setCompletion(currentCompletion);
    // Check for warning when opening the dialog
    if (hasIncompleteChildren && currentCompletion >= 100) {
      setShowWarning(true);
      setWarningLevel('warning');
    } else {
      setShowWarning(false);
      setWarningLevel('info');
    }
  }, [currentCompletion, hasIncompleteChildren, open]);

  if (!open) return null;

  const handleSliderChange = (e) => {
    const newValue = parseInt(e.target.value);
    setCompletion(newValue);
    
    // Update warning status based on new value and children status
    if (hasIncompleteChildren) {
      if (newValue === 100) {
        // Strong warning when trying to mark as 100% complete with incomplete children
        setShowWarning(true);
        setWarningLevel('warning');
      } else if (newValue > 80) {
        // Info-level warning for high completion with incomplete children
        setShowWarning(true);
        setWarningLevel('info');
      } else {
        setShowWarning(false);
      }
    } else {
      setShowWarning(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateCompletion(completion);
  };

  return (
    <div className="completion-dialog-overlay">
      <div className="completion-dialog-content">
        <div className="completion-dialog-header">
          <h3 className="completion-dialog-title">Update Node Completion</h3>
          <button 
            className="completion-dialog-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="completion-form-group">
            <label className="completion-form-label">Completion Percentage:</label>
            <div className="completion-slider-container">
              <input
                type="range"
                min="0"
                max="100"
                value={completion}
                onChange={handleSliderChange}
                className="completion-slider"
              />
              <div className="completion-value">{completion}%</div>
            </div>
            
            <div className="completion-preview">
              <div className="completion-preview-bar">
                <div 
                  className={`completion-preview-fill ${warningLevel === 'warning' ? 'warning' : ''}`}
                  style={{ width: `${completion}%` }}
                ></div>
              </div>
            </div>
            
            {showWarning && (
              <div className={`completion-warning-message ${warningLevel}`}>
                <span className="warning-icon">
                  {warningLevel === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                {warningLevel === 'warning' ? (
                  <>
                    Some child nodes are not yet complete.
                    <p className="warning-detail">A node should only be marked 100% complete when all its child nodes are also complete. The node's appearance will indicate this inconsistency if you proceed.</p>
                  </>
                ) : (
                  <>
                    Child nodes affect completion status.
                    <p className="warning-detail">For hierarchical integrity, it's recommended to complete child nodes before marking a parent node as complete.</p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="completion-children-status">
            {hasIncompleteChildren && (
              <div className="children-status-info">
                <h4>Child Node Status</h4>
                <p>Some of this node's children are not yet at 100% completion. For best results, complete child nodes first before marking parent nodes as complete.</p>
              </div>
            )}
          </div>
          
          <div className="completion-actions">
            <button
              type="button"
              className="completion-button-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="completion-button-primary"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NodeCompletionDialog;