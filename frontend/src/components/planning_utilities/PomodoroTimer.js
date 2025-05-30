import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FaPause, FaPlay, FaRedo, FaStepForward, FaTimes } from '../../icons/index';
import '../../styles/components/planning_utilities/PomodoroTimer.css';

const PomodoroTimer = ({ workDuration, breakDuration, onTogglePomodoro, onSessionComplete }) => {
  const [timeLeft, setTimeLeft] = useState(workDuration * 60);
  const [mode, setMode] = useState('work');
  const [cycles, setCycles] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isPaused, setIsPaused] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState(new Date());
  const [percentageComplete, setPercentageComplete] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const timerRef = useRef(null);
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const stateLoadedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const loadState = async () => {
      if (!mountedRef.current) return;

      const savedState = localStorage.getItem('pomodoroState');
      
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          const currentTime = new Date().getTime();
          const savedTime = new Date(state.timestamp).getTime();
          
          let adjustedTimeLeft;
          if (state.isPaused) {
            adjustedTimeLeft = state.timeLeft;
          } else {
            const elapsedSeconds = Math.floor((currentTime - savedTime) / 1000);
            adjustedTimeLeft = Math.max(0, state.timeLeft - elapsedSeconds);
          }
          
          if (mountedRef.current) {
            setMode(state.mode || 'work');
            setCycles(state.cycles || 0);
            setIsPaused(state.isPaused === true);
            setTimeLeft(adjustedTimeLeft);
            
            const totalDuration = state.mode === 'work' ? workDuration * 60 : breakDuration * 60;
            const elapsed = totalDuration - adjustedTimeLeft;
            const percentage = (elapsed / totalDuration) * 100;
            setPercentageComplete(Math.min(100, Math.max(0, percentage)));
            
            if (state.sessionStartTime) {
              setSessionStartTime(new Date(state.sessionStartTime));
            }
            

          }
        } catch (err) {
          console.error('Error loading timer state:', err);
          if (mountedRef.current) {
            setTimeLeft(workDuration * 60);
            setMode('work');
            setCycles(0);
            setIsPaused(true);
            setPercentageComplete(0);
          }
        }
      }
      
      if (mountedRef.current) {
        setIsInitialized(true);
        stateLoadedRef.current = true;
      }
    };
    
    loadState();
  }, [workDuration, breakDuration]);

  useEffect(() => {
    if (!stateLoadedRef.current || !isInitialized) return;
    
    const saveState = () => {
      const state = {
        mode,
        timeLeft,
        cycles,
        isPaused,
        sessionStartTime: sessionStartTime.toISOString(),
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('pomodoroState', JSON.stringify(state));
    };
    
    saveState();
  }, [mode, timeLeft, cycles, isPaused, sessionStartTime, isInitialized]);
  
  useEffect(() => {
    if (!isInitialized || !mountedRef.current) return;
    
    if (isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    timerRef.current = setInterval(() => {
      if (!mountedRef.current) {
        clearInterval(timerRef.current);
        return;
      }

      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          playNotificationSound();
          
          if (onSessionComplete) {
            onSessionComplete(mode === 'work', mode === 'work' ? workDuration : breakDuration);
          }
          
          if (mountedRef.current) {
            const newSessionStartTime = new Date();
            setSessionStartTime(newSessionStartTime);
            
            if (mode === 'work') {
              setMode('break');
              setPercentageComplete(0);
              return breakDuration * 60;
            } else {
              setMode('work');
              setCycles(c => c + 1);
              setPercentageComplete(0);
              return workDuration * 60;
            }
          }
          return prevTime;
        }
        
        if (mountedRef.current) {
          const totalSeconds = mode === 'work' ? workDuration * 60 : breakDuration * 60;
          const secondsElapsed = totalSeconds - (prevTime - 1);
          const newPercentage = (secondsElapsed / totalSeconds) * 100;
          setPercentageComplete(newPercentage);
        }
        
        return prevTime - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPaused, mode, isInitialized, workDuration, breakDuration]);

  const playNotificationSound = () => {
    try {
      const soundFile = mode === 'work' 
        ? '/sounds/work-complete.mp3' 
        : '/sounds/break-complete.mp3';
      
      const audio = new Audio(soundFile);
      audio.volume = 0.7;
      
      audio.play().catch(err => {
        console.error('Error playing sound:', err);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`${mode === 'work' ? 'Work session' : 'Break'} completed!`);
        }
      });
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  const togglePause = () => {
    if (!mountedRef.current) return;
    setIsPaused(p => !p);
  };

  const resetTimer = () => {
    if (!mountedRef.current) return;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const newTime = mode === 'work' ? workDuration * 60 : breakDuration * 60;
    setTimeLeft(newTime);
    setPercentageComplete(0);
    setIsPaused(true);
    setSessionStartTime(new Date());
  };

  const skipToNext = () => {
    if (!mountedRef.current) return;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const newMode = mode === 'work' ? 'break' : 'work';
    const newTime = newMode === 'work' ? workDuration * 60 : breakDuration * 60;
    
    setMode(newMode);
    setTimeLeft(newTime);
    setPercentageComplete(0);
    setIsPaused(true);
    setSessionStartTime(new Date());
    
    if (newMode === 'work') {
      setCycles(c => c + 1);
    }
  };

  const handleClose = () => {
    localStorage.removeItem('pomodoroState');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    onTogglePomodoro(false);
  };

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
    linear-gradient(to bottom, rgba(44, 20, 180, 0.2) 0%, rgba(11, 17, 65, 0.2) 33%, rgba(20, 13, 233, 0.2) 50%, rgba(29, 4, 59, 0.2) 75%, rgba(71, 68, 172, 0.2) 100%)
  `;

  const fillBackground = `
    linear-gradient(to bottom, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2)),
    radial-gradient(circle at 80% 100%, ${mode === 'work' ? 'rgb(214, 67, 67)' : 'rgb(67, 214, 115)'} 0%, rgba(36, 44, 189, 0) 15%),
    radial-gradient(circle at 30% 80%, rgba(29, 51, 217, 0.5) 2%, rgba(35, 10, 173, 0) 20%),
    radial-gradient(circle at 20% 30%, rgba(98, 115, 201, 0.406) 5%, rgba(205, 199, 195, 0) 20%),
    radial-gradient(circle at 60% 55%, rgba(18, 43, 202, 0.778) 3%, rgba(146, 132, 121, 0) 11%),
    radial-gradient(circle at 80% 30%, ${mode === 'work' ? 'rgb(215, 63, 63)' : 'rgb(63, 215, 110)'} 5%, rgba(146, 132, 121, 0) 20%),
    radial-gradient(circle at 90% 40%, ${mode === 'work' ? 'rgb(236, 98, 98)' : 'rgb(98, 236, 127)'} 5%, rgba(179, 115, 81, 0) 20%),
    radial-gradient(circle at 70% 62%, ${mode === 'work' ? '#b52b2b' : '#2bb543'} 5%, rgba(196, 183, 176, 0) 20%),
    radial-gradient(circle at 80% 60%, ${mode === 'work' ? 'rgba(166, 26, 26, 0.855)' : 'rgba(26, 166, 58, 0.855)'} 10%, rgba(84, 95, 89, 0) 30%),
    radial-gradient(circle at 10% 60%, rgba(126, 130, 203, 0.018) 10%, rgba(79, 6, 6, 0) 30%),
    linear-gradient(to right, rgba(6, 6, 62, 0.179) 50%, rgba(12, 31, 159, 0.25) 75%, ${mode === 'work' ? 'rgba(167, 58, 58, 0.722)' : 'rgba(58, 167, 84, 0.722)'} 100%),
    linear-gradient(to bottom, rgba(44, 20, 180, 0.568) 0%, rgba(11, 17, 65, 0.065) 33%, rgba(20, 13, 233, 0.179) 50%, ${mode === 'work' ? 'rgb(59, 4, 4)' : 'rgb(4, 59, 25)'} 75%, rgba(71, 68, 172, 0.251) 100%)
  `;

  if (!isInitialized) {
    return (
      <div className={`pomodoro-container ${isHomePage ? 'notcentered' : ''}`}>
        <div className="pomodoro-timer">
          <div className="timer-sphere-container">
            <div className="timer-sphere" style={{ background: transparentBackground }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                fontSize: '1.5rem'
              }}>
                Loading timer...
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const minutesLeft = Math.floor(timeLeft / 60);
  const secondsLeft = timeLeft % 60;

  return (
    <div className={`pomodoro-container ${isHomePage ? 'notcentered' : ''}`}>
      <div className="pomodoro-timer">
        <div className="timer-sphere-container">
          <div className="timer-sphere" style={{
            background: transparentBackground,
            overflow: 'hidden'
          }}>
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
            
            <div 
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '20%',
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '1.6rem',
                  fontWeight: '500',
                  color: 'rgba(255, 255, 255, 0.8)',
                  textShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: '2px'
                }}>
                  {mode === 'work' ? 'Work' : 'Break'}
                </span>
              </div>
              
              <div style={{
                position: 'absolute',
                top: '35%',
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  color: 'rgba(255, 255, 255, 0.8)',
                  textShadow: '0 0 10px rgba(0, 0, 0, 0.3)'
                }}>
                  {`${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}`}
                </span>
              </div>

              <div style={{
                position: 'absolute',
                bottom: '25%',
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '1.2rem',
                  fontWeight: '500',
                  color: 'rgba(255, 255, 255, 0.7)',
                  textShadow: '0 0 10px rgba(0, 0, 0, 0.3)'
                }}>
                  {`Cycle: ${cycles + 1}`}
                </span>
              </div>
              
              <div style={{
                position: 'absolute',
                bottom: '15%',
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
        </div>
        
        <div className="timer-controls-container">
          <div className="timer-controls">
            <button 
              className="timer-button reset" 
              onClick={resetTimer}
              aria-label="Reset timer"
            >
              <FaRedo />
            </button>
            
            <button 
              className="timer-button play-pause" 
              onClick={togglePause}
              aria-label={isPaused ? "Start timer" : "Pause timer"}
            >
              {isPaused ? <FaPlay /> : <FaPause />}
            </button>
            
            <button 
              className="timer-button skip" 
              onClick={skipToNext}
              aria-label="Skip to next session"
            >
              <FaStepForward />
            </button>
            
            <button 
              className="timer-button close" 
              onClick={handleClose}
              aria-label="Close Pomodoro timer"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;