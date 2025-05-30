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


const DailyPlanner = ({ 
  day, 
  tasks = {}, 
  reminders = {}, 
  currentDay, 
  currentHour, 
  currentTask, 
  isCurrentDay, 
  selectedDayFlag, 
  selectedDayUI, 
  setTaskToEdit,
  setReminderToEdit,
  context = 'default'
}) => {
  const [fetchedTasks, setFetchedTasks] = useState({});
  const [fetchedReminders, setFetchedReminders] = useState({});
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRepeatingItem, setIsRepeatingItem] = useState(false);
  const [itemType, setItemType] = useState(null); // 'task' or 'reminder'
  
  const dispatch = useDispatch();
  const settings = useSelector(state => state.settings || {
    startHour: '12:00 AM',
    endHour: '11:00 PM',
    hiddenHours: []
  });
  const reduxTasks = useSelector(state => state.tasks || {});
  const reduxReminders = useSelector(state => state.reminders || {}); 

  // Fetch tasks and reminders for the selected day
  const fetchTasksAndReminders = useCallback(async () => {
    if (!day) return;
    
    try {
      const tasksForDay = await getTasksForDay(day);
  
      const groupedTasks = groupItemsByTimeSlot(tasksForDay || [], 'startTime', 'endTime');
  
      setFetchedTasks(groupedTasks);

      // ADD THIS CODE TO FETCH REMINDERS:
      const remindersForDay = await getRemindersForDay(day);
      const groupedReminders = groupItemsByTimeSlot(remindersForDay || [], 'selectedTime', 'selectedTime');
    
    setFetchedReminders(groupedReminders);
    } catch (error) {
      console.error('[Frontend] Error fetching tasks:', error);
    }
  }, [day]);
  
  // Always fetch data when component mounts or day changes
  useEffect(() => {
    fetchTasksAndReminders();
  }, [day, fetchTasksAndReminders]);
  
  // Also fetch when dailyPlannerFlag changes
  useEffect(() => {
    if (selectedDayFlag) {
      fetchTasksAndReminders();
      dispatch(setSelectedDayFlag(false)); // Reset flag immediately
    }
  }, [selectedDayFlag, fetchTasksAndReminders, dispatch]);

  const handleSetReminder = async (itemId, reminderTime, itemType = 'task') => {
    if (itemType !== 'task') return;

    try {
      const result = await setTaskReminder(itemId, reminderTime, itemType);
      
      if (result.success) {
        dispatch(setTaskReminderAction({ 
          taskId: itemId, 
          reminderTime,
          task: result.task 
        }));
        
        toast.success('Reminder set successfully', {
          position: "top-center",
        });
  
        await fetchTasksAndReminders();
      }
    } catch (error) {
      console.error('Error setting reminder:', error);
      toast.error('Failed to set reminder. Please try again.', {
        position: "top-center",
      });
    }
  };

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

        await fetchTasksAndReminders();
      }
    } catch (error) {
      console.error('Error clearing reminder:', error);
      toast.error('Failed to clear reminder. Please try again.', {
        position: "top-center",
      });
    }
  };  

  const openDeleteModal = (id, item, type) => {
    setSelectedItemId(id);
    setSelectedItem(item);
    setItemType(type);
    setIsRepeatingItem(!!item.repeatOption);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedItem(null);
    setSelectedItemId(null);
    setItemType(null);
    setIsRepeatingItem(false);
  };

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

  
  const confirmDelete = async (deleteAll = false) => {
    if (selectedItemId !== null && selectedItem !== null) {
      try {
        // Use selectedDay directly for current or non-current day
        const selectedDate = selectedItem.selectedDay || 
          (selectedItem.startTime ? new Date(selectedItem.startTime).toISOString().split('T')[0] : 
          format(new Date(), 'yyyy-MM-dd'));     
        
        let result;
        if (itemType === 'task') {
          result = await deleteTask(selectedItemId, deleteAll, selectedDate);
          
          if (isCurrentDay || (deleteAll && doesItemFallOnCurrentDay(reduxTasks, selectedItemId))) {
            dispatch(deleteTaskAction({ 
              taskId: selectedItemId, 
              startTime: formatTimeForRedux(selectedItem.startTime),
              endTime: formatTimeForRedux(selectedItem.endTime)
            }));
          }
        } else {
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
              
              const reminderDate = new Date(selectedItem.selectedTime);
              console.log('[DELETE REMINDER] Parsed reminder date:', reminderDate);
              
              const hour = reminderDate.getHours();
              const isPM = hour >= 12;
              const hourFormatted = `${hour % 12 || 12}:00 ${isPM ? 'PM' : 'AM'}`;
              
              console.log('[DELETE REMINDER] Formatted hour:', hourFormatted);
              
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

        await fetchTasksAndReminders();

        toast.success(result.message, {
          position: "top-center",
        });
      } catch (error) {
        console.error('Error deleting item:', error);
        // Specific handling for "already deleted" error
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

  const displayedTasks = isCurrentDay ? tasks : fetchedTasks;
  const displayedReminders = isCurrentDay ? reminders : fetchedReminders;

  // Function to filter and sort time slots based on settings
  const getFilteredTimeSlots = () => {
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
      
      // First check if hour is hidden
      if (settings.hiddenHours && settings.hiddenHours.includes(time)) {
        return false;
      }
      
      // Then check if it's within the time range
      if (endNum >= startNum) {
        return timeNum >= startNum && timeNum <= endNum;
      } else {
        return timeNum >= startNum || timeNum <= endNum;
      }
    });
  };

  // Get filtered time slots
  const filteredTimeSlots = getFilteredTimeSlots();

 

  // Ensure we have objects before trying to use Object.values
  const flattenedTasks = React.useMemo(() => {
    return Object.values(displayedTasks || {}).flat();
  }, [displayedTasks]);

  const flattenedReminders = React.useMemo(() => {
    return Object.values(displayedReminders || {}).flat();
  }, [displayedReminders]);

  return (
    <div className={`daily-planner daily-planner-${context}`}>
      <h2 className='day-title'>{day}</h2>
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

      <DeleteTaskModal
        isOpen={isDeleteModalOpen}
        isRepeatingTask={isRepeatingItem}
        onClose={closeDeleteModal}
        onDeleteSingle={() => confirmDelete(false)}
        onDeleteAll={() => confirmDelete(true)}
        itemType={itemType}
      />

    </div>
  );
};

const mapStateToProps = (state) => ({
  currentDay: state.currentDay,
  currentHour: state.currentHour,
  currentTask: state.currentTask,
  selectedDayFlag: state.dailyPlannerFlag,
  selectedDayUI: state.selectedDayUI,
});

export default connect(mapStateToProps)(DailyPlanner);