import '../../styles/components/mind_mapping_visualisation/ProjectNode.css';

const ProjectNode = ({ 
  node, 
  onMouseDown, 
  onClick, 
  isDragging,
  onAddSubnode, 
  onDeleteNode,
  onUpdateCompletion,
  childrenComplete = true,
  isHighlighted = false
}) => {
  // Extract only essential node data
  const {
    id,
    name = 'Unnamed Node',
    completion = 0,
    deadline = null
  } = node;
  
  // Ensure completion is a number and rounded to nearest integer
  const nodeCompletion = Math.round(Number(completion) || 0);
  
  // Check if node is completed
  const isCompleted = nodeCompletion >= 100;
  
  // Calculate days remaining if deadline exists
  let daysRemaining = null;
  let isOverdue = false;
  
  if (deadline) {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const timeDiff = deadlineDate.getTime() - today.getTime();
    daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    isOverdue = daysRemaining < 0;
  }
  
  const handleToggleCompletion = (e) => {
    e.stopPropagation();
    onUpdateCompletion(id, isCompleted ? 0 : 100);
  };

  return (
    <div
      className="project-node-wrapper compact-node"
      style={{
        left: node.position_x,
        top: node.position_y
      }}
    >
      <div
        className={`project-node ${isDragging ? 'dragging' : ''} 
          ${isOverdue ? 'overdue' : ''} 
          ${isHighlighted ? 'highlighted-node' : ''}
          ${isCompleted ? 'completed' : ''}`}
        onMouseDown={(e) => onMouseDown(e, id)}
        onClick={() => onClick(id)}
      >
        {/* Node title - always visible */}
        <div className="node-title">
          {name}
        </div>
        
        {/* For incomplete nodes: always show completion bar and percentage */}
        {!isCompleted && (
          <div className="node-completion always-visible">
            {/* Percentage on left side of bar */}
            <div className="completion-value-container">
              <span className="completion-value">{nodeCompletion}%</span>
            </div>
            {/* Progress bar */}
            <div className="node-progress-bar">
              <div 
                className={`node-progress-fill ${!childrenComplete ? 'incomplete-children-fill' : ''}`}
                style={{ width: `${nodeCompletion}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* For completed nodes: completion bar only shown on hover */}
        {isCompleted && (
          <div className="node-completion hover-visible">
            {/* Percentage on left side of bar */}
            <div className="completion-value-container">
              <span className="completion-value">{nodeCompletion}%</span>
            </div>
            {/* Progress bar */}
            <div className="node-progress-bar">
              <div 
                className="node-progress-fill"
                style={{ width: `${nodeCompletion}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Days remaining for uncompleted nodes - now below completion bar */}
        {!isCompleted && daysRemaining !== null && (
          <div className={`node-deadline always-visible ${isOverdue ? 'overdue' : ''}`}>
            <span>{isOverdue ? '⚠️ ' : ''}{Math.abs(daysRemaining)}d {isOverdue ? 'ago' : 'left'}</span>
          </div>
        )}
        
        {/* Delete button - visible ONLY on hover */}
        <button 
          className="node-delete-btn" 
          onClick={(e) => {
            e.stopPropagation();
            onDeleteNode(id);
          }}
          title="Delete node"
        >
          ✕
        </button>
        
        {/* Completion toggle button - visible on hover */}
        <button 
          className="complete-node-btn hover-visible" 
          onClick={handleToggleCompletion}
          title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
        >
          {isCompleted ? "✓" : "○"}
        </button>
      </div>
      
      {/* Add subnode button - visible on hover */}
      <button 
        className="add-subnode-btn hover-visible" 
        onClick={(e) => {
          e.stopPropagation();
          onAddSubnode(id);
        }} 
        title="Add subnode"
      >
        +
      </button>
    </div>
  );
};

export default ProjectNode;