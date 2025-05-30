import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getPomodoroSettings } from '../../api/pomodoroApi';
import '../../styles/components/input_components/PomodoroInputBar.css';

const PomodoroInputBar = ({ onCancel, onStartPomodoro }) => {
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const settings = await getPomodoroSettings();
        
        if (!settings.error) {
          setWorkDuration(settings.work_duration || 25);
          setBreakDuration(settings.break_duration || 5);
        }
      } catch (error) {
        console.error('Error loading Pomodoro settings:', error);
        toast.error('Failed to load Pomodoro settings. Using defaults.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  const handleStartPomodoro = () => {
    // Validate inputs (ensure they're numbers and within reasonable ranges)
    const workMin = Math.max(1, Math.min(120, workDuration));
    const breakMin = Math.max(1, Math.min(60, breakDuration));
    
    onStartPomodoro(workMin, breakMin);
  };

  return (
    <div className="input-container">
      <div className="input-wrapper">
        <div className="pomodoro-input">
          <h3 className="pomodoro-input-title">Pomodoro Timer</h3>
          
          <div className="pomodoro-info">
            <p>The Pomodoro Technique uses a timer to break work into intervals, traditionally 25 minutes in length, separated by short breaks.</p>
          </div>
          
          {isLoading ? (
            <div className="pomodoro-loading">Loading settings...</div>
          ) : (
            <div className="pomodoro-settings">
              <div className="pomodoro-setting-field">
                <label htmlFor="work-duration">Work Duration (minutes)</label>
                <input
                  id="work-duration"
                  type="number"
                  min="1"
                  max="120"
                  value={workDuration}
                  onChange={(e) => setWorkDuration(Number(e.target.value))}
                  className="pomodoro-input-field"
                />
              </div>
              
              <div className="pomodoro-setting-field">
                <label htmlFor="break-duration">Break Duration (minutes)</label>
                <input
                  id="break-duration"
                  type="number"
                  min="1"
                  max="60"
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(Number(e.target.value))}
                  className="pomodoro-input-field"
                />
              </div>
            </div>
          )}
          
          <div className="pomodoro-input-actions">
            <button className="button-input" onClick={onCancel}>
              Go Back
            </button>
            <button 
              className="button-input start-pomodoro" 
              onClick={handleStartPomodoro}
              disabled={isLoading}
            >
              Start Pomodoro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PomodoroInputBar;