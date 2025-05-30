import React from 'react';

const HourlyGrid = ({ visibleHours }) => {
  return (
    <div className="hourly-grid">
      {visibleHours.map(hour => (
        <div key={hour} className="hour-cell">
          <div className="hour-label">
            {`${hour.toString().padStart(2, '0')}:00`}
          </div>
        </div>
      ))}
    </div>
  );
};

export default HourlyGrid;