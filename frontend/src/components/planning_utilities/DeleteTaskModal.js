import '../../styles/components/planning_utilities/DeleteTaskModal.css';

// DeleteTaskModal component displays a modal for confirming task deletion
const DeleteTaskModal = ({ isOpen, isRepeatingTask, onClose, onDeleteSingle, onDeleteAll, itemType }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p>Are you sure you want to delete this {itemType}?</p>
        
        {isRepeatingTask ? (
          <>
            <button onClick={onDeleteSingle}>Delete for this day</button>
            <button onClick={onDeleteAll}>Delete all instances</button>
          </>
        ) : (
          <button onClick={onDeleteSingle}>Yes</button>
        )}
        
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default DeleteTaskModal;
