
// utils/reminderUtils.js
import { format, isSameDay } from 'date-fns';
import { toast } from 'react-toastify';
import {
    addReminder,
    getLatestReminder,
    getRemindersForDay,
    updateReminder
} from '../api/api';
import { formatDateTime } from './sharedUtils';
import { formatHour } from './timeUtils';

/**
 * Handles adding or updating a reminder based on whether it's being edited or added for the first time.
 */
export const handleAddOrUpdateReminder = async (
  reminder, 
  repeatReminderOnCurrentDay, 
  reminderToEdit,
  addReminder,
  deleteReminder
) => {
  const safeParseDate = (dateStr, fieldName = 'unknown') => {
    try {
      // 1. Return valid Date objects as-is
      if (dateStr instanceof Date && !isNaN(dateStr)) {
        return dateStr;
      }
      
      // 2. Handle empty/undefined values
      if (!dateStr) return null;
      
      // 3. Handle DD/MM/YYYY format (from backend/storage)
      if (typeof dateStr === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('/');
        return new Date(`${year}-${month}-${day}T00:00:00`);
      }
      
      // 4. Handle DD/MM/YYYY, HH:mm:ss format (for times)
      if (typeof dateStr === 'string' && /^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}$/.test(dateStr)) {
        const [datePart, timePart] = dateStr.split(', ');
        const [day, month, year] = datePart.split('/');
        return new Date(`${year}-${month}-${day}T${timePart}`);
      }
      
      // 5. Default Date parsing
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate)) {
        return parsedDate;
      }
      
      (`Failed to parse ${fieldName}:`, dateStr);
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
    if (reminderToEdit) {
      const originalStartDay = safeParseDate(reminderToEdit.originalStartDay || reminderToEdit.selectedDay, 'originalStartDay');
      const repeatEndDay = reminderToEdit.repeatEndDay ? safeParseDate(reminderToEdit.repeatEndDay, 'repeatEndDay') : null;
      const originalDate = safeParseDate(reminderToEdit.selectedDay, 'selectedDay');
      const selectedDay = safeParseDate(reminder.selectedDay, 'reminder.selectedDay');

      if (!originalStartDay || !selectedDay) {
        ('CRITICAL: Invalid dates', {
          originalStartDay,
          selectedDay,
          originalStartDayInput: reminderToEdit.originalStartDay,
          selectedDayInput: reminder.selectedDay
        });
        throw new Error('Invalid date parsing');
      }

      const isWithinRepeatRange = (
        (originalStartDay <= today && (!repeatEndDay || today <= repeatEndDay)) ||
        isSameDay(originalStartDay, today) ||
        (repeatEndDay && isSameDay(repeatEndDay, today))
      );

      const shouldProcessReminder = 
        isSameDay(originalDate, today) || 
        repeatReminderOnCurrentDay ||
        (reminder.repeatOption === '' && reminderToEdit.repeatOption !== '' && isWithinRepeatRange);

      if (shouldProcessReminder) {
        const selectedTimeStr = safeConvertTime(reminderToEdit.selectedTime);

        try {
          deleteReminder({ 
            reminderId: reminderToEdit.id, 
            selectedTime: selectedTimeStr || reminderToEdit.selectedTime
          });
        } catch (deletionError) {
          ('Error during reminder deletion:', deletionError);
        }
      }

      if (isSameDay(selectedDay, today) || repeatReminderOnCurrentDay) {
        addReminderToCurrentDay(reminder, addReminder);
      }
    } else {
      if (isSameDay(safeParseDate(reminder.selectedDay), today) || repeatReminderOnCurrentDay) {
        addReminderToCurrentDay(reminder, addReminder);
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

const addReminderToCurrentDay = (reminder, addReminder) => {
  try {
    let selectedTimeDate = new Date(reminder.selectedTime);
    
    const selectedTimeHour = selectedTimeDate.getHours();

    // Fix: Ensure all Date objects are converted to strings
    const formattedReminder = {
      ...reminder,
      selectedDay: reminder.selectedDay instanceof Date 
        ? format(reminder.selectedDay, 'dd/MM/yyyy') 
        : reminder.selectedDay,
      originalStartDay: reminder.originalStartDay instanceof Date 
        ? format(reminder.originalStartDay, 'dd/MM/yyyy') 
        : reminder.originalStartDay,
      repeatEndDay: reminder.repeatEndDay instanceof Date 
        ? format(reminder.repeatEndDay, 'dd/MM/yyyy') 
        : reminder.repeatEndDay,
      currentDay: reminder.currentDay instanceof Date 
        ? format(reminder.currentDay, 'dd/MM/yyyy') 
        : reminder.currentDay,
      selectedTime: formatDateTime(selectedTimeDate)
    };

    // Get hour formatting
    const isPM = selectedTimeHour >= 12;
    const hourFormatted = `${formatHour(selectedTimeHour)}:00 ${isPM ? 'PM' : 'AM'}`;
    
    addReminder({ hour: hourFormatted, reminder: formattedReminder });
  } catch (error) {
    ('Error in addReminderToCurrentDay:', error);
  }
};

/**
 * Handles reminder submission (add or update) and retrieves the latest reminder.
 */
export const submitReminder = async (newReminder, isEditing, reminderToEdit) => {
  let result;
  let latestReminder;

  if (isEditing) {
    result = await updateReminder(newReminder.id, newReminder);
    latestReminder = newReminder;
  } else {
    result = await addReminder(newReminder);
    latestReminder = await getLatestReminder();
  }

  // Log the API response
  ('API response:', result);

  // Return the complete result with all flags
  return { 
    result: {
      message: result.message,
      success: result.success,
      warning: result.warning,
      repeatReminderOnCurrentDay: result.repeatReminderOnCurrentDay,
      repeatReminderOnSelectedDay: result.repeatReminderOnSelectedDay
    }, 
    latestReminder 
  };
};


// State update checker (matches taskUtils pattern)
export const shouldUpdateReduxState = (result, reminderDate, today, selectedDayUI, isEditing, originalReminderDate) => {
  return (
    result.repeatReminderOnSelectedDay ||
    ((reminderDate === selectedDayUI) && (reminderDate !== today)) ||
    (isEditing && (reminderDate !== selectedDayUI) && (originalReminderDate !== today))
  );
};

// Clear functions (matches taskUtils exactly)
export const clearForm = (setReminderState) => {
  setReminderState({
    reminderName: '',
    selectedDay: null,
    selectedTime: null,
    repeatOption: '',
    repeatEndDay: null
  });
};

export const clearInputField = (field, setReminderState) => {
  const fieldClearers = {
    reminderName: () => setReminderState(prev => ({ ...prev, reminderName: '' })),
    selectedDay: () => setReminderState(prev => ({ ...prev, selectedDay: null })),
    selectedTime: () => setReminderState(prev => ({ ...prev, selectedTime: null })),
    repeatOption: () => setReminderState(prev => ({ 
      ...prev, 
      repeatOption: '', 
      repeatEndDay: null 
    })),
    repeatEndDay: () => setReminderState(prev => ({ ...prev, repeatEndDay: null }))
  };

  if (fieldClearers[field]) fieldClearers[field]();
};

// Validation (matches taskUtils pattern)
export const validateRepeatEndDate = (repeatEndDay, selectedDay) => {
  if (!repeatEndDay || !selectedDay) return true;
  return new Date(repeatEndDay) >= new Date(selectedDay);
};

// Reminder scheduling (enhanced to match task patterns)
const reminderTimeouts = {};

export const scheduleReminder = (item) => {
  const itemId = item.id;
  const reminderTime = new Date(item.type === 'task' ? item.reminderTime : item.selectedTime);
  const now = new Date();
  const timeUntilReminder = reminderTime.getTime() - now.getTime();

  // Clear existing timeout
  if (reminderTimeouts[itemId]) {
    clearTimeout(reminderTimeouts[itemId]);
    delete reminderTimeouts[itemId];
  }

  // Only schedule future reminders, not past ones
  if (timeUntilReminder > 0) {
    reminderTimeouts[itemId] = setTimeout(() => {
      const message = item.type === 'task' 
        ? `Task Reminder: "${item.name}" starts at ${format(new Date(item.startTime), 'h:mm a')}`
        : `Reminder: "${item.name}" at ${format(reminderTime, 'h:mm a')}`;

      const toastId = `reminder-${itemId}`;
      
      // Dismiss existing toast if present
      toast.dismiss(toastId);

      toast.info(message, {
        toastId,
        autoClose: false,
        closeOnClick: false,
        draggable: true,
        closeButton: true,
        position: "top-right",
        className: "reminder-toast",
        onClose: () => {
          delete reminderTimeouts[itemId];
        }
      });
    }, timeUntilReminder);
  } else {
    // For past reminders, don't trigger anything
    (`Skipping past reminder: ${item.name} (${reminderTime.toLocaleString()})`);
  }
};

export const clearReminderNotification = (id) => {
  if (reminderTimeouts[id]) {
    clearTimeout(reminderTimeouts[id]);
    delete reminderTimeouts[id];
  }
  toast.dismiss(`reminder-${id}`);
};

export const clearAllReminderNotifications = () => {
  Object.keys(reminderTimeouts).forEach(id => {
    clearTimeout(reminderTimeouts[id]);
    toast.dismiss(`reminder-${id}`);
    delete reminderTimeouts[id];
  });
};

// Load reminders for day (matches taskUtils pattern)
export const loadRemindersForDay = async (date, dispatch) => {
  try {
    const remindersForDay = await getRemindersForDay(date);
    remindersForDay.forEach(reminder => {
      const selectedTime = new Date(reminder.selectedTime);
      const hour = selectedTime.getHours();
      const isPM = hour >= 12;
      const hourFormatted = `${formatHour(hour)}:00 ${isPM ? 'PM' : 'AM'}`;
      
      dispatch(addReminder({
        hour: hourFormatted,
        reminder: {
          ...reminder,
          selectedTime: formatDateTime(selectedTime),
          selectedDay: formatDateTime(reminder.selectedDay)
        }
      }));
    });
  } catch (error) {
    ('Error loading reminders:', {
      date,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};