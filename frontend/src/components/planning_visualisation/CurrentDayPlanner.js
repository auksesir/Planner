import { useEffect } from 'react';
import { connect, useDispatch } from 'react-redux';
import { setSelectedDayUI } from '../../redux/tasks/actions/selectedDayUIActions';
import DailyPlanner from './DailyPlanner';

/**
 * CurrentDayPlanner Component
 * 
 * A lightweight wrapper component that connects the DailyPlanner to Redux state
 * specifically for the current day. This component serves as a bridge between
 * global application state and the daily planning interface.
 * 
 * Key Responsibilities:
 * - Connects to Redux state for current day data (tasks, reminders, date)
 * - Updates the selected day UI state when the current day changes
 * - Passes through edit callbacks to enable task and reminder editing
 * - Provides proper context configuration for home page usage
 * 
 * This component is typically used on the home page to display today's schedule
 * and is distinguished from other DailyPlanner usages by the isCurrentDay=true prop.
 * 
 * @param {string} currentDay - Current date string from Redux state (YYYY-MM-DD format)
 * @param {Object} currentDayTasks - Tasks for the current day from Redux state (grouped by time slots)
 * @param {Object} currentDayReminders - Reminders for the current day from Redux state (grouped by time slots)
 * @param {Function} setTaskToEdit - Callback function to set a task for editing in parent component
 * @param {Function} setReminderToEdit - Callback function to set a reminder for editing in parent component
 */
const CurrentDayPlanner = ({ 
  currentDay, 
  currentDayTasks, 
  currentDayReminders, 
  setTaskToEdit,
  setReminderToEdit
}) => {
  const dispatch = useDispatch();

  // ==================== REDUX STATE SYNCHRONIZATION ====================
  
  /**
   * Update Selected Day UI State
   * 
   * Dispatches an action to update the selectedDayUI state in Redux whenever
   * the current day changes. This ensures that other parts of the application
   * are aware of which day is currently being viewed in the main interface.
   * 
   * This is particularly important for:
   * - Keeping navigation components in sync
   * - Maintaining proper highlighting in calendar views
   * - Ensuring consistent state across different planning components
   */
  useEffect(() => {
    dispatch(setSelectedDayUI(currentDay));
  }, [dispatch, currentDay]);

  // ==================== RENDER ====================

  return (
    <div>
      {/* 
        DailyPlanner Component Integration
        
        Renders the main DailyPlanner component with current day data and configuration:
        
        Props Explanation:
        - day: Current date string for display and data organization
        - tasks: Current day's tasks from Redux state (already grouped by time slots)
        - reminders: Current day's reminders from Redux state (already grouped by time slots)
        - isCurrentDay: Set to true to enable current-day-specific behaviors (e.g., real-time updates)
        - setTaskToEdit: Callback for editing tasks (passed through from parent)
        - setReminderToEdit: Callback for editing reminders (passed through from parent)
        - context: Set to "home" for styling and behavior specific to home page usage
      */}
      <DailyPlanner 
        day={currentDay} 
        tasks={currentDayTasks} 
        reminders={currentDayReminders} 
        isCurrentDay={true}                    // Enables current-day-specific features
        setTaskToEdit={setTaskToEdit}
        setReminderToEdit={setReminderToEdit} 
        context="home"                         // Context for home page styling/behavior
      />
    </div>
  );
};

// ==================== REDUX CONNECTION ====================

/**
 * Maps Redux State to Component Props
 * 
 * Connects the component to specific parts of the Redux store:
 * 
 * - currentDay: The current date string, typically updated by background processes
 * - currentDayTasks: Tasks for today, pre-organized and filtered by the Redux store
 * - currentDayReminders: Reminders for today, pre-organized and filtered by the Redux store
 * 
 * The tasks and reminders are expected to already be processed and grouped by time slots
 * in the Redux store, making this component a simple pass-through for current day data.
 * 
 * State Structure Expected:
 * - state.currentDay: string (YYYY-MM-DD)
 * - state.tasks: object (grouped by time slots)
 * - state.reminders: object (grouped by time slots)
 */
const mapStateToProps = (state) => ({
  currentDay: state.currentDay,                    // Current date from global state
  currentDayTasks: state.tasks,                    // Current day's tasks (grouped by time)
  currentDayReminders: state.reminders,           // Current day's reminders (grouped by time)
});

export default connect(mapStateToProps)(CurrentDayPlanner);