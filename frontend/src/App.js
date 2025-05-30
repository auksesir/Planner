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

const App = () => {
  const [upcomingTaskTimer, setUpcomingTaskTimer] = useState(0);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [reminderToEdit, setReminderToEdit] = useState(null);
  const [newTaskDefaults, setNewTaskDefaults] = useState(null);
  const [newReminderDefaults, setNewReminderDefaults] = useState(null);
  const updateCounterRef = useRef(0);
  
  // Enhanced pomodoro state management
  const [isPomodoroActive, setIsPomodoroActive] = useState(false);
  const [pomodoroSettings, setPomodoroSettings] = useState({
    workDuration: 25,
    breakDuration: 5
  });
  const [showTaskTimer, setShowTaskTimer] = useState(true);

  const dispatch = useDispatch();
  const currentDay = useSelector((state) => state.currentDay);
  const tasks = useSelector((state) => state.tasks);
  const reminders = useSelector((state) => state.reminders);
  const currentTask = useSelector((state) => state.currentTask);
  const currentHour = useSelector((state) => state.currentHour);

  // Get all tasks and reminders for the global scheduler
  const allTasks = useMemo(() => {
    const tasksArray = [];
    Object.values(tasks || {}).forEach(tasksInHour => {
      if (Array.isArray(tasksInHour)) {
        tasksArray.push(...tasksInHour);
      }
    });
    return tasksArray;
  }, [tasks]);
  
  const allReminders = useMemo(() => {
    const remindersArray = [];
    Object.values(reminders || {}).forEach(remindersInHour => {
      if (Array.isArray(remindersInHour)) {
        remindersArray.push(...remindersInHour);
      }
    });
    return remindersArray;
  }, [reminders]);

  // Load pomodoro state from localStorage on initial render
  useEffect(() => {
    const savedPomodoroActive = localStorage.getItem('isPomodoroActive') === 'true';
    const savedShowTaskTimer = localStorage.getItem('showTaskTimer') === 'true';
    const savedSettings = JSON.parse(localStorage.getItem('pomodoroSettings'));
    
    if (savedPomodoroActive) {
      setIsPomodoroActive(true);
    }
    
    // Determine which timer to show
    if (savedShowTaskTimer !== null) {
      setShowTaskTimer(savedShowTaskTimer);
    }
    
    // Load saved settings if available
    if (savedSettings) {
      setPomodoroSettings(savedSettings);
    }
    
    // Preload sounds for better performance during first notification
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

  // loadTasksAndReminders function
  const loadTasksAndReminders = async (date) => {
    try {
      const tasksForDay = await getTasksForDay(date);
      
      tasksForDay.forEach(task => {
  
        const startDate = new Date(task.startTime);
        const endDate = new Date(task.endTime);
        const startHour = getHours(startDate);
        const endHour = getHours(endDate);
        const endMinutes = getMinutes(endDate);
  
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
  
        if (startHour === endHour - 1 && endMinutes === 0) {
          const isPM = startHour >= 12;
          const hourFormatted = `${formatHour(startHour)}:00 ${isPM ? 'PM' : 'AM'}`;
          dispatch(addTask({ hour: hourFormatted, task: serializedTask }));
        } else {
          for (let hour = startHour; hour <= endHour; hour++) {
            if (hour === endHour && endMinutes === 0) {
              continue;
            }
            const isPM = hour >= 12;
            const hourFormatted = `${formatHour(hour)}:00 ${isPM ? 'PM' : 'AM'}`;
            dispatch(addTask({ hour: hourFormatted, task: serializedTask }));
          }
        }
      });
  
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
          console.error('Error details:', error.message);
        }
      });
    } catch (error) {
      console.error('Error loading tasks and reminders:', error.message);
    }
  };

  useEffect(() => {
    const currentDate = format(new Date(), 'yyyy-MM-dd');
    loadTasksAndReminders(currentDate);
  }, [dispatch]);

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

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('taskUpdated', handleTaskUpdate); // Add custom event listener
  
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('taskUpdated', handleTaskUpdate); // Remove listener on cleanup
    };
  }, []);

  // Enhanced task comparison that checks not just ID but content as well
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

  if (changed) {
  }

  return changed;
}


  useEffect(() => {
  const [newCurrentDay, newCurrentHour, newCurrentTask] = findCurrentHour();


  if (hasTaskChanged(newCurrentTask, currentTask)) {
    dispatch(setCurrentTask(newCurrentTask));
  } else {
  }

  if (newCurrentDay !== currentDay) {
    dispatch(setCurrentDayAction(newCurrentDay));
  }

  if (newCurrentHour !== currentHour) {
    dispatch(setCurrentHourAction(newCurrentHour));
  }

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


  function parseDateString(dateString) {
    const [datePart, timePart] = dateString.split(', ');
    const [day, month, year] = datePart.split('/').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    return new Date(year, month - 1, day, hours, minutes, seconds);
  }

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


  if (currentDay !== newCurrentDay) {
    dispatch({ type: 'CLEAR_ALL_TASKS' });
    dispatch({ type: 'CLEAR_ALL_REMINDERS' });
    loadTasksAndReminders(newCurrentDay);
  }

  if (tasks[hourIsPM] !== undefined) {
    const tasksInHour = tasks[hourIsPM];

    for (let i = 0; i < tasksInHour.length; i++) {
      const task = tasksInHour[i];
      const taskStartTime = parseDateString(task.startTime);
      const taskEndTime = parseDateString(task.endTime);

      if (task.repeatOption !== null) {
        const currentTimeOfDay = new Date(1970, 0, 1, currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds());
        const taskStartTimeOfDay = new Date(1970, 0, 1, taskStartTime.getHours(), taskStartTime.getMinutes(), taskStartTime.getSeconds());
        const taskEndTimeOfDay = new Date(1970, 0, 1, taskEndTime.getHours(), taskEndTime.getMinutes(), taskEndTime.getSeconds());


        if (currentTimeOfDay >= taskStartTimeOfDay && currentTimeOfDay < taskEndTimeOfDay
) {
          currentTask = task;
        } else {
        }
      } else {

        if (taskStartTime <= currentDate && currentDate < taskEndTime) {
          currentTask = task;
        } else {
        }
      }
    }
  }

    let newUpcomingTaskTimer = null;

    if (currentTask !== null && upcomingTask === null) {
      // Calculate timer based on whether the task is recurring or not
      if (currentTask.repeatOption !== null) {
        // For recurring tasks, use only the time part
        const currentTimeOfDay = new Date(1970, 0, 1, currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds());
        const taskEndTimeOfDay = new Date(1970, 0, 1, 
          parseDateString(currentTask.endTime).getHours(),
          parseDateString(currentTask.endTime).getMinutes(),
          parseDateString(currentTask.endTime).getSeconds()
        );
        
        // Calculate milliseconds between the two time-of-day values
        const timeToTaskEnd = taskEndTimeOfDay.getTime() - currentTimeOfDay.getTime();
        
        // If the end time is earlier than current time, it means the task ends tomorrow
        const adjustedTimeToTaskEnd = timeToTaskEnd > 0 ? 
          timeToTaskEnd : 
          timeToTaskEnd + (24 * 60 * 60 * 1000); // Add 24 hours
        
        // Calculate time until next hour
        const timeToNextHour = (60 - currentDate.getMinutes()) * 60 * 1000 - 
                              (currentDate.getSeconds() * 1000) - 
                              currentDate.getMilliseconds();
        
        // Use whichever comes first: next hour or task end
        newUpcomingTaskTimer = Math.min(timeToNextHour, adjustedTimeToTaskEnd);
      } else {
        // For non-recurring tasks, compare full date-time as before
        const taskEndTime = parseDateString(currentTask.endTime);
        
        // Calculate time until next hour and time until task ends
        const timeToNextHour = (60 - currentDate.getMinutes()) * 60 * 1000 - 
                              (currentDate.getSeconds() * 1000) - 
                              currentDate.getMilliseconds();
        
        const timeToTaskEnd = taskEndTime - currentDate;
        
        // Use whichever comes first: next hour or task end
        newUpcomingTaskTimer = Math.min(timeToNextHour, timeToTaskEnd);
      }
    } else if (upcomingTask === null) {
      // Calculate time to next hour
      newUpcomingTaskTimer = ((60 - minutes) * 60 * 1000) -           // minutes to ms
                            (currentDate.getSeconds() * 1000) -        // seconds to ms
                            currentDate.getMilliseconds();             // already in ms
    } else {
      // Calculate timer for upcoming task based on whether it's recurring
      if (upcomingTask.repeatOption !== null) {
        // For recurring tasks, use only the time part
        const currentTimeOfDay = new Date(1970, 0, 1, currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds());
        const taskStartTimeOfDay = new Date(1970, 0, 1, 
          parseDateString(upcomingTask.startTime).getHours(),
          parseDateString(upcomingTask.startTime).getMinutes(),
          parseDateString(upcomingTask.startTime).getSeconds()
        );
        
        // Calculate milliseconds between the two time-of-day values
        const timeToTaskStart = taskStartTimeOfDay.getTime() - currentTimeOfDay.getTime();
        
        // If the start time is earlier than current time, it means the task starts tomorrow
        newUpcomingTaskTimer = timeToTaskStart > 0 ? 
          timeToTaskStart : 
          timeToTaskStart + (24 * 60 * 60 * 1000); // Add 24 hours
      } else {
        // For non-recurring tasks, compare full date-time as before
        const taskStartTime = parseDateString(upcomingTask.startTime);
        newUpcomingTaskTimer = taskStartTime - currentDate;
      }
    }

    // Ensure the timer is at least 1 second to prevent instant refresh loops
    newUpcomingTaskTimer = Math.max(1000, newUpcomingTaskTimer);
    
    // Only update the timer state if there's a significant difference
    // This is key to preventing refresh loops
    if (Math.abs(newUpcomingTaskTimer - upcomingTaskTimer) >= 2000) {
      setUpcomingTaskTimer(newUpcomingTaskTimer);
    }
      
    return [newCurrentDay, hourIsPM, currentTask];
  }

  const handleCloseSettingsModal = () => {
    setIsSettingsModalOpen(false);
  };

  // Handle reminder clearing for the global scheduler
  const handleClearReminder = async (id, type) => {
    if (type === 'task') {
      try {
        // Call API to clear the reminder on the backend
        await clearReminder(id, type);
        
        // Also update the Redux state directly
        dispatch({ type: 'CLEAR_REMINDER', payload: id });
        
      } catch (error) {
        console.error('Error clearing task reminder:', error);
      }
    }
  };

  useEffect(() => {
    // Register a service worker for background notifications if supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // This enables notifications even when app is closed
      // Note: This requires additional setup with a service worker
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
    
    // Set up visibility change handling for when tab is not in focus
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // When page becomes visible again, check for missed reminders
        // Force re-check of reminders
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

  useEffect(() => {
    if (showTaskTimer) {
      document.body.classList.add('show-task-timer');
    } else {
      document.body.classList.remove('show-task-timer');
    }
  }, [showTaskTimer]);

  // Toggle between task timer and pomodoro when both are available
  const handleToggleTimerType = () => {
    // Simply switch which timer is shown without affecting pomodoro state
    setShowTaskTimer(!showTaskTimer);
    
    // Remember the preference
    localStorage.setItem('showTaskTimer', (!showTaskTimer).toString());
    
    // IMPORTANT: Do not modify any other state to prevent resets
  };

  // Add this to App.js
  
  const handleTogglePomodoro = (active, workDuration, breakDuration) => {
    
    // Save activation state
    setIsPomodoroActive(active);
    localStorage.setItem('isPomodoroActive', active.toString());
    
    // Only save new settings if explicitly provided and turning on
    if (active && workDuration && breakDuration) {
      const newSettings = { workDuration, breakDuration };
      setPomodoroSettings(newSettings);
      localStorage.setItem('pomodoroSettings', JSON.stringify(newSettings));
    }
    
    // ONLY remove state if we're explicitly turning off pomodoro
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
            {/* Render PomodoroTimer without the conditional that was hiding it */}
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
          
          {/* Global reminder scheduler that works on all pages */}
          <ReminderScheduler 
            items={[
              ...allTasks.map(task => ({ ...task, type: 'task' })),
              ...allReminders.map(reminder => ({ ...reminder, type: 'reminder' }))
            ]}
            onClearReminder={handleClearReminder}
          />
          
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