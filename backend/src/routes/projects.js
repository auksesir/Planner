const express = require('express');
const router = express.Router();
const { 
  validate, 
  projectValidation, 
  nodeValidation,
  subnodeValidation,
  nodeTaskLinkValidation,
  nodeReminderLinkValidation,
  nodePositionValidation,
  nodeParentValidation,
  nodeSizeValidation,
  deadlineValidation,
  completionValidation,
  idValidation
} = require('../middleware/validation');
const { param, body } = require('express-validator');

module.exports = (projectController) => {
  // Get all projects
  router.get('/', projectController.projects.getAll);

  // Create a new project
  router.post('/', 
    validate(projectValidation), 
    projectController.projects.create
  );

  // Get a project with all its nodes
  router.get('/:projectId', 
    validate(idValidation('projectId')), 
    projectController.projects.getWithNodes
  );

  // Add a node to a project
  router.post('/:projectId/nodes', 
    validate([
      ...idValidation('projectId'),
      ...nodeValidation
    ]), 
    projectController.nodes.add
  );
  
  // Add a subnode to a project with parent node
  router.post('/:projectId/nodes/:parentNodeId/subnodes', 
    validate([
      ...idValidation('projectId'),
      ...idValidation('parentNodeId'),
      ...subnodeValidation
    ]), 
    projectController.nodes.addSubnode
  );

  // Update node position
  router.put('/nodes/:nodeId/position', 
    validate([
      ...idValidation('nodeId'),
      ...nodePositionValidation
    ]), 
    projectController.nodes.updatePosition
  );

  // Link a task to a node
  router.post('/nodes/:nodeId/tasks', 
    validate([
      ...idValidation('nodeId'),
      ...nodeTaskLinkValidation
    ]), 
    projectController.tasks.link
  );

  // Link a reminder to a node
  router.post('/nodes/:nodeId/reminders', 
    validate([
      ...idValidation('nodeId'),
      ...nodeReminderLinkValidation
    ]), 
    projectController.reminders.link
  );

  // Update node details
  router.put('/nodes/:nodeId', 
    validate([
      ...idValidation('nodeId'),
      body('name').optional().trim().notEmpty().withMessage('Node name is required'),
      body('description').optional().isString().withMessage('Description must be a string'),
      body('status').optional().isString().withMessage('Status must be a string'),
      body('completion').optional().isNumeric({ min: 0, max: 100 }).withMessage('Completion must be a number between 0 and 100'),
      body('weight').optional().isNumeric().withMessage('Weight must be a number')
    ]), 
    projectController.nodes.update
  );

  // Delete a node
  router.delete('/nodes/:nodeId', 
    validate(idValidation('nodeId')), 
    projectController.nodes.delete
  );

  // Update node deadline
  router.put('/nodes/:nodeId/deadline', 
    validate([
      ...idValidation('nodeId'),
      ...deadlineValidation
    ]), 
    projectController.nodes.updateDeadline
  );

  // Update project deadline
  router.put('/:projectId/deadline', 
    validate([
      ...idValidation('projectId'),
      ...deadlineValidation
    ]), 
    projectController.projects.updateDeadline
  );

  // Update node completion percentage
  router.put('/nodes/:nodeId/completion', 
    validate([
      ...idValidation('nodeId'),
      ...completionValidation
    ]), 
    projectController.nodes.updateCompletion
  );

  // Delete a project
  router.delete('/:projectId', 
    validate(idValidation('projectId')), 
    projectController.projects.delete
  );

  // Update node parent relationship
  router.put('/nodes/:nodeId/parent', 
    validate([
      ...idValidation('nodeId'),
      ...nodeParentValidation
    ]), 
    projectController.nodes.updateParent
  );

  // Update node size
  router.put('/nodes/:nodeId/size', 
    validate([
      ...idValidation('nodeId'),
      ...nodeSizeValidation
    ]), 
    projectController.nodes.updateSize
  );

  // Link a task to a node as subnode
  router.post('/:projectId/nodes/:nodeId/tasks-as-subnodes', 
    validate([
      ...idValidation('projectId'),
      ...idValidation('nodeId'),
      ...nodeTaskLinkValidation
    ]), 
    projectController.tasks.linkAsSubnode
  );

  return router;
};