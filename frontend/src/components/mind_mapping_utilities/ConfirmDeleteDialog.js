import '../../styles/components/mind_mapping_utilities/ConfirmDeleteDialog.css';

const ConfirmDeleteDialog = ({ 
  open, 
  onClose, 
  onConfirm, 
  itemType = 'item', 
  itemName = 'this item',
  warningText = 'This action cannot be undone.'
}) => {
  if (!open) return null;

  return (
    <div className="confirm-delete-overlay">
      <div className="confirm-delete-content">
        <div className="confirm-delete-header">
          <h3 className="confirm-delete-title">Delete {itemType}</h3>
          <button 
            className="confirm-delete-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="confirm-delete-body">
          <p>Are you sure you want to delete {itemName}?</p>
          {warningText && (
            <p className="confirm-delete-warning">{warningText}</p>
          )}
        </div>
        
        <div className="confirm-delete-actions">
          <button
            className="confirm-delete-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="confirm-delete-confirm"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteDialog;