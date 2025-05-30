// src/services/serviceFactory.js

const TaskService = require('./taskService');
const ReminderService = require('./reminderService');
const SettingsService = require('./settingsService');
const ProjectService = require('./projectService');
const PomodoroService = require('./pomodoroService');

/**
 * Service Factory
 * Centralizes the creation of service instances
 * Ensures services are only instantiated once
 */
class ServiceFactory {
  constructor(db) {
    // Validate database connection
    if (!db) {
      throw new Error('Database connection is required');
    }
    
    this.db = db;
    this.services = {};
  }

  /**
   * Get TaskService instance
   * @returns {TaskService} - Singleton TaskService instance
   */
  getTaskService() {
    if (!this.services.taskService) {
      this.services.taskService = new TaskService(this.db);
    }
    return this.services.taskService;
  }

  /**
   * Get ReminderService instance
   * @returns {ReminderService} - Singleton ReminderService instance
   */
  getReminderService() {
    if (!this.services.reminderService) {
      this.services.reminderService = new ReminderService(this.db);
    }
    return this.services.reminderService;
  }
  
  /**
   * Get SettingsService instance
   * @returns {SettingsService} - Singleton SettingsService instance
   */
  getSettingsService() {
    if (!this.services.settingsService) {
      this.services.settingsService = new SettingsService(this.db);
    }
    return this.services.settingsService;
  }

  /**
   * Get ProjectService instance
   * @returns {ProjectService} - Singleton ProjectService instance
   */
  getProjectService() {
    if (!this.services.projectService) {
      this.services.projectService = new ProjectService(this.db);
    }
    return this.services.projectService;
  }

  /**
   * Get PomodoroService instance
   * @returns {PomodoroService} - Singleton PomodoroService instance
   */
  getPomodoroService() {
    if (!this.services.pomodoroService) {
      this.services.pomodoroService = new PomodoroService(this.db);
    }
    return this.services.pomodoroService;
  }
}

module.exports = ServiceFactory;