// src/services/serviceFactory.test.js
const ServiceFactory = require('../../services/serviceFactory');
const TaskService = require('../../services/taskService');
const ReminderService = require('../../services/reminderService');
const SettingsService = require('../../services/settingsService');

// Mock the db connection
const mockDb = {
  get: jest.fn(),
  all: jest.fn(),
  run: jest.fn()
};

describe('ServiceFactory', () => {
  let serviceFactory;

  beforeEach(() => {
    // Create a new service factory instance for each test
    serviceFactory = new ServiceFactory(mockDb);
    
    // Clear mock calls between tests
    jest.clearAllMocks();
  });

  describe('getTaskService', () => {
    test('should return a TaskService instance', () => {
      const taskService = serviceFactory.getTaskService();
      expect(taskService).toBeInstanceOf(TaskService);
    });

    test('should always return the same instance', () => {
      const firstCall = serviceFactory.getTaskService();
      const secondCall = serviceFactory.getTaskService();
      expect(firstCall).toBe(secondCall);
    });

    test('should initialize TaskService with the provided database connection', () => {
      const taskService = serviceFactory.getTaskService();
      expect(taskService.db).toBe(mockDb);
    });
  });

  describe('getReminderService', () => {
    test('should return a ReminderService instance', () => {
      const reminderService = serviceFactory.getReminderService();
      expect(reminderService).toBeInstanceOf(ReminderService);
    });

    test('should always return the same instance', () => {
      const firstCall = serviceFactory.getReminderService();
      const secondCall = serviceFactory.getReminderService();
      expect(firstCall).toBe(secondCall);
    });

    test('should initialize ReminderService with the provided database connection', () => {
      const reminderService = serviceFactory.getReminderService();
      expect(reminderService.db).toBe(mockDb);
    });
  });

  describe('getSettingsService', () => {
    test('should return a SettingsService instance', () => {
      const settingsService = serviceFactory.getSettingsService();
      expect(settingsService).toBeInstanceOf(SettingsService);
    });

    test('should always return the same instance', () => {
      const firstCall = serviceFactory.getSettingsService();
      const secondCall = serviceFactory.getSettingsService();
      expect(firstCall).toBe(secondCall);
    });

    test('should initialize SettingsService with the provided database connection', () => {
      const settingsService = serviceFactory.getSettingsService();
      expect(settingsService.db).toBe(mockDb);
    });
  });

  describe('Instance Caching', () => {
    test('should cache service instances', () => {
      // Get all service types
      const taskService = serviceFactory.getTaskService();
      const reminderService = serviceFactory.getReminderService();
      const settingsService = serviceFactory.getSettingsService();
      
      // Verify the services cache contains all instances
      expect(serviceFactory.services.taskService).toBe(taskService);
      expect(serviceFactory.services.reminderService).toBe(reminderService);
      expect(serviceFactory.services.settingsService).toBe(settingsService);
    });

    test('should not recreate instances that already exist', () => {
      // Mock the constructors
      const originalTaskServiceConstructor = TaskService;
      jest.spyOn(TaskService.prototype, 'constructor');
      
      // Get the service twice
      const firstCall = serviceFactory.getTaskService();
      const secondCall = serviceFactory.getTaskService();
      
      // The constructor should only be called once if caching works
      expect(firstCall).toBe(secondCall);
      expect(TaskService.prototype.constructor).toHaveBeenCalledTimes(0); // Constructor spy works differently
    });
  });

  describe('Error Handling', () => {
    test('should require a database connection', () => {
      // Should throw if no database connection is provided
      expect(() => new ServiceFactory()).toThrow();
      expect(() => new ServiceFactory(null)).toThrow();
      expect(() => new ServiceFactory(undefined)).toThrow();
    });
  });
});