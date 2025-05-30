import { isCurrentTask } from '../../utils/taskUtils';
import { formattedTime } from '../../utils/timeUtils';
import TaskReminderIcon from '../planning_utilities/TaskReminderIcon';

const TimeSlot = ({
  time,
  day,
  currentDay,
  currentHour,
  tasks,
  reminders,
  handleDeleteTask,
  handleEditTask,
  handleSetReminder,
  handleClearReminder,
  currentTask,
}) => {
  const normalizeAndAccessTasks = (timeStr, tasksObj) => {
    if (tasksObj[timeStr] && tasksObj[timeStr].length > 0) {
      return tasksObj[timeStr];
    }
    
    const [timePart, amPm] = timeStr.split(' ');
    const [hours, minutes] = timePart.split(':');
    
    const variations = [
      `${hours.padStart(2, '0')}:${minutes} ${amPm}`,
      `${parseInt(hours, 10)}:${minutes} ${amPm}`
    ];
    
    for (const variant of variations) {
      if (variant !== timeStr && tasksObj[variant] && tasksObj[variant].length > 0) {
        return tasksObj[variant];
      }
    }
    
    return [];
  };
  
  const displayedTasks = normalizeAndAccessTasks(time, tasks);
  const displayedReminders = normalizeAndAccessTasks(time, reminders);
  
  const combinedItems = [
    ...displayedTasks.map(task => ({ ...task, type: 'task' })),
    ...displayedReminders.map(reminder => ({ ...reminder, type: 'reminder' }))
  ].sort((a, b) => {
    const getDateValue = (item) => {
      const timeValue = item.type === 'task' ? 
        item.startTime : 
        (item.selectedTime || item.startTime);
      
      if (timeValue instanceof Date) {
        return timeValue;
      }
      
      if (typeof timeValue === 'string' && timeValue.includes('GMT')) {
        return new Date(timeValue);
      }
      
      if (typeof timeValue === 'string' && timeValue.includes('/')) {
        const [datePart, timePart] = timeValue.split(', ');
        const [day, month, year] = datePart.split('/').map(Number);
        return new Date(year, month - 1, day, timePart);
      }
      
      return new Date(timeValue);
    };
    
    const timeA = getDateValue(a);
    const timeB = getDateValue(b);
    
    return timeA - timeB;
  });

  const getItemTimes = (item) => {
    if (item.type === 'task') {
      return `${formattedTime(item.startTime)} - ${formattedTime(item.endTime)}`;
    }
    return formattedTime(item.selectedTime || item.startTime);
  };

  const getTimeStatus = () => {
    if (day !== currentDay) {
      return '';
    }
    
    const currentDate = new Date();
    const [timeValue, period] = time.split(' ');
    const [hours] = timeValue.split(':');
    let timeHour = parseInt(hours);
    
    if (period === 'PM' && timeHour !== 12) {
      timeHour += 12;
    } else if (period === 'AM' && timeHour === 12) {
      timeHour = 0;
    }
  
    const currentHour = currentDate.getHours();
    
    if (currentHour === timeHour) {
      return 'current';
    }
    if (currentHour > timeHour) {
      return 'passed';
    }
    return 'future';
  };

  const timeStatus = getTimeStatus();

  return (
    <div className={`time-slot ${timeStatus}`}>      
      <span className="time">{time}</span>
      <div className="time-slot-content">
        {combinedItems.length > 0 ? (
          <ul className="item-list">
            {combinedItems.map((item, index) => (
              <li 
                key={`${item.id}-${index}`} 
                className={`${item.type}-item`}
              >
                <div className="task-content">
                  <div className="item-time-duration">
                    <span className="task-time">{getItemTimes(item)}</span>
                    {item.type === 'task' && (
                      <span className="task-duration">{item.duration}m</span>
                    )}
                  </div>
                  <div className="item-content">
                    <span 
                      className={`task-title ${isCurrentTask(item, currentTask) ? 'highlighted-task' : ''}`}
                      data-testid={`item-${item.id}`}
                    >
                      {item.type === 'reminder' && <span className="reminder-icon">🔔</span>}
                      {item.name}
                    </span>
                    <div className="task-actions">
                      {(item.type === 'task' ) && (
                        <TaskReminderIcon
                          taskId={item.id}
                          taskName={item.name}
                          taskStartTime={item.type === 'task' ? item.startTime : item.selectedTime}
                          hasReminder={item.hasReminder}
                          reminderTime={item.reminderTime}
                          onSetReminder={(id, time) => handleSetReminder(id, time, item.type)}
                          onClearReminder={(id) => handleClearReminder(id, item.type)}
                          itemType={item.type}
                          task={item} // Pass the full task object here - THIS IS THE KEY CHANGE
                        />
                      )}
                      <button 
                        onClick={() => handleEditTask(item)} 
                        className="edit-button"
                      >
                        ✎
                      </button>
                      <button 
                        onClick={() => handleDeleteTask(item.id, item, item.type)} 
                        className="delete-button"
                      >
                        ✖
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="no-items" data-testid="no-items"></div>
        )}
      </div>
    </div>
  );
};

export default TimeSlot;