import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { createReminderToast } from '../../utils/sharedUtils';
import { parseDate } from '../../utils/timeUtils';

const ReminderScheduler = ({ items = [], onClearReminder }) => {
  const timeoutRef = useRef(null);
  const currentItemsRef = useRef(items);
  const triggeredReminders = useRef(new Set());
  
  const currentHour = useSelector(state => state.currentHour);
  
  
  
  
  
  
  // Helper function to determine if a reminder should trigger now
  const shouldTriggerReminderNow = useCallback((reminderTime, item) => {
    // Guard against undefined/null items or missing IDs
    if (!item || !item.id || !reminderTime) return false;
    
    const now = new Date();
    const parsedTime = parseDate(reminderTime);
    if (!parsedTime) return false;
    
    // Get ID for localStorage check
    const reminderKey = `reminder-triggered-${item.id}`;
    const storedTimestamp = localStorage.getItem(reminderKey);
    
    // If we have a stored timestamp for this reminder
    if (storedTimestamp) {
      const parsedStoredTimestamp = parseInt(storedTimestamp, 10);
      
      // If the stored timestamp matches the reminder time, it was already triggered
      if (Math.abs(parsedTime.getTime() - parsedStoredTimestamp) < 60000) {
        return false;
      }
    }
    
    // Check if reminder is within our window (now to 1 minute ago)
    const timeDiff = parsedTime.getTime() - now.getTime();
    const isWithinTimeWindow = (timeDiff <= 0 && timeDiff > -60000); // 1 minute window
    
    // If it's within the window, mark it as triggered immediately
    if (isWithinTimeWindow) {
      localStorage.setItem(reminderKey, parsedTime.getTime().toString());
    }
    
    return isWithinTimeWindow;
  }, []);
  
  // Clean up old triggered reminders at midnight
  useEffect(() => {
    // Simple cleanup function to run daily
    const cleanupOldReminders = () => {
      // Get all localStorage keys
      const allKeys = Object.keys(localStorage);
      
      // Find reminder keys that are older than today
      const today = new Date().setHours(0, 0, 0, 0);
      
      allKeys.forEach(key => {
        if (key.startsWith('reminder-triggered-')) {
          const timestamp = parseInt(localStorage.getItem(key), 10);
          
          // If stored date is from before today, remove it
          if (timestamp < today) {
            localStorage.removeItem(key);
          }
        }
      });
    };
    
    // Run cleanup on mount
    cleanupOldReminders();
    
    // Set up daily cleanup at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow - now;
    
    const midnightCleanup = setTimeout(() => {
      cleanupOldReminders();
    }, timeUntilMidnight);
    
    return () => clearTimeout(midnightCleanup);
  }, []);
  
  const getReminderOccurrenceId = (reminder) => {
    try {
      if (!reminder || !reminder.id) {
        ('Invalid reminder object for occurrence ID generation:', reminder);
        return `unknown-${new Date().toISOString().split('T')[0]}-0`;
      }
      
      let dateStr;
      
      // Handle different cases for getting the date string
      if (typeof reminder.selectedDay === 'string') {
        dateStr = reminder.selectedDay.split('T')[0];
      } else if (reminder.selectedTime) {
        // DEBUG: Log selectedTime parsing attempt
        
        const date = parseDate(reminder.selectedTime);
        
        dateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      } else if (reminder.reminderTime) {
        // DEBUG: Log reminderTime parsing attempt
        
        const date = parseDate(reminder.reminderTime);
        
        dateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      } else {
        dateStr = new Date().toISOString().split('T')[0];
      }
      
      // Add minutes to make the ID more specific (handles recurring daily reminders)
      const timeValue = reminder.type === 'task' ? reminder.reminderTime : reminder.selectedTime;
      const minutesValue = parseDate(timeValue)?.getMinutes() || 0;
      
      const occurrenceId = `${reminder.id}-${reminder.type}-${dateStr}-${minutesValue}`;
      
      return occurrenceId;
    } catch (error) {
      (`ERROR generating occurrence ID for [${reminder?.id}]:`, error);
      return `${reminder?.id || 'unknown'}-${reminder?.type || 'unknown'}-${new Date().toISOString().split('T')[0]}-0`;
    }
  };
  
  // Find reminders scheduled for the current hour
  const findHourlyReminders = useCallback(() => {
    if (!currentHour) return [];
    
    return items.filter(item => {
      // Guard against invalid items
      if (!item || !item.id) return false;
      
      // Type-specific time property
      const timeProperty = item.type === 'task' ? 'reminderTime' : 'selectedTime';
      const timeValue = item[timeProperty];
      
      // Skip items without a valid time
      if (!timeValue) {
        return false;
      }
      
      // Parse the time
      const reminderTime = parseDate(timeValue);
      
      if (!reminderTime) {
        (`Failed to parse ${item.type} time:`, timeValue);
        return false;
      }
      
      // IMPORTANT: Only include if it should trigger right now
      // Pass both the timeValue AND the item
      if (!shouldTriggerReminderNow(timeValue, item)) {
        return false;
      }
      
      // Then check if it's in the current hour
      const hours = reminderTime.getHours();
      const isPM = hours >= 12;
      const hour12 = hours % 12 || 12;
      const hourKey = `${hour12.toString().padStart(2, '0')}:00 ${isPM ? 'PM' : 'AM'}`;
      
      return hourKey === currentHour;
    });
  }, [currentHour, items, shouldTriggerReminderNow]);
  
  // Find the next upcoming reminders
  const findNextReminders = useCallback(() => {
    const now = new Date();
    let nextTime = Infinity;
    let nextReminders = [];
    
    
    items.forEach(item => {
      // Skip invalid items
      if (!item || !item.id) return;
      
      // DEBUG: Log each item check
      const itemType = item.type || 'unknown';
      const itemId = item.id || 'unknown';
      const itemName = item.name || 'unnamed';
      
      // Type-specific time property
      const timeProperty = item.type === 'task' ? 'reminderTime' : 'selectedTime';
      const timeValue = item[timeProperty];
      
      // Skip items without a valid time
      if (!timeValue) {
        return;
      }
      
      // Parse the time
      const reminderTime = parseDate(timeValue);
  
      if (!reminderTime) {
        (`Failed to parse time for ${itemName}:`, timeValue);
        return;
      }
  
      const timeUntilReminder = reminderTime.getTime() - now.getTime();
      
      
      // Only consider future reminders
      if (timeUntilReminder > 0) {
        if (timeUntilReminder < nextTime) {
          nextTime = timeUntilReminder;
          nextReminders = [item];
        } 
        else if (timeUntilReminder === nextTime) {
          nextReminders.push(item);
        }
      } else {
      }
    });
    
    // If no future reminders found, check again in 15 seconds (more frequent checks)
    if (nextReminders.length === 0) {
      nextTime = 15000; // 15 seconds instead of 60
    }
    
    return { nextTime, nextReminders };
  }, [items]);

  // Schedule the next reminder or handle hourly reminders
  const scheduleNextReminder = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const hourlyReminders = findHourlyReminders();
    if (hourlyReminders.length > 0) {
      
      const untriggeredReminders = hourlyReminders.filter(reminder => {
        if (!reminder || !reminder.id) return false;
        
        const occurrenceId = getReminderOccurrenceId(reminder);
        const alreadyTriggered = triggeredReminders.current.has(occurrenceId);
        return !alreadyTriggered;
      });
      
      
      untriggeredReminders.forEach(reminder => {
        const occurrenceId = getReminderOccurrenceId(reminder);
        
        triggeredReminders.current.add(occurrenceId);
        
        // Log the current triggered set
        
        createReminderToast(reminder, reminder.type, async () => {
          if (reminder.type === 'task' && onClearReminder) {
            try {
              await onClearReminder(reminder.id, reminder.type);
            } catch (error) {
              ('Error clearing task reminder:', error);
            }
          }
        });
      });
    }

    const { nextTime, nextReminders } = findNextReminders();
    currentItemsRef.current = items;

    if (nextReminders.length > 0) {
      
      // Add a small buffer (10ms) to the schedule time to prevent immediate re-triggering
      const scheduleTime = Math.max(1000, nextTime + 10);

      timeoutRef.current = setTimeout(() => {
        
        // Check if items reference is the same
        const itemsChanged = currentItemsRef.current !== items;
        
        if (!itemsChanged) {
          const untriggeredReminders = nextReminders.filter(reminder => {
            if (!reminder || !reminder.id) return false;
            
            const occurrenceId = getReminderOccurrenceId(reminder);
            return !triggeredReminders.current.has(occurrenceId);
          });
          
          
          untriggeredReminders.forEach(reminder => {
            const occurrenceId = getReminderOccurrenceId(reminder);
            triggeredReminders.current.add(occurrenceId);
            
            
            createReminderToast(reminder, reminder.type, async () => {
              if (reminder.type === 'task' && onClearReminder) {
                try {
                  await onClearReminder(reminder.id, reminder.type);
                } catch (error) {
                  ('Error clearing task reminder:', error);
                }
              }
            });
          });
        }
        
        // Schedule the next check regardless
        scheduleNextReminder();
      }, scheduleTime);
    } else {
      // If no specific reminders, check every 15 seconds (more frequent checks)
      timeoutRef.current = setTimeout(() => {
        scheduleNextReminder();
      }, 15000); // 15 seconds instead of 60 for more responsive reminders
    }
  }, [items, currentHour, findNextReminders, findHourlyReminders, onClearReminder]);

  // Reset triggered reminders when day changes
  useEffect(() => {
    const todayKey = new Date().toISOString().split('T')[0];
    const oldSize = triggeredReminders.current.size;
    
    
    // Keep only today's entries
    triggeredReminders.current = new Set(
      [...triggeredReminders.current].filter(id => id.includes(todayKey))
    );
    
    
    if (oldSize !== triggeredReminders.current.size) {
    }
  }, [currentHour]);

  // Schedule reminders whenever items or current hour changes
  useEffect(() => {
    
    currentItemsRef.current = items;
    
    // Log how many of each type we have
    const taskItems = items.filter(item => item && item.type === 'task').length;
    const taskWithReminders = items.filter(item => item && item.type === 'task' && item.reminderTime).length;
    const reminderItems = items.filter(item => item && item.type === 'reminder').length;
    
    
    // Check if we have any valid reminder times
    let hasValidReminderTimes = false;
    
    items.forEach(item => {
      if (!item) return;
      
      const timeValue = item.type === 'task' ? item.reminderTime : item.selectedTime;
      if (timeValue) {
        const parsed = parseDate(timeValue);
        if (parsed) hasValidReminderTimes = true;
      }
    });
    
    
    // Only schedule if we have valid reminder times
    if (hasValidReminderTimes) {
      scheduleNextReminder();
    } else {
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [items, currentHour, scheduleNextReminder]);

  return null;
};

export default ReminderScheduler;