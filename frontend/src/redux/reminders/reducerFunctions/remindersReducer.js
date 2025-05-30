import { format, parse } from 'date-fns';
import { ADD_REMINDER, CLEAR_ALL_REMINDERS, DELETE_REMINDER, UPDATE_REMINDER } from '../actions/remindersActionsTypes';

const initialState = {};

const DATE_FORMAT = 'dd/MM/yyyy, HH:mm:ss';

const parseDate = (dateString) => {
  try {
    return parse(dateString, DATE_FORMAT, new Date());
  } catch (error) {
    console.error(`Error parsing date: ${dateString}`, error);
    return new Date();
  }
};

const remindersReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_REMINDER: {
      const { hour, reminder } = action.payload;
      
      // Prevent duplicates
      const existingReminders = state[hour] || [];
      if (existingReminders.some(r => r.id === reminder.id)) {
        return state;
      }
    
      // Sort reminders within the time slot
      const sortedReminders = [
        ...existingReminders,
        reminder
      ].sort((a, b) => {
        // Use parseDate to properly parse the dates in consistent format
        const timeA = typeof a.selectedTime === 'string' ? parseDate(a.selectedTime) : a.selectedTime;
        const timeB = typeof b.selectedTime === 'string' ? parseDate(b.selectedTime) : b.selectedTime;
        return timeA - timeB;
      });
    
      return {
        ...state,
        [hour]: sortedReminders
      };
    }

    case UPDATE_REMINDER: {
      const reminder = action.payload;
      const reminderWithDates = {
        ...reminder,
        selectedDay: reminder.selectedDay,
        selectedTime: reminder.selectedTime,
        repeatEndDay: reminder.repeatEndDay ? 
          reminder.repeatEndDay : null,
        originalStartDay: reminder.originalStartDay,
        repeatOption: reminder.repeatOption || null
      };

      const newState = { ...state };
      
      // Remove from old time slot
      for (let hour in newState) {
        newState[hour] = newState[hour]?.filter(
          r => r.id !== reminderWithDates.id
        );
        
        if (newState[hour]?.length === 0) {
          delete newState[hour];
        }
      }
      
      // Parse the time properly to get the hour
      const selectedTimeDate = typeof reminderWithDates.selectedTime === 'string' ? 
        parseDate(reminderWithDates.selectedTime) : 
        new Date(reminderWithDates.selectedTime);
      
      const hour = format(selectedTimeDate, 'hh:00 aa');
      
      return {
        ...newState,
        [hour]: [
          ...(newState[hour] || []),
          reminderWithDates
        ].sort((a, b) => {
          // Use parseDate consistently here too
          const timeA = typeof a.selectedTime === 'string' ? parseDate(a.selectedTime) : new Date(a.selectedTime);
          const timeB = typeof b.selectedTime === 'string' ? parseDate(b.selectedTime) : new Date(b.selectedTime);
          return timeA - timeB;
        })
      };
    }

    case DELETE_REMINDER: {
      const { hour, reminderId } = action.payload;
      // Create a new state object
      const newState = { ...state };
      
      // Find and remove the reminder from all time slots
      Object.keys(newState).forEach(timeSlot => {
        newState[timeSlot] = newState[timeSlot].filter(
          reminder => reminder.id !== reminderId
        );
        
        // Remove empty time slots
        if (newState[timeSlot].length === 0) {
          delete newState[timeSlot];
        }
      });

      return newState;
    }

    case CLEAR_ALL_REMINDERS:
      return {};

    default:
      return state;
  }
};

export default remindersReducer;