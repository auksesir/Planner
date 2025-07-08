import { format, getHours, getMinutes } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { Link, Route, HashRouter as Router, Routes } from 'react-router-dom';
import { clearReminder, getRemindersForDay, getTasksForDay } from './api/api';
import InputBar from './components/input_components/InputBar';
import PomodoroTimer from './components/planning_utilities/PomodoroTimer';
import ReminderScheduler from './components/planning_utilities/ReminderScheduler';
import SettingsModal from './components/planning_utilities/SettingsModal';
import Sphere from './components/planning_utilities/Sphere';
import Home from './pages/Home';
import Planner from './pages/Planner';
import Projects from './pages/Projects';
import { addReminder } from './redux/reminders/actions/remindersActions';
import { setCurrentDayAction, setCurrentHourAction } from './redux/tasks/actions/currentDayandHourActions';
import { setCurrentTask } from './redux/tasks/actions/currentTaskActions';
import { addTask } from './redux/tasks/actions/tasksActions';
import store from './store';
import './styles/App.css';
import { preloadNotificationSounds } from './utils/audioUtils';

/**
 * Main application component that orchestrates the entire task management system.
 * Handles real-time task tracking, pomodoro timer integration, and global state management.
 */
const App = () => {
  // Modal and editing state
  const [upcomingTaskTimer, setUpcomingTaskTimer] = useState(0);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [reminderToEdit, setReminderToEdit] = useState(null);
  const [newTaskDefaults, setNewTaskDefaults] = useState(null);
  const [newReminderDefaults, setNewReminderDefaults] = useState(null);
  
  // Performance optimization: prevents unnecessary re-renders during rapid state updates
  const updateCounterRef = useRef(0);
  
  /**
   * Pomodoro timer state management
   * Coordinates between task-based timers and focus session timers
   */
  const [isPomodoroActive, setIsPomodoroActive] = useState(false);
  const [pomodoroSettings, setPomodoroSettings] = useState({
    workDuration: 25,
    breakDuration: 5
  });
  // Controls which timer type is displayed when both task and pomodoro are available
  const [showTaskTimer, setShowTaskTimer] = useState(true);

  // Redux state selectors for real-time data
  const dispatch = useDispatch();
  const currentDay = useSelector((state) => state.currentDay);
  const tasks = useSelector((state) => state.tasks);
  const reminders = useSelector((state) => state.reminders);
  const currentTask = useSelector((state) => state.currentTask);
  const currentHour = useSelector((state) => state.currentHour);

  /**
   * Aggregates all tasks from hourly buckets into a flat array for global scheduling.
   * Tasks are stored by hour in Redux for efficient daily planner rendering,
   * but need to be flattened for reminder scheduling and current task detection.
   */
  const allTasks = useMemo(() => {
    const tasksArray = [];
    Object.values(tasks || {}).forEach(tasksInHour => {
      if (Array.isArray(tasksInHour)) {
        tasksArray.push(...tasksInHour);
      }
    });
    return tasksArray;
  }, [tasks]);
  
  /**
   * Similar aggregation for reminders - converts hourly buckets to flat array
   * for the global reminder scheduler component.
   */
  const allReminders = useMemo(() => {
    const remindersArray = [];
    Object.values(reminders || {}).forEach(remindersInHour => {
      if (Array.isArray(remindersInHour)) {
        remindersArray.push(...remindersInHour);
      }
    });
    return remindersArray;
  }, [reminders]);

  /**
   * Initialize application state from localStorage on first load.
   * Restores pomodoro session state and user preferences for timer display.
   */
  useEffect(() => {
    const savedPomodoroActive = localStorage.getItem('isPomodoroActive') === 'true';
    const savedShowTaskTimer = localStorage.getItem('showTaskTimer') === 'true';
    const savedSettings = JSON.parse(localStorage.getItem('pomodoroSettings'));
    
    if (savedPomodoroActive) {
      setIsPomodoroActive(true);
    }
    
    // Determine which timer to show based on saved preference
    if (savedShowTaskTimer !== null) {
      setShowTaskTimer(savedShowTaskTimer);
    }
    
    // Restore pomodoro duration settings
    if (savedSettings) {
      setPomodoroSettings(savedSettings);
    }
    
    // Preload notification sounds to prevent delays during first alert
    preloadNotificationSounds();
  }, []);

  const updateReduxState = () => {
    const currentDate = new Date().toISOString().split('T')[0];
    loadTasksAndReminders(currentDate);
  };

  const formatHour = (hour) => {
    const formattedHour = hour % 12 || 12;
    return formattedHour.toString().padStart(2, '0');
  };

  /**
   * Loads and processes tasks/reminders from API into Redux store.
   * Handles complex time-based bucketing and serialization for consistent storage.
   * 
   * Key business logic:
   * - Tasks spanning multiple hours are duplicated across all relevant hour buckets
   * - Times are normalized to consistent format for reliable comparison
   * - Hour buckets use 12-hour format with AM/PM for user-friendly display
   */
  const loadTasksAndReminders = async (date) => {
    try {
      const tasksForDay = await getTasksForDay(date);
      
      tasksForDay.forEach(task => {
        const startDate = new Date(task.startTime);
        const endDate = new Date(task.endTime);
        const startHour = getHours(startDate);
        const endHour = getHours(endDate);
        const endMinutes = getMinutes(endDate);
  
        // Serialize dates to consistent format for Redux storage and comparison
        const serializedTask = {
          ...task,
          startTime: format(startDate, 'dd/MM/yyyy, HH:mm:ss'),
          endTime: format(endDate, 'dd/MM/yyyy, HH:mm:ss'),
          reminderTime: task.reminderTime ? 
            (task.reminderTime instanceof Date ? 
              task.reminderTime.toISOString() : 
              task.reminderTime
            ) : null,
          selectedDay: task.selectedDay instanceof Date ? 
          format(task.selectedDay, 'yyyy-MM-dd') : task.selectedDay
        };
  
        // Special case: 1-hour tasks that end exactly on the hour
        if (startHour === endHour - 1 && endMinutes === 0) {
          const isPM = startHour >= 12;
          const hourFormatted = `${formatHour(startHour)}:00 ${isPM ? 'PM' : 'AM'}`;
          dispatch(addTask({ hour: hourFormatted, task: serializedTask }));
        } else {
          // Multi-hour tasks: add to all relevant hour buckets for proper display
          for (let hour = startHour; hour <= endHour; hour++) {
            if (hour === endHour && endMinutes === 0) {
              continue; // Don't include the ending hour if task ends at :00
            }
            const isPM = hour >= 12;
            const hourFormatted = `${formatHour(hour)}:00 ${isPM ? 'PM' : 'AM'}`;
            dispatch(addTask({ hour: hourFormatted, task: serializedTask }));
          }
        }
      });
  
      // Process reminders - simpler since they're point-in-time events
      const remindersForDay = await getRemindersForDay(date);

      remindersForDay.forEach(reminder => {
        try {
          const selectedTimeDate = new Date(reminder.selectedTime);
          
          if (isNaN(selectedTimeDate.getTime())) {
            console.error('Invalid selectedTime for reminder:', reminder);
            return;
          }
          
          const hour = selectedTimeDate.getHours();
          const isPM = hour >= 12;
          const hourFormatted = `${formatHour(hour)}:00 ${isPM ? 'PM' : 'AM'}`;
          
          const serializedReminder = {
            ...reminder,
            selectedTime: format(selectedTimeDate, 'dd/MM/yyyy, HH:mm:ss'),
          };

          dispatch(addReminder({
            hour: hourFormatted,
            reminder: serializedReminder
          }));

        } catch (error) {
          console.error('Error processing reminder:', reminder, error);
        }
      });
    } catch (error) {
      console.error('Error loading tasks and reminders:', error.message);
    }
  };

  // Load initial data for current day
  useEffect(() => {
    const currentDate = format(new Date(), 'yyyy-MM-dd');
    loadTasksAndReminders(currentDate);
  }, [dispatch]);

  /**
   * Set up event listeners for real-time updates when app regains focus.
   * Critical for maintaining accurate current task detection when user switches tabs/apps.
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateCounterRef.current += 1;
        findCurrentHour();
      }
    };
  
    const handleFocus = () => {
      updateCounterRef.current += 1;
      findCurrentHour();
    };

    const handleTaskUpdate = () => {
      updateCounterRef.current += 1;
      findCurrentHour();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('taskUpdated', handleTaskUpdate);
  
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('taskUpdated', handleTaskUpdate);
    };
  }, []);

  /**
   * Sophisticated task change detection that prevents unnecessary re-renders.
   * Compares not just task ID but all relevant properties to detect actual changes.
   * Essential for performance when dealing with frequent time-based updates.
   */
  function hasTaskChanged(newTask, currentTask) {
    if (!newTask && !currentTask) return false;
    if (!newTask || !currentTask) {
      return true;
    }

    if (newTask.id !== currentTask.id) return true;

    const changed =
      newTask.name !== currentTask.name ||
      newTask.startTime !== currentTask.startTime ||
      newTask.endTime !== currentTask.endTime ||
      newTask.repeatOption !== currentTask.repeatOption ||
      newTask.reminderTime !== currentTask.reminderTime;

    return changed;
  }

  /**
   * Main reactive loop that updates current task, day, and hour in real-time.
   * Uses dynamic timer calculation to minimize CPU usage while maintaining accuracy.
   * 
   * Timer strategy:
   * - Updates immediately when tasks change
   * - Sets smart timers for next expected change (task end, hour boundary, etc.)
   * - Prevents update loops through change detection and minimum intervals
   */
  useEffect(() => {
    const [newCurrentDay, newCurrentHour, newCurrentTask] = findCurrentHour();

    // Only update Redux if task actually changed (prevents render loops)
    if (hasTaskChanged(newCurrentTask, currentTask)) {
      dispatch(setCurrentTask(newCurrentTask));
    }

    if (newCurrentDay !== currentDay) {
      dispatch(setCurrentDayAction(newCurrentDay));
    }

    if (newCurrentHour !== currentHour) {
      dispatch(setCurrentHourAction(newCurrentHour));
    }

    // Set up dynamic timer for next expected change
    let timer = setTimeout(() => {
      const [updatedDay, updatedHour, updatedTask] = findCurrentHour();
      dispatch(setCurrentTask(updatedTask));
      dispatch(setCurrentDayAction(updatedDay));
      dispatch(setCurrentHourAction(updatedHour));
    }, upcomingTaskTimer);

    return () => {
      clearTimeout(timer);
    };
  }, [tasks, upcomingTaskTimer, currentTask, updateCounterRef.current]);

  /**
   * Parses the custom date format used throughout the application.
   * Format: "DD/MM/YYYY, HH:mm:ss"
   */
  function parseDateString(dateString) {
    const [datePart, timePart] = dateString.split(', ');
    const [day, month, year] = datePart.split('/').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    return new Date(year, month - 1, day, hours, minutes, seconds);
  }

  /**
   * Core algorithm that determines the current active task and calculates optimal update timing.
   * 
   * Complex logic handles:
   * 1. Day transitions (clears state and reloads data)
   * 2. Recurring vs one-time tasks (different time comparison logic)
   * 3. Current task detection (precise time-based matching)
   * 4. Dynamic timer calculation (next hour vs task end - whichever comes first)
   * 5. Performance optimization (minimum 1s intervals, significant change detection)
   * 
   * Returns: [currentDay, currentHour, activeTask]
   */
  function findCurrentHour() {
    const currentDate = new Date();
    const hour = currentDate.getHours();
    const minutes = currentDate.getMinutes();
    const newCurrentDay = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    const isPM = hour >= 12 && hour !== 0;
    const formattedHour = hour !== 0 ? (hour % 12) || 12 : 12;
    const hourIsPM = `${formattedHour.toString().padStart(2, '0')}:00 ${isPM ? 'PM' : 'AM'}`;

    let currentTask = null;
    let upcomingTask = null;

    // Handle day transitions by clearing state and reloading data
    if (currentDay !== newCurrentDay) {
      dispatch({ type: 'CLEAR_ALL_TASKS' });
      dispatch({ type: 'CLEAR_ALL_REMINDERS' });
      loadTasksAndReminders(newCurrentDay);
    }

    // Find currently active task in the current hour bucket
    if (tasks[hourIsPM] !== undefined) {
      const tasksInHour = tasks[hourIsPM];

      for (let i = 0; i < tasksInHour.length; i++) {
        const task = tasksInHour[i];
        const taskStartTime = parseDateString(task.startTime);
        const taskEndTime = parseDateString(task.endTime);

        // Recurring tasks: compare only time-of-day (ignore date)
        if (task.repeatOption !== null) {
          const currentTimeOfDay = new Date(1970, 0, 1, currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds());
          const taskStartTimeOfDay = new Date(1970, 0, 1, taskStartTime.getHours(), taskStartTime.getMinutes(), taskStartTime.getSeconds());
          const taskEndTimeOfDay = new Date(1970, 0, 1, taskEndTime.getHours(), taskEndTime.getMinutes(), taskEndTime.getSeconds());

          if (currentTimeOfDay >= taskStartTimeOfDay && currentTimeOfDay < taskEndTimeOfDay) {
            currentTask = task;
          }
        } else {
          // One-time tasks: compare full date-time
          if (taskStartTime <= currentDate && currentDate < taskEndTime) {
            currentTask = task;
          }
        }
      }
    }

    /**
     * Calculate optimal timer interval for next update.
     * Strategy: Update at the earliest of these events:
     * - Current task ends
     * - Next hour boundary
     * - Upcoming task starts
     * 
     * This minimizes CPU usage while maintaining real-time accuracy.
     */
    let newUpcomingTaskTimer = null;

    if (currentTask !== null && upcomingTask === null) {
      // Calculate timer based on task type (recurring vs one-time)
      if (currentTask.repeatOption !== null) {
        // Recurring tasks: calculate time until task ends today
        const currentTimeOfDay = new Date(1970, 0, 1, currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds());
        const taskEndTimeOfDay = new Date(1970, 0, 1, 
          parseDateString(currentTask.endTime).getHours(),
          parseDateString(currentTask.endTime).getMinutes(),
          parseDateString(currentTask.endTime).getSeconds()
        );
        
        const timeToTaskEnd = taskEndTimeOfDay.getTime() - currentTimeOfDay.getTime();
        
        // Handle tasks that end tomorrow
        const adjustedTimeToTaskEnd = timeToTaskEnd > 0 ? 
          timeToTaskEnd : 
          timeToTaskEnd + (24 * 60 * 60 * 1000);
        
        const timeToNextHour = (60 - currentDate.getMinutes()) * 60 * 1000 - 
                              (currentDate.getSeconds() * 1000) - 
                              currentDate.getMilliseconds();
        
        newUpcomingTaskTimer = Math.min(timeToNextHour, adjustedTimeToTaskEnd);
      } else {
        // One-time tasks: calculate exact time until task ends
        const taskEndTime = parseDateString(currentTask.endTime);
        
        const timeToNextHour = (60 - currentDate.getMinutes()) * 60 * 1000 - 
                              (currentDate.getSeconds() * 1000) - 
                              currentDate.getMilliseconds();
        
        const timeToTaskEnd = taskEndTime - currentDate;
        
        newUpcomingTaskTimer = Math.min(timeToNextHour, timeToTaskEnd);
      }
    } else if (upcomingTask === null) {
      // No current or upcoming task: update at next hour boundary
      newUpcomingTaskTimer = ((60 - minutes) * 60 * 1000) -
                            (currentDate.getSeconds() * 1000) -
                            currentDate.getMilliseconds();
    } else {
      // Calculate timer for upcoming task start
      if (upcomingTask.repeatOption !== null) {
        const currentTimeOfDay = new Date(1970, 0, 1, currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds());
        const taskStartTimeOfDay = new Date(1970, 0, 1, 
          parseDateString(upcomingTask.startTime).getHours(),
          parseDateString(upcomingTask.startTime).getMinutes(),
          parseDateString(upcomingTask.startTime).getSeconds()
        );
        
        const timeToTaskStart = taskStartTimeOfDay.getTime() - currentTimeOfDay.getTime();
        
        newUpcomingTaskTimer = timeToTaskStart > 0 ? 
          timeToTaskStart : 
          timeToTaskStart + (24 * 60 * 60 * 1000);
      } else {
        const taskStartTime = parseDateString(upcomingTask.startTime);
        newUpcomingTaskTimer = taskStartTime - currentDate;
      }
    }

    // Performance safeguards
    newUpcomingTaskTimer = Math.max(1000, newUpcomingTaskTimer); // Minimum 1 second
    
    // Only update timer if there's a significant change (prevents refresh loops)
    if (Math.abs(newUpcomingTaskTimer - upcomingTaskTimer) >= 2000) {
      setUpcomingTaskTimer(newUpcomingTaskTimer);
    }
      
    return [newCurrentDay, hourIsPM, currentTask];
  }

  const handleCloseSettingsModal = () => {
    setIsSettingsModalOpen(false);
  };

  /**
   * Handles reminder clearing for both API and Redux state synchronization.
   * Ensures consistent state between backend and frontend when users dismiss reminders.
   */
  const handleClearReminder = async (id, type) => {
    if (type === 'task') {
      try {
        await clearReminder(id, type);
        dispatch({ type: 'CLEAR_REMINDER', payload: id });
      } catch (error) {
        console.error('Error clearing task reminder:', error);
      }
    }
  };

  /**
   * Sets up background notification support and handles app visibility changes.
   * Ensures reminders work even when the app is not in focus.
   */
  useEffect(() => {
    // Register service worker for background notifications
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered');
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
    
    // Handle app visibility changes to check for missed reminders
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const reminderScheduler = document.querySelector('reminder-scheduler');
        if (reminderScheduler) {
          reminderScheduler.dispatchEvent(new Event('check-reminders'));
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Apply CSS classes based on timer display preferences
  useEffect(() => {
    if (showTaskTimer) {
      document.body.classList.add('show-task-timer');
    } else {
      document.body.classList.remove('show-task-timer');
    }
  }, [showTaskTimer]);

  /**
   * Toggles between task-based timer and pomodoro timer display.
   * Preserves all state - only changes which timer is visible to the user.
   */
  const handleToggleTimerType = () => {
    setShowTaskTimer(!showTaskTimer);
    localStorage.setItem('showTaskTimer', (!showTaskTimer).toString());
  };

  /**
   * Manages pomodoro timer activation and settings persistence.
   * Handles the complex state coordination between pomodoro sessions and task timers.
   */
  const handleTogglePomodoro = (active, workDuration, breakDuration) => {
    setIsPomodoroActive(active);
    localStorage.setItem('isPomodoroActive', active.toString());
    
    // Save new settings when starting pomodoro with specific durations
    if (active && workDuration && breakDuration) {
      const newSettings = { workDuration, breakDuration };
      setPomodoroSettings(newSettings);
      localStorage.setItem('pomodoroSettings', JSON.stringify(newSettings));
    }
    
    // Clean up pomodoro state when explicitly turning off
    if (!active) {
      localStorage.removeItem('pomodoroState');
    }
  };

  return (
    <Provider store={store}>
      <div className="app">
        <Router>
          <nav className="navbar">
            <div className="navbar-left">
              <Link to="/" className="logo">
                My Plan
              </Link>
            </div>
            <div className="navbar-right">
              <Link to="/projects" >
                Projects
              </Link>
              <Link to="/planner" className="planner">
                Planner
              </Link>
              <button 
                onClick={() => setIsSettingsModalOpen(true)}
                className="settings-button"
              >
                Settings
              </button>   
            </div>
          </nav>

          <Routes>
            <Route path="/" element={
              <>
                <Home 
                  setTaskToEdit={setTaskToEdit} 
                  setReminderToEdit={setReminderToEdit}
                  isPomodoroActive={isPomodoroActive}
                  showTaskTimer={showTaskTimer}
                />
                {/* Conditional pomodoro timer rendering - only when active and not conflicting with task timer */}
                {isPomodoroActive && (!showTaskTimer || !currentTask) && (
                  <PomodoroTimer 
                    workDuration={pomodoroSettings.workDuration} 
                    breakDuration={pomodoroSettings.breakDuration}
                    onTogglePomodoro={handleTogglePomodoro}
                    onSessionComplete={handlePomodoroSessionComplete}
                  />
                )}
              </>
            } />

            <Route path="/projects" element={
              <>
                <Projects 
                  setTaskToEdit={setTaskToEdit}
                  setReminderToEdit={setReminderToEdit}
                  onSetNewTaskDefaults={setNewTaskDefaults}
                  onSetNewReminderDefaults={setNewReminderDefaults}
                />
                <Sphere />
              </>
            } />

            <Route path="/planner/*" element={
              <>
                <Planner 
                  setTaskToEdit={setTaskToEdit}
                  setReminderToEdit={setReminderToEdit}  
                />
                <Sphere />
              </>
            } />
          </Routes>
          
          {/* Global reminder scheduler works across all pages */}
          <ReminderScheduler 
            items={[
              ...allTasks.map(task => ({ ...task, type: 'task' })),
              ...allReminders.map(reminder => ({ ...reminder, type: 'reminder' }))
            ]}
            onClearReminder={handleClearReminder}
          />
          
          {/* Global input bar for task/reminder creation and editing */}
          <InputBar 
            updateReduxState={updateReduxState}
            taskToEdit={taskToEdit}
            setTaskToEdit={setTaskToEdit}
            reminderToEdit={reminderToEdit}
            setReminderToEdit={setReminderToEdit}
            newTaskDefaults={newTaskDefaults}
            setNewTaskDefaults={setNewTaskDefaults}
            newReminderDefaults={newReminderDefaults}
            setNewReminderDefaults={setNewReminderDefaults}
            onTogglePomodoro={handleTogglePomodoro}
            isPomodoroActive={isPomodoroActive}
            onToggleTimerType={handleToggleTimerType}
            showTaskTimer={showTaskTimer}
            currentTask={currentTask}
          />
        </Router>
        
        {isSettingsModalOpen && (
          <SettingsModal 
            open={isSettingsModalOpen} 
            onClose={handleCloseSettingsModal}
          />
        )}
      </div>
    </Provider>
  );
};

export default App;