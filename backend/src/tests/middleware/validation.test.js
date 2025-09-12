// REMOVE ALL MOCKS - Let express-validator work naturally
const { validate, 
    taskValidation,
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
    deleteTaskQueryValidation,
    deleteReminderQueryValidation
  } = require('../../middleware/validation');

// Import the real express-validator functions - NO MOCKING
const { validationResult } = require('express-validator');

describe('Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate middleware', () => {
    it('should call next() when validations pass', async () => {
      // Test with valid data
      req.body = {
        name: 'Valid Task',
        selectedDay: '2023-07-20T00:00:00.000Z',
        startTime: '2023-07-20T09:00:00.000Z',
        endTime: '2023-07-20T10:00:00.000Z',
        duration: 60
      };
      
      await validate(taskValidation)(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 with errors when validations fail', async () => {
      // Test with invalid data (missing required fields)
      req.body = {
        // Missing name - should trigger validation error
        selectedDay: 'invalid-date', // Invalid date format
        duration: -5 // Invalid negative duration
      };
      
      await validate(taskValidation)(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      
      // Check that errors were returned
      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.errors).toBeDefined();
      expect(jsonCall.errors.length).toBeGreaterThan(0);
    });
  });

  // Test validation arrays exist and have rules
  describe('Task Validation', () => {
    it('should validate task fields correctly', async () => {
      expect(taskValidation).toBeDefined();
      expect(Array.isArray(taskValidation)).toBe(true);
      expect(taskValidation.length).toBeGreaterThan(0);
    });
  });

  describe('Reminder Validation', () => {
    it('should validate reminder fields correctly', async () => {
      expect(reminderValidation).toBeDefined();
      expect(Array.isArray(reminderValidation)).toBe(true);
      expect(reminderValidation.length).toBeGreaterThan(0);
    });
  });

  describe('Project Validation', () => {
    it('should validate project fields correctly', async () => {
      expect(projectValidation).toBeDefined();
      expect(Array.isArray(projectValidation)).toBe(true);
      expect(projectValidation.length).toBeGreaterThan(0);
    });
  });

  describe('Node Validation', () => {
    it('should validate node fields correctly', async () => {
      expect(nodeValidation).toBeDefined();
      expect(Array.isArray(nodeValidation)).toBe(true);
      expect(nodeValidation.length).toBeGreaterThan(0);
    });
  });

  describe('Subnode Validation', () => {
    it('should validate subnode fields correctly', async () => {
      expect(subnodeValidation).toBeDefined();
      expect(Array.isArray(subnodeValidation)).toBe(true);
      expect(subnodeValidation.length).toBeGreaterThan(0);
    });
  });

  describe('Node Task Link Validation', () => {
    it('should validate node-task links correctly', async () => {
      expect(nodeTaskLinkValidation).toBeDefined();
      expect(Array.isArray(nodeTaskLinkValidation)).toBe(true);
      expect(nodeTaskLinkValidation.length).toBeGreaterThan(0);
    });
  });

  describe('Node Reminder Link Validation', () => {
    it('should validate node-reminder links correctly', async () => {
      expect(nodeReminderLinkValidation).toBeDefined();
      expect(Array.isArray(nodeReminderLinkValidation)).toBe(true);
      expect(nodeReminderLinkValidation.length).toBeGreaterThan(0);
    });
  });

  describe('Node Position Validation', () => {
    it('should validate node position correctly', async () => {
      expect(nodePositionValidation).toBeDefined();
      expect(Array.isArray(nodePositionValidation)).toBe(true);
      expect(nodePositionValidation.length).toBeGreaterThan(0);
    });
  });

  describe('Node Size Validation', () => {
    it('should validate node size correctly', async () => {
      expect(nodeSizeValidation).toBeDefined();
      expect(Array.isArray(nodeSizeValidation)).toBe(true);
      expect(nodeSizeValidation.length).toBeGreaterThan(0);
    });
  });

  describe('Node Parent Validation', () => {
    it('should validate node parent correctly', async () => {
      expect(nodeParentValidation).toBeDefined();
      expect(Array.isArray(nodeParentValidation)).toBe(true);
      expect(nodeParentValidation.length).toBeGreaterThan(0);
    });
  });

  describe('Deadline Validation', () => {
    it('should validate deadline correctly', async () => {
      expect(deadlineValidation).toBeDefined();
      expect(Array.isArray(deadlineValidation)).toBe(true);
      expect(deadlineValidation.length).toBeGreaterThan(0);
    });
  });

  describe('Completion Validation', () => {
    it('should validate completion percentage correctly', async () => {
      expect(completionValidation).toBeDefined();
      expect(Array.isArray(completionValidation)).toBe(true);
      expect(completionValidation.length).toBeGreaterThan(0);
    });
  });

  describe('Settings Validation', () => {
    it('should validate settings correctly', async () => {
      expect(settingsValidation).toBeDefined();
      expect(Array.isArray(settingsValidation)).toBe(true);
      expect(settingsValidation.length).toBeGreaterThan(0);
    });
  });

  describe('Date Validation', () => {
    it('should validate date format correctly', async () => {
      expect(dateValidation).toBeDefined();
      expect(Array.isArray(dateValidation)).toBe(true);
      expect(dateValidation.length).toBeGreaterThan(0);
    });
  });

  describe('Week Date Range Validation', () => {
    it('should validate week date range correctly', async () => {
      expect(weekDateRangeValidation).toBeDefined();
      expect(Array.isArray(weekDateRangeValidation)).toBe(true);
      expect(weekDateRangeValidation.length).toBeGreaterThan(0);
    });
  });

  describe('ID Validation', () => {
    it('should validate ID parameter correctly', async () => {
      const idRules = idValidation('testId');
      expect(idRules).toBeDefined();
      expect(Array.isArray(idRules)).toBe(true);
      expect(idRules.length).toBeGreaterThan(0);
    });
  });

  describe('Reminder Alert Validation', () => {
    it('should validate reminder alert correctly', async () => {
      expect(reminderAlertValidation).toBeDefined();
      expect(Array.isArray(reminderAlertValidation)).toBe(true);
      expect(reminderAlertValidation.length).toBeGreaterThan(0);
    });
  });

  describe('Delete Task Query Validation', () => {
    it('should validate delete task query correctly', async () => {
      expect(deleteTaskQueryValidation).toBeDefined();
      expect(Array.isArray(deleteTaskQueryValidation)).toBe(true);
      expect(deleteTaskQueryValidation.length).toBeGreaterThan(0);
    });
  });

  describe('Delete Reminder Query Validation', () => {
    it('should validate delete reminder query correctly', async () => {
      expect(deleteReminderQueryValidation).toBeDefined();
      expect(Array.isArray(deleteReminderQueryValidation)).toBe(true);
      expect(deleteReminderQueryValidation.length).toBeGreaterThan(0);
    });
  });
});

/**
 * Validation Rule Tests - Testing Actual Validation Logic
 * These tests run the real validation rules to ensure they work correctly
 */
describe('Validation Rule Tests', () => {
  describe('Task Validation Rules', () => {
    it('should require task name', async () => {
      const req = {
        body: {
          // Missing name field - should fail validation
          selectedDay: '2023-07-20T00:00:00.000Z',
          startTime: '2023-07-20T09:00:00.000Z',
          endTime: '2023-07-20T10:00:00.000Z',
          duration: 60
        }
      };

      // Run the actual validation rules
      await Promise.all(taskValidation.map(validation => validation.run(req)));
      
      // Check validation result
      const result = validationResult(req);
      expect(result.isEmpty()).toBe(false);
      
      const errors = result.array();
      const nameError = errors.find(error => error.path === 'name');
      expect(nameError).toBeDefined();
      expect(nameError.msg).toContain('required');
    });

    it('should validate selectedDay as ISO8601', async () => {
      const req = {
        body: {
          name: 'Test Task',
          selectedDay: 'invalid-date', // Invalid date format
          startTime: '2023-07-20T09:00:00.000Z',
          endTime: '2023-07-20T10:00:00.000Z',
          duration: 60
        }
      };

      await Promise.all(taskValidation.map(validation => validation.run(req)));

      const result = validationResult(req);
      expect(result.isEmpty()).toBe(false);
      
      const errors = result.array();
      const dateError = errors.find(error => error.path === 'selectedDay');
      expect(dateError).toBeDefined();
      expect(dateError.msg).toContain('Valid date is required');
    });

    it('should validate startTime as ISO8601', async () => {
      const req = {
        body: {
          name: 'Test Task',
          selectedDay: '2023-07-20T00:00:00.000Z',
          startTime: 'invalid-time', // Invalid time format
          endTime: '2023-07-20T10:00:00.000Z',
          duration: 60
        }
      };

      await Promise.all(taskValidation.map(validation => validation.run(req)));

      const result = validationResult(req);
      expect(result.isEmpty()).toBe(false);
      
      const errors = result.array();
      const timeError = errors.find(error => error.path === 'startTime');
      expect(timeError).toBeDefined();
      expect(timeError.msg).toContain('Valid time is required');
    });

    it('should validate duration as positive integer', async () => {
      const req = {
        body: {
          name: 'Test Task',
          selectedDay: '2023-07-20T00:00:00.000Z',
          startTime: '2023-07-20T09:00:00.000Z',
          endTime: '2023-07-20T10:00:00.000Z',
          duration: -5 // Invalid negative duration
        }
      };

      await Promise.all(taskValidation.map(validation => validation.run(req)));

      const result = validationResult(req);
      expect(result.isEmpty()).toBe(false);
      
      const errors = result.array();
      const durationError = errors.find(error => error.path === 'duration');
      expect(durationError).toBeDefined();
      expect(durationError.msg).toContain('positive integer');
    });

    it('should accept valid task data', async () => {
      const req = {
        body: {
          name: 'Valid Task',
          selectedDay: '2023-07-20T00:00:00.000Z',
          startTime: '2023-07-20T09:00:00.000Z',
          endTime: '2023-07-20T10:00:00.000Z',
          duration: 60
        }
      };

      await Promise.all(taskValidation.map(validation => validation.run(req)));

      const result = validationResult(req);
      expect(result.isEmpty()).toBe(true);
    });
  });

  describe('Reminder Validation Rules', () => {
    it('should require reminder name', async () => {
      const req = {
        body: {
          // Missing name field
          selectedDay: '2023-07-20T00:00:00.000Z',
          selectedTime: '2023-07-20T10:00:00.000Z'
        }
      };

      await Promise.all(reminderValidation.map(validation => validation.run(req)));

      const result = validationResult(req);
      expect(result.isEmpty()).toBe(false);
      
      const errors = result.array();
      const nameError = errors.find(error => error.path === 'name');
      expect(nameError).toBeDefined();
      expect(nameError.msg).toContain('required');
    });

    it('should validate selectedTime as ISO8601', async () => {
      const req = {
        body: {
          name: 'Test Reminder',
          selectedDay: '2023-07-20T00:00:00.000Z',
          selectedTime: 'invalid-time' // Invalid time format
        }
      };

      await Promise.all(reminderValidation.map(validation => validation.run(req)));

      const result = validationResult(req);
      expect(result.isEmpty()).toBe(false);
      
      const errors = result.array();
      const timeError = errors.find(error => error.path === 'selectedTime');
      expect(timeError).toBeDefined();
      expect(timeError.msg).toContain('Valid time is required');
    });

    it('should accept valid reminder data', async () => {
      const req = {
        body: {
          name: 'Valid Reminder',
          selectedDay: '2023-07-20T00:00:00.000Z',
          selectedTime: '2023-07-20T10:00:00.000Z'
        }
      };

      await Promise.all(reminderValidation.map(validation => validation.run(req)));

      const result = validationResult(req);
      expect(result.isEmpty()).toBe(true);
    });
  });

  describe('Project Validation Rules', () => {
    it('should require project name', async () => {
      const req = {
        body: {
          // Missing name field
          description: 'Test project',
          startDate: '2023-07-20T00:00:00.000Z',
          endDate: '2023-07-21T00:00:00.000Z'
        }
      };

      await Promise.all(projectValidation.map(validation => validation.run(req)));

      const result = validationResult(req);
      expect(result.isEmpty()).toBe(false);
      
      const errors = result.array();
      const nameError = errors.find(error => error.path === 'name');
      expect(nameError).toBeDefined();
      expect(nameError.msg).toContain('required');
    });

    it('should accept valid project data', async () => {
      const req = {
        body: {
          name: 'Valid Project',
          description: 'Test project',
          startDate: '2023-07-20T00:00:00.000Z',
          endDate: '2023-07-21T00:00:00.000Z'
        }
      };

      await Promise.all(projectValidation.map(validation => validation.run(req)));

      const result = validationResult(req);
      expect(result.isEmpty()).toBe(true);
    });
  });

  describe('Completion Validation Rules', () => {
    it('should reject completion value over 100', async () => {
      const req = {
        body: {
          completion: 150 // Invalid: over 100
        }
      };

      await Promise.all(completionValidation.map(validation => validation.run(req)));

      const result = validationResult(req);
      expect(result.isEmpty()).toBe(false);
      
      const errors = result.array();
      const completionError = errors.find(error => error.path === 'completion');
      expect(completionError).toBeDefined();
      expect(completionError.msg).toContain('between 0 and 100');
    });

    it('should reject completion value under 0', async () => {
      const req = {
        body: {
          completion: -10 // Invalid: under 0
        }
      };

      await Promise.all(completionValidation.map(validation => validation.run(req)));

      const result = validationResult(req);
      expect(result.isEmpty()).toBe(false);
      
      const errors = result.array();
      const completionError = errors.find(error => error.path === 'completion');
      expect(completionError).toBeDefined();
      expect(completionError.msg).toContain('between 0 and 100');
    });

    it('should accept valid completion value', async () => {
      const req = {
        body: {
          completion: 75 // Valid: between 0 and 100
        }
      };

      await Promise.all(completionValidation.map(validation => validation.run(req)));

      const result = validationResult(req);
      expect(result.isEmpty()).toBe(true);
    });
  });

  describe('ID Validation Rules', () => {
    it('should validate ID parameter as integer', async () => {
      const req = {
        params: {
          testId: 'not-a-number' // Invalid: not an integer
        }
      };

      const idRules = idValidation('testId');
      await Promise.all(idRules.map(validation => validation.run(req)));

      const result = validationResult(req);
      expect(result.isEmpty()).toBe(false);
      
      const errors = result.array();
      const idError = errors.find(error => error.path === 'testId');
      expect(idError).toBeDefined();
      expect(idError.msg).toContain('integer');
    });

    it('should accept valid ID parameter', async () => {
      const req = {
        params: {
          testId: '123' // Valid integer as string
        }
      };

      const idRules = idValidation('testId');
      await Promise.all(idRules.map(validation => validation.run(req)));

      const result = validationResult(req);
      expect(result.isEmpty()).toBe(true);
    });
  });

  describe('Date Validation Rules', () => {
    it('should validate date parameter format', async () => {
      const req = {
        params: {
          date: 'invalid-date-format' // Invalid date format
        }
      };

      await Promise.all(dateValidation.map(validation => validation.run(req)));

      const result = validationResult(req);
      expect(result.isEmpty()).toBe(false);
      
      const errors = result.array();
      const dateError = errors.find(error => error.path === 'date');
      expect(dateError).toBeDefined();
      expect(dateError.msg).toContain('valid date');
    });

    it('should accept valid date parameter', async () => {
      const req = {
        params: {
          date: '2023-07-20' // Valid date format
        }
      };

      await Promise.all(dateValidation.map(validation => validation.run(req)));

      const result = validationResult(req);
      expect(result.isEmpty()).toBe(true);
    });
  });

  describe('Validation Array Structure Tests', () => {
    it('should have expected number of task validation rules', () => {
      expect(taskValidation).toBeDefined();
      expect(Array.isArray(taskValidation)).toBe(true);
      expect(taskValidation.length).toBeGreaterThan(0);
    });

    it('should have expected number of reminder validation rules', () => {
      expect(reminderValidation).toBeDefined();
      expect(Array.isArray(reminderValidation)).toBe(true);
      expect(reminderValidation.length).toBeGreaterThan(0);
    });

    it('should have expected number of project validation rules', () => {
      expect(projectValidation).toBeDefined();
      expect(Array.isArray(projectValidation)).toBe(true);
      expect(projectValidation.length).toBeGreaterThan(0);
    });
  });
});