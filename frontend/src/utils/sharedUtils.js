import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import { playNotificationSound } from './audioUtils';
import { parseDate } from './timeUtils';

const DATE_FORMAT = 'dd/MM/yyyy, HH:mm:ss';

/**
 * Safely parse and format dates for both tasks and reminders.
 * @param {Date|string|null} dateValue - The date to format
 * @returns {string|null} - Formatted date string or null if invalid
 */
export const formatDateTime = (dateValue) => {
  if (!dateValue) return null;
  try {
    let date;
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string') {
      date = dateValue.includes('T') ? new Date(dateValue) : parseISO(dateValue);
    } else {
      console.error('Invalid date value type:', typeof dateValue);
      return null;
    }

    if (isNaN(date.getTime())) {
      console.error('Invalid date created from:', dateValue);
      return null;
    }

    return format(date, DATE_FORMAT);
  } catch (error) {
    console.error('Date formatting error for value:', dateValue);
    return null;
  }
};

/**
 * Determines if data for a non-current day needs to be refetched from the server
 */
export const shouldRefetchDayView = (
  result,
  itemDate,
  today,
  selectedDayUI,
  isEditing,
  originalItemDate
) => {
  const repeatOnSelectedDay = result.repeatOnSelectedDay || 
                             result.repeatTaskOnSelectedDay || 
                             result.repeatReminderOnSelectedDay || 
                             false;
  
  const repeatOnCurrentDay = result.repeatOnCurrentDay || 
                            result.repeatTaskOnCurrentDay || 
                            result.repeatReminderOnCurrentDay || 
                            false;
  
  console.log('Checking refetch conditions:', {
    repeatOnSelectedDay,
    repeatOnCurrentDay,
    itemDate,
    today,
    selectedDayUI,
    isEditing,
    originalItemDate
  });

  return (
    // Refetch if item repeats on selected day
    repeatOnSelectedDay ||

    // Refetch if item repeats on current day and we're viewing today
    (repeatOnCurrentDay && today === selectedDayUI) ||
    
    // Refetch if item is on selected day but not today
    (itemDate === selectedDayUI && itemDate !== today) ||
    
    // Refetch if editing and dates changed
    (isEditing && itemDate !== selectedDayUI && originalItemDate !== today)
    
  );
};

export const doesItemFallOnCurrentDay = (reduxState, itemId) => {
  const timeSlots = Object.keys(reduxState);

  for (let i = 0; i < timeSlots.length; i++) {
    const itemsInTimeSlot = reduxState[timeSlots[i]];
    if (Array.isArray(itemsInTimeSlot) && itemsInTimeSlot.some(item => item.id === itemId)) {
      return true;
    }
  }

  return false;
};

/**
 * Creates a toast notification for a reminder with optional sound
 * @param {Object} item - The reminder or task item
 * @param {string} type - The type of item ('task' or 'reminder')
 * @param {Function} onClose - Callback function when toast is closed
 * @param {boolean} playSound - Whether to play a sound (default: true)
 */
export const createReminderToast = (item, type, onClose, playSound = true) => {
  // Handle different item types and fields
  let itemTime;
  let itemName = item.name || 'Reminder';
  
  if (type === 'task') {
    if (!item.reminderTime && !item.startTime) {
      console.error('Task has no valid times:', item);
      return;
    }
    itemTime = parseDate(item.reminderTime) || parseDate(item.startTime);
  } else {
    if (!item.selectedTime) {
      console.error('Reminder has no selectedTime:', item);
      return;
    }
    itemTime = parseDate(item.selectedTime);
  }

  if (!itemTime) {
    console.error(`Failed to parse time for ${type}:`, item);
    return;
  }

  // Check if reminder is in the past (more than 2 minutes ago)
  const now = new Date();
  const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
  
  // Important: Also check if it's in the future (to prevent triggering on reload)
  const tenSecondsInFuture = new Date(now.getTime() + 10 * 1000);
  
  // Skip past reminders and future reminders on page load
  if (itemTime < twoMinutesAgo || (itemTime > now && itemTime < tenSecondsInFuture)) {
    console.log(`Skipping toast for ${type}: ${itemName} (${itemTime.toLocaleString()})`);
    return;
  }

  // Create appropriate message based on item type
  const startTime = type === 'task' ? parseDate(item.startTime) : itemTime;
  const message = type === 'task'
    ? `Task Reminder: "${itemName}" starts at ${format(startTime, 'h:mm a')}`
    : `Reminder: "${itemName}"`;

  const toastId = `reminder-${item.id}`;

  // Don't show the same toast multiple times
  if (!toast.isActive(toastId)) {
    console.log(`Creating toast notification for ${type}: ${itemName}`);
    
    // Optionally play sound
    if (playSound) {
      playNotificationSound(type, 0.7).catch(error => {
        console.error('Error playing notification sound:', error);
      });
    }

    toast.info(message, {
      toastId,
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      closeButton: true,
      position: "top-right",
      className: "reminder-toast",
      onClose: () => {
        console.log(`Toast closed for ${type} [${item.id}]`);
        
        // For task reminders, always clear the reminder when the toast is closed
        if (type === 'task' && onClose) {
          console.log(`Executing clear callback for task reminder: ${item.id}`);
          onClose();
        } else if (onClose) {
          onClose();
        }
      }
    });
  }
};

export const scheduleReminder = (item, type, clearCallback) => {
  const reminderDateTime = type === 'task' 
    ? parseDate(item.reminderTime) 
    : parseDate(item.selectedTime);

  if (!reminderDateTime) {
    console.error('Invalid reminder date:', { reminderDateTime });
    return null;
  }

  const now = new Date();
  const timeUntilReminder = reminderDateTime.getTime() - now.getTime();

  if (timeUntilReminder > 0) {
    // Only schedule future reminders
    return setTimeout(() => {
      // Play sound when reminder is triggered
      playNotificationSound(type, 0.7)
        .then(() => {
          createReminderToast(item, type, () => {
            if (type === 'task' && clearCallback) {
              clearCallback(item.id);
            }
          }, false); // Don't play sound again in createReminderToast
        })
        .catch(error => {
          console.error('Error playing notification sound:', error);
          createReminderToast(item, type, () => {
            if (type === 'task' && clearCallback) {
              clearCallback(item.id);
            }
          }, false);
        });
    }, timeUntilReminder);
  } else {
    // For past reminders, log but don't trigger notifications
    console.log(`Skipping past reminder for ${item.name} (scheduled at ${reminderDateTime.toLocaleString()})`);
    return null;
  }
};