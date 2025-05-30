import '../../styles/components/mind_mapping_visualisation/NodeConnections.css';

// Create a direct connection component for each node pair
const NodeConnection = ({ childNode, parentNode }) => {
  // Get node dimensions based on completion status
  const getNodeDimensions = (node) => {
    if (node.completion >= 100) {
      return { width: 150, height: 20 }; // Smaller height for completed nodes
    } else {
      return { width: 150, height: 50 }; // Standard size for incomplete nodes
    }
  };
  
  // Get the dimensions for both nodes
  const childDims = getNodeDimensions(childNode);
  const parentDims = getNodeDimensions(parentNode);
  
  // Calculate the connection points
  const childPoint = {
    x: childNode.position_x,
    y: childNode.position_y - (childDims.height / 2) // Top center
  };
  
  // Calculate which edge of the parent node to connect to
  const dx = parentNode.position_x - childNode.position_x;
  const dy = parentNode.position_y - childNode.position_y;
  
  // Calculate parent connection point
  let parentPoint = { x: 0, y: 0 };
  
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontally aligned - connect to left or right edge
    parentPoint.x = parentNode.position_x + (dx > 0 ? -(parentDims.width / 2) : (parentDims.width / 2));
    parentPoint.y = parentNode.position_y;
  } else {
    // Vertically aligned - connect to top or bottom edge
    parentPoint.x = parentNode.position_x;
    parentPoint.y = parentNode.position_y + (dy > 0 ? -(parentDims.height / 2) : (parentDims.height / 2));
  }
  
  // Calculate angle for the arrow head
  const angle = Math.atan2(parentPoint.y - childPoint.y, parentPoint.x - childPoint.x);
  
  // Arrow head dimensions - delicate
  const headLength = 6;
  const headWidth = 4;
  
  // Calculate arrow head points
  const arrowPoints = [
    [parentPoint.x, parentPoint.y], // tip
    [
      parentPoint.x - headLength * Math.cos(angle) + headWidth * Math.sin(angle),
      parentPoint.y - headLength * Math.sin(angle) - headWidth * Math.cos(angle)
    ], // left corner
    [
      parentPoint.x - headLength * Math.cos(angle) - headWidth * Math.sin(angle),
      parentPoint.y - headLength * Math.sin(angle) + headWidth * Math.cos(angle)
    ] // right corner
  ];
  
  // Determine if the child node is completed (>= 100%)
  const isChildCompleted = childNode.completion >= 100;
  
  // Apply different classes based on completion status
  // Only use dashed line for incomplete nodes
  const connectionClass = isChildCompleted ? 'connection-complete' : 'connection-in-progress';
  
  return (
    <>
      {/* Line */}
      <line
        x1={childPoint.x}
        y1={childPoint.y}
        x2={parentPoint.x}
        y2={parentPoint.y}
        className={`connection-path ${connectionClass}`}
      />
      
      {/* Arrow head */}
      <polygon
        points={arrowPoints.map(point => point.join(',')).join(' ')}
        className={`arrowhead ${connectionClass}`}
      />
    </>
  );
};

// Main component that manages all connections
const NodeConnections = ({ nodes }) => {
  // Filter nodes with parent-child relationships
  const connections = nodes
    .filter(node => node.parent_node_id)
    .map(childNode => {
      const parentNode = nodes.find(n => n.id === childNode.parent_node_id);
      if (!parentNode) return null;
      return { childNode, parentNode };
    })
    .filter(Boolean);
  
  return (
    <svg 
      className="node-connections" 
      width="100%" 
      height="100%"
    >
      {connections.map(({ childNode, parentNode }) => (
        <g key={`connection-${childNode.id}-${parentNode.id}`}>
          <NodeConnection 
            childNode={childNode} 
            parentNode={parentNode} 
          />
        </g>
      ))}
    </svg>
  );
};

export default NodeConnections;