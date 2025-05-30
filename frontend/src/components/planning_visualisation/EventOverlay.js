import React from 'react';
import EventItem from './EventItem';

const EventOverlay = ({ events }) => {
  if (events.length === 0) return null;

  return (
    <div className="day-cell-hover-overlay">
      <div className="events-list">
        {events.map((event, index) => (
          <EventItem 
            key={`${event.type}-${event.id || index}`} 
            event={event} 
            type={event.type} 
          />
        ))}
      </div>
    </div>
  );
};

export default EventOverlay;