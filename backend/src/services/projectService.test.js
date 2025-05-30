// src/tests/services/projectService.test.js

const ProjectService = require('../../services/projectService');
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const path = require('path');

describe('ProjectService', () => {
  let db;
  let projectService;
  let testProjectId;
  
  // Setup test database
  beforeAll(async () => {
    db = await sqlite.open({
      filename: ':memory:',
      driver: sqlite3.Database
    });
    
    // Create test tables
    await db.exec(`
      CREATE TABLE projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        start_date TEXT,
        end_date TEXT,
        deadline TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await db.exec(`
      CREATE TABLE project_nodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        parent_node_id INTEGER,
        position_x REAL DEFAULT 100,
        position_y REAL DEFAULT 100,
        status TEXT DEFAULT 'pending',
        completion REAL DEFAULT 0,
        deadline TEXT,
        weight REAL DEFAULT 1,
        size TEXT DEFAULT 'medium', 
        custom_width INTEGER,       
        custom_height INTEGER,
        is_task_node BOOLEAN DEFAULT 0,  
        task_id INTEGER,                 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await db.exec(`
      CREATE TABLE node_tasks (
        node_id INTEGER,
        task_id INTEGER,
        PRIMARY KEY (node_id, task_id)
      )
    `);
    
    await db.exec(`
      CREATE TABLE node_reminders (
        node_id INTEGER,
        reminder_id INTEGER,
        PRIMARY KEY (node_id, reminder_id)
      )
    `);
    
    await db.exec(`
      CREATE TABLE tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        selectedDay DATE,
        originalStartDay DATE,
        startTime DATETIME,
        endTime DATETIME,
        duration INTEGER,
        repeatOption TEXT,
        repeatEndDay DATE,
        skipDates TEXT,
        reminderTime DATETIME,
        hasReminder BOOLEAN DEFAULT 0
      )
    `);
    
    await db.exec(`
      CREATE TABLE reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        selectedDay DATE,
        selectedTime DATETIME,
        repeatOption TEXT,
        repeatEndDay DATE,
        originalStartDay DATE,
        skipDates TEXT
      )
    `);
    
    projectService = new ProjectService(db);
  });
  
  // Clean up after tests
  afterAll(async () => {
    await db.close();
  });
  
  // Set up a test project
  beforeEach(async () => {
    // Create a test project
    const project = await projectService.createProject({
      name: "Test Project",
      description: "Test Description",
      startDate: "2023-01-01",
      endDate: "2023-12-31",
      deadline: "2023-12-31"
    });
    
    testProjectId = project.id;
  });
  
  // Clean up after each test
  afterEach(async () => {
    // Clean up database
    await db.exec('DELETE FROM node_tasks');
    await db.exec('DELETE FROM node_reminders');
    await db.exec('DELETE FROM project_nodes');
    await db.exec('DELETE FROM tasks');
    await db.exec('DELETE FROM reminders');
    await db.exec('DELETE FROM projects');
  });
  
  // Test project creation
  test('createProject should create a new project', async () => {
    const project = {
      name: "New Project",
      description: "New Description",
      startDate: "2023-02-01",
      endDate: "2023-12-31",
      deadline: "2023-11-30"
    };
    
    const result = await projectService.createProject(project);
    
    expect(result).toEqual(expect.objectContaining({
      name: project.name,
      description: project.description,
      start_date: project.startDate,
      end_date: project.endDate,
      deadline: project.deadline,
      status: 'active'
    }));
    
    expect(result.id).toBeDefined();
  });
  
  // Test getting all projects
  test('getAllProjects should return all projects', async () => {
    const projects = await projectService.getAllProjects();
    
    expect(projects).toHaveLength(1);
    expect(projects[0]).toEqual(expect.objectContaining({
      name: "Test Project",
      description: "Test Description",
      start_date: "2023-01-01",
      end_date: "2023-12-31"
    }));
  });
  
  // Test getting project with nodes
  test('getProjectWithNodes should return project with its nodes', async () => {
    // Add some nodes to the project
    await projectService.addNode(testProjectId, {
      name: "Parent Node",
      description: "Parent Description",
      positionX: 100,
      positionY: 100
    });
    
    const { project, nodes } = await projectService.getProjectWithNodes(testProjectId);
    
    expect(project).toEqual(expect.objectContaining({
      id: testProjectId,
      name: "Test Project"
    }));
    
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toEqual(expect.objectContaining({
      name: "Parent Node",
      description: "Parent Description"
    }));
  });
  
  // Test node hierarchy and completion propagation
  test('node completion should propagate up the hierarchy', async () => {
    // Create node hierarchy
    const parentNode = await projectService.addNode(testProjectId, {
      name: "Parent Node",
      description: "Parent Description"
    });
    
    const childNode = await projectService.addNode(testProjectId, {
      name: "Child Node",
      description: "Child Description",
      parentNodeId: parentNode.id
    });
    
    const grandchildNode = await projectService.addNode(testProjectId, {
      name: "Grandchild Node",
      description: "Grandchild Description",
      parentNodeId: childNode.id
    });
    
    // Update grandchild completion to 100%
    await projectService.updateNodeCompletion(grandchildNode.id, 100);
    
    // Get the updated nodes
    const { nodes } = await projectService.getProjectWithNodes(testProjectId);
    
    const updatedParentNode = nodes.find(n => n.id === parentNode.id);
    const updatedChildNode = nodes.find(n => n.id === childNode.id);
    const updatedGrandchildNode = nodes.find(n => n.id === grandchildNode.id);
    
    expect(updatedGrandchildNode.completion).toBe(100);
    expect(updatedChildNode.completion).toBe(100);
    expect(updatedParentNode.completion).toBe(100);
  });
  
  // Test mixed completion (not all nodes at 100%)
  test('partial completion should average correctly', async () => {
    // Create node hierarchy
    const parentNode = await projectService.addNode(testProjectId, {
      name: "Parent Node",
      description: "Parent Description"
    });
    
    const childNode1 = await projectService.addNode(testProjectId, {
      name: "Child Node 1",
      description: "Child Description 1",
      parentNodeId: parentNode.id
    });
    
    const childNode2 = await projectService.addNode(testProjectId, {
      name: "Child Node 2",
      description: "Child Description 2",
      parentNodeId: parentNode.id
    });
    
    // Update child completions
    await projectService.updateNodeCompletion(childNode1.id, 100);
    await projectService.updateNodeCompletion(childNode2.id, 50);
    
    // Get the updated nodes
    const { nodes } = await projectService.getProjectWithNodes(testProjectId);
    
    const updatedParentNode = nodes.find(n => n.id === parentNode.id);
    const updatedChildNode1 = nodes.find(n => n.id === childNode1.id);
    const updatedChildNode2 = nodes.find(n => n.id === childNode2.id);
    
    expect(updatedChildNode1.completion).toBe(100);
    expect(updatedChildNode2.completion).toBe(50);
    // Parent should have the average completion: (100 + 50) / 2 = 75
    expect(updatedParentNode.completion).toBe(75);
  });
  
  // Test completion boundary values
  test('completion values should be clamped between 0 and 100', async () => {
    // Create a test node
    const node = await projectService.addNode(testProjectId, {
      name: "Test Node",
      description: "Test Description"
    });
    
    // Test with negative value (should clamp to 0)
    await projectService.updateNodeCompletion(node.id, -10);
    let { nodes } = await projectService.getProjectWithNodes(testProjectId);
    let updatedNode = nodes.find(n => n.id === node.id);
    expect(updatedNode.completion).toBe(0);
    
    // Test with value > 100 (should clamp to 100)
    await projectService.updateNodeCompletion(node.id, 150);
    ({ nodes } = await projectService.getProjectWithNodes(testProjectId));
    updatedNode = nodes.find(n => n.id === node.id);
    expect(updatedNode.completion).toBe(100);
  });
  
  // Test node deletion and hierarchy update
  test('deleting a node should update hierarchy completion', async () => {
    // Create node hierarchy
    const parentNode = await projectService.addNode(testProjectId, {
      name: "Parent Node",
      description: "Parent Description"
    });
    
    const childNode1 = await projectService.addNode(testProjectId, {
      name: "Child Node 1",
      description: "Child Description 1",
      parentNodeId: parentNode.id
    });
    
    const childNode2 = await projectService.addNode(testProjectId, {
      name: "Child Node 2",
      description: "Child Description 2",
      parentNodeId: parentNode.id
    });
    
    // Update child completions
    await projectService.updateNodeCompletion(childNode1.id, 100);
    await projectService.updateNodeCompletion(childNode2.id, 50);
    
    // Get the initial state
    let { nodes } = await projectService.getProjectWithNodes(testProjectId);
    const initialParentNode = nodes.find(n => n.id === parentNode.id);
    expect(initialParentNode.completion).toBe(75); // (100 + 50) / 2
    
    // Delete childNode2
    await projectService.deleteNode(childNode2.id);
    
    // Get the updated state
    ({ nodes } = await projectService.getProjectWithNodes(testProjectId));
    const updatedParentNode = nodes.find(n => n.id === parentNode.id);
    
    // Parent should now have 100% completion (only childNode1 remains)
    expect(updatedParentNode.completion).toBe(100);
  });
});