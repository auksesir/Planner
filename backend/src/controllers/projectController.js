// src/controllers/projectController.js

const ServiceFactory = require('../services/serviceFactory');

const projectController = (db) => {
  const serviceFactory = new ServiceFactory(db);
  const projectService = serviceFactory.getProjectService();
  
  return {
    // Project-related methods
    projects: {
      getAll: async (req, res) => {
        try {
          const projects = await projectService.getAllProjects();
          const projectsWithProgress = projectService.processProjectsWithProgress(projects);
          res.json(projectsWithProgress);
        } catch (error) {
          console.error('Error in getAll projects:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      },

      create: async (req, res) => {
        try {
          const { name, description, startDate, endDate, deadline } = req.body;
          
          const newProject = await projectService.createProject({
            name, 
            description, 
            startDate, 
            endDate, 
            deadline
          });
          
          // Add calculated fields for frontend
          const daysRemaining = Math.ceil(
            (new Date(newProject.end_date).getTime() - new Date().getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          
          res.status(201).json({
            ...newProject,
            node_count: 0,
            completion: 0,
            timeProgress: 0,
            daysElapsed: 0,
            daysRemaining
          });
        } catch (error) {
          console.error('Error in create project:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      },

      getWithNodes: async (req, res) => {
        try {
          const { projectId } = req.params;
          
          const { project, nodes } = await projectService.getProjectWithNodes(projectId);
          
          const processedNodes = nodes.map(node => ({
            ...node,
            tasks: node.task_ids ? node.task_ids.split(',').map(Number) : [],
            reminders: node.reminder_ids ? node.reminder_ids.split(',').map(Number) : [],
            subnodes: Number(node.subnode_count) || 0,
            weight: Number(node.weight) || 1,
            completion: Number(node.completion) || 0
          }));

          const { completion, timeProgress, daysElapsed, daysRemaining } = 
            projectService.calculateProjectProgress(processedNodes, project);
          
          res.json({
            ...project,
            nodes: processedNodes,
            completion: parseFloat(completion).toFixed(1),
            timeProgress: parseFloat(timeProgress).toFixed(1),
            daysElapsed,
            daysRemaining,
            isOverdue: daysRemaining < 0
          });
        } catch (error) {
          if (error.message === 'Project not found') {
            res.status(404).json({ error: 'Project not found' });
          } else {
            console.error('Error in getWithNodes:', error);
            res.status(500).json({ error: 'Internal Server Error' });
          }
        }
      },

      updateDeadline: async (req, res) => {
        try {
          const { projectId } = req.params;
          const { deadline } = req.body;
          
          const result = await projectService.updateProjectDeadline(projectId, deadline);
          
          res.json({ 
            message: 'Project deadline updated',
            ...result
          });
        } catch (error) {
          console.error('Error in updateDeadline:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      },

      delete: async (req, res) => {
        try {
          const { projectId } = req.params;
          
          const result = await projectService.deleteProject(projectId);
          
          res.json({ 
            message: 'Project deleted successfully',
            ...result
          });
        } catch (error) {
          console.error('Error in delete project:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      }
    },

    // Node-related methods
    nodes: {
      add: async (req, res) => {
        try {
          const { projectId } = req.params;
          const { name, description, parentNodeId, positionX, positionY, status, completion, deadline, weight } = req.body;
          
          const newNode = await projectService.addNode(projectId, {
            name, 
            description, 
            parentNodeId, 
            positionX, 
            positionY, 
            status, 
            completion, 
            deadline, 
            weight
          });
          
          res.status(201).json(newNode);
        } catch (error) {
          console.error('Error in add node:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      },

      addSubnode: async (req, res) => {
        try {
          const { projectId, parentNodeId } = req.params;
          const { name, description, positionX, positionY, status, completion, deadline, weight } = req.body;

          const newSubnode = await projectService.addSubnode(projectId, parentNodeId, {
            name, 
            description, 
            positionX, 
            positionY, 
            status, 
            completion, 
            deadline, 
            weight
          });

          res.status(201).json(newSubnode);
        } catch (error) {
          console.error('Error in addSubnode:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      },

      updatePosition: async (req, res) => {
        try {
          const { nodeId } = req.params;
          const { positionX, positionY } = req.body;
          
          const result = await projectService.updateNodePosition(nodeId, positionX, positionY);
          
          res.json({ 
            message: 'Node position updated',
            ...result
          });
        } catch (error) {
          console.error('Error in updatePosition:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      },

      update: async (req, res) => {
        try {
          const { nodeId } = req.params;
          const { name, description, status, completion, weight } = req.body;
          
          const result = await projectService.updateNode(nodeId, {
            name, 
            description, 
            status, 
            completion, 
            weight
          });
          
          res.json({ 
            message: 'Node updated',
            ...result
          });
        } catch (error) {
          if (error.message === 'Node not found') {
            res.status(404).json({ error: 'Node not found' });
          } else {
            console.error('Error in update node:', error);
            res.status(500).json({ error: 'Internal Server Error' });
          }
        }
      },

      updateCompletion: async (req, res) => {
        try {
          const { nodeId } = req.params;
          const { completion } = req.body;
          
          const result = await projectService.updateNodeCompletion(nodeId, completion);
          
          res.json({ 
            message: 'Node completion updated successfully',
            ...result
          });
        } catch (error) {
          if (error.message === 'Node not found') {
            res.status(404).json({ error: 'Node not found' });
          } else {
            console.error('Error in updateCompletion:', error);
            res.status(500).json({ error: 'Internal Server Error' });
          }
        }
      },

      updateDeadline: async (req, res) => {
        try {
          const { nodeId } = req.params;
          const { deadline } = req.body;
          
          const result = await projectService.updateNodeDeadline(nodeId, deadline);
          
          res.json({ 
            message: 'Node deadline updated',
            ...result
          });
        } catch (error) {
          console.error('Error in updateNodeDeadline:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      },

      updateParent: async (req, res) => {
        try {
          const { nodeId } = req.params;
          const { parent_node_id } = req.body;
          
          const result = await projectService.updateNodeParent(nodeId, parent_node_id);
          
          res.json({ 
            message: 'Node parent updated',
            ...result
          });
        } catch (error) {
          if (error.message === 'Node not found') {
            res.status(404).json({ error: 'Node not found' });
          } else {
            console.error('Error in updateParent:', error);
            res.status(500).json({ error: 'Internal Server Error' });
          }
        }
      },

      updateSize: async (req, res) => {
        try {
          const { nodeId } = req.params;
          const { size, customWidth, customHeight } = req.body;
          
          const result = await projectService.updateNodeSize(nodeId, {
            size, 
            customWidth, 
            customHeight
          });
          
          res.json({ 
            message: 'Node size updated',
            ...result
          });
        } catch (error) {
          console.error('Error in updateSize:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      },

      delete: async (req, res) => {
        try {
          const { nodeId } = req.params;
          
          const result = await projectService.deleteNode(nodeId);
          
          res.json({ 
            message: 'Node deleted',
            ...result
          });
        } catch (error) {
          if (error.message === 'Node not found') {
            res.status(404).json({ error: 'Node not found' });
          } else {
            console.error('Error in delete node:', error);
            res.status(500).json({ error: 'Internal Server Error' });
          }
        }
      }
    },

    // Task-related methods
    tasks: {
      link: async (req, res) => {
        try {
          const { nodeId } = req.params;
          const { taskId } = req.body;
          
          const result = await projectService.linkTaskToNode(nodeId, taskId);
          
          res.status(201).json({ 
            message: 'Task linked to node and displayed as subnode',
            ...result
          });
        } catch (error) {
          if (error.message === 'Task is already linked to this node') {
            res.status(409).json({ error: error.message });
          } else if (error.message === 'Node not found' || error.message === 'Task not found') {
            res.status(404).json({ error: error.message });
          } else {
            console.error('Error in link task:', error);
            res.status(500).json({ error: 'Internal Server Error' });
          }
        }
      },

      linkAsSubnode: async (req, res) => {
        try {
          const { projectId, nodeId } = req.params;
          const { taskId } = req.body;
          
          const result = await projectService.linkTaskToNodeAsSubnode(projectId, nodeId, taskId);
          
          res.status(201).json({
            message: 'Task linked and displayed as subnode',
            ...result
          });
        } catch (error) {
          if (error.message === 'Node not found' || error.message === 'Task not found') {
            res.status(404).json({ error: error.message });
          } else {
            console.error('Error in linkAsSubnode:', error);
            res.status(500).json({ error: 'Internal Server Error' });
          }
        }
      }
    },

    // Reminder-related methods
    reminders: {
      link: async (req, res) => {
        try {
          const { nodeId } = req.params;
          const { reminderId } = req.body;
          
          const result = await projectService.linkReminderToNode(nodeId, reminderId);
          
          res.status(201).json({ 
            message: 'Reminder linked to node',
            ...result
          });
        } catch (error) {
          if (error.message === 'Reminder is already linked to this node') {
            res.status(409).json({ error: error.message });
          } else {
            console.error('Error in link reminder:', error);
            res.status(500).json({ error: 'Internal Server Error' });
          }
        }
      }
    }
  };
};

module.exports = projectController;