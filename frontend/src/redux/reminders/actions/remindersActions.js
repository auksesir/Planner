import {
  ADD_REMINDER,
  CLEAR_ALL_REMINDERS,
  DELETE_REMINDER,
  UPDATE_REMINDER
} from './remindersActionsTypes';

// General reminder actions
export const addReminder = (reminder) => ({
  type: ADD_REMINDER,
  payload: reminder
});

export const updateReminder = (reminder) => ({
  type: UPDATE_REMINDER,
  payload: reminder
});

export const deleteReminder = (reminderInfo) => ({
  type: DELETE_REMINDER,
  payload: reminderInfo
});

export const clearAllReminders = () => ({
  type: CLEAR_ALL_REMINDERS
});
