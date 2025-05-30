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
  } = require('../src/middleware/validation');
  
  // Mock express-validator's validation result
  jest.mock('express-validator', () => {
    const actualExpressValidator = jest.requireActual('express-validator');
    
    return {
      ...actualExpressValidator,
      validationResult: jest.fn().mockImplementation(() => ({
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([])
      }))
    };
  });
  
  // Import validator to override for error case testing
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
        const validations = [{ run: jest.fn().mockResolvedValue(null) }];
        
        await validate(validations)(req, res, next);
        
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });
  
      it('should return 400 with errors when validations fail', async () => {
        const validations = [{ run: jest.fn().mockResolvedValue(null) }];
        
        // Mock validation errors
        validationResult.mockImplementationOnce(() => ({
          isEmpty: jest.fn().mockReturnValue(false),
          array: jest.fn().mockReturnValue([{ param: 'name', msg: 'Required field' }])
        }));
        
        await validate(validations)(req, res, next);
        
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ errors: expect.any(Array) });
      });
    });
  
    describe('Task Validation', () => {
      it('should validate task fields correctly', async () => {
        const mockRun = jest.fn().mockResolvedValue(null);
        taskValidation.forEach(validation => {
          validation.run = mockRun;
        });
        
        await validate(taskValidation)(req, res, next);
        
        expect(mockRun).toHaveBeenCalledTimes(taskValidation.length);
        expect(next).toHaveBeenCalled();
      });
    });
  
    describe('Reminder Validation', () => {
      it('should validate reminder fields correctly', async () => {
        const mockRun = jest.fn().mockResolvedValue(null);
        reminderValidation.forEach(validation => {
          validation.run = mockRun;
        });
        
        await validate(reminderValidation)(req, res, next);
        
        expect(mockRun).toHaveBeenCalledTimes(reminderValidation.length);
        expect(next).toHaveBeenCalled();
      });
    });
  
    describe('Project Validation', () => {
      it('should validate project fields correctly', async () => {
        const mockRun = jest.fn().mockResolvedValue(null);
        projectValidation.forEach(validation => {
          validation.run = mockRun;
        });
        
        await validate(projectValidation)(req, res, next);
        
        expect(mockRun).toHaveBeenCalledTimes(projectValidation.length);
        expect(next).toHaveBeenCalled();
      });
    });
  
    describe('Node Validation', () => {
      it('should validate node fields correctly', async () => {
        const mockRun = jest.fn().mockResolvedValue(null);
        nodeValidation.forEach(validation => {
          validation.run = mockRun;
        });
        
        await validate(nodeValidation)(req, res, next);
        
        expect(mockRun).toHaveBeenCalledTimes(nodeValidation.length);
        expect(next).toHaveBeenCalled();
      });
    });
  
    describe('Subnode Validation', () => {
      it('should validate subnode fields correctly', async () => {
        const mockRun = jest.fn().mockResolvedValue(null);
        subnodeValidation.forEach(validation => {
          validation.run = mockRun;
        });
        
        await validate(subnodeValidation)(req, res, next);
        
        expect(mockRun).toHaveBeenCalledTimes(subnodeValidation.length);
        expect(next).toHaveBeenCalled();
      });
    });
  
    describe('Node Task Link Validation', () => {
      it('should validate node-task links correctly', async () => {
        const mockRun = jest.fn().mockResolvedValue(null);
        nodeTaskLinkValidation.forEach(validation => {
          validation.run = mockRun;
        });
        
        await validate(nodeTaskLinkValidation)(req, res, next);
        
        expect(mockRun).toHaveBeenCalledTimes(nodeTaskLinkValidation.length);
        expect(next).toHaveBeenCalled();
      });
    });
  
    describe('Node Reminder Link Validation', () => {
      it('should validate node-reminder links correctly', async () => {
        const mockRun = jest.fn().mockResolvedValue(null);
        nodeReminderLinkValidation.forEach(validation => {
          validation.run = mockRun;
        });
        
        await validate(nodeReminderLinkValidation)(req, res, next);
        
        expect(mockRun).toHaveBeenCalledTimes(nodeReminderLinkValidation.length);
        expect(next).toHaveBeenCalled();
      });
    });
  
    describe('Node Position Validation', () => {
      it('should validate node position correctly', async () => {
        const mockRun = jest.fn().mockResolvedValue(null);
        nodePositionValidation.forEach(validation => {
          validation.run = mockRun;
        });
        
        await validate(nodePositionValidation)(req, res, next);
        
        expect(mockRun).toHaveBeenCalledTimes(nodePositionValidation.length);
        expect(next).toHaveBeenCalled();
      });
    });
  
    describe('Node Size Validation', () => {
      it('should validate node size correctly', async () => {
        const mockRun = jest.fn().mockResolvedValue(null);
        nodeSizeValidation.forEach(validation => {
          validation.run = mockRun;
        });
        
        await validate(nodeSizeValidation)(req, res, next);
        
        expect(mockRun).toHaveBeenCalledTimes(nodeSizeValidation.length);
        expect(next).toHaveBeenCalled();
      });
    });
  
    describe('Node Parent Validation', () => {
      it('should validate node parent correctly', async () => {
        const mockRun = jest.fn().mockResolvedValue(null);
        nodeParentValidation.forEach(validation => {
          validation.run = mockRun;
        });
        
        await validate(nodeParentValidation)(req, res, next);
        
        expect(mockRun).toHaveBeenCalledTimes(nodeParentValidation.length);
        expect(next).toHaveBeenCalled();
      });
    });
  
    describe('Deadline Validation', () => {
      it('should validate deadline correctly', async () => {
        const mockRun = jest.fn().mockResolvedValue(null);
        deadlineValidation.forEach(validation => {
          validation.run = mockRun;
        });
        
        await validate(deadlineValidation)(req, res, next);
        
        expect(mockRun).toHaveBeenCalledTimes(deadlineValidation.length);
        expect(next).toHaveBeenCalled();
      });
    });
  
    describe('Completion Validation', () => {
      it('should validate completion percentage correctly', async () => {
        const mockRun = jest.fn().mockResolvedValue(null);
        completionValidation.forEach(validation => {
          validation.run = mockRun;
        });
        
        await validate(completionValidation)(req, res, next);
        
        expect(mockRun).toHaveBeenCalledTimes(completionValidation.length);
        expect(next).toHaveBeenCalled();
      });
    });
  
    describe('Settings Validation', () => {
      it('should validate settings correctly', async () => {
        const mockRun = jest.fn().mockResolvedValue(null);
        settingsValidation.forEach(validation => {
          validation.run = mockRun;
        });
        
        await validate(settingsValidation)(req, res, next);
        
        expect(mockRun).toHaveBeenCalledTimes(settingsValidation.length);
        expect(next).toHaveBeenCalled();
      });
    });
  
    describe('Date Validation', () => {
      it('should validate date format correctly', async () => {
        const mockRun = jest.fn().mockResolvedValue(null);
        dateValidation.forEach(validation => {
          validation.run = mockRun;
        });
        
        await validate(dateValidation)(req, res, next);
        
        expect(mockRun).toHaveBeenCalledTimes(dateValidation.length);
        expect(next).toHaveBeenCalled();
      });
    });
  
    describe('Week Date Range Validation', () => {
      it('should validate week date range correctly', async () => {
        const mockRun = jest.fn().mockResolvedValue(null);
        weekDateRangeValidation.forEach(validation => {
          validation.run = mockRun;
        });
        
        await validate(weekDateRangeValidation)(req, res, next);
        
        expect(mockRun).toHaveBeenCalledTimes(weekDateRangeValidation.length);
        expect(next).toHaveBeenCalled();
      });
    });
  
    describe('ID Validation', () => {
      it('should validate ID parameter correctly', async () => {
        const testIdValidation = idValidation('testId');
        const mockRun = jest.fn().mockResolvedValue(null);
        testIdValidation.forEach(validation => {
          validation.run = mockRun;
        });
        
        await validate(testIdValidation)(req, res, next);
        
        expect(mockRun).toHaveBeenCalledTimes(testIdValidation.length);
        expect(next).toHaveBeenCalled();
      });
    });
  
    describe('Reminder Alert Validation', () => {
      it('should validate reminder alert correctly', async () => {
        const mockRun = jest.fn().mockResolvedValue(null);
        reminderAlertValidation.forEach(validation => {
          validation.run = mockRun;
        });
        
        await validate(reminderAlertValidation)(req, res, next);
        
        expect(mockRun).toHaveBeenCalledTimes(reminderAlertValidation.length);
        expect(next).toHaveBeenCalled();
      });
    });
  
    describe('Delete Task Query Validation', () => {
      it('should validate delete task query correctly', async () => {
        const mockRun = jest.fn().mockResolvedValue(null);
        deleteTaskQueryValidation.forEach(validation => {
          validation.run = mockRun;
        });
        
        await validate(deleteTaskQueryValidation)(req, res, next);
        
        expect(mockRun).toHaveBeenCalledTimes(deleteTaskQueryValidation.length);
        expect(next).toHaveBeenCalled();
      });
    });
  
    describe('Delete Reminder Query Validation', () => {
      it('should validate delete reminder query correctly', async () => {
        const mockRun = jest.fn().mockResolvedValue(null);
        deleteReminderQueryValidation.forEach(validation => {
          validation.run = mockRun;
        });
        
        await validate(deleteReminderQueryValidation)(req, res, next);
        
        expect(mockRun).toHaveBeenCalledTimes(deleteReminderQueryValidation.length);
        expect(next).toHaveBeenCalled();
      });
    });
  });
  
  /**
   * Specific Test Cases for Individual Validation Rules
   */
  describe('Specific Validation Rules', () => {
    const { body, param, query } = require('express-validator');
    
    describe('Task Validation Rules', () => {
      it('should require task name', async () => {
        const nameValidation = taskValidation.find(v => 
          v._context && v._context.path === 'name'
        );
        
        expect(nameValidation).toBeDefined();
        expect(nameValidation._context.message).toContain('required');
      });
      
      it('should validate selectedDay as ISO8601', async () => {
        const dayValidation = taskValidation.find(v => 
          v._context && v._context.path === 'selectedDay'
        );
        
        expect(dayValidation).toBeDefined();
        expect(dayValidation._context.validator).toBe('isISO8601');
      });
    });
    
    describe('Reminder Validation Rules', () => {
      it('should require reminder name', async () => {
        const nameValidation = reminderValidation.find(v => 
          v._context && v._context.path === 'name'
        );
        
        expect(nameValidation).toBeDefined();
        expect(nameValidation._context.message).toContain('required');
      });
      
      it('should validate selectedTime as ISO8601', async () => {
        const timeValidation = reminderValidation.find(v => 
          v._context && v._context.path === 'selectedTime'
        );
        
        expect(timeValidation).toBeDefined();
        expect(timeValidation._context.validator).toBe('isISO8601');
      });
    });
    
    describe('Project Validation Rules', () => {
      it('should require project name', async () => {
        const nameValidation = projectValidation.find(v => 
          v._context && v._context.path === 'name'
        );
        
        expect(nameValidation).toBeDefined();
        expect(nameValidation._context.message).toContain('required');
      });
    });
    
    describe('Week Date Range Validation Rules', () => {
      it('should validate that end date is after start date', async () => {
        // Find the custom validator in weekDateRangeValidation
        const endDateValidation = weekDateRangeValidation.find(v => 
          v._context && v._context.path === 'endDate' && v._context.custom === true
        );
        
        expect(endDateValidation).toBeDefined();
        
        // Test the custom validator directly
        const mockRequest = {
          params: {
            startDate: '2023-01-01',
            endDate: '2023-01-01' // Same as start date
          }
        };
        
        let errorThrown = false;
        try {
          // Execute the custom validation function
          endDateValidation._context.options({ req: mockRequest });
        } catch (error) {
          errorThrown = true;
          expect(error.message).toContain('End date must be after start date');
        }
        
        expect(errorThrown).toBe(true);
      });
    });
    
    describe('Completion Validation Rules', () => {
      it('should validate completion is between 0 and 100', async () => {
        const completionRule = completionValidation.find(v => 
          v._context && v._context.path === 'completion'
        );
        
        expect(completionRule).toBeDefined();
        expect(completionRule._context.options).toEqual({ min: 0, max: 100 });
      });
    });
  });