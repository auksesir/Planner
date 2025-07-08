import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { DatePicker, LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useEffect, useState } from 'react';
import { connect, useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ClearIcon, RepeatIcon } from '../../icons/index';
import { setSelectedDayFlag } from '../../redux/tasks/actions/dailyPlannerFlagActions';
import '../../styles/components/input_components/TaskInputBar.css';
import {
    shouldRefetchDayView
} from '../../utils/sharedUtils';
import {
    clearInputField as clearTaskInputField,
    submitTask
} from '../../utils/taskUtils';
import {
    adjustTimeToSelectedDay,
    calculateEndTime,
    formatDate2
} from '../../utils/timeUtils';


const TaskInputBar = ({ onAddOrUpdateTask, onCancel, currentDay, selectedDayUI, taskToEdit, defaultValues }) => {
  const [taskState, setTaskState] = useState({
    taskName: '',
    selectedDay: null,
    startTime: null,
    endTime: null,
    selectedDuration: '',
    repeatOption: '',
    repeatEndDay: null,
    nodeContext: null
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  // Store nodeContext in a separate state to ensure it doesn't get lost
  const [savedNodeContext, setSavedNodeContext] = useState(null);
  const weeklyGridOpen = useSelector(state => state.weeklyGridOpen);
  const dispatch = useDispatch();

  useEffect(() => {
    if (taskState.selectedDay && taskState.startTime && taskState.endTime) {
      const { startTime, endTime, selectedDay } = taskState;
      const newStartTime = adjustTimeToSelectedDay(startTime, selectedDay);
      const newEndTime = adjustTimeToSelectedDay(endTime, selectedDay);
      setTaskState(prev => ({
        ...prev,
        startTime: newStartTime,
        endTime: newEndTime
      }));
    }
  }, [taskState.selectedDay]);

  // Handle defaults for new tasks (doesn't trigger edit mode)
  useEffect(() => {
    if (defaultValues && !taskToEdit) {
      ("Setting task state from defaultValues:", defaultValues);
      
      // Save nodeContext separately to make sure it doesn't get lost
      if (defaultValues.nodeContext) {
        setSavedNodeContext(defaultValues.nodeContext);
      }
      
      setTaskState(prev => ({
        ...prev,
        taskName: defaultValues.name || '',
        selectedDay: defaultValues.selectedDay || new Date(),
        nodeContext: defaultValues.nodeContext || null
      }));
      setIsEditing(false); // Ensure we're in creation mode
    }
  }, [defaultValues, taskToEdit]);

  useEffect(() => {
    if (taskToEdit) {
      if (taskToEdit.nodeContext) {
        setSavedNodeContext(taskToEdit.nodeContext);
      }
  
      // Helper function to safely handle dates
      const getValidDate = (value, isDayField = false) => {
        // 1. Return valid Date objects as-is
        if (value instanceof Date && !isNaN(value.getTime())) {
          return value;
        }
      
        // 2. Handle day fields (forces midnight UTC)
        if (isDayField) {
          const dateStr = typeof value === 'string' 
            ? value.split('T')[0] 
            : format(value, 'yyyy-MM-dd');
          return new Date(`${dateStr}T00:00:00Z`);
        }
        // 3. Direct parsing for "DD/MM/YYYY, HH:mm:ss" format
        if (typeof value === 'string' && value.includes('/')) {
          const [datePart, timePart] = value.split(', ');
          const [day, month, year] = datePart.split('/');
          return new Date(`${year}-${month}-${day}T${timePart}`);
        }
      
        // 4. Default parsing
        return new Date(value);
      };
  
      setTaskState({
        taskName: taskToEdit.name,
        // Handle selectedDay with originalStartDay fallback, force midnight UTC
        selectedDay: getValidDate(
          taskToEdit.selectedDay || taskToEdit.originalStartDay, 
          true
        ),
        // Use existing Date objects or parse if needed
        startTime: getValidDate(taskToEdit.startTime),
        endTime: getValidDate(taskToEdit.endTime),
        selectedDuration: taskToEdit.duration,
        repeatOption: taskToEdit.repeatOption || '',
        repeatEndDay: taskToEdit.repeatEndDay 
          ? getValidDate(taskToEdit.repeatEndDay, true) 
          : null,
        nodeContext: taskToEdit.nodeContext || null
      });
  
      setIsEditing(true);
  
      // Debug logs
      ("Processed dates:", {
        selectedDay: taskState.selectedDay?.toISOString(),
        startTime: taskState.startTime?.toISOString(),
        endTime: taskState.endTime?.toISOString()
      });
    }
  }, [taskToEdit]);

  // Custom clearForm function to preserve nodeContext
  const customClearForm = () => {
    setTaskState({
      taskName: '',
      selectedDay: null,
      startTime: null,
      endTime: null,
      selectedDuration: '',
      repeatOption: '',
      repeatEndDay: null,
      nodeContext: savedNodeContext  // Preserve the nodeContext
    });
    setIsEditing(false);
  };

  useEffect(() => {
    if (taskToEdit === null) {
      customClearForm();
    }
  }, [taskToEdit]);

  useEffect(() => {
    if (taskState.repeatEndDay && taskState.selectedDay && taskState.selectedDay > taskState.repeatEndDay) {
      setTaskState(prev => ({
        ...prev,
        selectedDay: taskState.repeatEndDay
      }));
      toast.warn('Selected day has been adjusted to match the repeat end day.', { position: "top-center" });
    }
  }, [taskState.repeatEndDay]);

  const handleTaskNameChange = (e) => {
    setTaskState(prev => ({ ...prev, taskName: e.target.value }));
  };

  const handleStartTimeChange = (newDate) => {
    setTaskState(prev => {
      const newState = { ...prev, startTime: newDate };
      if (newDate && prev.endTime) {
        const durationInMinutes = (prev.endTime.getTime() - newDate.getTime()) / (60 * 1000);
        newState.selectedDuration = durationInMinutes;
      }
      return newState;
    });
  };

  const handleEndTimeChange = (newDate) => {
    setTaskState(prev => {
      const newState = { ...prev, endTime: newDate };
      if (newDate && prev.startTime) {
        const durationInMinutes = (newDate.getTime() - prev.startTime.getTime()) / (60 * 1000);
        newState.selectedDuration = durationInMinutes;
      }
      return newState;
    });
  };

  const handleDurationChange = (e) => {
    setTaskState(prev => {
      const newState = { ...prev, selectedDuration: e.target.value };
      if (prev.startTime) {
        newState.endTime = calculateEndTime(prev.startTime, e.target.value);
      }
      return newState;
    });
  };

  const handleRepeatOptionClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleRepeatOptionClose = () => {
    setAnchorEl(null);
  };

  const handleRepeatOptionSelect = (option) => {
    setTaskState(prev => ({ ...prev, repeatOption: option }));
    setAnchorEl(null);
  };

  const handleSubmit = async () => {
    const { taskName, selectedDay, startTime, endTime, selectedDuration, repeatOption, repeatEndDay, nodeContext } = taskState;
  
    // Use either taskState.nodeContext or the separately saved nodeContext
    const effectiveNodeContext = nodeContext || savedNodeContext;
  
    // Validation checks
    if (taskName.trim() === '') {
      toast.error('Please enter a task name.', { position: "top-center" });
      return;
    }
  
    if (!selectedDay || !startTime || !endTime) {
      toast.error('Please select day and times.', { position: "top-center" });
      return;
    }
  
    if (repeatOption && !repeatEndDay) {
      toast.error('Please select a repeat end day.', { position: "top-center" });
      return;
    }
  
    if (repeatOption && repeatEndDay && selectedDay > repeatEndDay) {
      toast.error('Selected day cannot be after the repeat end day.', { position: "top-center" });
      return;
    }
  
    if (endTime <= startTime) {
      toast.error('End time cannot be before start time.', { position: "top-center" });
      return;
    }
  
    // Adjust and convert times properly
    const adjustedStartTime = adjustTimeToSelectedDay(startTime, selectedDay);
    const adjustedEndTime = adjustTimeToSelectedDay(endTime, selectedDay);
  
    const newTask = {
      id: isEditing ? taskToEdit.id : undefined,
      name: taskName,
      selectedDay: selectedDay,
      originalStartDay: selectedDay,
      startTime: adjustedStartTime.toISOString(),
      endTime: adjustedEndTime.toISOString(),
      duration: selectedDuration,
      repeatOption: repeatOption,
      repeatEndDay: repeatOption && repeatEndDay ? repeatEndDay : null,
      currentDay: new Date(),
      selectedDayUI: selectedDayUI,
    };
  
    try {
      const { result, latestTask } = await submitTask(newTask, isEditing, taskToEdit);
      
      if (result.warning) {
        toast.error('This task overlaps with an existing task. Please choose a different time.', {
          position: "top-center",
        });
        return;
      }
  
      if (result.message) {
        toast.success(result.message, {
          position: "top-center",
        });

        // If this is a new task created from a node, link it automatically
        if (!isEditing && effectiveNodeContext && effectiveNodeContext.parentNodeId && latestTask && latestTask.id) {
          try {
            
             
              
              toast.success('Task created and linked as subnode');

              // Dispatch a custom event to notify the Projects component
              window.dispatchEvent(new CustomEvent('refreshProject', {
                detail: { projectId: effectiveNodeContext.projectId }
              }));
            
          } catch (linkError) {
            ('Error linking task to node:', linkError);
            toast.error('Task created but failed to link as subnode');
          }
        }

  
        customClearForm();
        setIsEditing(false);
        onAddOrUpdateTask(latestTask, result.repeatTaskOnCurrentDay);
        // Dispatch a custom taskUpdated event just like focus events
        window.dispatchEvent(new CustomEvent('taskUpdated'));                
        if (weeklyGridOpen) {
          dispatch(setSelectedDayFlag(true));
        } else {
          // For existing tasks that were moved from the current day to another day
          const wasTaskMovedFromCurrentDay = isEditing && 
            taskToEdit && 
            formatDate2(new Date(taskToEdit.selectedDay)) === selectedDayUI && 
            formatDate2(selectedDay) !== selectedDayUI;
          
          // For single tasks on the currently viewed day, always refresh  
          const isSingleTaskOnCurrentView = !repeatOption && formatDate2(selectedDay) === selectedDayUI;
          
          if (wasTaskMovedFromCurrentDay || 
              isSingleTaskOnCurrentView || 
              shouldRefetchDayView({
                repeatOnSelectedDay: result.repeatTaskOnSelectedDay,
                repeatOnCurrentDay: result.repeatTaskOnCurrentDay
              }, formatDate2(selectedDay), formatDate2(new Date()), selectedDayUI, isEditing, taskToEdit ? formatDate2(new Date(taskToEdit.selectedDay)) : null)) {
            dispatch(setSelectedDayFlag(true));
          }
        }
      }
    } catch (error) {
      ('Task submission error:', error);
      toast.error(error.message, {
        position: "top-center",
      });
    }
  };

  const clearInputField = (field) => {
    clearTaskInputField(field, setTaskState);
  };

  return (
    <div className="input-container">
      <div className="input-wrapper">
        <TextField
          type="text"
          value={taskState.taskName}
          onChange={handleTaskNameChange}
          placeholder="Enter task name"
          className="input-task"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {taskState.taskName && (
                  <IconButton onClick={() => clearInputField('taskName')}>
                    <ClearIcon />
                  </IconButton>
                )}
              </InputAdornment>
            ),
          }}
        />

        <div className="date-time-row">
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Select Day"
              value={taskState.selectedDay}
              onChange={(newValue) => setTaskState(prev => ({ ...prev, selectedDay: newValue }))}
              className="time-picker"
              textField={(params) => (
                <TextField
                  {...params}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        <InputAdornment position="end">
                          {taskState.selectedDay && (
                            <IconButton onClick={() => clearInputField('selectedDay')}>
                              <ClearIcon />
                            </IconButton>
                          )}
                        </InputAdornment>
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            <TimePicker
              label="Start Time"
              value={taskState.startTime}
              onChange={handleStartTimeChange}
              className="time-picker"
              textField={(params) => (
                <TextField
                  {...params}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        <InputAdornment position="end">
                          {taskState.startTime && (
                            <IconButton onClick={() => clearInputField('startTime')}>
                              <ClearIcon />
                            </IconButton>
                          )}
                        </InputAdornment>
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              timeSteps={{ minutes: 1 }}
            />

            <TimePicker
              label="End Time"
              value={taskState.endTime}
              onChange={handleEndTimeChange}
              className="time-picker"
              textField={(params) => (
                <TextField
                  {...params}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        <InputAdornment position="end">
                          {taskState.endTime && (
                            <IconButton onClick={() => clearInputField('endTime')}>
                              <ClearIcon />
                            </IconButton>
                          )}
                        </InputAdornment>
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              timeSteps={{ minutes: 1 }}
            />
          </LocalizationProvider>
        </div>

        <TextField
          value={taskState.selectedDuration}
          onChange={handleDurationChange}
          placeholder="Duration (minutes)"
          className="input-duration"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {taskState.selectedDuration && (
                  <IconButton onClick={() => clearInputField('selectedDuration')}>
                    <ClearIcon />
                  </IconButton>
                )}
              </InputAdornment>
            ),
          }}
        />

        <TextField
          value={taskState.repeatOption}
          placeholder="Repeat"
          className="input-duration"
          onClick={handleRepeatOptionClick}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {taskState.repeatOption && (
                  <IconButton onClick={() => clearInputField('repeatOption')}>
                    <ClearIcon />
                  </IconButton>
                )}
                <IconButton onClick={handleRepeatOptionClick}>
                  <RepeatIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Menu id="repeat-menu" anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleRepeatOptionClose}>
          <MenuItem onClick={() => handleRepeatOptionSelect('daily')}>Daily</MenuItem>
          <MenuItem onClick={() => handleRepeatOptionSelect('every two days')}>Every Two Days</MenuItem>
          <MenuItem onClick={() => handleRepeatOptionSelect('every three days')}>Every Three Days</MenuItem>
          <MenuItem onClick={() => handleRepeatOptionSelect('weekly')}>Weekly</MenuItem>
          <MenuItem onClick={() => handleRepeatOptionSelect('biweekly')}>Biweekly</MenuItem>
          <MenuItem onClick={() => handleRepeatOptionSelect('monthly')}>Monthly</MenuItem>
        </Menu>

        {taskState.repeatOption && (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Repeat End Day (optional)"
              value={taskState.repeatEndDay}
              onChange={(newValue) => setTaskState(prev => ({ ...prev, repeatEndDay: newValue }))}
              className="time-picker"
              textField={(params) => (
                <TextField
                  {...params}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        <InputAdornment position="end">
                          {taskState.repeatEndDay && (
                            <IconButton onClick={() => clearInputField('repeatEndDay')}>
                              <ClearIcon />
                            </IconButton>
                          )}
                        </InputAdornment>
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </LocalizationProvider>
        )}

        <button className="button-input" onClick={onCancel}>
          Go Back
        </button>
        <button className="button-input" onClick={handleSubmit}>
          {taskToEdit ? 'Update' : 'Add'}
        </button>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  currentDay: state.currentDay,
  selectedDayUI: state.selectedDayUI,
});

export default connect(mapStateToProps)(TaskInputBar);