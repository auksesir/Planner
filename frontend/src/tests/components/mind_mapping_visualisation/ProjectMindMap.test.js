import { fireEvent, render, screen } from '@testing-library/react';

// Import the actual component
import ProjectMindMap from '../../../components/mind_mapping_visualisation/ProjectMindMap';

// Mock child components to simplify testing
jest.mock('../../../components/mind_mapping_utilities/ConfirmDeleteDialog', () => {
  return function MockConfirmDeleteDialog(props) {
    return props.open ? (
      <div data-testid="confirm-delete-dialog">
        <button onClick={props.onConfirm}>Confirm Delete</button>
      </div>
    ) : null;
  };
});

jest.mock('../../../components/mind_mapping_utilities/SubnodeDialog', () => {
  return function MockSubnodeDialog(props) {
    return props.open ? (
      <div data-testid="subnode-dialog">
        <button onClick={() => props.onAddSubnode({ name: 'New Subnode' })}>Add Subnode</button>
      </div>
    ) : null;
  };
});

jest.mock('../../../components/mind_mapping_visualisation/NodeConnections', () => {
  return function MockNodeConnections() {
    return <div data-testid="node-connections" />;
  };
});

jest.mock('../../../components/mind_mapping_visualisation/ProjectNode', () => {
  return function MockProjectNode(props) {
    return (
      <div 
        data-testid="project-node" 
        onClick={() => props.onClick(props.node.id)}
        onMouseDown={(e) => props.onMouseDown(e, props.node.id)}
      >
        {props.node.name}
        <button onClick={() => props.onAddSubnode(props.node.id)}>Add Subnode</button>
        <button onClick={() => props.onDeleteNode(props.node.id)}>Delete Node</button>
      </div>
    );
  };
});

describe('ProjectMindMap Component', () => {
  const mockProject = {
    id: 1,
    name: 'Test Project'
  };

  const mockNodes = [
    { 
      id: 1, 
      name: 'Main Node 1', 
      position_x: 100, 
      position_y: 100, 
      completion: 50,
      parent_node_id: null
    },
    { 
      id: 2, 
      name: 'Subnode 1', 
      position_x: 250, 
      position_y: 200, 
      completion: 75,
      parent_node_id: 1
    }
  ];

  const mockProps = {
    project: mockProject,
    nodes: mockNodes,
    onUpdateNode: jest.fn(),
    onAddSubnode: jest.fn(),
    onAddNode: jest.fn(),
    onDeleteNode: jest.fn(),
    onUpdateCompletion: jest.fn()
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders project nodes when project exists', () => {
    render(<ProjectMindMap {...mockProps} />);
    
    // Check if nodes are rendered
    expect(screen.getByText('Main Node 1')).toBeInTheDocument();
    expect(screen.getByText('Subnode 1')).toBeInTheDocument();
  });

  test('renders empty state when no project', () => {
    render(<ProjectMindMap {...mockProps} project={null} />);
    
    expect(screen.getByText('No project selected.')).toBeInTheDocument();
  });

  test('renders empty state when no nodes', () => {
    render(<ProjectMindMap {...mockProps} nodes={[]} />);
    
    expect(screen.getByText('This project has no nodes yet. Click the + button to add a node.')).toBeInTheDocument();
  });

  test('handles node click', () => {
    render(<ProjectMindMap {...mockProps} />);
    
    const mainNode = screen.getByText('Main Node 1');
    fireEvent.click(mainNode);
  });

  test('handles adding a new main node', () => {
    render(<ProjectMindMap {...mockProps} />);
    
    const addNodeButton = screen.getByTitle('Add new node');
    fireEvent.click(addNodeButton);

    expect(mockProps.onAddNode).toHaveBeenCalled();
  });

  test('handles adding a subnode', () => {
    render(<ProjectMindMap {...mockProps} />);
    
    const addSubnodeButtons = screen.getAllByText('Add Subnode');
    fireEvent.click(addSubnodeButtons[0]);

    // The subnode dialog should open
    expect(screen.getByTestId('subnode-dialog')).toBeInTheDocument();
  });

  test('handles node deletion', () => {
    render(<ProjectMindMap {...mockProps} />);
    
    const deleteButtons = screen.getAllByText('Delete Node');
    fireEvent.click(deleteButtons[0]);

    // The confirm delete dialog should open
    expect(screen.getByTestId('confirm-delete-dialog')).toBeInTheDocument();
  });

  test('confirms node deletion', () => {
    render(<ProjectMindMap {...mockProps} />);
    
    const deleteButtons = screen.getAllByText('Delete Node');
    fireEvent.click(deleteButtons[0]);

    const confirmDeleteButton = screen.getByText('Confirm Delete');
    fireEvent.click(confirmDeleteButton);

    expect(mockProps.onDeleteNode).toHaveBeenCalledWith(1);
  });
});