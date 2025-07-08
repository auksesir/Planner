import { useEffect, useState } from 'react';
import '../styles/pages/Projects.css';

// Import components and API functions
import {
  addNodeToProject,
  addSubnode,
  createProject,
  deleteNode,
  deleteProject,
  getAllProjects,
  getProjectWithNodes,
  updateNodeCompletion,
  updateNodeParent,
  updateNodePosition
} from '../api/projectsApi';
import ConfirmDeleteDialog from '../components/mind_mapping_utilities/ConfirmDeleteDialog';
import { NewNodeDialog, NewProjectDialog } from '../components/mind_mapping_utilities/ProjectDialogs';
import ProjectList from '../components/mind_mapping_visualisation/ProjectList';
import ProjectMindMap from '../components/mind_mapping_visualisation/ProjectMindMap';

/**
 * Projects Component
 * 
 * A comprehensive project management interface that provides mind mapping functionality.
 * Manages projects and their hierarchical node structures with visual mind map representation.
 * 
 * Features:
 * - Project CRUD operations (Create, Read, Update, Delete)
 * - Hierarchical node management with parent-child relationships
 * - Interactive mind map visualization with drag-and-drop positioning
 * - Real-time completion tracking for projects and nodes
 * - Event-driven project refresh system
 * - Modal dialogs for creation and deletion confirmation
 * 
 * @param {Function} setTaskToEdit - Callback to set task for editing (passed to child components)
 * @param {Function} setReminderToEdit - Callback to set reminder for editing (passed to child components)
 * @param {Function} onSetNewTaskDefaults - Callback to set default values for new tasks
 * @param {Function} onSetNewReminderDefaults - Callback to set default values for new reminders
 */
const Projects = ({ setTaskToEdit, setReminderToEdit, onSetNewTaskDefaults, onSetNewReminderDefaults }) => {
  
  // ==================== MAIN STATE ====================
  
  // Core data state
  const [projects, setProjects] = useState([]);                    // List of all projects
  const [selectedProject, setSelectedProject] = useState(null);    // Currently selected project with full details
  const [projectNodes, setProjectNodes] = useState([]);           // Nodes belonging to the selected project
  const [error, setError] = useState(null);                       // Error message state
  const [projectToDelete, setProjectToDelete] = useState(null);   // Project ID pending deletion
  
  // Dialog visibility state
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);      // New project creation dialog
  const [isNewNodeDialogOpen, setIsNewNodeDialogOpen] = useState(false);           // New node creation dialog
  const [isDeleteProjectConfirmOpen, setIsDeleteProjectConfirmOpen] = useState(false); // Delete confirmation dialog

  // ==================== INITIALIZATION ====================
  
  /**
   * Load initial data when component mounts
   * Fetches all projects from the API on component initialization
   */
  useEffect(() => {
    loadProjects();
  }, []);

  /**
   * Load all projects from the API
   * Updates the projects state with fetched data and handles errors
   */
  const loadProjects = async () => {
    setError(null);
    try {
      const projectsData = await getAllProjects();
      setProjects(projectsData);
    } catch (error) {
      setError('Failed to load projects: ' + error.message);
    }
  };

  // ==================== EVENT HANDLING ====================
  
  /**
   * Handle project refresh events from external sources
   * Listens for custom 'refreshProject' events and refreshes the selected project if it matches
   * This allows other parts of the application to trigger project updates
   */
  useEffect(() => {
    const handleRefreshProject = (event) => {
      const { projectId } = event.detail;
      if (selectedProject && selectedProject.id === parseInt(projectId)) {
        handleSelectProject(selectedProject.id);
      }
    };
    
    window.addEventListener('refreshProject', handleRefreshProject);
    return () => {
      window.removeEventListener('refreshProject', handleRefreshProject);
    };
  }, [selectedProject]);

  // ==================== PROJECT OPERATIONS ====================
  
  /**
   * Handle project selection
   * Fetches full project details including nodes and updates completion status
   * 
   * @param {number} projectId - ID of the project to select
   */
  const handleSelectProject = async (projectId) => {
    setError(null);
    try {
      const projectData = await getProjectWithNodes(projectId);
      setSelectedProject(projectData);
      setProjectNodes(projectData.nodes || []);
      
      // Update this project's completion in the projects list
      // This ensures the project list shows the most current completion percentage
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectId 
            ? {...project, completion: projectData.completion}
            : project
        )
      );
    } catch (error) {
      setError('Failed to load project details: ' + error.message);
    }
  };

  /**
   * Handle project creation
   * Creates a new project and automatically selects it
   * 
   * @param {Object} projectData - Project data including name, description, etc.
   */
  const handleCreateProject = async (projectData) => {
    setError(null);
    try {
      const project = await createProject(projectData);
      setProjects(prevProjects => [...prevProjects, project]);
      setSelectedProject(project);
      setProjectNodes([]); // New project starts with no nodes
      setIsNewProjectDialogOpen(false);
    } catch (error) {
      setError('Failed to create project: ' + error.message);
    } 
  };
  
  /**
   * Initiate project deletion process
   * Opens confirmation dialog for the specified project
   * 
   * @param {number} projectId - ID of the project to delete
   */
  const handleDeleteProject = (projectId) => {
    setProjectToDelete(projectId);
    setIsDeleteProjectConfirmOpen(true);
  };
  
  /**
   * Confirm and execute project deletion
   * Deletes the project and updates the UI state accordingly
   */
  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
   
    setError(null);
    try {
      await deleteProject(projectToDelete);
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectToDelete));
      
      // If the deleted project was selected, clear the selection
      if (selectedProject && selectedProject.id === projectToDelete) {
        setSelectedProject(null);
        setProjectNodes([]);
      }
      
      setIsDeleteProjectConfirmOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      setError('Failed to delete project: ' + error.message);
    } 
  };

  // ==================== NODE OPERATIONS ====================
  
  /**
   * Open the new node creation dialog
   */
  const handleAddNode = () => {
    setIsNewNodeDialogOpen(true);
  };
  
  /**
   * Handle node creation
   * Creates a new node and positions it in the mind map with a slight offset
   * 
   * @param {Object} nodeData - Node data including title, description, etc.
   */
  const handleNodeCreation = async (nodeData) => {
    if (!selectedProject) return;
   
    setError(null);
    try {
      // Calculate position for new node (center with offset based on existing nodes)
      const centerX = 400;
      const centerY = 300;
      const offset = projectNodes.length * 30; // Offset each new node to avoid overlap
      
      const node = await addNodeToProject(selectedProject.id, {
        ...nodeData,
        positionX: centerX + offset,
        positionY: centerY + offset
      });
      
      setProjectNodes(prevNodes => [...prevNodes, node]);
      setIsNewNodeDialogOpen(false);
      
      // Refresh the project to get updated completion percentage
      await handleSelectProject(selectedProject.id);
    } catch (error) {
      setError('Failed to add node: ' + error.message);
    } 
  };

  /**
   * Handle adding a subnode to an existing node
   * Creates a child node with automatic positioning relative to its parent
   * 
   * @param {number} parentNodeId - ID of the parent node
   * @param {Object} subnodeData - Subnode data including title, description, etc.
   */
  const handleAddSubnode = async (parentNodeId, subnodeData) => {
    if (!selectedProject || !parentNodeId) return;
  
    setError(null);
    try {
      const parentNode = projectNodes.find((node) => node.id === parentNodeId);
      if (!parentNode) {
        throw new Error('Parent node not found');
      }
  
      // Position subnode relative to parent (offset to the right and down)
      const subnode = await addSubnode(selectedProject.id, parentNodeId, {
        ...subnodeData,
        positionX: parentNode.position_x + 180,
        positionY: parentNode.position_y + 50,
        parent_node_id: parentNodeId
      });

      setProjectNodes((prevNodes) => [...prevNodes, subnode]);
      
      // Refresh the project to get updated completion
      await handleSelectProject(selectedProject.id);
    } catch (error) {
      setError('Failed to add subnode: ' + error.message);
    } 
  };
  
  /**
   * Handle node deletion
   * Deletes a node and all its descendants (children, grandchildren, etc.)
   * Uses recursive logic to find and delete the entire subtree
   * 
   * @param {number} nodeId - ID of the node to delete
   */
  const handleDeleteNode = async (nodeId) => {
    setError(null);
    try {
      // Find the node to delete
      const nodeToDelete = projectNodes.find(n => n.id === nodeId);
      if (!nodeToDelete) {
        throw new Error('Node not found');
      }
      
      // Recursive function to find all descendant nodes
      const findAllDescendants = (parentId) => {
        const children = projectNodes.filter(n => n.parent_node_id === parentId);
        let descendants = [...children];
        
        // Recursively find descendants of each child
        children.forEach(child => {
          descendants = [...descendants, ...findAllDescendants(child.id)];
        });
        
        return descendants;
      };
      
      const descendants = findAllDescendants(nodeId);
      
      // Delete the node itself
      await deleteNode(nodeId);
      
      // Delete all descendant nodes
      for (const descendant of descendants) {
        await deleteNode(descendant.id);
      }
      
      // Update the local state to remove all deleted nodes
      setProjectNodes(prevNodes => 
        prevNodes.filter(n => n.id !== nodeId && !descendants.some(d => d.id === n.id))
      );
      
      // Refresh the project to get updated completion
      await handleSelectProject(selectedProject.id);
    } catch (error) {
      setError('Failed to delete node: ' + error.message);
    } 
  };

  /**
   * Handle node updates (position and parent relationships)
   * Supports both position updates (for drag-and-drop) and parent relationship changes
   * 
   * @param {number} nodeId - ID of the node to update
   * @param {Object} nodeData - Update data (positionX, positionY, parentNodeId)
   */
  const handleUpdateNode = async (nodeId, nodeData) => {
    setError(null);
    try {
      const { positionX, positionY, parentNodeId } = nodeData;
      
      const node = projectNodes.find(n => n.id === nodeId);
      if (!node) {
        throw new Error('Node not found');
      }
      
      const newX = positionX !== undefined ? positionX : node.position_x;
      const newY = positionY !== undefined ? positionY : node.position_y;
      
      // Handle position updates (for drag-and-drop functionality)
      if (positionX !== undefined || positionY !== undefined) {
        await updateNodePosition(nodeId, { positionX: newX, positionY: newY });
        
        setProjectNodes(prevNodes => 
          prevNodes.map(node => 
            node.id === nodeId 
              ? { ...node, position_x: newX, position_y: newY } 
              : node
          )
        );
      }
      
      // Handle parent node relationship updates (for restructuring the hierarchy)
      if (parentNodeId !== undefined) {
        await updateNodeParent(nodeId, parentNodeId);
        
        setProjectNodes(prevNodes => 
          prevNodes.map(node => 
            node.id === nodeId 
              ? { ...node, parent_node_id: parentNodeId } 
              : node
          )
        );
        
        // Refresh the project to get updated completion (hierarchy changes affect completion)
        await handleSelectProject(selectedProject.id);
      }
    } catch (error) {
      console.error('Failed to update node:', error);
      setError('Failed to update node: ' + error.message);
    } 
  };
  
  /**
   * Handle updating a node's completion percentage
   * Updates the completion value and refreshes the project to recalculate overall completion
   * 
   * @param {number} nodeId - ID of the node to update
   * @param {number} completionValue - New completion percentage (0-100)
   */
  const handleUpdateNodeCompletion = async (nodeId, completionValue) => {
    setError(null);
    try {
      // Call the API to update the node's completion
      await updateNodeCompletion(nodeId, completionValue);
      
      // Refresh the project to get the updated completion values
      // This recalculates the overall project completion based on all node completions
      await handleSelectProject(selectedProject.id);
    } catch (error) {
      console.error('Failed to update node completion:', error);
      setError('Failed to update node completion: ' + error.message);
    } 
  };

  // ==================== RENDER ====================

  return (
    <div className="projects-container">

      {/* Error Display */}
      {error && (
        <div className="error-message">
          {error}
          <button 
            className="dismiss-error"
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Main Content Grid */}
      <div className="projects-grid">
        {/* Left Side: Project List */}
        <div className="project-list-container">
          <ProjectList
            projects={projects}
            selectedProject={selectedProject}
            onSelectProject={handleSelectProject}
            onDeleteProject={handleDeleteProject}
            onCreateProject={() => setIsNewProjectDialogOpen(true)}
          />
        </div>

        {/* Right Side: Project Content */}
        <div className="project-content">
          {selectedProject ? (
            <ProjectMindMap 
              project={selectedProject}
              nodes={projectNodes}
              onUpdateNode={handleUpdateNode}
              onAddSubnode={handleAddSubnode}
              onUpdateCompletion={handleUpdateNodeCompletion}
              onAddNode={handleAddNode}
              onDeleteNode={handleDeleteNode}
            />
          ) : (
            // Empty state when no project is selected
            <div className="empty-state">
              <h3>No Project Selected</h3>
              <p>Select a project from the list or create a new one to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* ==================== MODAL DIALOGS ==================== */}
      
      {/* New Project Creation Dialog */}
      <NewProjectDialog
        open={isNewProjectDialogOpen}
        onClose={() => setIsNewProjectDialogOpen(false)}
        onCreate={handleCreateProject}
      />

      {/* New Node Creation Dialog */}
      <NewNodeDialog
        open={isNewNodeDialogOpen}
        onClose={() => setIsNewNodeDialogOpen(false)}
        onCreate={handleNodeCreation}
      />
      
      {/* Project Deletion Confirmation Dialog */}
      {isDeleteProjectConfirmOpen && (
        <ConfirmDeleteDialog
          open={isDeleteProjectConfirmOpen}
          onClose={() => setIsDeleteProjectConfirmOpen(false)}
          onConfirm={confirmDeleteProject}
          itemType="project"
          itemName={projects.find(p => p.id === projectToDelete)?.name || 'this project'}
          warningText="This will delete the project and all its nodes."
        />
      )}
    </div>
  );
};

export default Projects;