const express = require('express');
const router = express.Router();
const { 
  validate, 
  idValidation,
  reminderValidation,
  reminderAlertValidation,
  dateValidation,
  weekDateRangeValidation,
  deleteReminderQueryValidation
} = require('../middleware/validation');

module.exports = (reminderController) => {
  if (!reminderController) {
    throw new Error('reminderController is required');
  }

  // Reminder routes
  router.get('/id/:id', validate(idValidation('id')), reminderController.reminders.getById);
  router.get('/', reminderController.reminders.getAll);
  router.get('/date/:date', validate(dateValidation), reminderController.reminders.getForDay);
  router.post('/add', validate(reminderValidation), reminderController.reminders.create);
  router.put('/id/:id', validate([...idValidation('id'), ...reminderValidation]), reminderController.reminders.update);
  router.delete('/id/:id', validate([...idValidation('id'), ...deleteReminderQueryValidation]), reminderController.reminders.delete);
  router.get('/latest', reminderController.reminders.getLatest);
  router.get('/week/:startDate/:endDate', validate(weekDateRangeValidation), reminderController.reminders.getForWeek);

  // Alert routes
  router.post('/:id/alert', validate([...idValidation('id'), ...reminderAlertValidation]), reminderController.alerts.set);
  router.delete('/:id/alert', validate(idValidation('id')), reminderController.alerts.clear);
  router.post(
    '/:id/alert', 
    validate([
      ...idValidation('id'), 
      ...reminderAlertValidation 
    ]), 
    reminderController.alerts.set
  );

  return router;
};