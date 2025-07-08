import { format } from 'date-fns';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { Bell } from '../../icons/index';
import '../../styles/components/planning_utilities/TaskReminderIcon.css';

export default function TaskReminderIcon({ 
  taskId, 
  taskName, 
  taskStartTime, 
  hasReminder, 
  reminderTime,
  onSetReminder,
  onClearReminder,
  task // Add the full task object as a prop
}) {
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [minutes, setMinutes] = useState('');

  // Helper function to parse dates
  const parseDateString = (dateStr) => {
    try {
      // Handle "DD/MM/YYYY, HH:mm:ss" format explicitly
      if (typeof dateStr === 'string' && dateStr.includes(',')) {
        const [datePart, timePart] = dateStr.split(', ');
        const [day, month, year] = datePart.split('/').map(Number);
        const [hours, minutes, seconds] = timePart.split(':').map(Number);
        
        const date = new Date(year, month - 1, day, hours, minutes, seconds);
        return !isNaN(date.getTime()) ? date : null;
      }
      
      // Fallback to standard parsing
      const date = new Date(dateStr);
      return !isNaN(date.getTime()) ? date : null;
    } catch (error) {
      ('Date parsing error:', error);
      return null;
    }
  };

  // Determine if task has passed or started - FIXED FOR REPEATING TASKS
  const isTaskPassedOrStarted = () => {
    const taskStart = parseDateString(taskStartTime);
    
    if (!taskStart) {
      ('Failed to parse task start time:', taskStartTime);
      return true; // Conservatively hide the reminder if parsing fails
    }

    const now = new Date();

    // FOR REPEATING TASKS: Check if this is a repeating task
    if (task && task.repeatOption) {
      // For repeating tasks, we need to check if today's occurrence has started
      // Create a new date with today's date but the original task's time
      const todaysOccurrence = new Date();
      todaysOccurrence.setHours(taskStart.getHours());
      todaysOccurrence.setMinutes(taskStart.getMinutes());
      todaysOccurrence.setSeconds(taskStart.getSeconds());
      todaysOccurrence.setMilliseconds(0);
      
      // Only hide the reminder if today's occurrence has already started
      return now.getTime() >= todaysOccurrence.getTime();
    }

    // FOR NON-REPEATING TASKS: Use the original logic
    const taskStartDetails = {
      year: taskStart.getFullYear(),
      month: taskStart.getMonth(),
      date: taskStart.getDate(),
      hours: taskStart.getHours(),
      minutes: taskStart.getMinutes()
    };

    const nowDetails = {
      year: now.getFullYear(),
      month: now.getMonth(),
      date: now.getDate(),
      hours: now.getHours(),
      minutes: now.getMinutes()
    };

    const isSameDay = 
      taskStartDetails.year === nowDetails.year &&
      taskStartDetails.month === nowDetails.month &&
      taskStartDetails.date === nowDetails.date;

    const isBeforeCurrentTime = taskStart.getTime() < now.getTime();

    // Only consider the task "passed" if it's before the current time
    // AND not on the same day
    const shouldHideReminder = isBeforeCurrentTime && !isSameDay;

    return shouldHideReminder;
  };

  // Determine if reminder should be shown
  const showReminderIcon = () => {
    const canSetReminder = !isTaskPassedOrStarted();
    return canSetReminder;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const minutesNum = parseInt(minutes, 10);
    if (isNaN(minutesNum) || minutesNum <= 0) {
      toast.error('Please enter a valid number of minutes');
      return;
    }
  
    const taskStart = parseDateString(taskStartTime);
    if (!taskStart) {
      toast.error('Error processing task start time');
      return;
    }
  
    if (isTaskPassedOrStarted()) {
      toast.error('Cannot set reminder for a task that has already started or passed');
      return;
    }
  
    // FOR REPEATING TASKS: Calculate reminder time based on today's occurrence
    let reminderBaseTime;
    if (task && task.repeatOption) {
      // For repeating tasks, use today's occurrence
      reminderBaseTime = new Date();
      reminderBaseTime.setHours(taskStart.getHours());
      reminderBaseTime.setMinutes(taskStart.getMinutes());
      reminderBaseTime.setSeconds(taskStart.getSeconds());
      reminderBaseTime.setMilliseconds(0);
    } else {
      // For non-repeating tasks, use the original task start time
      reminderBaseTime = taskStart;
    }
  
    const newReminderTime = new Date(reminderBaseTime.getTime() - minutesNum * 60000);
    
    if (newReminderTime <= new Date()) {
      toast.error('Reminder time would be in the past. Please choose fewer minutes.');
      return;
    }
  
    const isoReminderTime = newReminderTime.toISOString();
    onSetReminder(taskId, isoReminderTime, 'task');
    setShowTimeInput(false);
    setMinutes('');
  };

  // Close input without setting reminder
  const handleCloseInput = () => {
    setShowTimeInput(false);
    setMinutes('');
  };

  // If reminder icon should not be shown, return null
  if (!showReminderIcon()) {
    return null;
  }

  return (
    <div className="reminder-icon-container">
      <div className="reminder-icon-group">
        <Bell
          size={16}
          className={`reminder-bell ${hasReminder ? 'reminder-bell-active' : 'reminder-bell-inactive'}`}
          onClick={() => setShowTimeInput(!showTimeInput)}
        />
        
        <div className="reminder-tooltip">
          {hasReminder ? (
            <>
              <div className="reminder-tooltip-content">
                <span>
                  {(() => {
                    try {
                      const reminderDate = parseDateString(reminderTime);
                      return reminderDate ? 
                        `Reminder set for ${format(reminderDate, 'h:mm a')}` :
                        'Reminder set';
                    } catch (error) {
                      return 'Reminder set';
                    }
                  })()}
                </span>
              </div>
              <div className="reminder-tooltip-delete">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearReminder(taskId);
                    setShowTimeInput(false);
                  }}
                  className="reminder-delete-button"
                >
                  Delete
                </button>
              </div>
            </>
          ) : (
            <div className="reminder-tooltip-content">
              <span>Click to set reminder</span>
            </div>
          )}
          <div className="reminder-tooltip-arrow"></div>
        </div>
      </div>

      {showTimeInput && !hasReminder && (
        <div className="reminder-input-container">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center">
              <input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="reminder-input mr-2"
                placeholder="Minutes before"
                min="1"
                autoFocus
              />
              <button type="submit" className="submit-button mr-2">
                Set
              </button>
              <button 
                type="button" 
                onClick={handleCloseInput}
                className="close-button"
              >
                ✖
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}