const express = require('express');
const router = express.Router();
const { 
  validate, 
  taskValidation, 
  taskReminderValidation,
  dateValidation,
  weekDateRangeValidation,
  idValidation,
  deleteTaskQueryValidation
} = require('../middleware/validation');

module.exports = (taskController) => {
  // Task routes
  router.get('/id/:id', validate(idValidation('id')), taskController.tasks.getById);
  router.get('/', taskController.tasks.getAll);
  router.get('/date/:date', validate(dateValidation), taskController.tasks.getForDay);
  router.post('/add', validate(taskValidation), taskController.tasks.create);
  router.put('/id/:id', validate([...idValidation('id'), ...taskValidation]), taskController.tasks.update);
  router.delete('/id/:id', validate([...idValidation('id'), ...deleteTaskQueryValidation]), taskController.tasks.delete);
  router.get('/latest', taskController.tasks.getLatest);
  router.get('/week/:startDate/:endDate', validate(weekDateRangeValidation), taskController.tasks.getForWeek);

  // Reminder routes
  router.post('/:taskId/reminder', validate([...idValidation('taskId'), ...taskReminderValidation]), taskController.reminders.set);
  router.delete('/:taskId/reminder', validate(idValidation('taskId')), taskController.reminders.clear);

  return router;
};