import { addDays, format, getHours, isSameDay, startOfWeek } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedDayFlag } from '../../redux/tasks/actions/dailyPlannerFlagActions';
import { setWeeklyGridOpen } from '../../redux/tasks/actions/weeklyGridActions';
import '../../styles/components/planning_visualisation/WeeklyPlanner.css';
import { getMonthsArray, getYearsArray, groupItemsByTimeSlot } from '../../utils/timeUtils';
import { fetchWeekData } from '../../utils/weekUtils';
import DeleteTaskModal from '../planning_utilities/DeleteTaskModal';
import Sphere from '../planning_utilities/Sphere';
import DailyPlanner from './DailyPlanner';
import DayCell from './DayCell';

/**
 * WeeklyPlanner Component
 * 
 * A comprehensive weekly planning interface that provides both grid and individual day views.
 * Features dynamic height calculations, event management, and seamless integration with daily planning.
 * 
 * Key Features:
 * - Dual view modes: Weekly grid view and single day detailed view
 * - Dynamic hour height calculations based on event density
 * - Real-time data synchronization with Redux state management
 * - Event CRUD operations with support for recurring items
 * - Responsive design with horizontal scrolling for weekly view
 * - Date navigation with year/month selectors and week navigation
 * - Integration with task and reminder management systems
 * 
 * @param {Function} setTaskToEdit - Callback to set a task for editing
 * @param {Function} setReminderToEdit - Callback to set a reminder for editing
 */
const WeeklyPlanner = ({ setTaskToEdit, setReminderToEdit }) => {
  
  // ==================== CORE STATE ====================
  
  // Date and navigation state
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);        // Currently selected week anchor date
  const [weekDays, setWeekDays] = useState([]);                   // Array of 7 days in current week
  const [activeDay, setActiveDay] = useState(today);              // Currently focused day in single day view
  
  // View state
  const [showAllDays, setShowAllDays] = useState(true);           // Toggle between grid view and single day view
  
  // Data state
  const [weeklyTasks, setWeeklyTasks] = useState({});             // Tasks organized by date string (YYYY-MM-DD)
  const [weeklyReminders, setWeeklyReminders] = useState({});     // Reminders organized by date string
  const [hourHeights, setHourHeights] = useState({});             // Dynamic heights for each hour based on event density
  
  // Modal and deletion state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);     // Delete confirmation modal visibility
  const [selectedItemId, setSelectedItemId] = useState(null);            // ID of item to delete
  const [selectedItem, setSelectedItem] = useState(null);                // Full object of item to delete
  const [itemType, setItemType] = useState(null);                        // 'task' or 'reminder'
  const [isRepeatingItem, setIsRepeatingItem] = useState(false);         // Whether item has repeat settings

  // ==================== REDUX INTEGRATION ====================
  
  const dispatch = useDispatch();
  const settings = useSelector(state => state.settings || {});           // User preferences for time display
  const dailyPlannerFlag = useSelector(state => state.dailyPlannerFlag); // Flag to trigger data refresh

  // ==================== COMPONENT LIFECYCLE ====================
  
  /**
   * Component Mount/Unmount Effect
   * Notifies Redux that the weekly grid is open/closed for proper state management
   */
  useEffect(() => {
    dispatch(setWeeklyGridOpen(true));
    return () => dispatch(setWeeklyGridOpen(false));
  }, [dispatch]);

  /**
   * Week Days Initialization
   * Calculates the 7 days of the current week based on selected date
   * Week starts on Sunday (weekStartsOn: 0)
   */
  useEffect(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const days = [...Array(7)].map((_, i) => addDays(start, i));
    setWeekDays(days);
  }, [selectedDate]);

  // ==================== DATA REFRESH MANAGEMENT ====================
  
  /**
   * Redux Flag-Triggered Data Refresh
   * Monitors dailyPlannerFlag and refreshes weekly data when external changes occur
   * This ensures the weekly view stays synchronized with other parts of the application
   */
  useEffect(() => {
    const refreshData = async () => {
      if (weekDays.length > 0) {
        try {
          const { tasks, reminders } = await fetchWeekData(weekDays);
          setWeeklyTasks(tasks);
          setWeeklyReminders(reminders);
        } catch (error) {
          console.error('Error refreshing weekly data:', error);
        }
      }
    };
  
    // Call this function when dailyPlannerFlag changes to true
    if (dailyPlannerFlag === true) {
      refreshData();
      // Reset the flag after initiating the refresh
      dispatch(setSelectedDayFlag(false));
    }
  }, [dailyPlannerFlag, weekDays, dispatch]);

  // ==================== DYNAMIC HEIGHT CALCULATIONS ====================
  
  /**
   * Calculate Hour Heights Based on Event Density
   * 
   * Dynamically calculates the height for each hour slot based on the maximum number
   * of concurrent events across all days of the week. This ensures proper spacing
   * and prevents overlapping in the weekly grid view.
   * 
   * Algorithm:
   * 1. For each hour (0-23), check all 7 days
   * 2. Count tasks and reminders that occur during that hour
   * 3. Find the maximum event count across all days for that hour
   * 4. Calculate height: base 60px + 24px per additional event
   */
  const calculateHourHeights = useMemo(() => {
    if (Object.keys(weeklyTasks).length === 0) return {};
    
    const heights = {};
    
    // Get all visible hours from settings (currently all 24 hours)
    const visibleHours = Array.from({ length: 24 }, (_, i) => i).filter(hour => {
      // Future enhancement: filter based on user settings
      return true; // For now, include all hours
    });
    
    visibleHours.forEach(hour => {
      let maxEventsCount = 0;
      
      // Check each day for this hour
      weekDays.forEach(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayTasks = weeklyTasks[dayStr] || [];
        const dayReminders = weeklyReminders[dayStr] || [];
        
        let eventsInHour = 0;
        
        // Count tasks that span or occur during this hour
        dayTasks.forEach(task => {
          const taskStartHour = getHours(new Date(task.startTime));
          const taskEndHour = getHours(new Date(task.endTime));
          
          if (hour >= taskStartHour && hour <= taskEndHour) {
            eventsInHour++;
          }
        });
        
        // Count reminders that occur during this hour
        dayReminders.forEach(reminder => {
          const reminderTime = reminder.selectedTime || reminder.time;
          if (reminderTime) {
            const reminderHour = getHours(new Date(reminderTime));
            if (hour === reminderHour) {
              eventsInHour++;
            }
          }
        });
        
        maxEventsCount = Math.max(maxEventsCount, eventsInHour);
      });
      
      // Calculate height: base height + additional height per event
      // Base height of 60px + 24px per event after the first
      heights[hour] = maxEventsCount <= 1 ? 60 : 60 + ((maxEventsCount - 1) * 24);
    });
    
    return heights;
  }, [weeklyTasks, weeklyReminders, weekDays]);

  // ==================== INITIAL DATA LOADING ====================
  
  /**
   * Fetch Weekly Data on Week Change
   * Loads tasks and reminders for all 7 days when week changes
   */
  useEffect(() => {
    if (weekDays.length > 0) {
      const loadWeekData = async () => {
        try {
          const { tasks, reminders } = await fetchWeekData(weekDays);
          console.log("Tasks by day:", tasks);
          
          // Verify data structure is correct
          Object.keys(tasks).forEach(dayKey => {
            console.log(`Day ${dayKey} has ${tasks[dayKey]?.length || 0} tasks`);
          });
          
          setWeeklyTasks(tasks);
          setWeeklyReminders(reminders);
        } catch (error) {
          console.error('Error loading week data:', error);
        }
      };
  
      loadWeekData();
    }
  }, [weekDays]);

  /**
   * Update Hour Heights When Data Changes
   * Recalculates dynamic heights whenever tasks or reminders are updated
   */
  useEffect(() => {
    setHourHeights(calculateHourHeights);
  }, [weeklyTasks, weeklyReminders, calculateHourHeights]);

  /**
   * DOM Update and Scroll Management
   * Ensures proper scrolling behavior after state updates
   */
  useEffect(() => {    
    // Add a small delay to ensure the DOM has updated
    setTimeout(() => {
      const scrollContainer = document.getElementById('weekly-scroll');
      if (scrollContainer) {
        // Force a scroll update by slightly adjusting scroll position
        scrollContainer.scrollLeft = 0;
      }
    }, 100);
  }, [weeklyTasks, weeklyReminders, hourHeights]);

  // ==================== EVENT HANDLERS ====================
  
  /**
   * Handle day click in weekly grid view
   * Switches to single day view and sets the clicked day as active
   */
  const handleDayClick = (date) => {
    setActiveDay(date);
    setShowAllDays(false);
  };

  /**
   * Handle day selection in single day view
   * Changes the active day without changing view mode
   */
  const handleDaySelect = (date) => {
    setActiveDay(date);
  };

  /**
   * Handle event editing
   * Sets the appropriate day as active and triggers edit mode for tasks/reminders
   */
  const handleEventEdit = (event) => {
    // Update active day without changing the view mode
    const eventDate = new Date(event.selectedDay || event.startTime || event.time);
    setActiveDay(eventDate);

    if (event.type === 'task') {
      setTaskToEdit(event);
    } else if (event.type === 'reminder') {
      setReminderToEdit(event);
    }
  };

  /**
   * Handle event deletion initiation
   * Opens delete confirmation modal with event details
   */
  const handleDeleteEvent = (event) => {
    setSelectedItemId(event.id);
    setSelectedItem(event);
    setItemType(event.type);
    setIsRepeatingItem(!!event.repeatOption);
    setIsDeleteModalOpen(true);
  };

  /**
   * Close delete modal and reset related state
   */
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedItem(null);
    setSelectedItemId(null);
    setItemType(null);
    setIsRepeatingItem(false);
  };

  /**
   * Confirm and execute event deletion
   * Handles both single instance and recurring event deletion
   * 
   * @param {boolean} deleteAll - Whether to delete all instances of recurring events
   */
  const confirmDelete = async (deleteAll = false) => {
    if (selectedItemId !== null && selectedItem !== null) {
      const dateObj = selectedItem.selectedDay ? 
        new Date(selectedItem.selectedDay) : 
        new Date(selectedItem.startTime || selectedItem.time);
      
      // Format date as YYYY-MM-DD for API consistency
      const selectedDate = dateObj.toISOString().split('T')[0];
      
      try {
        // Import deletion functions dynamically to avoid circular dependencies
        const { deleteTask, deleteReminder } = await import('../../api/api');
        let result;
        
        if (itemType === 'task') {
          result = await deleteTask(selectedItemId, deleteAll, selectedDate);
        } else {
          result = await deleteReminder(selectedItemId, deleteAll, selectedDate);
        }
        
        // Set the flag to trigger a refresh across the application
        dispatch(setSelectedDayFlag(true));
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
    
    closeDeleteModal();
  };

  // ==================== VIEW NAVIGATION ====================
  
  /**
   * Toggle between weekly grid view and single day view
   */
  const toggleView = () => {
    setShowAllDays(!showAllDays);
  };

  /**
   * Handle year change in date selector
   */
  const handleYearChange = (e) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(parseInt(e.target.value));
    setSelectedDate(newDate);
  };

  /**
   * Handle month change in date selector
   */
  const handleMonthChange = (e) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(getMonthsArray().indexOf(e.target.value));
    setSelectedDate(newDate);
  };

  /**
   * Navigate to previous week
   */
  const handlePrevWeek = () => {
    setSelectedDate(prev => addDays(prev, -7));
  };

  /**
   * Navigate to next week
   */
  const handleNextWeek = () => {
    setSelectedDate(prev => addDays(prev, 7));
  };

  // ==================== DATA PREPARATION ====================
  
  /**
   * Prepare Active Day Data for Single Day View
   * 
   * Formats and groups tasks/reminders for the currently active day
   * Groups items by time slots for proper rendering in DailyPlanner component
   */
  const prepareActiveDayData = useMemo(() => {
    const activeDayStr = format(activeDay, 'yyyy-MM-dd');
    const activeDayTasks = weeklyTasks[activeDayStr] || [];
    const activeDayReminders = weeklyReminders[activeDayStr] || [];
    
    // Group tasks and reminders by time slot for DailyPlanner component
    const groupedTasks = groupItemsByTimeSlot(activeDayTasks, 'startTime', 'endTime');
    const groupedReminders = groupItemsByTimeSlot(activeDayReminders, 'selectedTime', 'selectedTime');
    
    return {
      dayStr: activeDayStr,
      tasks: groupedTasks,
      reminders: groupedReminders,
    };
  }, [activeDay, weeklyTasks, weeklyReminders]);

  // ==================== RENDER ====================

  return (
    <div className="weekly-planner">
      
      {/* ==================== DATE NAVIGATION ==================== */}
      <div className="date-selectors">
        <label>
          Year:
          <select
            value={format(selectedDate, 'yyyy')}
            onChange={handleYearChange}
            className="year-select"
          >
            {getYearsArray().map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </label>

        <label>
          Month:
          <select
            value={format(selectedDate, 'MMMM')}
            onChange={handleMonthChange}
            className="month-select"
          >
            {getMonthsArray().map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Week Navigation and View Toggle */}
      <div>
        <button onClick={handlePrevWeek}>←</button>
        <button onClick={toggleView}>
          {showAllDays ? 'Show Single Day' : 'Show All Days'}
        </button>
        <button onClick={handleNextWeek}>→</button>
      </div>

      {/* ==================== CONDITIONAL VIEW RENDERING ==================== */}
      
      {showAllDays ? (
        /* Weekly Grid View - Shows all 7 days in a scrollable grid */
        <div className="weekly-scroll-container" id="weekly-scroll">
          <div className="weekly-content-wrapper">
            <div className="week-grid">
            {weekDays.map(date => {
              const dayStr = format(date, 'yyyy-MM-dd');
              return (
                <DayCell
                  key={dayStr}
                  date={date}
                  tasks={weeklyTasks[dayStr] || []}
                  reminders={weeklyReminders[dayStr] || []} 
                  onDayClick={handleDayClick}
                  settings={settings}
                  onEventEdit={handleEventEdit}
                  onEventDelete={handleDeleteEvent}
                  hourHeights={hourHeights} // Dynamic heights based on event density
                />
              );
            })}
            </div>
          </div>
        </div>
      ) : (
        /* Single Day View - Shows day selector and detailed daily planner */
        <>
          {/* Day Selector Row */}
          <div className="calendar-grid">
            {weekDays.map((date, index) => (
              <div
                key={index}
                className={`day-selector ${isSameDay(date, activeDay) ? 'selected' : ''}`}
                onClick={() => handleDaySelect(date)}
              >
                <div>{format(date, 'EEE')}</div>
                <div className="day-number">{format(date, 'd')}</div>
              </div>
            ))}
          </div>
          
          {/* Detailed Daily Planner */}
          <div className="daily-planner-container">
            <DailyPlanner
              day={prepareActiveDayData.dayStr}
              tasks={prepareActiveDayData.tasks}
              reminders={prepareActiveDayData.reminders}
              isCurrentDay={false} // This is always false since it's a weekly view
              setTaskToEdit={setTaskToEdit}
              setReminderToEdit={setReminderToEdit}
              context="weekly" // Context for styling differences
            />
          </div>
        </>
      )}
      
      {/* ==================== MODAL DIALOGS ==================== */}
      
      {/* Delete Confirmation Modal */}
      <DeleteTaskModal
        isOpen={isDeleteModalOpen}
        isRepeatingTask={isRepeatingItem}
        onClose={closeDeleteModal}
        onDeleteSingle={() => confirmDelete(false)}  // Delete single instance
        onDeleteAll={() => confirmDelete(true)}      // Delete all instances
        itemType={itemType}
      />
      
      {/* Sphere Component - Additional UI element */}
      <Sphere />
    </div>
  );
};

export default WeeklyPlanner;