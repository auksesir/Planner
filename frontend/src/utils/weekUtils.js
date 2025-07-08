import { format } from 'date-fns';
import { getRemindersForWeek, getTasksForWeek } from '../api/api';

// Process and organize tasks by day with logging
export const organizeTasksByDay = (tasks) => {
  
  const organized = tasks.reduce((acc, task) => {
    const day = format(new Date(task.selectedDay), 'yyyy-MM-dd');
    
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(task);
    return acc;
  }, {});

  return organized;
};

// In weekUtils.js - Fix the organizeRemindersByDay function
export const organizeRemindersByDay = (reminders) => {
  
  const organized = reminders.reduce((acc, reminder) => {
    // Log the incoming reminder

    try {
      // Use the selectedDay property for organizing by day
      const reminderDate = new Date(reminder.selectedDay);
      if (isNaN(reminderDate.getTime())) {
        return acc;
      }
      
      const day = format(reminderDate, 'yyyy-MM-dd');

      if (!acc[day]) {
        acc[day] = [];
      }
      
      // Make sure we have valid times
      const reminderTime = reminder.selectedTime || reminder.time;
      if (!reminderTime) {
        return acc;
      }

      acc[day].push({
        ...reminder,
        selectedTime: reminderTime // Ensure selectedTime is always set
      });
    } catch (error) {
      ('Error processing reminder:', error, reminder);
    }

    return acc;
  }, {});

  // Log the final organized structure
  return organized;
};

// Fetch and process week data with enhanced error handling and logging
export const fetchWeekData = async (weekDays) => {
  try {    
    const startDate = format(weekDays[0], 'yyyy-MM-dd');
    const endDate = format(weekDays[6], 'yyyy-MM-dd');
    
    const [weekTasks, weekReminders] = await Promise.all([
      getTasksForWeek(startDate, endDate),
      getRemindersForWeek(startDate, endDate)
    ]);

    // Organize the data
    const organizedTasks = organizeTasksByDay(weekTasks);
    const organizedReminders = organizeRemindersByDay(weekReminders);

    return {
      tasks: organizedTasks,
      reminders: organizedReminders
    };
  } catch (error) {
    ('Error in fetchWeekData:', error);
    // Return empty objects instead of throwing to prevent UI crashes
    return {
      tasks: {},
      reminders: {}
    };
  }
};