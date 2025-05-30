// src/tests/controllers/projectController.test.js
const projectController = require('./projectController');

// Mock dependencies
jest.mock('../services/serviceFactory');
const ServiceFactory = require('../services/serviceFactory');

describe('projectController', () => {
  // Setup mocks
  let mockDb;
  let mockProjectService;
  let mockServiceFactory;
  let controller;
  let req;
  let res;

  beforeEach(() => {
    // Create mock database
    mockDb = {};
    
    // Create mock project service with all required methods
    mockProjectService = {
      getAllProjects: jest.fn(),
      processProjectsWithProgress: jest.fn(),
      createProject: jest.fn(),
      getProjectWithNodes: jest.fn(),
      calculateProjectProgress: jest.fn(),
      updateProjectDeadline: jest.fn(),
      deleteProject: jest.fn(),
      addNode: jest.fn(),
      addSubnode: jest.fn(),
      updateNodePosition: jest.fn(),
      updateNode: jest.fn(),
      updateNodeCompletion: jest.fn(),
      updateNodeDeadline: jest.fn(),
      updateNodeParent: jest.fn(),
      updateNodeSize: jest.fn(),
      deleteNode: jest.fn(),
      linkTaskToNode: jest.fn(),
      linkTaskToNodeAsSubnode: jest.fn(),
      linkReminderToNode: jest.fn()
    };
    
    // Mock ServiceFactory to return our mock service
    mockServiceFactory = {
      getProjectService: jest.fn().mockReturnValue(mockProjectService)
    };
    
    ServiceFactory.mockImplementation(() => mockServiceFactory);
    
    // Create controller with mock database
    controller = projectController(mockDb);
    
    // Setup mock request and response objects
    req = {
      params: {},
      body: {},
      query: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test project-related methods
  describe('projects', () => {
    describe('getAll', () => {
      it('should return all projects with progress information', async () => {
        // Setup
        const mockProjects = [
          { id: 1, name: 'Project 1' },
          { id: 2, name: 'Project 2' }
        ];
        
        const mockProjectsWithProgress = [
          { id: 1, name: 'Project 1', completion: '50.0', timeProgress: '25.0' },
          { id: 2, name: 'Project 2', completion: '75.0', timeProgress: '50.0' }
        ];
        
        mockProjectService.getAllProjects.mockResolvedValue(mockProjects);
        mockProjectService.processProjectsWithProgress.mockReturnValue(mockProjectsWithProgress);
        
        // Execute
        await controller.projects.getAll(req, res);
        
        // Verify
        expect(mockProjectService.getAllProjects).toHaveBeenCalled();
        expect(mockProjectService.processProjectsWithProgress).toHaveBeenCalledWith(mockProjects);
        expect(res.json).toHaveBeenCalledWith(mockProjectsWithProgress);
      });
      
      it('should handle errors', async () => {
        // Setup
        const error = new Error('Database error');
        mockProjectService.getAllProjects.mockRejectedValue(error);
        
        // Execute
        await controller.projects.getAll(req, res);
        
        // Verify
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
      });
    });
    
    describe('create', () => {
      it('should create a new project', async () => {
        // Setup
        req.body = {
          name: 'New Project',
          description: 'Project Description',
          startDate: '2023-01-01',
          endDate: '2023-12-31',
          deadline: '2023-12-15'
        };
        
        const mockNewProject = {
          id: 1,
          name: 'New Project',
          description: 'Project Description',
          start_date: '2023-01-01',
          end_date: '2023-12-31',
          deadline: '2023-12-15',
          status: 'active',
          created_at: '2023-01-01T00:00:00.000Z'
        };
        
        mockProjectService.createProject.mockResolvedValue(mockNewProject);
        
        // Execute
        await controller.projects.create(req, res);
        
        // Verify
        expect(mockProjectService.createProject).toHaveBeenCalledWith({
          name: 'New Project',
          description: 'Project Description',
          startDate: '2023-01-01',
          endDate: '2023-12-31',
          deadline: '2023-12-15'
        });
        
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          ...mockNewProject,
          node_count: 0,
          completion: 0,
          timeProgress: 0,
          daysElapsed: 0,
          daysRemaining: expect.any(Number)
        }));
      });
      
      it('should handle errors', async () => {
        // Setup
        req.body = {
          name: 'New Project',
          description: 'Project Description',
          startDate: '2023-01-01',
          endDate: '2023-12-31'
        };
        
        const error = new Error('Database error');
        mockProjectService.createProject.mockRejectedValue(error);
        
        // Execute
        await controller.projects.create(req, res);
        
        // Verify
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
      });
    });
    
    describe('getWithNodes', () => {
      it('should return a project with its nodes and progress information', async () => {
        // Setup
        req.params = { projectId: '1' };
        
        const mockProject = {
          id: 1,
          name: 'Project 1',
          start_date: '2023-01-01',
          end_date: '2023-12-31'
        };
        
        const mockNodes = [
          {
            id: 1,
            project_id: 1,
            name: 'Node 1',
            task_ids: '1,2',
            reminder_ids: '1',
            subnode_count: 2,
            weight: 1,
            completion: 50
          },
          {
            id: 2,
            project_id: 1,
            name: 'Node 2',
            task_ids: null,
            reminder_ids: null,
            subnode_count: 0,
            weight: 1,
            completion: 75
          }
        ];
        
        const mockProgress = {
          completion: 62.5,
          timeProgress: 40.3,
          daysElapsed: 150,
          daysRemaining: 215
        };
        
        mockProjectService.getProjectWithNodes.mockResolvedValue({
          project: mockProject,
          nodes: mockNodes
        });
        
        mockProjectService.calculateProjectProgress.mockReturnValue(mockProgress);
        
        // Execute
        await controller.projects.getWithNodes(req, res);
        
        // Verify
        expect(mockProjectService.getProjectWithNodes).toHaveBeenCalledWith('1');
        expect(mockProjectService.calculateProjectProgress).toHaveBeenCalled();
        
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          ...mockProject,
          nodes: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              tasks: [1, 2],
              reminders: [1]
            }),
            expect.objectContaining({
              id: 2,
              tasks: [],
              reminders: []
            })
          ]),
          completion: '62.5',
          timeProgress: '40.3',
          daysElapsed: 150,
          daysRemaining: 215,
          isOverdue: false
        }));
      });
      
      it('should handle project not found error', async () => {
        // Setup
        req.params = { projectId: '999' };
        
        const error = new Error('Project not found');
        mockProjectService.getProjectWithNodes.mockRejectedValue(error);
        
        // Execute
        await controller.projects.getWithNodes(req, res);
        
        // Verify
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Project not found' });
      });
      
      it('should handle general errors', async () => {
        // Setup
        req.params = { projectId: '1' };
        
        const error = new Error('Database error');
        mockProjectService.getProjectWithNodes.mockRejectedValue(error);
        
        // Execute
        await controller.projects.getWithNodes(req, res);
        
        // Verify
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
      });
    });
    
    // Add more tests for other project-related methods (updateDeadline, delete)
  });

  // Test node-related methods
  describe('nodes', () => {
    describe('add', () => {
      it('should add a new node to a project', async () => {
        // Setup
        req.params = { projectId: '1' };
        req.body = {
          name: 'New Node',
          description: 'Node Description',
          parentNodeId: 5,
          positionX: 200,
          positionY: 150
        };
        
        const mockNewNode = {
          id: 10,
          project_id: 1,
          name: 'New Node',
          description: 'Node Description',
          parent_node_id: 5,
          position_x: 200,
          position_y: 150,
          status: 'pending',
          completion: 0
        };
        
        mockProjectService.addNode.mockResolvedValue(mockNewNode);
        
        // Execute
        await controller.nodes.add(req, res);
        
        // Verify
        expect(mockProjectService.addNode).toHaveBeenCalledWith('1', {
          name: 'New Node',
          description: 'Node Description',
          parentNodeId: 5,
          positionX: 200,
          positionY: 150,
          status: undefined,
          completion: undefined,
          deadline: undefined,
          weight: undefined
        });
        
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(mockNewNode);
      });
      
      it('should handle errors', async () => {
        // Setup
        req.params = { projectId: '1' };
        req.body = { name: 'New Node' };
        
        const error = new Error('Database error');
        mockProjectService.addNode.mockRejectedValue(error);
        
        // Execute
        await controller.nodes.add(req, res);
        
        // Verify
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
      });
    });
    
    describe('updateCompletion', () => {
      it('should update node completion percentage', async () => {
        // Setup
        req.params = { nodeId: '5' };
        req.body = { completion: 75 };
        
        const mockResult = {
          id: 5,
          completion: 75
        };
        
        mockProjectService.updateNodeCompletion.mockResolvedValue(mockResult);
        
        // Execute
        await controller.nodes.updateCompletion(req, res);
        
        // Verify
        expect(mockProjectService.updateNodeCompletion).toHaveBeenCalledWith('5', 75);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Node completion updated successfully',
          ...mockResult
        });
      });
      
      it('should handle node not found error', async () => {
        // Setup
        req.params = { nodeId: '999' };
        req.body = { completion: 75 };
        
        const error = new Error('Node not found');
        mockProjectService.updateNodeCompletion.mockRejectedValue(error);
        
        // Execute
        await controller.nodes.updateCompletion(req, res);
        
        // Verify
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Node not found' });
      });
      
      it('should handle general errors', async () => {
        // Setup
        req.params = { nodeId: '5' };
        req.body = { completion: 75 };
        
        const error = new Error('Database error');
        mockProjectService.updateNodeCompletion.mockRejectedValue(error);
        
        // Execute
        await controller.nodes.updateCompletion(req, res);
        
        // Verify
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
      });
    });
    
    // Add more tests for other node-related methods
  });

  // Test task-related methods
  describe('tasks', () => {
    describe('linkAsSubnode', () => {
      it('should link a task as a subnode', async () => {
        // Setup
        req.params = { projectId: '1', nodeId: '5' };
        req.body = { taskId: 10 };
        
        const mockResult = {
          parentNodeId: 5,
          taskId: 10,
          subnode: {
            id: 15,
            name: 'Task Node',
            project_id: 1
          }
        };
        
        mockProjectService.linkTaskToNodeAsSubnode.mockResolvedValue(mockResult);
        
        // Execute
        await controller.tasks.linkAsSubnode(req, res);
        
        // Verify
        expect(mockProjectService.linkTaskToNodeAsSubnode).toHaveBeenCalledWith('1', '5', 10);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Task linked and displayed as subnode',
          ...mockResult
        });
      });
      
      it('should handle not found errors', async () => {
        // Setup
        req.params = { projectId: '1', nodeId: '5' };
        req.body = { taskId: 999 };
        
        const error = new Error('Task not found');
        mockProjectService.linkTaskToNodeAsSubnode.mockRejectedValue(error);
        
        // Execute
        await controller.tasks.linkAsSubnode(req, res);
        
        // Verify
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Task not found' });
      });
      
      it('should handle general errors', async () => {
        // Setup
        req.params = { projectId: '1', nodeId: '5' };
        req.body = { taskId: 10 };
        
        const error = new Error('Database error');
        mockProjectService.linkTaskToNodeAsSubnode.mockRejectedValue(error);
        
        // Execute
        await controller.tasks.linkAsSubnode(req, res);
        
        // Verify
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
      });
    });
    
    describe('link', () => {
      it('should link a task to a node', async () => {
        // Setup
        req.params = { nodeId: '5' };
        req.body = { taskId: 10 };
        
        const mockResult = {
          node_id: 5,
          task_id: 10,
          subnode_id: 15
        };
        
        mockProjectService.linkTaskToNode.mockResolvedValue(mockResult);
        
        // Execute
        await controller.tasks.link(req, res);
        
        // Verify
        expect(mockProjectService.linkTaskToNode).toHaveBeenCalledWith('5', 10);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Task linked to node and displayed as subnode',
          ...mockResult
        });
      });
      
      it('should handle already linked errors', async () => {
        // Setup
        req.params = { nodeId: '5' };
        req.body = { taskId: 10 };
        
        const error = new Error('Task is already linked to this node');
        mockProjectService.linkTaskToNode.mockRejectedValue(error);
        
        // Execute
        await controller.tasks.link(req, res);
        
        // Verify
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ error: 'Task is already linked to this node' });
      });
      
      it('should handle not found errors', async () => {
        // Setup
        req.params = { nodeId: '5' };
        req.body = { taskId: 999 };
        
        const error = new Error('Task not found');
        mockProjectService.linkTaskToNode.mockRejectedValue(error);
        
        // Execute
        await controller.tasks.link(req, res);
        
        // Verify
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Task not found' });
      });
      
      it('should handle general errors', async () => {
        // Setup
        req.params = { nodeId: '5' };
        req.body = { taskId: 10 };
        
        const error = new Error('Database error');
        mockProjectService.linkTaskToNode.mockRejectedValue(error);
        
        // Execute
        await controller.tasks.link(req, res);
        
        // Verify
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
      });
    });
  });

  // Test reminder-related methods
  describe('reminders', () => {
    describe('link', () => {
      it('should link a reminder to a node', async () => {
        // Setup
        req.params = { nodeId: '5' };
        req.body = { reminderId: 10 };
        
        const mockResult = {
          node_id: 5,
          reminder_id: 10
        };
        
        mockProjectService.linkReminderToNode.mockResolvedValue(mockResult);
        
        // Execute
        await controller.reminders.link(req, res);
        
        // Verify
        expect(mockProjectService.linkReminderToNode).toHaveBeenCalledWith('5', 10);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Reminder linked to node',
          ...mockResult
        });
      });
      
      it('should handle already linked errors', async () => {
        // Setup
        req.params = { nodeId: '5' };
        req.body = { reminderId: 10 };
        
        const error = new Error('Reminder is already linked to this node');
        mockProjectService.linkReminderToNode.mockRejectedValue(error);
        
        // Execute
        await controller.reminders.link(req, res);
        
        // Verify
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ error: 'Reminder is already linked to this node' });
      });
      
      it('should handle general errors', async () => {
        // Setup
        req.params = { nodeId: '5' };
        req.body = { reminderId: 10 };
        
        const error = new Error('Database error');
        mockProjectService.linkReminderToNode.mockRejectedValue(error);
        
        // Execute
        await controller.reminders.link(req, res);
        
        // Verify
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
      });
    });
  });
});