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

const WeeklyPlanner = ({ setTaskToEdit, setReminderToEdit }) => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekDays, setWeekDays] = useState([]);
  const [showAllDays, setShowAllDays] = useState(true);
  const [activeDay, setActiveDay] = useState(today);
  const [weeklyTasks, setWeeklyTasks] = useState({});
  const [weeklyReminders, setWeeklyReminders] = useState({});
  const [hourHeights, setHourHeights] = useState({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemType, setItemType] = useState(null);
  const [isRepeatingItem, setIsRepeatingItem] = useState(false);

  const dispatch = useDispatch();
  const settings = useSelector(state => state.settings || {});
  const dailyPlannerFlag = useSelector(state => state.dailyPlannerFlag);

  useEffect(() => {
    // Dispatch when component mounts/unmounts
    dispatch(setWeeklyGridOpen(true));
    return () => dispatch(setWeeklyGridOpen(false));
  }, [dispatch]);

  // Initialize week days
  useEffect(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const days = [...Array(7)].map((_, i) => addDays(start, i));
    setWeekDays(days);
  }, [selectedDate]);

  // Update your useEffect that watches dailyPlannerFlag
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

  // Calculate maximum tasks per hour across all days
  const calculateHourHeights = useMemo(() => {
    if (Object.keys(weeklyTasks).length === 0) return {};
    
    const heights = {};
    
    // Get all visible hours from settings
    const visibleHours = Array.from({ length: 24 }, (_, i) => i).filter(hour => {
      // Here you would filter based on your settings
      return true; // For now, include all hours
    });
    
    visibleHours.forEach(hour => {
      let maxEventsCount = 0;
      
      // Check each day for this hour
      weekDays.forEach(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayTasks = weeklyTasks[dayStr] || [];
        const dayReminders = weeklyReminders[dayStr] || [];
        
        // Count events in this hour
        let eventsInHour = 0;
        
        // Count tasks
        dayTasks.forEach(task => {
          const taskStartHour = getHours(new Date(task.startTime));
          const taskEndHour = getHours(new Date(task.endTime));
          
          if (hour >= taskStartHour && hour <= taskEndHour) {
            eventsInHour++;
          }
        });
        
        // Count reminders
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
      
      // Calculate height based on event count (base height + additional height per event)
      // Base height of 60px + 24px per event after the first
      heights[hour] = maxEventsCount <= 1 ? 60 : 60 + ((maxEventsCount - 1) * 24);
    });
    
    return heights;
  }, [weeklyTasks, weeklyReminders, weekDays]);

  // Fetch weekly data on initial load
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

  // Update hour heights when tasks or reminders change
  useEffect(() => {
    setHourHeights(calculateHourHeights);
  }, [weeklyTasks, weeklyReminders, calculateHourHeights]);

  // Monitor state updates and ensure proper scrolling
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

  const handleDayClick = (date) => {
    setActiveDay(date);
    setShowAllDays(false);
  };

  const handleDaySelect = (date) => {
    setActiveDay(date);
  };

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

  const handleDeleteEvent = (event) => {
    setSelectedItemId(event.id);
    setSelectedItem(event);
    setItemType(event.type);
    setIsRepeatingItem(!!event.repeatOption);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedItem(null);
    setSelectedItemId(null);
    setItemType(null);
    setIsRepeatingItem(false);
  };

  const confirmDelete = async (deleteAll = false) => {
    if (selectedItemId !== null && selectedItem !== null) {
      const dateObj = selectedItem.selectedDay ? 
        new Date(selectedItem.selectedDay) : 
        new Date(selectedItem.startTime || selectedItem.time);
      
      // Format date as YYYY-MM-DD
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
        
        // Set the flag to trigger a refresh
        dispatch(setSelectedDayFlag(true));
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
    
    closeDeleteModal();
  };

  const toggleView = () => {
    setShowAllDays(!showAllDays);
  };

  const handleYearChange = (e) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(parseInt(e.target.value));
    setSelectedDate(newDate);
  };

  const handleMonthChange = (e) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(getMonthsArray().indexOf(e.target.value));
    setSelectedDate(newDate);
  };

  const handlePrevWeek = () => {
    setSelectedDate(prev => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setSelectedDate(prev => addDays(prev, 7));
  };

  // Prepare data for the active day with proper formatting
  const prepareActiveDayData = useMemo(() => {
    const activeDayStr = format(activeDay, 'yyyy-MM-dd');
    const activeDayTasks = weeklyTasks[activeDayStr] || [];
    const activeDayReminders = weeklyReminders[activeDayStr] || [];
    
    // Group tasks and reminders by time slot
    const groupedTasks = groupItemsByTimeSlot(activeDayTasks, 'startTime', 'endTime');
    const groupedReminders = groupItemsByTimeSlot(activeDayReminders, 'selectedTime', 'selectedTime');
    
    return {
      dayStr: activeDayStr,
      tasks: groupedTasks,
      reminders: groupedReminders,
      
    };
  }, [activeDay, weeklyTasks, weeklyReminders, today]);

  return (
    <div className="weekly-planner">
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

      <div>
        <button onClick={handlePrevWeek}>←</button>
        <button onClick={toggleView}>
          {showAllDays ? 'Show Single Day' : 'Show All Days'}
        </button>
        <button onClick={handleNextWeek}>→</button>
      </div>

      {showAllDays ? (
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
                  hourHeights={hourHeights}
                />
              );
            })}
            </div>
          </div>
        </div>
      ) : (
        <>
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
          <div className="daily-planner-container">
            <DailyPlanner
              day={prepareActiveDayData.dayStr}
              tasks={prepareActiveDayData.tasks}
              reminders={prepareActiveDayData.reminders}
              isCurrentDay={false}
              setTaskToEdit={setTaskToEdit}
              setReminderToEdit={setReminderToEdit}
              DailyPlanner context="weekly"
            />
          </div>
        </>
      )}
      
      <DeleteTaskModal
        isOpen={isDeleteModalOpen}
        isRepeatingTask={isRepeatingItem}
        onClose={closeDeleteModal}
        onDeleteSingle={() => confirmDelete(false)}
        onDeleteAll={() => confirmDelete(true)}
        itemType={itemType}
      />
      
      <Sphere />
    </div>
  );
};

export default WeeklyPlanner;