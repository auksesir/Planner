// backend/src/middleware/validation.js

const { body, param, query, validationResult } = require('express-validator');

// Custom validation middleware handler
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    next();
  };
};

// Task validations
const taskValidation = [
  body('name').trim().notEmpty().withMessage('Task name is required'),
  body('selectedDay').isISO8601().withMessage('Valid date is required for selectedDay'),
  body('startTime').isISO8601().withMessage('Valid time is required for startTime'),
  body('endTime').isISO8601().withMessage('Valid time is required for endTime'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('repeatOption').optional({ nullable: true }).isString().withMessage('Repeat option must be a string'),
  body('repeatEndDay').optional({ nullable: true }).isISO8601().withMessage('Valid date is required for repeatEndDay'),
  body('currentDay').optional().isString().withMessage('Current day must be a string'),
  body('selectedDayUI').optional().isString().withMessage('Selected day UI must be a string'),
  body('originalStartDay').optional().isISO8601().withMessage('Valid date is required for originalStartDay')
];

// Task reminder validations
const taskReminderValidation = [
  body('reminderTime').isISO8601().withMessage('Valid date is required for reminderTime')
];

// Reminder validations
const reminderValidation = [
  body('name').trim().notEmpty().withMessage('Reminder name is required'),
  body('selectedDay').isISO8601().withMessage('Valid date is required for selectedDay'),
  body('selectedTime').isISO8601().withMessage('Valid time is required for selectedTime'),
  body('repeatOption').optional({ nullable: true }).isString().withMessage('Repeat option must be a string'),
  body('repeatEndDay').optional({ nullable: true }).isISO8601().withMessage('Valid date is required for repeatEndDay'),
  body('currentDay').optional().isString().withMessage('Current day must be a string'),
  body('selectedDayUI').optional().isString().withMessage('Selected day UI must be a string'),
  body('originalStartDay').optional().isISO8601().withMessage('Valid date is required for originalStartDay')
];

// Project validations
const projectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('startDate').isISO8601().withMessage('Valid date is required for start date'),
  body('endDate').isISO8601().withMessage('Valid date is required for end date'),
  body('deadline').optional({ nullable: true }).isISO8601().withMessage('Valid date is required for deadline')
];

// Node validations
const nodeValidation = [
  body('name').trim().notEmpty().withMessage('Node name is required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('parentNodeId').optional({ nullable: true }).isInt().withMessage('Parent node ID must be an integer'),
  body('positionX').optional().isNumeric().withMessage('Position X must be a number'),
  body('positionY').optional().isNumeric().withMessage('Position Y must be a number'),
  body('status').optional().isString().withMessage('Status must be a string'),
  body('completion').optional().isNumeric({ min: 0, max: 100 }).withMessage('Completion must be a number between 0 and 100'),
  body('deadline').optional({ nullable: true }).isISO8601().withMessage('Valid date is required for deadline'),
  body('weight').optional().isNumeric().withMessage('Weight must be a number')
  // Removed 'project_id' as it's provided via route parameters, not request body
];

// Subnode validations - simplified since it's largely redundant with nodeValidation
// Only keeping minimal required fields since other optional fields are covered by the controller's default values
const subnodeValidation = [
  body('name').trim().notEmpty().withMessage('Node name is required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('status').optional().isString().withMessage('Status must be a string'),
  body('completion').optional().isNumeric({ min: 0, max: 100 }).withMessage('Completion must be a number between 0 and 100'),
  body('deadline').optional({ nullable: true }).isISO8601().withMessage('Valid date is required for deadline'),
  body('weight').optional().isNumeric().withMessage('Weight must be a number')
  // Note: positionX/positionY are calculated in the controller based on parent node
];

// Node task link validations
const nodeTaskLinkValidation = [
  body('taskId').isInt().withMessage('Task ID must be an integer')
];

// Node reminder link validations
const nodeReminderLinkValidation = [
  body('reminderId').isInt().withMessage('Reminder ID must be an integer')
];

// Node position validations
const nodePositionValidation = [
  body('positionX').isNumeric().withMessage('Position X must be a number'),
  body('positionY').isNumeric().withMessage('Position Y must be a number')
];

// Node size validations
const nodeSizeValidation = [
  body('size').optional().isString().withMessage('Size must be a string'),
  body('customWidth').optional().isNumeric().withMessage('Custom width must be a number'),
  body('customHeight').optional().isNumeric().withMessage('Custom height must be a number')
];

// Node parent validations
const nodeParentValidation = [
  body('parent_node_id').optional({ nullable: true }).isInt().withMessage('Parent node ID must be an integer')
];

// Deadline validations
const deadlineValidation = [
  body('deadline').isISO8601().withMessage('Valid date is required for deadline')
];

// Completion validations
const completionValidation = [
  body('completion').isInt({ min: 0, max: 100 }).withMessage('Completion must be a number between 0 and 100')
];

// Settings validations
const settingsValidation = [
  body('start_hour').optional().isString().withMessage('Start hour must be a string'),
  body('end_hour').optional().isString().withMessage('End hour must be a string'),
  body('hidden_hours').optional().isArray().withMessage('Hidden hours must be an array'),
  body('soundSettings').optional().isObject().withMessage('Sound settings must be an object'),
  body('soundSettings.enabled').optional().isBoolean().withMessage('Sound enabled must be a boolean'),
  body('soundSettings.volume').optional().isFloat({ min: 0, max: 1 }).withMessage('Volume must be between 0 and 1'),
  body('soundSettings.reminderSound').optional().isString().withMessage('Reminder sound must be a string'),
  body('soundSettings.taskSound').optional().isString().withMessage('Task sound must be a string')
];

// Date parameter validation - validates dates in URL parameters like /date/2023-12-31
const dateValidation = [
  param('date')
    .isISO8601()
    .withMessage('Must be a valid date in ISO8601 format (YYYY-MM-DD)')
    
];

// Week date range validation
const weekDateRangeValidation = [
  param('startDate')
    .isISO8601()
    .withMessage('Start date must be in YYYY-MM-DD format'),
    
  param('endDate')
    .isISO8601()
    .withMessage('End date must be in YYYY-MM-DD format')
    
    .custom((value, { req }) => {
      if (value <= req.params.startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];

// ID parameter validation
const idValidation = (paramName) => [
  param(paramName)
    .isInt({ min: 1 })
    .withMessage(`${paramName} must be a positive integer`)
    .toInt()
];

const reminderAlertValidation = [
  body('reminderTime').isISO8601().withMessage('Invalid reminder time format')
];

// Delete task query validation
const deleteTaskQueryValidation = [
  query('deleteAll')
    .optional()
    .isBoolean()
    .withMessage('deleteAll must be a boolean'),
    
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be in YYYY-MM-DD format')
];

const deleteReminderQueryValidation = [
  query('deleteAll').optional().isBoolean().withMessage('deleteAll must be boolean'),
  query('date').optional().isISO8601().withMessage('Invalid date parameter')
];

// Pomodoro settings validation
const pomodoroSettingsValidation = [
  body('work_duration')
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage('Work duration must be between 1 and 120 minutes'),
    
  body('break_duration')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('Break duration must be between 1 and 60 minutes'),
    
  body('auto_start_breaks')
    .optional()
    .isBoolean()
    .withMessage('Auto-start breaks must be a boolean'),
    
  body('sound_enabled')
    .optional()
    .isBoolean()
    .withMessage('Sound enabled must be a boolean')
];

// Pomodoro session validation
const pomodoroSessionValidation = [
  body('start_time')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),
    
  body('end_time')
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date'),
    
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer (in seconds)'),
    
  body('is_work')
    .isBoolean()
    .withMessage('is_work must be a boolean'),
    
  body('is_completed')
    .optional()
    .isBoolean()
    .withMessage('is_completed must be a boolean'),
    
  body('task_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Task ID must be a positive integer')
];

module.exports = {
  validate,
  taskValidation,
  taskReminderValidation,
  reminderValidation,
  projectValidation,
  nodeValidation,
  subnodeValidation,
  nodeTaskLinkValidation,
  nodeReminderLinkValidation,
  nodePositionValidation,
  nodeSizeValidation,
  nodeParentValidation,
  deadlineValidation,
  completionValidation,
  settingsValidation,
  dateValidation,
  weekDateRangeValidation,
  idValidation,
  reminderAlertValidation,
  deleteReminderQueryValidation,
  deleteTaskQueryValidation,
  pomodoroSettingsValidation, 
  pomodoroSessionValidation
};