import { useEffect, useState } from 'react';
import '../../styles/components/mind_mapping_visualisation/ProjectMindMap.css';
import ConfirmDeleteDialog from '../mind_mapping_utilities/ConfirmDeleteDialog';
import SubnodeDialog from '../mind_mapping_utilities/SubnodeDialog';
import NodeConnections from './NodeConnections';
import ProjectNode from './ProjectNode';

const ProjectMindMap = ({ 
  project,
  nodes, 
  onUpdateNode, 
  onAddSubnode, 
  onAddNode,
  onDeleteNode,
  onUpdateCompletion
}) => {
  const [draggingNode, setDraggingNode] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeToDelete, setNodeToDelete] = useState(null);
  const [childrenCompletionStatus, setChildrenCompletionStatus] = useState({});
  
  // Simplified dialogs state
  const [isSubnodeDialogOpen, setIsSubnodeDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Check for children completion status
  useEffect(() => {
    const calculateChildrenCompletionStatus = () => {
      const newCompletionStatus = {};
      
      const areAllChildrenComplete = (nodeId) => {
        const children = nodes.filter(node => node.parent_node_id === nodeId);
        if (children.length === 0) return true;
        return children.every(child => 
          parseInt(child.completion) >= 100 && areAllChildrenComplete(child.id)
        );
      };
      
      nodes.forEach(node => {
        newCompletionStatus[node.id] = areAllChildrenComplete(node.id);
      });
      
      return newCompletionStatus;
    };
    
    setChildrenCompletionStatus(calculateChildrenCompletionStatus());
  }, [nodes]);

  // Handle mouse movement for dragging nodes
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!draggingNode) return;
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      onUpdateNode(draggingNode, { positionX: newX, positionY: newY });
    };

    const handleMouseUp = () => {
      setDraggingNode(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingNode, dragOffset, onUpdateNode]);

  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setDraggingNode(nodeId);
    setDragOffset({
      x: e.clientX - node.position_x,
      y: e.clientY - node.position_y
    });
  };

  const handleNodeClick = (nodeId) => {
    setSelectedNode(nodeId);
  };

  // Handle node operations
  const handleAddSubnode = (parentId) => {
    setSelectedNode(parentId);
    setIsSubnodeDialogOpen(true);
  };
  
  const handleDeleteNodeClick = (nodeId) => {
    setNodeToDelete(nodeId);
    setIsDeleteConfirmOpen(true);
  };
  
  // Handle node completion
  const handleUpdateNodeCompletion = (nodeId, completionValue) => {
    onUpdateCompletion(nodeId, completionValue);
  };
  
  const confirmDeleteNode = () => {
    if (nodeToDelete) {
      onDeleteNode(nodeToDelete);
      setNodeToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  };
  
  const closeAllDialogs = () => {
    setIsSubnodeDialogOpen(false);
    setIsDeleteConfirmOpen(false);
  };

  if (!project) {
    return (
      <div className="mind-map-container">
        <div className="empty-mind-map">
          <p className="empty-mind-map-text">No project selected.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="project-layout">
      {/* Main content area with mind map - Header removed */}
      <div className="mind-map-container">
        {nodes.length === 0 ? (
          <div className="empty-mind-map">
            <p className="empty-mind-map-text">This project has no nodes yet. Click the + button to add a node.</p>
          </div>
        ) : (
          <>
            <NodeConnections nodes={nodes} />
            {nodes.map(node => (
              <ProjectNode
                key={node.id}
                node={node}
                onMouseDown={handleNodeMouseDown}
                onClick={handleNodeClick}
                isDragging={draggingNode === node.id}
                onAddSubnode={handleAddSubnode}
                onDeleteNode={handleDeleteNodeClick}
                onUpdateCompletion={handleUpdateNodeCompletion}
                childrenComplete={childrenCompletionStatus[node.id]}
              />
            ))}
          </>
        )}
        
        {/* Add Node button */}
        <button 
          className="add-main-node-btn"
          onClick={onAddNode}
          title="Add new node"
        >
          +
        </button>
      </div>

      {/* Dialogs */}
      {isSubnodeDialogOpen && (
        <SubnodeDialog
          open={isSubnodeDialogOpen}
          onClose={() => setIsSubnodeDialogOpen(false)}
          onAddSubnode={(subnodeData) => {
            if (!selectedNode) return;
            onAddSubnode(selectedNode, subnodeData);
            setIsSubnodeDialogOpen(false);
          }}
        />
      )}
      
      {isDeleteConfirmOpen && (
        <ConfirmDeleteDialog
          open={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={confirmDeleteNode}
          itemType="node"
          itemName={nodes.find(n => n.id === nodeToDelete)?.name || 'this node'}
          warningText="This will delete the node and all its subnodes."
        />
      )}
    </div>
  );
};

export default ProjectMindMap;