import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as projectsApi from '../../api/projectsApi';
import Projects from '../../pages/Projects';

// Mock the API module with all the functions used by Projects component
jest.mock('../../api/projectsApi', () => ({
  getAllProjects: jest.fn(),
  getProjectWithNodes: jest.fn(),
  createProject: jest.fn(),
  deleteProject: jest.fn(),
  addNodeToProject: jest.fn(),
  addSubnode: jest.fn(),
  deleteNode: jest.fn(),
  updateNodeCompletion: jest.fn(),
  updateNodeParent: jest.fn(),
  updateNodePosition: jest.fn()
}));

// Mock the child components
jest.mock('../../components/mind_mapping_utilities/ConfirmDeleteDialog', () => {
  return function MockConfirmDeleteDialog({ open, onClose, onConfirm, itemName }) {
    return open ? (
      <div data-testid="confirm-delete-dialog">
        <p>Delete {itemName}</p>
        <button data-testid="confirm-delete-btn" onClick={onConfirm}>Delete</button>
        <button data-testid="cancel-delete-btn" onClick={onClose}>Cancel</button>
      </div>
    ) : null;
  };
});

jest.mock('../../components/mind_mapping_utilities/ProjectDialogs', () => ({
  NewProjectDialog: function MockNewProjectDialog({ open, onClose, onCreate }) {
    return open ? (
      <div data-testid="new-project-dialog">
        <h2>Create New Project</h2>
        <button onClick={onClose}>Close</button>
        <button onClick={() => onCreate({ name: 'Test Project' })}>Create</button>
      </div>
    ) : null;
  },
  NewNodeDialog: function MockNewNodeDialog({ open, onClose, onCreate }) {
    return open ? (
      <div data-testid="new-node-dialog">
        <h2>Create New Node</h2>
        <button onClick={onClose}>Close</button>
        <button onClick={() => onCreate({ name: 'Test Node' })}>Create</button>
      </div>
    ) : null;
  }
}));

jest.mock('../../components/mind_mapping_visualisation/ProjectList', () => {
  return function MockProjectList({ projects, onSelectProject, onDeleteProject, onCreateProject }) {
    return (
      <div data-testid="project-list">
        {projects.map(project => (
          <div key={project.id} data-testid={`project-${project.id}`}>
            <span onClick={() => onSelectProject(project.id)}>{project.name}</span>
            <button 
              title="Delete project"
              onClick={() => onDeleteProject(project.id)}
            >
              Delete
            </button>
          </div>
        ))}
        <button title="Create new project" onClick={onCreateProject}>
          Add Project
        </button>
      </div>
    );
  };
});

jest.mock('../../components/mind_mapping_visualisation/ProjectMindMap', () => {
  return function MockProjectMindMap({ project, nodes }) {
    return (
      <div data-testid="project-mind-map">
        <h3>{project.name}</h3>
        {nodes && nodes.map(node => (
          <div key={node.id} data-testid={`node-${node.id}`}>
            {node.name}
          </div>
        ))}
      </div>
    );
  };
});


describe('Projects Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Set up default mock implementations
    projectsApi.getAllProjects.mockResolvedValue([
      { 
        id: 1, 
        name: 'Project 1', 
        completion: 50,
        daysRemaining: 10 
      },
      { 
        id: 2, 
        name: 'Project 2', 
        completion: 75,
        daysRemaining: 5 
      }
    ]);

    projectsApi.getProjectWithNodes.mockResolvedValue({
      id: 1,
      name: 'Project 1',
      completion: 50,
      nodes: []
    });

    projectsApi.createProject.mockResolvedValue({
      id: 3,
      name: 'New Project',
      completion: 0
    });

    projectsApi.deleteProject.mockResolvedValue({ success: true });
  });

  test('loads and displays projects', async () => {
    render(<Projects />);
    
    // Wait for the API call to complete and projects to render
    await waitFor(() => {
      expect(projectsApi.getAllProjects).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument();
      expect(screen.getByText('Project 2')).toBeInTheDocument();
    });
  });

  test('opens new project dialog', async () => {
    render(<Projects />);
    
    // Wait for projects to load first
    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument();
    });

    const addProjectButton = screen.getByTitle('Create new project');
    fireEvent.click(addProjectButton);

    expect(screen.getByText('Create New Project')).toBeInTheDocument();
  });

  test('selects a project', async () => {
    // Mock the project details API call with nodes
    projectsApi.getProjectWithNodes.mockResolvedValue({
      id: 1,
      name: 'Project 1',
      completion: 50,
      nodes: [
        { 
          id: 1, 
          name: 'Node 1', 
          position_x: 100, 
          position_y: 100 
        }
      ]
    });

    render(<Projects />);
    
    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument();
    });

    // Click on the project
    const projectItem = screen.getByText('Project 1');
    fireEvent.click(projectItem);

    // Wait for project details to load
    await waitFor(() => {
      expect(projectsApi.getProjectWithNodes).toHaveBeenCalledWith(1);
    });

    // Check if project mind map is displayed (since that's what shows when a project is selected)
    await waitFor(() => {
      expect(screen.getByTestId('project-mind-map')).toBeInTheDocument();
    });
  });

  test('deletes a project', async () => {
    render(<Projects />);
    
    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument();
    });

    // Click delete button for the first project
    const deleteButtons = screen.getAllByTitle('Delete project');
    fireEvent.click(deleteButtons[0]);

    // Confirm delete dialog should appear
    await waitFor(() => {
      expect(screen.getByTestId('confirm-delete-dialog')).toBeInTheDocument();
    });
    
    // Confirm deletion using the specific test id
    const confirmDeleteButton = screen.getByTestId('confirm-delete-btn');
    fireEvent.click(confirmDeleteButton);

    await waitFor(() => {
      expect(projectsApi.deleteProject).toHaveBeenCalledWith(1);
    });
  });
});