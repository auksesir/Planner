import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const CombinedSphere = ({ currentTask }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [percentageComplete, setPercentageComplete] = useState(0);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  // Parse the date string from the format "dd/MM/yyyy, HH:mm:ss"
  const parseDateTime = (dateStr) => {
    try {
      const [datePart, timePart] = dateStr.split(', ');
      const [day, month, year] = datePart.split('/');
      return new Date(`${year}-${month}-${day}T${timePart}`);
    } catch (error) {
      ('Error parsing date string:', dateStr, error);
      return new Date(); // Return current date as fallback
    }
  };

  // Log when current task changes to help with debugging
  useEffect(() => {
    ('CombinedSphere received task:', currentTask);
    if (currentTask) {
      ('Task repeat option:', currentTask.repeatOption);
    }
  }, [currentTask]);

  useEffect(() => {
    let timer;
    
    if (currentTask?.startTime && currentTask?.endTime) {
      const updateTimer = () => {
        try {
          // Parse dates from the task
          const taskStartTime = parseDateTime(currentTask.startTime);
          const taskEndTime = parseDateTime(currentTask.endTime);
          const now = new Date();
          
          // Special handling for recurring tasks
          if (currentTask.repeatOption) {
            // For recurring tasks, we need to use the time part only
            const currentTimeOfDay = new Date(1970, 0, 1, now.getHours(), now.getMinutes(), now.getSeconds());
            
            // Extract the time part from the start and end times
            const taskStartTimeOfDay = new Date(1970, 0, 1, 
              taskStartTime.getHours(), 
              taskStartTime.getMinutes(), 
              taskStartTime.getSeconds()
            );
            
            const taskEndTimeOfDay = new Date(1970, 0, 1, 
              taskEndTime.getHours(), 
              taskEndTime.getMinutes(), 
              taskEndTime.getSeconds()
            );
            
            // Calculate the total duration of the task (in this session)
            let totalDuration = taskEndTimeOfDay - taskStartTimeOfDay;
            if (totalDuration <= 0) {
              // Task crosses midnight
              totalDuration += 24 * 60 * 60 * 1000;
            }
            
            // Calculate time left for the current session
            let currentTimeLeft = taskEndTimeOfDay - currentTimeOfDay;
            if (currentTimeLeft < 0) {
              // If end time is earlier than current time and this is a recurring task,
              // it means the task ends tomorrow
              currentTimeLeft += 24 * 60 * 60 * 1000;
            }
            
            // Calculate elapsed time for the current session
            let elapsed = currentTimeOfDay - taskStartTimeOfDay;
            if (elapsed < 0) {
              // If start time is later than current time and this is a recurring task,
              // it means the task started yesterday
              elapsed += 24 * 60 * 60 * 1000;
            }
            
            // Convert to seconds and set state
            const timeLeftSeconds = Math.max(0, Math.floor(currentTimeLeft / 1000));
            setTimeLeft(timeLeftSeconds);
            
            // Calculate and set percentage
            const percentage = (elapsed / totalDuration) * 100;
            setPercentageComplete(Math.min(100, Math.max(0, percentage)));
            
            return timeLeftSeconds;
          } else {
            // For non-recurring tasks, use the full date-time calculation
            const totalDuration = taskEndTime - taskStartTime;
            const currentTimeLeft = taskEndTime - now;
            const timeLeftSeconds = Math.max(0, Math.floor(currentTimeLeft / 1000));
            setTimeLeft(timeLeftSeconds);
            
            // Calculate percentage
            const elapsed = now - taskStartTime;
            const percentage = (elapsed / totalDuration) * 100;
            setPercentageComplete(Math.min(100, Math.max(0, percentage)));
            
            return timeLeftSeconds;
          }
        } catch (error) {
          ('Error updating timer:', error);
          return 0;
        }
      };
      
      // Initial update
      const initialTimeLeft = updateTimer();
      
      // Set up interval timer if time remains
      if (initialTimeLeft > 0) {
        timer = setInterval(() => {
          const remainingTime = updateTimer();
          if (remainingTime <= 0) {
            clearInterval(timer);
          }
        }, 1000);
      }
    } else {
      // Reset values if no current task
      setTimeLeft(0);
      setPercentageComplete(0);
    }
    
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [currentTask]);

  // Semi-transparent background version with more opacity
  const transparentBackground = `
    radial-gradient(circle at 80% 100%, rgba(113, 67, 214, 0.2) 0%, rgba(36, 44, 189, 0) 15%),
    radial-gradient(circle at 30% 80%, rgba(29, 51, 217, 0.2) 2%, rgba(35, 10, 173, 0) 20%),
    radial-gradient(circle at 20% 30%, rgba(98, 115, 201, 0.2) 5%, rgba(205, 199, 195, 0) 20%),
    radial-gradient(circle at 60% 55%, rgba(18, 43, 202, 0.2) 3%, rgba(146, 132, 121, 0) 11%),
    radial-gradient(circle at 80% 30%, rgba(63, 83, 215, 0.2) 5%, rgba(146, 132, 121, 0) 20%),
    radial-gradient(circle at 90% 40%, rgba(98, 116, 236, 0.2) 5%, rgba(179, 115, 81, 0) 20%),
    radial-gradient(circle at 70% 62%, rgba(59, 43, 181, 0.2) 5%, rgba(196, 183, 176, 0) 20%),
    radial-gradient(circle at 80% 60%, rgba(26, 42, 166, 0.2) 10%, rgba(84, 95, 89, 0) 30%),
    radial-gradient(circle at 10% 60%, rgba(126, 130, 203, 0.2) 10%, rgba(79, 6, 6, 0) 30%),
    linear-gradient(to right, rgba(6, 6, 62, 0.2) 50%, rgba(12, 31, 159, 0.2) 75%, rgba(167, 58, 58, 0.2) 100%),
    linear-gradient(to bottom, rgba(44, 20, 180, 0.2) 0%, rgba(11, 17, 65, 0.2) 33%, rgba(20, 13, 233, 0.2) 50%, rgba(29, 4, 59, 0.2) 75%, rgba(71, 68, 172, 0.2) 100%)`;

  // Full color version for the fill with white mix
  const fillBackground = `
    linear-gradient(to bottom, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2)),
    radial-gradient(circle at 80% 100%, rgb(113, 67, 214) 0%, rgba(36, 44, 189, 0) 15%),
    radial-gradient(circle at 30% 80%, rgba(29, 51, 217, 0.5) 2%, rgba(35, 10, 173, 0) 20%),
    radial-gradient(circle at 20% 30%, rgba(98, 115, 201, 0.406) 5%, rgba(205, 199, 195, 0) 20%),
    radial-gradient(circle at 60% 55%, rgba(18, 43, 202, 0.778) 3%, rgba(146, 132, 121, 0) 11%),
    radial-gradient(circle at 80% 30%, rgb(63, 83, 215) 5%, rgba(146, 132, 121, 0) 20%),
    radial-gradient(circle at 90% 40%, rgb(98, 116, 236) 5%, rgba(179, 115, 81, 0) 20%),
    radial-gradient(circle at 70% 62%, #3b2bb5 5%, rgba(196, 183, 176, 0) 20%),
    radial-gradient(circle at 80% 60%, rgba(26, 42, 166, 0.855) 10%, rgba(84, 95, 89, 0) 30%),
    radial-gradient(circle at 10% 60%, rgba(126, 130, 203, 0.018) 10%, rgba(79, 6, 6, 0) 30%),
    linear-gradient(to right, rgba(6, 6, 62, 0.179) 50%, rgba(12, 31, 159, 0.25) 75%, rgba(167, 58, 58, 0.722) 100%),
    linear-gradient(to bottom, rgba(44, 20, 180, 0.568) 0%, rgba(11, 17, 65, 0.065) 33%, rgba(20, 13, 233, 0.179) 50%, rgb(29, 4, 59) 75%, rgba(71, 68, 172, 0.251) 100%)`;

  const minutesLeft = Math.floor(timeLeft / 60);
  const secondsLeft = timeLeft % 60;

  const styles = `
    .timer-sphere {
      z-index: -1;
      width: 15rem;
      height: 15rem;
      border-radius: 50%;
      box-shadow: 0 0 .5rem .3rem rgba(255, 255, 255, 0.076), inset 0 0 1rem 2rem rgba(241, 223, 206, 0.075);
      animation: bounce 7s ease-in-out infinite;
      filter: blur(.03rem);
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      transition: all 0.5s ease-in-out;
      background: transparent;
    }

    .timer-sphere.notcentered {
      top: 39%;
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div 
        className={`timer-sphere ${isHomePage ? 'notcentered' : ''}`}
        style={{
          background: transparentBackground,
          overflow: 'hidden'
        }}
      >
        {/* Rising fill level */}
        <div 
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${percentageComplete}%`,
            background: fillBackground,
            filter: 'blur(4px)',
            transition: 'height 1s linear'
          }}
        />
        
        {/* Timer text overlay */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none'
          }}
        >
          {/* Timer in top half */}
          <div style={{
            position: 'absolute',
            top: '25%', // Position at 1/4 of the sphere
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'rgba(255, 255, 255, 0.8)',
              textShadow: '0 0 10px rgba(0, 0, 0, 0.3)'
            }}>
              {`${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}`}
            </span>
          </div>

          {/* Percentage in bottom half */}
          <div style={{
            position: 'absolute',
            bottom: '25%', // Position at 1/4 from bottom of the sphere
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: '1.6rem',
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.7)',
              textShadow: '0 0 10px rgba(0, 0, 0, 0.3)'
            }}>
              {`${Math.round(percentageComplete)}%`}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default CombinedSphere;