import { useState } from 'react';
import '../../styles/components/mind_mapping_utilities/ProjectDialogs.css';

export const NewProjectDialog = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(formatDateForInput(new Date()));
  const [endDate, setEndDate] = useState('');
  
  // Format date for the input (YYYY-MM-DD)
  function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && startDate && endDate) {
      // Validate that end date is after start date
      if (new Date(endDate) <= new Date(startDate)) {
        alert("End date must be after start date");
        return;
      }
      
      onCreate({ 
        name, 
        description, 
        startDate: new Date(startDate).toISOString(), 
        endDate: new Date(endDate).toISOString(),
        deadline: new Date(endDate).toISOString()
      });
      
      // Reset form
      setName('');
      setDescription('');
      setStartDate(formatDateForInput(new Date()));
      setEndDate('');
      onClose();
    } else {
      alert("Please fill in all required fields");
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Create New Project</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Project Name*</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              required
              data-testid="project-name-input"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group half-width">
              <label className="form-label">Start Date*</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input"
                required
                data-testid="start-date-input"
              />
            </div>
            
            <div className="form-group half-width">
              <label className="form-label">End Date/Deadline*</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-input"
                min={startDate} // Prevent selecting end date before start date
                required
                data-testid="end-date-input"
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="button button-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button-primary"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const NewNodeDialog = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [weight, setWeight] = useState(1);

 

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate({ 
        name, 
        description, 
        deadline: deadline ? new Date(deadline).toISOString() : null,
        weight: parseInt(weight, 10) || 1
      });
      
      // Reset form
      setName('');
      setDescription('');
      setDeadline('');
      setWeight(1);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Add New Node</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Node Name*</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              required
              data-testid="node-name-input"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group half-width">
              <label className="form-label">Deadline (optional)</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="form-input"
                data-testid="node-deadline-input"
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="button button-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button-primary"
            >
              Add Node
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};