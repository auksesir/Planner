import { useState } from 'react';
import '../../styles/components/mind_mapping_utilities/SubnodeDialog.css';

const SubnodeDialog = ({ open, onClose, onAddSubnode }) => {
  const [name, setName] = useState('');
  const [deadline, setDeadline] = useState('');

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const subnodeData = {
      name,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      status: 'pending',
      completion: 0
    };

    onAddSubnode(subnodeData);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setDeadline('');
  };

  // Format date for the input (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="subnode-dialog-overlay">
      <div className="subnode-dialog-content">
        <div className="subnode-dialog-header">
          <h3 className="subnode-dialog-title">Add Node</h3>
          <button 
            className="subnode-dialog-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="subnode-form-group">
            <label className="subnode-form-label">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="subnode-form-input"
              placeholder="Enter node name"
              required
            />
          </div>

          <div className="subnode-form-group">
            <label className="subnode-form-label">Deadline (optional)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="subnode-form-input"
              min={formatDateForInput(new Date())}
            />
          </div>
          
          <div className="subnode-actions">
            <button
              type="button"
              className="subnode-button-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="subnode-button-primary"
            >
              Add Node
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubnodeDialog;