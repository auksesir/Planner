// api/projectsApi.js
// All project and node-related API calls

import { apiDelete, apiGet, apiPost, apiPut, defaultApiErrorHandler, handleApiResponse } from '../utils/apiUtils';

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3001/routes'
  : 'http://localhost:3001/routes';

/**
 * Project API operations
 * Handles all project, node, and linking operations
 * Includes proper date format conversions for backend compatibility
 */
export const projectsApi = {
  // Project Operations
  getAllProjects: async () => {
    try {
      const response = await apiGet(`${API_BASE_URL}/projects`);
      
      return handleApiResponse(
        response,
        (projects) => {
          return projects.map(project => ({
            ...project,
            startDate: project.startDate ? new Date(project.startDate) : null,
            endDate: project.endDate ? new Date(project.endDate) : null,
            deadline: project.deadline ? new Date(project.deadline) : null,
            created_at: project.created_at ? new Date(project.created_at) : null,
            // Add default values for completion tracking
            completion: project.completion || 0,
            daysRemaining: project.daysRemaining || 0,
            isOverdue: project.isOverdue || false
          }));
        },
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to fetch projects',
        originalError: error
      });
    }
  },
  
  createProject: async (projectData) => {
    try {
      // Validate required fields before sending
      if (!projectData.name || !projectData.startDate || !projectData.endDate) {
        throw new Error('Missing required fields: name, startDate, and endDate are required');
      }

      const formattedProjectData = {
        ...projectData,
        startDate: projectData.startDate ? 
          (projectData.startDate instanceof Date ? 
            projectData.startDate.toISOString() : 
            projectData.startDate) : null,
        endDate: projectData.endDate ? 
          (projectData.endDate instanceof Date ? 
            projectData.endDate.toISOString() : 
            projectData.endDate) : null,
        deadline: projectData.deadline ? 
          (projectData.deadline instanceof Date ? 
            projectData.deadline.toISOString() : 
            projectData.deadline) : (projectData.endDate ? 
              (projectData.endDate instanceof Date ? 
                projectData.endDate.toISOString() : 
                projectData.endDate) : null)
      };

      console.log('Sending project data:', formattedProjectData); // Debug log

      const response = await apiPost(`${API_BASE_URL}/projects`, formattedProjectData);
      
      return handleApiResponse(
        response,
        (data) => ({
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          deadline: data.deadline ? new Date(data.deadline) : null,
          created_at: data.created_at ? new Date(data.created_at) : null,
          completion: data.completion || 0,
          daysRemaining: data.daysRemaining || 0,
          isOverdue: data.isOverdue || false
        }),
        defaultApiErrorHandler
      );
    } catch (error) {
      console.error('Error in createProject:', error); // Debug log
      return defaultApiErrorHandler({
        message: 'Failed to create project',
        originalError: error
      });
    }
  },
  
  getProjectWithNodes: async (projectId) => {
    try {
      const response = await apiGet(`${API_BASE_URL}/projects/${projectId}`);
      
      return handleApiResponse(
        response,
        (data) => ({
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          deadline: data.deadline ? new Date(data.deadline) : null,
          created_at: data.created_at ? new Date(data.created_at) : null,
          completion: data.completion || 0,
          nodes: (data.nodes || []).map(node => ({
            ...node,
            deadline: node.deadline ? new Date(node.deadline) : null,
            created_at: node.created_at ? new Date(node.created_at) : null,
            completion: node.completion || 0
          }))
        }),
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to fetch project details',
        originalError: error
      });
    }
  },
  
  updateProjectDeadline: async (projectId, deadline) => {
    try {
      const formattedDeadline = deadline instanceof Date ? 
        deadline.toISOString() : 
        deadline;
      
      const response = await apiPut(`${API_BASE_URL}/projects/${projectId}/deadline`, { 
        deadline: formattedDeadline 
      });
      
      return handleApiResponse(
        response,
        (data) => data,
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to update project deadline',
        originalError: error
      });
    }
  },
  
  deleteProject: async (projectId) => {
    try {
      const response = await apiDelete(`${API_BASE_URL}/projects/${projectId}`);
      
      return handleApiResponse(
        response,
        (data) => data,
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to delete project',
        originalError: error
      });
    }
  },

  // Node Operations
  addNode: async (projectId, nodeData) => {
    try {
      const formattedNodeData = {
        ...nodeData,
        deadline: nodeData.deadline ? 
          (nodeData.deadline instanceof Date ? 
            nodeData.deadline.toISOString() : 
            nodeData.deadline) : null,
        completion: nodeData.completion || 0
      };

      const response = await apiPost(`${API_BASE_URL}/projects/${projectId}/nodes`, formattedNodeData);
      
      return handleApiResponse(
        response,
        (data) => ({
          ...data,
          deadline: data.deadline ? new Date(data.deadline) : null,
          created_at: data.created_at ? new Date(data.created_at) : null,
          completion: data.completion || 0
        }),
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to add node',
        originalError: error
      });
    }
  },
  
  addSubnode: async (projectId, parentNodeId, nodeData) => {
    try {
      const formattedNodeData = {
        ...nodeData,
        deadline: nodeData.deadline ? 
          (nodeData.deadline instanceof Date ? 
            nodeData.deadline.toISOString() : 
            nodeData.deadline) : null,
        completion: nodeData.completion || 0
      };

      const response = await apiPost(`${API_BASE_URL}/projects/${projectId}/nodes/${parentNodeId}/subnodes`, formattedNodeData);
      
      return handleApiResponse(
        response,
        (data) => ({
          ...data,
          deadline: data.deadline ? new Date(data.deadline) : null,
          created_at: data.created_at ? new Date(data.created_at) : null,
          completion: data.completion || 0
        }),
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to add subnode',
        originalError: error
      });
    }
  },
  
  updateNode: async (nodeId, nodeData) => {
    try {
      const response = await apiPut(`${API_BASE_URL}/projects/nodes/${nodeId}`, nodeData);
      
      return handleApiResponse(
        response,
        (data) => data,
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to update node',
        originalError: error
      });
    }
  },
  
  updateNodePosition: async (nodeId, positionData) => {
    try {
      const response = await apiPut(`${API_BASE_URL}/projects/nodes/${nodeId}/position`, positionData);
      
      return handleApiResponse(
        response,
        (data) => data,
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to update node position',
        originalError: error
      });
    }
  },
  
  updateNodeCompletion: async (nodeId, completion) => {
    try {
      const response = await apiPut(`${API_BASE_URL}/projects/nodes/${nodeId}/completion`, { completion });
      
      return handleApiResponse(
        response,
        (data) => data,
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to update node completion',
        originalError: error
      });
    }
  },
  
  updateNodeDeadline: async (nodeId, deadline) => {
    try {
      const formattedDeadline = deadline instanceof Date ? 
        deadline.toISOString() : 
        deadline;
      
      const response = await apiPut(`${API_BASE_URL}/projects/nodes/${nodeId}/deadline`, { 
        deadline: formattedDeadline 
      });
      
      return handleApiResponse(
        response,
        (data) => data,
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to update node deadline',
        originalError: error
      });
    }
  },
  
  updateNodeParent: async (nodeId, parent_node_id) => {
    try {
      const response = await apiPut(`${API_BASE_URL}/projects/nodes/${nodeId}/parent`, { parent_node_id });
      
      return handleApiResponse(
        response,
        (data) => data,
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to update node parent',
        originalError: error
      });
    }
  },
  
  updateNodeSize: async (nodeId, size, customWidth, customHeight) => {
    try {
      const response = await apiPut(`${API_BASE_URL}/projects/nodes/${nodeId}/size`, { 
        size, 
        customWidth, 
        customHeight 
      });
      
      return handleApiResponse(
        response,
        (data) => data,
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to update node size',
        originalError: error
      });
    }
  },
  
  deleteNode: async (nodeId) => {
    try {
      const response = await apiDelete(`${API_BASE_URL}/projects/nodes/${nodeId}`);
      
      return handleApiResponse(
        response,
        (data) => data,
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to delete node',
        originalError: error
      });
    }
  },

  // Task Linking Operations
  linkTaskToNode: async (nodeId, taskId) => {
    try {
      const response = await apiPost(`${API_BASE_URL}/projects/nodes/${nodeId}/tasks`, { taskId });
      
      return handleApiResponse(
        response,
        (data) => data,
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to link task to node',
        originalError: error
      });
    }
  },
  
  linkTaskAsSubnode: async (projectId, nodeId, taskId) => {
    try {
      const response = await apiPost(`${API_BASE_URL}/projects/${projectId}/nodes/${nodeId}/tasks-as-subnodes`, { taskId });
      
      return handleApiResponse(
        response,
        (data) => data,
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to link task as subnode',
        originalError: error
      });
    }
  },

  // Reminder Linking Operations
  linkReminderToNode: async (nodeId, reminderId) => {
    try {
      const response = await apiPost(`${API_BASE_URL}/projects/nodes/${nodeId}/reminders`, { reminderId });
      
      return handleApiResponse(
        response,
        (data) => data,
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to link reminder to node',
        originalError: error
      });
    }
  }
};

// Legacy function names for backward compatibility
export const getAllProjects = projectsApi.getAllProjects;
export const createProject = projectsApi.createProject;
export const getProjectWithNodes = projectsApi.getProjectWithNodes;
export const updateProjectDeadline = projectsApi.updateProjectDeadline;
export const deleteProject = projectsApi.deleteProject;
export const addNode = projectsApi.addNode;
export const addSubnode = projectsApi.addSubnode;
export const updateNode = projectsApi.updateNode;
export const updateNodePosition = projectsApi.updateNodePosition;
export const updateNodeCompletion = projectsApi.updateNodeCompletion;
export const updateNodeDeadline = projectsApi.updateNodeDeadline;
export const updateNodeParent = projectsApi.updateNodeParent;
export const updateNodeSize = projectsApi.updateNodeSize;
export const deleteNode = projectsApi.deleteNode;
export const linkTaskToNode = projectsApi.linkTaskToNode;
export const linkTaskAsSubnode = projectsApi.linkTaskAsSubnode;
export const linkReminderToNode = projectsApi.linkReminderToNode;

// Additional helper function for node operations
export const addNodeToProject = projectsApi.addNode;

// Export for the new Projects.js import pattern
export const getProjects = projectsApi.getAllProjects;