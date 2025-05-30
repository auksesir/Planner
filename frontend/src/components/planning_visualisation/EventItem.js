import { format } from 'date-fns';
import React from 'react';
import '../styles/components/EventItem.css';

const EventItem = ({ event, type }) => {
  const isTask = type === 'task';
  
  // Format time based on event type
  const eventTime = isTask 
    ? `${format(new Date(event.startTime), 'h:mm a')} - ${format(new Date(event.endTime), 'h:mm a')}`
    : format(new Date(event.selectedTime), 'h:mm a');

  return (
    <div className="event-item">
      <span 
        className="event-dot" 
        style={{ backgroundColor: isTask ? '#4285f4' : '#34a853' }}
      />
      <div className="event-details">
        <div className="event-time">{eventTime}</div>
        <div className="event-title">{event.name}</div>
      </div>
    </div>
  );
};

export default EventItem;