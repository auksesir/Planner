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

const Projects = ({ setTaskToEdit, setReminderToEdit, onSetNewTaskDefaults, onSetNewReminderDefaults }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectNodes, setProjectNodes] = useState([]);
  const [error, setError] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  
  // Dialog states
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [isNewNodeDialogOpen, setIsNewNodeDialogOpen] = useState(false);
  const [isDeleteProjectConfirmOpen, setIsDeleteProjectConfirmOpen] = useState(false);

  // Load initial data when component mounts
  useEffect(() => {
    loadProjects();
  }, []);

  // Load all projects from the API
  const loadProjects = async () => {
    setError(null);
    try {
      const projectsData = await getAllProjects();
      setProjects(projectsData);
    } catch (error) {
      setError('Failed to load projects: ' + error.message);
    }
  };

  // Handle project refresh events
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

  // Handle project selection
  const handleSelectProject = async (projectId) => {
    setError(null);
    try {
      const projectData = await getProjectWithNodes(projectId);
      setSelectedProject(projectData);
      setProjectNodes(projectData.nodes || []);
      
      // Update this project's completion in the projects list
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

  // Handle project creation
  const handleCreateProject = async (projectData) => {
    setError(null);
    try {
      const project = await createProject(projectData);
      setProjects(prevProjects => [...prevProjects, project]);
      setSelectedProject(project);
      setProjectNodes([]);
      setIsNewProjectDialogOpen(false);
    } catch (error) {
      setError('Failed to create project: ' + error.message);
    } 
  };
  
  // Handle project deletion
  const handleDeleteProject = (projectId) => {
    setProjectToDelete(projectId);
    setIsDeleteProjectConfirmOpen(true);
  };
  
  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
   
    setError(null);
    try {
      await deleteProject(projectToDelete);
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectToDelete));
      
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

  // Handle node operations
  const handleAddNode = () => {
    setIsNewNodeDialogOpen(true);
  };
  
  const handleNodeCreation = async (nodeData) => {
    if (!selectedProject) return;
   
    setError(null);
    try {
      const centerX = 400;
      const centerY = 300;
      const offset = projectNodes.length * 30;
      
      const node = await addNodeToProject(selectedProject.id, {
        ...nodeData,
        positionX: centerX + offset,
        positionY: centerY + offset
      });
      
      setProjectNodes(prevNodes => [...prevNodes, node]);
      setIsNewNodeDialogOpen(false);
      
      // Refresh the project to get updated completion
      await handleSelectProject(selectedProject.id);
    } catch (error) {
      setError('Failed to add node: ' + error.message);
    } 
  };

  // Handle adding a subnode
  const handleAddSubnode = async (parentNodeId, subnodeData) => {
    if (!selectedProject || !parentNodeId) return;
  
    setError(null);
    try {
      const parentNode = projectNodes.find((node) => node.id === parentNodeId);
      if (!parentNode) {
        throw new Error('Parent node not found');
      }
  
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
  
  const handleDeleteNode = async (nodeId) => {
    setError(null);
    try {
      // Find the node to delete
      const nodeToDelete = projectNodes.find(n => n.id === nodeId);
      if (!nodeToDelete) {
        throw new Error('Node not found');
      }
      
      // Find all descendant nodes to delete
      const findAllDescendants = (parentId) => {
        const children = projectNodes.filter(n => n.parent_node_id === parentId);
        let descendants = [...children];
        
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
      
      // Update the local state to remove the deleted nodes
      setProjectNodes(prevNodes => 
        prevNodes.filter(n => n.id !== nodeId && !descendants.some(d => d.id === n.id))
      );
      
      // Refresh the project to get updated completion
      await handleSelectProject(selectedProject.id);
    } catch (error) {
      setError('Failed to delete node: ' + error.message);
    } 
  };

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
      
      // Regular position update
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
      
      // Update parent node relationship if provided
      if (parentNodeId !== undefined) {
        await updateNodeParent(nodeId, parentNodeId);
        
        setProjectNodes(prevNodes => 
          prevNodes.map(node => 
            node.id === nodeId 
              ? { ...node, parent_node_id: parentNodeId } 
              : node
          )
        );
        
        // Refresh the project to get updated completion
        await handleSelectProject(selectedProject.id);
      }
    } catch (error) {
      console.error('Failed to update node:', error);
      setError('Failed to update node: ' + error.message);
    } 
  };
  
  // Handle updating a node's completion percentage
  const handleUpdateNodeCompletion = async (nodeId, completionValue) => {
    setError(null);
    try {
      // Call the API to update the node's completion
      await updateNodeCompletion(nodeId, completionValue);
      
      // Refresh the project to get the updated completion values
      await handleSelectProject(selectedProject.id);
    } catch (error) {
      console.error('Failed to update node completion:', error);
      setError('Failed to update node completion: ' + error.message);
    } 
  };

  return (
    <div className="projects-container">

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
      
      <div className="projects-grid">
        <div className="project-list-container">
          <ProjectList
            projects={projects}
            selectedProject={selectedProject}
            onSelectProject={handleSelectProject}
            onDeleteProject={handleDeleteProject}
            onCreateProject={() => setIsNewProjectDialogOpen(true)}
          />
        </div>

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
            <div className="empty-state">
              <h3>No Project Selected</h3>
              <p>Select a project from the list or create a new one to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <NewProjectDialog
        open={isNewProjectDialogOpen}
        onClose={() => setIsNewProjectDialogOpen(false)}
        onCreate={handleCreateProject}
      />

      <NewNodeDialog
        open={isNewNodeDialogOpen}
        onClose={() => setIsNewNodeDialogOpen(false)}
        onCreate={handleNodeCreation}
      />
      
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