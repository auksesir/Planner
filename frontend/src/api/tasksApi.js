// api/tasksApi.js
// All task-related API calls

import { apiDelete, apiGet, apiPost, apiPut, defaultApiErrorHandler, handleApiResponse } from '../utils/apiUtils';
import { formatDateForDB } from '../utils/timeUtils';

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3001/routes'
  : 'http://localhost:3001/routes';

/**
 * Task API operations
 * Handles all task-related CRUD operations and reminder management
 * Includes proper date format conversions for backend compatibility
 */
export const tasksApi = {
  getTaskById: async (id) => {
    const response = await apiGet(`${API_BASE_URL}/tasks/id/${id}`);
    
    return handleApiResponse(
      response,
      (data) => {
        // Format task times
        const startLocal = new Date(data.startTime);
        const endLocal = new Date(data.endTime);
        
        return {
          ...data,
          startTime: startLocal,
          endTime: endLocal,
          reminderTime: data.reminderTime ? new Date(data.reminderTime) : null,
          hasReminder: !!data.reminderTime
        };
      },
      defaultApiErrorHandler
    );
  },

  getAllTasks: async () => {
    const response = await apiGet(`${API_BASE_URL}/tasks`);
    
    return handleApiResponse(
      response,
      (tasks) => {
        return tasks.map(task => ({
          ...task,
          startTime: new Date(task.startTime),
          endTime: new Date(task.endTime),
          reminderTime: task.reminderTime ? new Date(task.reminderTime) : null,
          hasReminder: !!task.reminderTime
        }));
      },
      defaultApiErrorHandler
    );
  },

  getTasksForDay: async (date) => {
    try {
      const response = await apiGet(`${API_BASE_URL}/tasks/date/${date}`);
     
      return handleApiResponse(
        response,
        (tasks) => {
          // Format all task times consistently
          return tasks.map(task => ({
            ...task,
            startTime: new Date(task.startTime),
            endTime: new Date(task.endTime),
            reminderTime: task.reminderTime ? new Date(task.reminderTime) : null,
            hasReminder: !!task.reminderTime
          }));
        },
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to fetch tasks for the day',
        originalError: error
      });
    }
  },

  getTasksForWeek: async (startDate, endDate) => {
    try {
      const response = await apiGet(`${API_BASE_URL}/tasks/week/${startDate}/${endDate}`);
      
      return handleApiResponse(
        response,
        (tasks) => {
          // Convert dates to local Date objects
          return tasks.map(task => ({
            ...task,
            startTime: new Date(task.startTime),
            endTime: new Date(task.endTime),
            selectedDay: new Date(task.selectedDay),
            reminderTime: task.reminderTime ? new Date(task.reminderTime) : null
          }));
        },
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to fetch tasks for week',
        originalError: error
      });
    }
  },

  addTask: async (task) => {
    try {
      const formattedTask = {
        name: task.name,
        selectedDay: formatDateForDB(task.selectedDay),
        originalStartDay: formatDateForDB(task.originalStartDay || task.selectedDay),
        startTime: task.startTime instanceof Date ? task.startTime.toISOString() : task.startTime,
        endTime: task.endTime instanceof Date ? task.endTime.toISOString() : task.endTime,
        duration: task.duration,
        repeatOption: task.repeatOption || null,
        repeatEndDay: task.repeatEndDay ? 
          (task.repeatEndDay instanceof Date ? 
            formatDateForDB(task.repeatEndDay) : 
            formatDateForDB(task.repeatEndDay)
          ) : null,
        currentDay: formatDateForDB(task.currentDay),
        selectedDayUI: formatDateForDB(task.selectedDayUI || task.selectedDay)
      };

      const response = await apiPost(`${API_BASE_URL}/tasks/add`, formattedTask);
      // Special handling for task creation
      // Server might return a warning about overlaps, which isn't a true error
      if (!response.success && response.status === 409) {
        // Overlap warning - not a true error
        return {
          warning: response.error.message,
          message: null
        };
      }
      
      return handleApiResponse(
        response,
        (data) => data,
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to add task',
        originalError: error
      });
    }
  },

  updateTask: async (id, task) => {
    try {
      const taskToSend = {
        id: task.id,
        name: task.name,
        selectedDay: formatDateForDB(task.selectedDay),
        originalStartDay: formatDateForDB(task.originalStartDay || task.selectedDay),
        startTime: task.startTime instanceof Date ? 
          task.startTime.toISOString() : 
          task.startTime,
        endTime: task.endTime instanceof Date ? 
          task.endTime.toISOString() : 
          task.endTime,
        duration: task.duration,
        repeatOption: task.repeatOption || null,
        repeatEndDay: task.repeatEndDay ? 
          formatDateForDB(task.repeatEndDay) : null,
        currentDay: formatDateForDB(task.currentDay),
        selectedDayUI: formatDateForDB(task.selectedDayUI || task.selectedDay),
      };

      const response = await apiPut(`${API_BASE_URL}/tasks/id/${id}`, taskToSend);
      
      return handleApiResponse(
        response,
        (data) => data,
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to update task',
        originalError: error
      });
    }
  },

  deleteTask: async (id, deleteAll = false, date) => {
    try {
      const queryParams = new URLSearchParams({
        deleteAll: String(deleteAll),
        ...(date && { date })
      }).toString();
      
      const response = await apiDelete(`${API_BASE_URL}/tasks/id/${id}?${queryParams}`);
      
      return handleApiResponse(
        response,
        (data) => data,
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to delete task',
        originalError: error
      });
    }
  },

  getLatestTask: async () => {
    try {
      const response = await apiGet(`${API_BASE_URL}/tasks/latest`);
      
      return handleApiResponse(
        response,
        (latestTask) => ({
          ...latestTask,
          startTime: new Date(latestTask.startTime),
          endTime: new Date(latestTask.endTime),
          reminderTime: latestTask.reminderTime ? new Date(latestTask.reminderTime) : null,
          hasReminder: !!latestTask.reminderTime
        }),
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to fetch latest task',
        originalError: error
      });
    }
  },

  // Task Reminder Operations
  setTaskReminder: async (itemId, reminderTime) => {
    try {
      if (typeof itemId === 'object') {
        throw new Error('Invalid itemId provided');
      }
      
      const endpoint = `${API_BASE_URL}/tasks/${itemId}/reminder`;
      const response = await apiPost(endpoint, { reminderTime });
      
      return handleApiResponse(
        response,
        (data) => ({
          ...data,
          type: 'task'
        }),
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to set task reminder',
        originalError: error
      });
    }
  },

  clearTaskReminder: async (itemId) => {
    try {
      const endpoint = `${API_BASE_URL}/tasks/${itemId}/reminder`;
      const response = await apiDelete(endpoint);
      
      return handleApiResponse(
        response,
        (data) => data,
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to clear task reminder',
        originalError: error
      });
    }
  }
};

// Legacy function names for backward compatibility
export const getTaskById = tasksApi.getTaskById;
export const getAllTasks = tasksApi.getAllTasks;
export const getTasksForDay = tasksApi.getTasksForDay;
export const getTasksForWeek = tasksApi.getTasksForWeek;
export const addTask = tasksApi.addTask;
export const updateTask = tasksApi.updateTask;
export const deleteTask = tasksApi.deleteTask;
export const getLatestTask = tasksApi.getLatestTask;
export const setTaskReminder = tasksApi.setTaskReminder;
export const clearTaskReminder = tasksApi.clearTaskReminder;