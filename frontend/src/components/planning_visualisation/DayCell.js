import { format, getHours, getMinutes } from 'date-fns';
import { useMemo, useState } from 'react';
import '../../styles/components/planning_visualisation/DayCell.css';
import { formatTimeLabel, getVisibleHours } from '../../utils/timeUtils';

const EventBlock = ({ event, onEventEdit, onEventDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const [startTimeStr, durationText] = useMemo(() => {
    if (event.type === 'task') {
      const startStr = format(new Date(event.startTime), 'h:mm a');
      const durationMinutes = event.minutesInThisHour;
      const durText = durationMinutes >= 60 
        ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
        : `${durationMinutes}m`;
      return [startStr, durText];
    }
    // Handle reminders properly by using selectedTime or time
    const reminderTime = event.selectedTime || event.time;
    return [format(new Date(reminderTime), 'h:mm a'), ''];
  }, [event]);

  const blockClass = `event-block ${event.type}-block`;
  
  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling up to edit handler
    onEventDelete(event);
  };
  
  return (
    <div 
      className={blockClass} 
      title={`${event.name} (${startTimeStr}${durationText ? ` - ${durationText}` : ''})`}
      onClick={() => onEventEdit(event)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="event-name">
        <div className="task-time">
          <span>{startTimeStr}</span>
          <span>{event.name}</span>
        </div>
        {event.type === 'task' && (
          <span className="task-duration">{durationText}</span>
        )}
      </div>
      
      {isHovered && (
        <button 
          className="delete-button-mini"
          onClick={handleDeleteClick}
          title={`Delete ${event.type}`}
        >
          ✖
        </button>
      )}
    </div>
  );
};

const DayCell = ({ 
  date, 
  tasks, 
  reminders, 
  settings, 
  onEventEdit, 
  onEventDelete,
  hourHeights = {} 
}) => {
  const visibleHours = useMemo(() => getVisibleHours(settings), [settings]);

  // Add logging to verify data
  
  const processedEventsByHour = useMemo(() => {
    const hourMap = {};

    visibleHours.forEach(hour => {
      hourMap[hour] = {
        events: [],
        taskCount: 0
      };
    });

    // Process tasks
    (tasks || []).forEach((task) => {
      const startTime = new Date(task.startTime);
      const endTime = new Date(task.endTime);
      const startHour = getHours(startTime);
      const endHour = getHours(endTime);
      
      for (let hour = startHour; hour <= endHour; hour++) {
        if (!hourMap[hour]) continue;

        let minutesInThisHour;
        let startMinute;

        if (hour === startHour) {
          startMinute = getMinutes(startTime);
          if (hour === endHour) {
            minutesInThisHour = getMinutes(endTime) - startMinute;
          } else {
            minutesInThisHour = 60 - startMinute;
          }
        } else if (hour === endHour) {
          startMinute = 0;
          minutesInThisHour = getMinutes(endTime);
          if (minutesInThisHour === 0) continue;
        } else {
          startMinute = 0;
          minutesInThisHour = 60;
        }

        if (minutesInThisHour > 0) {
          hourMap[hour].events.push({
            ...task,
            type: 'task',
            startMinute,
            minutesInThisHour,
            startTime: task.startTime,
            endTime: task.endTime
          });
          hourMap[hour].taskCount++;
        }
      }
    });

    // Process reminders
    (reminders || []).forEach(reminder => {
      const reminderTime = reminder.selectedTime || reminder.time;
      if (!reminderTime) {
        return;
      }
    
      // Ensure we're working with a proper date object
      const time = new Date(reminderTime);
      if (isNaN(time.getTime())) {
        return;
      }
    
      // Get the hour of the reminder
      const hour = getHours(time);
      const minute = getMinutes(time);
    
      // Verify the hour exists in our visible hours
      if (hourMap[hour]) {
        hourMap[hour].events.push({
          ...reminder,
          type: 'reminder',
          startMinute: minute,
          minutesInThisHour: 15,
          time: reminderTime
        });
      }
    });

    // Sort events by start time
    Object.keys(hourMap).forEach(hour => {
      hourMap[hour].events.sort((a, b) => a.startMinute - b.startMinute);
    });

    return hourMap;
  }, [tasks, reminders, visibleHours]);

  return (
    <div className="day-cell">
      <div className="day-header">
        <div className="day-name">{format(date, 'EEE')}</div>
        <div className="day-number">{format(date, 'd')}</div>
      </div>

      <div className="hourly-grid">
        {visibleHours.map(hour => {
          const hourData = processedEventsByHour[hour];
          
          return (
            <div 
              key={hour} 
              className="hour-cell"
            >
              <div className="hour-label">
                {formatTimeLabel(hour)}
              </div>
              <div 
                className="events-container"
                style={{ 
                  minHeight: hourHeights[hour] ? `${hourHeights[hour]}px` : '60px'
                }}
              >
                {hourData.events.map((event, index) => (
                  <EventBlock
                    key={`${event.type}-${event.id}-${index}`}
                    event={event}
                    onEventEdit={onEventEdit}
                    onEventDelete={onEventDelete}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DayCell;