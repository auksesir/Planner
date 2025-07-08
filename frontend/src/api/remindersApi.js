// api/remindersApi.js
// All reminder-related API calls

import { apiDelete, apiGet, apiPost, apiPut, defaultApiErrorHandler, handleApiResponse } from '../utils/apiUtils';
import { formatDateForDB } from '../utils/timeUtils';

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3001/routes'
  : 'http://localhost:3001/routes';

/**
 * Reminder API operations
 * Handles all reminder-related CRUD operations and alert management
 * Includes proper date format conversions for backend compatibility
 */
export const remindersApi = {
  getReminderById: async (id) => {
    const response = await apiGet(`${API_BASE_URL}/reminders/id/${id}`);
    
    return handleApiResponse(
      response,
      (data) => ({
        ...data,
        selectedTime: new Date(data.selectedTime),
        selectedDay: data.selectedDay ? new Date(data.selectedDay) : null,
        repeatEndDay: data.repeatEndDay ? new Date(data.repeatEndDay) : null
      }),
      defaultApiErrorHandler
    );
  },
  
  getAllReminders: async () => {
    const response = await apiGet(`${API_BASE_URL}/reminders`);
    
    return handleApiResponse(
      response,
      (reminders) => {
        return reminders.map(reminder => ({
          ...reminder,
          selectedTime: new Date(reminder.selectedTime),
          selectedDay: reminder.selectedDay ? new Date(reminder.selectedDay) : null,
          repeatEndDay: reminder.repeatEndDay ? new Date(reminder.repeatEndDay) : null
        }));
      },
      defaultApiErrorHandler
    );
  },
  
  getRemindersForDay: async (date) => {
    try {
      // Use the date directly without any conversion
      const response = await apiGet(`${API_BASE_URL}/reminders/date/${date}`);
      
      return handleApiResponse(
        response,
        (reminders) => {
          // Make sure this is an array
          if (!Array.isArray(reminders)) {
            console.warn("Expected reminders array but got:", reminders);
            return [];
          }
          // Format all reminder times consistently - exactly like tasks
          return reminders.map(reminder => ({
            ...reminder,
            selectedTime: new Date(reminder.selectedTime),
            // Include any other fields that might be needed for display
            type: 'reminder' // Add a type identifier to help with rendering
          }));
        },
        (error) => {
          ("Error processing reminders:", error);
          return []; // Return empty array on error
        }
      );
    } catch (error) {
      ('Failed to fetch reminders for the day:', error);
      return []; // Return empty array for consistency
    }
  },
  
  getRemindersForWeek: async (startDate, endDate) => {
    try {
      const response = await apiGet(`${API_BASE_URL}/reminders/week/${startDate}/${endDate}`);
      
      return handleApiResponse(
        response,
        (reminders) => {
          // Convert dates to local Date objects
          return reminders.map(reminder => ({
            ...reminder,
            selectedTime: new Date(reminder.selectedTime),
            selectedDay: new Date(reminder.selectedDay),
            repeatEndDay: reminder.repeatEndDay ? new Date(reminder.repeatEndDay) : null
          }));
        },
        (error) => {
          ('Error fetching weekly reminders:', error);
          return []; // Return empty array on error for this specific API
        }
      );
    } catch (error) {
      ('Error fetching weekly reminders:', error);
      return []; // Return empty array in case of exception
    }
  },
  
  addReminder: async (reminder) => {
    try {
      const reminderToSend = {
        name: reminder.name,
        selectedDay: formatDateForDB(reminder.selectedDay),
        selectedTime: reminder.selectedTime instanceof Date ? 
          reminder.selectedTime.toISOString() : 
          reminder.selectedTime,
        repeatOption: reminder.repeatOption || null,
        repeatEndDay: reminder.repeatEndDay ? 
          formatDateForDB(reminder.repeatEndDay) : 
          null,
        originalStartDay: formatDateForDB(reminder.originalStartDay || reminder.selectedDay),
        currentDay: formatDateForDB(reminder.currentDay),
        selectedDayUI: formatDateForDB(reminder.selectedDayUI || reminder.selectedDay)
      };
      
      const response = await apiPost(`${API_BASE_URL}/reminders/add`, reminderToSend);
      
      return handleApiResponse(
        response,
        (data) => ({
          ...data,
          // Ensure all date fields are properly formatted
          selectedTime: new Date(data.selectedTime),
          selectedDay: new Date(data.selectedDay),
          repeatEndDay: data.repeatEndDay ? new Date(data.repeatEndDay) : null,
          originalStartDay: new Date(data.originalStartDay)
        }),
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to add reminder',
        originalError: error
      });
    }
  },
  
  updateReminder: async (id, reminder) => {
    try {
      const reminderToSend = {
        id: reminder.id,
        name: reminder.name,
        selectedDay: formatDateForDB(reminder.selectedDay),
        selectedTime: reminder.selectedTime instanceof Date ? 
          reminder.selectedTime.toISOString() : 
          reminder.selectedTime,
        repeatOption: reminder.repeatOption || null,
        repeatEndDay: reminder.repeatEndDay ? 
          formatDateForDB(reminder.repeatEndDay) : 
          null,
        originalStartDay: formatDateForDB(reminder.originalStartDay || reminder.selectedDay),
        currentDay: formatDateForDB(reminder.currentDay),
        selectedDayUI: formatDateForDB(reminder.selectedDayUI || reminder.selectedDay)
      };

      const response = await apiPut(`${API_BASE_URL}/reminders/id/${id}`, reminderToSend);
      
      return handleApiResponse(
        response,
        (data) => ({
          ...data,
          // Consistent date formatting with tasks
          selectedTime: new Date(data.selectedTime),
          selectedDay: new Date(data.selectedDay),
          repeatEndDay: data.repeatEndDay ? new Date(data.repeatEndDay) : null
        }),
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to update reminder',
        originalError: error
      });
    }
  },
  
  deleteReminder: async (id, deleteAll = false, date = null) => {
    try {
      const queryParams = new URLSearchParams({
        deleteAll: String(deleteAll),
        ...(date && { date: formatDateForDB(date) })
      });
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await apiDelete(`${API_BASE_URL}/reminders/id/${id}${queryString}`);
      
      return handleApiResponse(
        response,
        (data) => data,
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to delete reminder',
        originalError: error
      });
    }
  },
  
  getLatestReminder: async () => {
    try {
      const response = await apiGet(`${API_BASE_URL}/reminders/latest`);
      
      return handleApiResponse(
        response,
        (latestReminder) => ({
          ...latestReminder,
          selectedTime: new Date(latestReminder.selectedTime),
        }),
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to fetch latest reminder',
        originalError: error
      });
    }
  },
  
  setReminderAlert: async (id, reminderTime) => {
    try {
      const response = await apiPost(`${API_BASE_URL}/reminders/${id}/alert`, { 
        reminderTime: reminderTime instanceof Date ? reminderTime.toISOString() : reminderTime 
      });
      
      return handleApiResponse(
        response,
        (data) => data,
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to set reminder alert',
        originalError: error
      });
    }
  },
  
  clearReminderAlert: async (id) => {
    try {
      const response = await apiDelete(`${API_BASE_URL}/reminders/${id}/alert`);
      
      return handleApiResponse(
        response,
        (data) => data,
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to clear reminder alert',
        originalError: error
      });
    }
  }
};

// Legacy function names for backward compatibility
export const getReminderById = remindersApi.getReminderById;
export const getAllReminders = remindersApi.getAllReminders;
export const getRemindersForDay = remindersApi.getRemindersForDay;
export const getRemindersForWeek = remindersApi.getRemindersForWeek;
export const addReminder = remindersApi.addReminder;
export const updateReminder = remindersApi.updateReminder;
export const deleteReminder = remindersApi.deleteReminder;
export const getLatestReminder = remindersApi.getLatestReminder;
export const setReminderAlert = remindersApi.setReminderAlert;
export const clearReminderAlert = remindersApi.clearReminderAlert;
// Legacy aliases
export const setReminder = remindersApi.setReminderAlert;
export const clearReminder = remindersApi.clearReminderAlert;