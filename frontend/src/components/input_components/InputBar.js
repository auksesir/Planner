import { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { addReminder, deleteReminder } from '../../redux/reminders/actions/remindersActions';
import { addTask, deleteTask } from '../../redux/tasks/actions/tasksActions';
import '../../styles/components/input_components/InputBar.css';
import { handleAddOrUpdateReminder } from '../../utils/reminderUtils';
import { handleAddOrUpdateTask } from '../../utils/taskUtils';
import PomodoroInputBar from './PomodoroInputBar';
import ReminderInputBar from './ReminderInputBar';
import TaskInputBar from './TaskInputBar';

const InputBar = ({ 
  selectedDayUI, 
  taskToEdit, 
  reminderToEdit, 
  setTaskToEdit, 
  setReminderToEdit,
  addTask,
  deleteTask,
  updateTask,
  addReminder,
  deleteReminder,
  updateReminder,
  newTaskDefaults,
  setNewTaskDefaults,
  newReminderDefaults,
  setNewReminderDefaults,
  onTogglePomodoro,
  isPomodoroActive,
  onToggleTimerType,
  showTaskTimer,
  currentTask
}) => {
  const [inputType, setInputType] = useState(null);

  useEffect(() => {
    if (newTaskDefaults) {
      console.log("InputBar received task defaults:", newTaskDefaults);
      console.log("nodeContext in defaults:", newTaskDefaults.nodeContext);
    }
  }, [newTaskDefaults]);

  // Determine what to show based on props
  useEffect(() => {
    if (taskToEdit) {
      setInputType('task');
    } else if (reminderToEdit) {
      setInputType('reminder');
    } else if (newTaskDefaults) {
      setInputType('task');
    } else if (newReminderDefaults) {
      setInputType('reminder');
    }
  }, [taskToEdit, reminderToEdit, newTaskDefaults, newReminderDefaults]);

  const handleCancel = () => {
    // Clear all state and close the input
    setInputType(null);
    setTaskToEdit(null);
    setReminderToEdit(null);
    setNewTaskDefaults(null);
    setNewReminderDefaults(null);
  };

  useEffect(() => {
    if (taskToEdit) {
      setInputType('task');
    } else if (reminderToEdit) {
      setInputType('reminder');
    }
  }, [taskToEdit, reminderToEdit]);

  const handleInputChange = (type) => {
    setInputType(type);
    setTaskToEdit(null);
    if (setReminderToEdit) {
      setReminderToEdit(null);
    }
  };

  const onCancel = () => {
    setInputType(null);
    setTaskToEdit(null);
    if (setReminderToEdit) {
      setReminderToEdit(null);
    }
  };

  const handleAddOrUpdateTaskWrapper = async (task, repeatTaskOnCurrentDay) => {
    try {
      await handleAddOrUpdateTask(
        task,
        repeatTaskOnCurrentDay,
        taskToEdit,
        addTask,
        deleteTask
      );
      
      setInputType(null);
      setTaskToEdit(null);
    } catch (error) {
      console.error('Error handling task:', error);
    }
  };

  const handleAddOrUpdateReminderWrapper = async (reminder, repeatReminderOnCurrentDay) => {
    try {
      await handleAddOrUpdateReminder(
        reminder,
        repeatReminderOnCurrentDay,
        reminderToEdit,
        addReminder,
        deleteReminder
      );
      
      setInputType(null); 
      setReminderToEdit(null);
      
    } catch (error) {
      console.error('Error handling reminder:', error);
    }
  };

  const handleStartPomodoro = (workDuration, breakDuration) => {
    onTogglePomodoro(true, workDuration, breakDuration);
    setInputType(null);
  };

  const handleToggleTimerDisplay = () => {
    // If Pomodoro isn't active yet, start it
    if (!isPomodoroActive) {
      handleInputChange('pomodoro');
      return;
    }

    // If Pomodoro is active, toggle between timers
    onToggleTimerType();
    toast.info(`Switched to ${showTaskTimer ? 'Pomodoro Timer' : 'Task Timer'}`, {
      position: "bottom-center",
      autoClose: 2000
    });
  };

  const handleStopPomodoro = () => {
    onTogglePomodoro(false);
  };

  return (
    <div>
      {!taskToEdit && !reminderToEdit && inputType === null && (
        <div className='input-container'>
          <div className='input-wrapper'>
            <button onClick={() => handleInputChange('task')}>Task</button>
            
            {/* Pomodoro/Timer toggle button */}
            {currentTask ? (
              // When there's a current task
              isPomodoroActive ? (
                // If pomodoro is active, show toggle button
                <button 
                  onClick={handleToggleTimerDisplay} 
                  className={`pomodoro-button ${!showTaskTimer ? 'active' : ''}`}
                >
                  ⏱️ {showTaskTimer ? 'Switch to Pomodoro' : 'Switch to Task Timer'}
                </button>
              ) : (
                // If pomodoro is not active, show start button
                <button 
                  onClick={() => handleInputChange('pomodoro')} 
                  className="pomodoro-button"
                >
                  ⏱️ Start Pomodoro
                </button>
              )
            ) : (
              // No current task - show regular pomodoro toggle
              isPomodoroActive ? (
                <button 
                  onClick={handleStopPomodoro} 
                  className="pomodoro-button active"
                >
                  ⏱️ Stop Pomodoro
                </button>
              ) : (
                <button 
                  onClick={() => handleInputChange('pomodoro')} 
                  className="pomodoro-button"
                >
                  ⏱️ Start Pomodoro
                </button>
              )
            )}
            
            <button onClick={() => handleInputChange('reminder')}>Reminder</button>
          </div>
        </div>
      )}

      {inputType === 'task' && (
        <TaskInputBar 
          onCancel={onCancel}
          onAddOrUpdateTask={handleAddOrUpdateTaskWrapper}
          taskToEdit={taskToEdit}
          selectedDayUI={selectedDayUI}
          defaultValues={newTaskDefaults}
        />
      )}

      {inputType === 'reminder' && (
        <ReminderInputBar 
          onCancel={onCancel}
          onAddOrUpdateReminder={handleAddOrUpdateReminderWrapper}
          reminderToEdit={reminderToEdit}
          selectedDayUI={selectedDayUI}
          defaultValues={newReminderDefaults}
        />
      )}
      
      {inputType === 'pomodoro' && (
        <PomodoroInputBar
          onCancel={onCancel}
          onStartPomodoro={handleStartPomodoro}
        />
      )}
    </div>
  );
};

const mapStateToProps = (state) => ({
  selectedDayUI: state.selectedDayUI,
  currentTask: state.currentTask,
});

const mapDispatchToProps = (dispatch) => ({
  addTask: (task) => dispatch(addTask(task)),
  deleteTask: (taskInfo) => dispatch(deleteTask(taskInfo)),
  addReminder: (reminder) => dispatch(addReminder(reminder)),
  deleteReminder: (reminderInfo) => dispatch(deleteReminder(reminderInfo))
});

export default connect(mapStateToProps, mapDispatchToProps)(InputBar);