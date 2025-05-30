// api/api.js
// Main API file - centralizes all API operations with improved error handling

// Import all API modules
import { pomodoroApi } from './pomodoroApi';
import { projectsApi } from './projectsApi';
import { remindersApi } from './remindersApi';
import { settingsApi } from './settingsApi';
import { tasksApi } from './tasksApi';

// Export all API modules for organized access
export {
    pomodoroApi, projectsApi, remindersApi, settingsApi, tasksApi
};

// Also export with shorter names for convenience
export const tasks = tasksApi;
export const reminders = remindersApi;
export const projects = projectsApi;
export const settings = settingsApi;
export const pomodoro = pomodoroApi;

// Legacy exports for backward compatibility
// Task API exports
export const {
  getTaskById,
  getAllTasks,
  getTasksForDay,
  getTasksForWeek,
  addTask,
  updateTask,
  deleteTask,
  getLatestTask,
  setTaskReminder,
  clearTaskReminder
} = tasksApi;

// Reminder API exports
export const {
  getReminderById,
  getAllReminders,
  getRemindersForDay,
  getRemindersForWeek,
  addReminder,
  updateReminder,
  deleteReminder,
  getLatestReminder,
  setReminderAlert,
  clearReminderAlert
} = remindersApi;

// Project API exports
export const {
  getAllProjects,
  createProject,
  getProjectWithNodes,
  updateProjectDeadline,
  deleteProject,
  addNode,
  addSubnode,
  updateNode,
  updateNodePosition,
  updateNodeCompletion,
  updateNodeDeadline,
  updateNodeParent,
  updateNodeSize,
  deleteNode,
  linkTaskToNode,
  linkTaskAsSubnode,
  linkReminderToNode
} = projectsApi;

// Settings API exports
export const {
  getUserSettings,
  updateUserSettings
} = settingsApi;

// Pomodoro API exports
export const {
  getPomodoroSettings,
  updatePomodoroSettings,
  recordPomodoroSession,
  getPomodoroSessions,
  deletePomodoroSession,
  getPomodoroStats
} = pomodoroApi;

// Legacy aliases for reminder operations
export const setReminder = setReminderAlert;
export const clearReminder = clearReminderAlert;

// Additional helper function for project operations
export const addNodeToProject = addNode;

/**
 * Centralized API health check
 * @returns {Promise<Object>} - Health status of all API endpoints
 */
export const checkApiHealth = async () => {
  const healthChecks = [];
  
  try {
    // Test each API module
    const checks = [
      { name: 'Tasks API', test: () => tasksApi.getAllTasks() },
      { name: 'Reminders API', test: () => remindersApi.getAllReminders() },
      { name: 'Projects API', test: () => projectsApi.getAllProjects() },
      { name: 'Settings API', test: () => settingsApi.getUserSettings() },
      { name: 'Pomodoro API', test: () => pomodoroApi.getSettings() }
    ];
    
    for (const check of checks) {
      try {
        await check.test();
        healthChecks.push({ name: check.name, status: 'healthy' });
      } catch (error) {
        healthChecks.push({ 
          name: check.name, 
          status: 'unhealthy', 
          error: error.message 
        });
      }
    }
    
    const allHealthy = healthChecks.every(check => check.status === 'healthy');
    
    return {
      overall: allHealthy ? 'healthy' : 'degraded',
      services: healthChecks,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      overall: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * USAGE EXAMPLES:
 * 
 * RECOMMENDED - Namespace imports for new code:
 * import * as API from './api/api';
 * const tasks = await API.tasks.getTasksForDay(new Date());
 * const projects = await API.projects.getAllProjects();
 * 
 * ALTERNATIVE - Import specific modules:
 * import { tasksApi, projectsApi } from './api/api';
 * const tasks = await tasksApi.getTasksForDay(new Date());
 * 
 * LEGACY - Your existing imports still work:
 * import { getTasksForDay, addTask } from './api/api';
 * const tasks = await getTasksForDay('2023-12-01');
 * 
 * BENEFITS OF NEW STRUCTURE:
 * 1. ✅ Consistent error handling with automatic toast notifications
 * 2. ✅ Automatic date format conversion
 * 3. ✅ Better TypeScript support
 * 4. ✅ Centralized API configuration
 * 5. ✅ Built-in retry logic and timeout handling
 * 6. ✅ Consistent success/error response format
 * 7. ✅ API health checking
 * 8. ✅ Complete backward compatibility
 */