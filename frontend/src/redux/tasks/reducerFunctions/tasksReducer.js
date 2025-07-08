import { compareAsc, format, getHours, parse } from 'date-fns';
import { ADD_TASK, CLEAR_ALL_TASKS, CLEAR_REMINDER, DELETE_TASK, SET_REMINDER } from '../actions/tasksActionsTypes';

const initialState = {};

const serializeTask = (task) => {
  const formatTimeToCustom = (date) => {
    if (date instanceof Date) {
      // Convert Date to "DD/MM/YYYY, HH:mm:ss" format
      return format(date, 'dd/MM/yyyy, HH:mm:ss');
    }
    return date; // Keep existing format if not a Date object
  };

  return {
    ...task,
    startTime: formatTimeToCustom(task.startTime),
    endTime: formatTimeToCustom(task.endTime),
    selectedDay: task.selectedDay,
    originalStartDay: task.originalStartDay,  
    repeatEndDay: task.repeatEndDay          
  };
};

const DATE_FORMAT = 'dd/MM/yyyy, HH:mm:ss';

const parseDate = (dateString) => {
  try {
    return parse(dateString, DATE_FORMAT, new Date());
  } catch (error) {
    (`Error parsing date: ${dateString}`, error);
    return new Date(); // Return current date as fallback
  }
};

const tasksReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_TASK: {
      const hour = action.payload.hour.hour;
      const task = serializeTask(action.payload.hour.task);
      
      // Prevent duplicate tasks in the same hour
      const existingTasks = state[hour] || [];
      const isDuplicate = existingTasks.some(t => t.id === task.id);
      
      if (isDuplicate) {
        return state;
      }
    
      const sortedTasks = [
        ...existingTasks,
        task
      ].sort((a, b) => {
        const startTimeA = parseDate(a.startTime);
        const startTimeB = parseDate(b.startTime);
        return compareAsc(startTimeA, startTimeB);
      });
    
      return {
        ...state,
        [hour]: sortedTasks,
      };
    }

    case CLEAR_ALL_TASKS:
      return {};

    case DELETE_TASK: {
      const { taskId, startTime, endTime } = action.payload;

      // Ensure we have string dates for processing
      const startTimeStr = startTime instanceof Date ? startTime.toISOString() : startTime;
      const endTimeStr = endTime instanceof Date ? endTime.toISOString() : endTime;

      const startDate = parseDate(startTime);
      const endDate = parseDate(endTime);
      
      const startHour = getHours(startDate);
      const endHour = getHours(endDate);

      const newState = { ...state };

      for (let hour = startHour; hour <= endHour; hour++) {
        const formattedHour = format(new Date().setHours(hour, 0, 0, 0), 'hh:00 aa');
        
        if (newState[formattedHour]) {
          newState[formattedHour] = newState[formattedHour].filter(task => task.id !== taskId);
          
          if (newState[formattedHour].length === 0) {
            delete newState[formattedHour];
          }
        }
      }

      return newState;
    }

    

    case SET_REMINDER: {
      const { taskId, reminderTime } = action.payload;
      const newState = { ...state };
      
      for (let hour in newState) {
        newState[hour] = newState[hour]?.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                // Store as ISO string
                reminderTime: reminderTime instanceof Date ? 
                  reminderTime.toISOString() : 
                  reminderTime,
                hasReminder: true
              }
            : task
        );
      }
      return newState;
    }

    case CLEAR_REMINDER: {
      const taskId = action.payload;
      const newState = { ...state };
      
      // Clear reminder for task in all time slots where it appears
      for (let hour in newState) {
        newState[hour] = newState[hour]?.map(task => 
          task.id === taskId 
            ? {
                ...task,
                reminderTime: null,
                hasReminder: false
              }
            : task
        );
      }
      return newState;
    }

    default:
      return state;
  }
};

export default tasksReducer;