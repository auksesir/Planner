import { useState } from 'react';
import '../../styles/components/mind_mapping_utilities/DeadlineDialog.css';

const DeadlineDialog = ({ open, onClose, onSetDeadline, existingDeadline }) => {
  const [selectedDate, setSelectedDate] = useState(
    existingDeadline ? new Date(existingDeadline) : new Date()
  );

  if (!open) return null;

  const handleDateChange = (e) => {
    setSelectedDate(new Date(e.target.value));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSetDeadline(selectedDate.toISOString());
  };

  // Format date for the input (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="deadline-dialog-overlay">
      <div className="deadline-dialog-content">
        <div className="deadline-dialog-header">
          <h3 className="deadline-dialog-title">Set Deadline</h3>
          <button 
            className="deadline-dialog-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="deadline-form-group">
            <label className="deadline-form-label">Select a deadline date:</label>
            <input
              type="date"
              value={formatDateForInput(selectedDate)}
              onChange={handleDateChange}
              className="deadline-date-input"
              min={formatDateForInput(new Date())}
            />
          </div>
          
          <div className="deadline-actions">
            <button
              type="button"
              className="deadline-button-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="deadline-button-primary"
            >
              Set Deadline
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeadlineDialog;