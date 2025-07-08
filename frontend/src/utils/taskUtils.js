// utils/taskUtils.js
import { format, getHours, getMinutes, isAfter, isBefore, isSameDay, isSameHour, parseISO } from 'date-fns';
import { addTask, getLatestTask, getRemindersForDay, getTasksForDay, updateTask } from '../api/api';
import { addReminder } from '../redux/reminders/actions/remindersActions';
import { formatDateTime } from './sharedUtils';
import { formatHour } from './timeUtils';

/**
 * Handles adding or updating a task based on whether it's being edited or added for the first time.
 */
export const handleAddOrUpdateTask = async (
  task, 
  repeatTaskOnCurrentDay, 
  taskToEdit,
  addTask,
  deleteTask
) => {
  const safeParseDate = (dateStr, fieldName = 'unknown') => {
    try {
      if (dateStr instanceof Date && !isNaN(dateStr)) {
        return dateStr;
      }
      
      if (typeof dateStr === 'string') {
        const parsedDate = new Date(dateStr);
        
        if (isNaN(parsedDate)) {
          (`Failed to parse ${fieldName}:`, dateStr);
          return null;
        }
        
        return parsedDate;
      }
      
      return null;
    } catch (error) {
      (`Parsing error for ${fieldName}:`, error);
      return null;
    }
  };

  const safeConvertTime = (timeStr) => {
    try {
      if (/^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}$/.test(timeStr)) {
        return timeStr;
      }

      const time = new Date(timeStr);
      
      if (isNaN(time)) {
        ('Invalid time value:', timeStr);
        return null;
      }

      return format(time, 'dd/MM/yyyy, HH:mm:ss');
    } catch (error) {
      ('Time conversion error:', {
        input: timeStr,
        error: error.message,
        stack: error.stack
      });
      return null;
    }
  };

  const today = new Date();

  try {
    if (taskToEdit) {
      const originalStartDay = safeParseDate(taskToEdit.originalStartDay, 'originalStartDay');
      const repeatEndDay = taskToEdit.repeatEndDay ? safeParseDate(taskToEdit.repeatEndDay, 'repeatEndDay') : null;
      const originalDate = safeParseDate(taskToEdit.selectedDay, 'selectedDay');
      const selectedDay = safeParseDate(task.selectedDay, 'task.selectedDay');

      if (!originalStartDay || !selectedDay) {
        ('CRITICAL: Invalid dates', {
          originalStartDay,
          selectedDay,
          originalStartDayInput: taskToEdit.originalStartDay,
          selectedDayInput: task.selectedDay
        });
        throw new Error('Invalid date parsing');
      }

      const isWithinRepeatRange = (
        (originalStartDay <= today && (!repeatEndDay || today <= repeatEndDay)) ||
        isSameDay(originalStartDay, today) ||
        (repeatEndDay && isSameDay(repeatEndDay, today))
      );

      const shouldProcessTask = 
        isSameDay(originalDate, today) || 
        repeatTaskOnCurrentDay ||
        (task.repeatOption === '' && taskToEdit.repeatOption !== '' && isWithinRepeatRange);

      if (shouldProcessTask) {
        const startTimeStr = safeConvertTime(taskToEdit.startTime);
        const endTimeStr = safeConvertTime(taskToEdit.endTime);

        try {
          deleteTask({ 
            taskId: task.id, 
            startTime: startTimeStr || taskToEdit.startTime,
            endTime: endTimeStr || taskToEdit.endTime
          });
        } catch (deletionError) {
          ('Error during task deletion:', deletionError);
        }
      }

      if (isSameDay(selectedDay, today) || repeatTaskOnCurrentDay) {
        addTaskToCurrentDay(task, addTask);
      }
    } else {
      if (isSameDay(safeParseDate(task.selectedDay), today) || repeatTaskOnCurrentDay) {
        addTaskToCurrentDay(task, addTask);
      }
    }

  } catch (error) {
    ('COMPLETE ERROR DETAILS:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
};

const addTaskToCurrentDay = (task, addTask) => {
  try {
    let startDate = new Date(task.startTime);
    let endDate = new Date(task.endTime);
    
    const startHour = startDate.getHours();
    const endHour = endDate.getHours();
    const endMinutes = endDate.getMinutes();

    // Fix: Ensure all Date objects are converted to strings
    const formattedTask = {
      ...task,
      selectedDay: task.selectedDay instanceof Date 
        ? format(task.selectedDay, 'yyyy-MM-dd') 
        : task.selectedDay,
      originalStartDay: task.originalStartDay instanceof Date 
        ? format(task.originalStartDay, 'yyyy-MM-dd') 
        : task.originalStartDay,
      repeatEndDay: task.repeatEndDay instanceof Date 
        ? format(task.repeatEndDay, 'yyyy-MM-dd') 
        : task.repeatEndDay,
      currentDay: task.currentDay instanceof Date 
        ? format(task.currentDay, 'yyyy-MM-dd') 
        : task.currentDay,
      startTime: formatDateTime(startDate),
      endTime: formatDateTime(endDate)
    };

    // Rest of the function remains the same
    if (startHour === endHour - 1 && endMinutes === 0) {
      const hourFormatted = `${formatHour(startHour)}:00 ${startHour >= 12 ? 'PM' : 'AM'}`;
      addTask({ hour: hourFormatted, task: formattedTask });
    } else {
      for (let hour = startHour; hour <= endHour; hour++) {
        if (hour === endHour && endMinutes === 0) continue;
        const hourFormatted = `${formatHour(hour)}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
        addTask({ hour: hourFormatted, task: formattedTask });
      }
    }
  } catch (error) {
    ('Error in addTaskToCurrentDay:', error);
  }
};

/**
 * Checks if a task with the selectedTaskId is scheduled on the current day.
 */
export const doesTaskFallOnCurrentDay = (reduxTasks, selectedTaskId) => {
  const timeSlots = Object.keys(reduxTasks);

  for (let i = 0; i < timeSlots.length; i++) {
    const tasksInTimeSlot = reduxTasks[timeSlots[i]];
    if (tasksInTimeSlot.some(task => task.id === selectedTaskId)) {
      return true;
    }
  }

  return false;
};

/**
 * Checks if a task is already present in the Redux state.
 * @param {Object} task - The task to check.
 * @param {Object} tasks - The current state of tasks in Redux.
 * @returns {boolean} - True if the task is already in the state, false otherwise.
 */
export const isTaskInRedux = (task, tasks) => {
  const taskStart = parseISO(task.startTime);
  const taskEnd = parseISO(task.endTime);

  for (let hour in tasks) {
    if (Array.isArray(tasks[hour])) {
      const hourStart = parseISO(`${task.selectedDay.split('T')[0]}T${hour.split(' ')[0]}:00`);
      const hourEnd = parseISO(`${task.selectedDay.split('T')[0]}T${hour.split(' ')[0]}:59`);

      if ((isBefore(taskStart, hourEnd) || isSameHour(taskStart, hourEnd)) &&
          (isAfter(taskEnd, hourStart) || isSameHour(taskEnd, hourStart))) {
        if (tasks[hour].some(t => t.id === task.id)) return true;
      }
    }
  }

  if (tasks.repeatingTasks) {
    return tasks.repeatingTasks.some(t => 
      t.id === task.id &&
      t.startTime === task.startTime &&
      t.endTime === task.endTime
    );
  }

  return false;
};


/**
 * Handles task submission (add or update) and retrieves the latest task.
 */
export const submitTask = async (newTask, isEditing, taskToEdit) => {
  let result;
  let latestTask;

  if (isEditing) {
    result = await updateTask(newTask.id, newTask);
    latestTask = newTask;
  } else {
    result = await addTask(newTask);
    latestTask = await getLatestTask();
  }

  // Log the API response
  ('API response:', result);

  // Return the complete result with all flags
  return { 
    result: {
      message: result.message,
      success: result.success,
      warning: result.warning,
      repeatTaskOnCurrentDay: result.repeatTaskOnCurrentDay,
      repeatTaskOnSelectedDay: result.repeatTaskOnSelectedDay
    }, 
    latestTask 
  };
};


/**
 * Clears all form fields.
 */
export const clearForm = (setTaskState) => {
  setTaskState({
    taskName: '',
    selectedDay: null,
    startTime: null,
    endTime: null,
    selectedDuration: '',
    repeatOption: '',
    repeatEndDay: null,
  });
};

/**
 * Clears specific fields in the task form state.
 */
export const clearInputField = (field, setTaskState) => {
  const fieldClearers = {
    taskName: () => setTaskState((prev) => ({ ...prev, taskName: '' })),
    selectedDay: () => setTaskState((prev) => ({ ...prev, selectedDay: null })),
    startTime: () => setTaskState((prev) => ({ ...prev, startTime: null })),
    endTime: () => setTaskState((prev) => ({ ...prev, endTime: null })),
    selectedDuration: () => setTaskState((prev) => ({ ...prev, selectedDuration: '' })),
    repeatOption: () => setTaskState((prev) => ({ ...prev, repeatOption: '' })),
    repeatEndDay: () => setTaskState((prev) => ({ ...prev, repeatEndDay: null })),
  };

  if (fieldClearers[field]) fieldClearers[field]();
};

/**
 * Function to check if an item is the current task.
 */
export const isCurrentTask = (item, currentTask) => {
  return currentTask
    ? item.startTime === currentTask.startTime && item.endTime === currentTask.endTime
    : false;
};

/**
 * Serializes a task for consistent formatting across the app.
 */
export const serializeTask = (task) => {
  return {
    ...task,
    startTime: formatDateTime(task.startTime),
    endTime: formatDateTime(task.endTime),
  };
};

/**
 * Dispatches a task with proper formatting for the selected day.
 */
export const handleTaskForDay = (task, dispatch, addTask) => {
  const formattedTask = {
    ...task,
    startTime: formatDateTime(task.startTime),
    endTime: formatDateTime(task.endTime)
  };

  const startDate = new Date(task.startTime);
  const startHour = startDate.getHours();
  const isPM = startHour >= 12;
  const hourFormatted = `${(startHour % 12 || 12).toString().padStart(2, '0')}:00 ${isPM ? 'PM' : 'AM'}`;

  dispatch(addTask({ hour: hourFormatted, task: formattedTask }));
};

/**
 * Loads tasks and reminders for a given day and dispatches them to Redux.
 */
export const loadTasksAndReminders = async (date, dispatch) => {
  try {
    const tasksForDay = await getTasksForDay(date);
    tasksForDay.forEach(task => {
      const startDate = new Date(task.startTime);
      const endDate = new Date(task.endTime);
      const startHour = getHours(startDate);
      const endHour = getHours(endDate);
      const endMinutes = getMinutes(endDate);

      const formattedTask = {
        ...task,
        startTime: formatDateTime(startDate),
        endTime: formatDateTime(endDate)
      };

      if (startHour === endHour - 1 && endMinutes === 0) {
        const isPM = startHour >= 12;
        const hourFormatted = `${formatHour(startHour)}:00 ${isPM ? 'PM' : 'AM'}`;
        dispatch(addTask({ hour: hourFormatted, task: formattedTask }));
      } else {
        for (let hour = startHour; hour <= endHour; hour++) {
          if (hour === endHour && endMinutes === 0) continue;
          const isPM = hour >= 12;
          const hourFormatted = `${formatHour(hour)}:00 ${isPM ? 'PM' : 'AM'}`;
          dispatch(addTask({ hour: hourFormatted, task: formattedTask }));
        }
      }
    });

    const remindersForDay = await getRemindersForDay(date);
    remindersForDay.forEach(reminder => dispatch(addReminder(reminder)));
  } catch (error) {
    ('Error loading tasks and reminders:', error.message);
  }
};
