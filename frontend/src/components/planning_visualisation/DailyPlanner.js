import { format } from 'date-fns';
import React, { useCallback, useEffect, useState } from 'react';
import { connect, useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  clearTaskReminder,
  deleteReminder,
  deleteTask,
  getRemindersForDay,
  getTasksForDay,
  setTaskReminder
} from '../../api/api';
import { deleteReminder as deleteReminderAction } from '../../redux/reminders/actions/remindersActions';
import { setSelectedDayFlag } from '../../redux/tasks/actions/dailyPlannerFlagActions';
import {
  clearReminder as clearTaskReminderAction,
  deleteTask as deleteTaskAction,
  setReminder as setTaskReminderAction
} from '../../redux/tasks/actions/tasksActions';
import '../../styles/components/planning_visualisation/DailyPlanner.css';
import { doesItemFallOnCurrentDay } from '../../utils/sharedUtils';
import { formatTimeForRedux, groupItemsByTimeSlot } from '../../utils/timeUtils';
import DeleteTaskModal from '../planning_utilities/DeleteTaskModal';
import TimeSlot from './TimeSlot';

/**
 * DailyPlanner Component
 * 
 * A comprehensive daily planning interface that displays tasks and reminders organized by time slots.
 * Supports viewing, editing, deleting, and setting reminders for both current and selected days.
 * 
 * Features:
 * - Time-based organization of tasks and reminders
 * - Real-time data fetching and synchronization
 * - Modal-based deletion with support for recurring items
 * - Reminder management (set/clear)
 * - Customizable time slot display based on user settings
 * - Integration with Redux for state management
 */
const DailyPlanner = ({ 
  day,                    // Selected day to display (YYYY-MM-DD format)
  tasks = {},            // Tasks data from props (used for current day)
  reminders = {},        // Reminders data from props (used for current day)
  currentDay,            // Current day from Redux state
  currentHour,           // Current hour from Redux state
  currentTask,           // Currently active/highlighted task
  isCurrentDay,          // Boolean indicating if viewing current day
  selectedDayFlag,       // Redux flag to trigger data refresh
  selectedDayUI,         // UI state for selected day
  setTaskToEdit,         // Callback to set task for editing
  setReminderToEdit,     // Callback to set reminder for editing
  context = 'default'    // Context for styling/behavior variations
}) => {
  // ==================== LOCAL STATE ====================
  
  // Fetched data for non-current days
  const [fetchedTasks, setFetchedTasks] = useState({});
  const [fetchedReminders, setFetchedReminders] = useState({});
  
  // Modal and selection state for deletion
  const [selectedItemId, setSelectedItemId] = useState(null);        // ID of item to delete
  const [selectedItem, setSelectedItem] = useState(null);            // Full item object to delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Modal visibility
  const [isRepeatingItem, setIsRepeatingItem] = useState(false);     // Whether item has repeat pattern
  const [itemType, setItemType] = useState(null);                    // 'task' or 'reminder'
  
  // ==================== REDUX HOOKS ====================
  
  const dispatch = useDispatch();
  
  // User settings for time display preferences
  const settings = useSelector(state => state.settings || {
    startHour: '12:00 AM',    // Start of visible time range
    endHour: '11:00 PM',      // End of visible time range
    hiddenHours: []           // Hours to hide from display
  });
  
  // Redux state for tasks and reminders (used for current day logic)
  const reduxTasks = useSelector(state => state.tasks || {});
  const reduxReminders = useSelector(state => state.reminders || {}); 

  // ==================== DATA FETCHING ====================
  
  /**
   * Fetches tasks and reminders for the specified day from the API
   * Groups them by time slots for efficient rendering
   */
  const fetchTasksAndReminders = useCallback(async () => {
    if (!day) return;
    
    try {
      // Fetch and group tasks by time slots
      const tasksForDay = await getTasksForDay(day);
      const groupedTasks = groupItemsByTimeSlot(tasksForDay || [], 'startTime', 'endTime');
      setFetchedTasks(groupedTasks);

      // Fetch and group reminders by time slots
      const remindersForDay = await getRemindersForDay(day);
      const groupedReminders = groupItemsByTimeSlot(remindersForDay || [], 'selectedTime', 'selectedTime');
      setFetchedReminders(groupedReminders);
    } catch (error) {
      console.error('[Frontend] Error fetching tasks:', error);
    }
  }, [day]);
  
  // Fetch data when component mounts or day changes
  useEffect(() => {
    fetchTasksAndReminders();
  }, [day, fetchTasksAndReminders]);
  
  // Fetch data when dailyPlannerFlag is set (triggered by external updates)
  useEffect(() => {
    if (selectedDayFlag) {
      fetchTasksAndReminders();
      dispatch(setSelectedDayFlag(false)); // Reset flag immediately after use
    }
  }, [selectedDayFlag, fetchTasksAndReminders, dispatch]);

  // ==================== REMINDER MANAGEMENT ====================
  
  /**
   * Sets a reminder for a task at the specified time
   * Only works for tasks (not reminder items)
   */
  const handleSetReminder = async (itemId, reminderTime, itemType = 'task') => {
    if (itemType !== 'task') return;

    try {
      const result = await setTaskReminder(itemId, reminderTime, itemType);
      
      if (result.success) {
        // Update Redux state
        dispatch(setTaskReminderAction({ 
          taskId: itemId, 
          reminderTime,
          task: result.task 
        }));
        
        toast.success('Reminder set successfully', {
          position: "top-center",
        });
  
        // Refresh data to show updated state
        await fetchTasksAndReminders();
      }
    } catch (error) {
      console.error('Error setting reminder:', error);
      toast.error('Failed to set reminder. Please try again.', {
        position: "top-center",
      });
    }
  };

  /**
   * Clears/removes a reminder from a task
   * Only works for tasks (not reminder items)
   */
  const handleClearReminder = async (itemId, type = 'task') => {
    if (type !== 'task') return;

    try {
      const result = await clearTaskReminder(itemId, type);
      
      if (result.success) {
        if (type === 'task') {
          dispatch(clearTaskReminderAction(itemId));
        }

        toast.success('Reminder cleared successfully', {
          position: "top-center",
        });

        // Refresh data to show updated state
        await fetchTasksAndReminders();
      }
    } catch (error) {
      console.error('Error clearing reminder:', error);
      toast.error('Failed to clear reminder. Please try again.', {
        position: "top-center",
      });
    }
  };  

  // ==================== MODAL MANAGEMENT ====================
  
  /**
   * Opens the delete confirmation modal with item details
   */
  const openDeleteModal = (id, item, type) => {
    setSelectedItemId(id);
    setSelectedItem(item);
    setItemType(type);
    setIsRepeatingItem(!!item.repeatOption); // Check if item has repeat settings
    setIsDeleteModalOpen(true);
  };

  /**
   * Closes the delete modal and resets related state
   */
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedItem(null);
    setSelectedItemId(null);
    setItemType(null);
    setIsRepeatingItem(false);
  };

  /**
   * Opens the appropriate edit interface for tasks or reminders
   */
  const openEditTask = (item) => {
    if (item.type === 'reminder') {
      if (typeof setReminderToEdit === 'function') {
        setReminderToEdit(item);
      }
    } else {
      if (typeof setTaskToEdit === 'function') {
        setTaskToEdit(item);
      }
    }
  };

  // ==================== DELETION LOGIC ====================
  
  /**
   * Confirms and executes the deletion of a task or reminder
   * 
   * @param {boolean} deleteAll - Whether to delete all instances (for repeating items) or just one
   */
  const confirmDelete = async (deleteAll = false) => {
    if (selectedItemId !== null && selectedItem !== null) {
      try {
        // Determine the date for deletion context
        const selectedDate = selectedItem.selectedDay || 
          (selectedItem.startTime ? new Date(selectedItem.startTime).toISOString().split('T')[0] : 
          format(new Date(), 'yyyy-MM-dd'));     
        
        let result;
        
        if (itemType === 'task') {
          // Handle task deletion
          result = await deleteTask(selectedItemId, deleteAll, selectedDate);
          
          // Update Redux state if deleting from current day or all instances
          if (isCurrentDay || (deleteAll && doesItemFallOnCurrentDay(reduxTasks, selectedItemId))) {
            dispatch(deleteTaskAction({ 
              taskId: selectedItemId, 
              startTime: formatTimeForRedux(selectedItem.startTime),
              endTime: formatTimeForRedux(selectedItem.endTime)
            }));
          }
        } else {
          // Handle reminder deletion with detailed logging
          console.log('[DELETE REMINDER] Starting deletion process...');
          console.log('[DELETE REMINDER] Parameters:', {
            selectedItemId,
            deleteAll,
            selectedDate,
            selectedItem,
            isCurrentDay
          });
        
          try {
            result = await deleteReminder(selectedItemId, deleteAll, selectedDate);
            console.log('[DELETE REMINDER] API Response:', result);
        
            if (result.success) {
              console.log('[DELETE REMINDER] API call successful, processing response...');
              
              // Parse and format the reminder time for Redux action
              const reminderDate = new Date(selectedItem.selectedTime);
              console.log('[DELETE REMINDER] Parsed reminder date:', reminderDate);
              
              const hour = reminderDate.getHours();
              const isPM = hour >= 12;
              const hourFormatted = `${hour % 12 || 12}:00 ${isPM ? 'PM' : 'AM'}`;
              
              console.log('[DELETE REMINDER] Formatted hour:', hourFormatted);
              
              // Determine if Redux state should be updated
              const shouldDispatch = isCurrentDay || (deleteAll && doesItemFallOnCurrentDay(reduxReminders, selectedItemId));
              console.log('[DELETE REMINDER] Should dispatch action?', shouldDispatch, {
                isCurrentDay,
                deleteAll,
                fallsOnCurrentDay: doesItemFallOnCurrentDay(reduxReminders, selectedItemId)
              });
        
              if (shouldDispatch) {
                console.log('[DELETE REMINDER] Dispatching deleteReminderAction with:', {
                  hour: hourFormatted,
                  reminderId: selectedItemId
                });
                
                dispatch(deleteReminderAction({ 
                  hour: hourFormatted, 
                  reminderId: selectedItemId
                }));
                
                console.log('[DELETE REMINDER] Action dispatched successfully');
              } else {
                console.log('[DELETE REMINDER] Not dispatching action - not current day and not deleteAll');
              }
            } else {
              console.warn('[DELETE REMINDER] API call unsuccessful:', result);
            }
          } catch (error) {
            console.error('[DELETE REMINDER] Error during deletion:', error);
            throw error; // Re-throw to be caught by the outer try-catch
          }
        }

        // Refresh data after successful deletion
        await fetchTasksAndReminders();

        toast.success(result.message, {
          position: "top-center",
        });
      } catch (error) {
        console.error('Error deleting item:', error);
        // Handle specific error cases
        if (error.message === 'This instance is already deleted') {
          toast.info('This reminder instance was already removed', {
            position: "top-center",
          });
        } else {
          toast.error(`Failed to delete ${itemType}. Please try again.`, {
            position: "top-center",
          });
        }
      }
    }
    closeDeleteModal();
  };

  // ==================== DATA SELECTION ====================
  
  // Choose between current day data (from props) or fetched data for other days
  const displayedTasks = isCurrentDay ? tasks : fetchedTasks;
  const displayedReminders = isCurrentDay ? reminders : fetchedReminders;

  // ==================== TIME SLOT FILTERING ====================
  
  /**
   * Filters and sorts time slots based on user settings
   * Respects start/end hour preferences and hidden hours
   */
  const getFilteredTimeSlots = () => {
    // Convert time string to 24-hour number for comparison
    const timeToNumber = (timeStr) => {
      const [time, period] = timeStr.split(' ');
      let [hours] = time.split(':');
      hours = parseInt(hours);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours;
    };
  
    const startNum = timeToNumber(settings.startHour || '12:00 AM');
    const endNum = timeToNumber(settings.endHour || '11:00 PM');
  
    // All possible time slots in 12-hour format
    const allHours = [
      '12:00 AM', '01:00 AM', '02:00 AM', '03:00 AM', '04:00 AM',
      '05:00 AM', '06:00 AM', '07:00 AM',
      '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
      '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM',
      '11:00 PM'
    ];
  
    return allHours.filter(time => {
      const timeNum = timeToNumber(time);
      
      // First check if hour is manually hidden
      if (settings.hiddenHours && settings.hiddenHours.includes(time)) {
        return false;
      }
      
      // Then check if it's within the user's preferred time range
      if (endNum >= startNum) {
        // Normal range (e.g., 9 AM to 5 PM)
        return timeNum >= startNum && timeNum <= endNum;
      } else {
        // Overnight range (e.g., 10 PM to 6 AM)
        return timeNum >= startNum || timeNum <= endNum;
      }
    });
  };

  // Get filtered time slots based on settings
  const filteredTimeSlots = getFilteredTimeSlots();

  // ==================== MEMOIZED DATA ====================
  
  /**
   * Flatten grouped data structures for easier processing
   * Ensures we have objects before trying to use Object.values
   * These are kept for potential future use, though not currently used in render
   */
  const flattenedTasks = React.useMemo(() => {
    return Object.values(displayedTasks || {}).flat();
  }, [displayedTasks]);

  const flattenedReminders = React.useMemo(() => {
    return Object.values(displayedReminders || {}).flat();
  }, [displayedReminders]);

  // ==================== RENDER ====================
  
  return (
    <div className={`daily-planner daily-planner-${context}`} data-context={context}>      {/* Day title header */}
      <h2 className='day-title'>{day}</h2>
      
      {/* Time slots container */}
      <div className="time-slots">
        {filteredTimeSlots.map((time) => (
          <TimeSlot
            key={time}
            time={time}
            day={day}
            tasks={displayedTasks || {}}
            reminders={displayedReminders || {}}
            currentDay={currentDay}
            currentHour={currentHour}
            handleDeleteTask={(id, item, type) => openDeleteModal(id, item, type)}
            handleSetReminder={(id, time, type) => handleSetReminder(id, time, type)}
            handleEditTask={openEditTask}
            handleClearReminder={handleClearReminder}
            currentTask={currentTask}
          />
        ))}
      </div>

      {/* Delete confirmation modal */}
      <DeleteTaskModal
        isOpen={isDeleteModalOpen}
        isRepeatingTask={isRepeatingItem}
        onClose={closeDeleteModal}
        onDeleteSingle={() => confirmDelete(false)}  // Delete single instance
        onDeleteAll={() => confirmDelete(true)}      // Delete all instances
        itemType={itemType}
      />
    </div>
  );
};

// ==================== REDUX CONNECTION ====================

/**
 * Maps Redux state to component props
 * Connects component to global application state
 */
const mapStateToProps = (state) => ({
  currentDay: state.currentDay,           // Current day from global state
  currentHour: state.currentHour,         // Current hour from global state  
  currentTask: state.currentTask,         // Currently active task
  selectedDayFlag: state.dailyPlannerFlag, // Flag to trigger data refresh
  selectedDayUI: state.selectedDayUI,     // UI state for selected day
});

export default connect(mapStateToProps)(DailyPlanner);