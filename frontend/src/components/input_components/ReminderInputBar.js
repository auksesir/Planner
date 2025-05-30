import { IconButton, InputAdornment, Menu, MenuItem, TextField } from '@mui/material';
import { DatePicker, LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { ClearIcon, RepeatIcon } from '../../icons/index';
import { setSelectedDayFlag } from '../../redux/tasks/actions/dailyPlannerFlagActions';
import '../../styles/components/input_components/ReminderInputBar.css';
import { clearForm, clearInputField, submitReminder } from '../../utils/reminderUtils';
import {
  shouldRefetchDayView
} from '../../utils/sharedUtils';
import {
  formatDate2
} from '../../utils/timeUtils';


const ReminderInputBar = ({ onAddOrUpdateReminder, onCancel, reminderToEdit, selectedDayUI }) => {
  const [reminderState, setReminderState] = useState({
    reminderName: '',
    selectedDay: null,
    selectedTime: null,
    repeatOption: '',
    repeatEndDay: null
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const weeklyGridOpen = useSelector(state => state.weeklyGridOpen);
  const dispatch = useDispatch();

  useEffect(() => {
    if (reminderToEdit) {
      // Helper function to safely handle dates
      const getValidDate = (value, isDayField = false) => {
        // 1. Return valid Date objects as-is
        if (value instanceof Date && !isNaN(value.getTime())) {
          return value;
        }
        
        // 2. Handle day fields in "DD/MM/YYYY" format
        if (isDayField && typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
          const [day, month, year] = value.split('/');
          return new Date(`${year}-${month}-${day}T00:00:00Z`);
        }
        
        // 3. Handle time fields in "DD/MM/YYYY, HH:mm:ss" format
        if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}$/.test(value)) {
          const [datePart, timePart] = value.split(', ');
          const [day, month, year] = datePart.split('/');
          return new Date(`${year}-${month}-${day}T${timePart}`);
        }
      
        // 4. Default parsing
        return new Date(value);
      };
  
      setReminderState({
        reminderName: reminderToEdit.name,
        // Handle selectedDay with originalStartDay fallback, force midnight UTC
        selectedDay: getValidDate(
          reminderToEdit.selectedDay || reminderToEdit.originalStartDay, 
          true
        ),
        // Use existing Date objects or parse if needed
        selectedTime: getValidDate(reminderToEdit.selectedTime),
        repeatOption: reminderToEdit.repeatOption || '',
        repeatEndDay: reminderToEdit.repeatEndDay 
          ? getValidDate(reminderToEdit.repeatEndDay, true) 
          : null
      });
  
      setIsEditing(true);
  
      // Debug logs
      console.log("Processed reminder edit dates:", {
        selectedDay: reminderState.selectedDay?.toISOString(),
        selectedTime: reminderState.selectedTime?.toISOString(),
        repeatEndDay: reminderState.repeatEndDay?.toISOString()
      });
    }
  }, [reminderToEdit]);

  useEffect(() => {
    if (reminderToEdit === null) {
      clearForm(setReminderState);
      setIsEditing(false);
    }
  }, [reminderToEdit]);

  useEffect(() => {
    if (reminderState.repeatEndDay && reminderState.selectedDay && 
        reminderState.selectedDay > reminderState.repeatEndDay) {
      setReminderState(prev => ({
        ...prev,
        repeatEndDay: reminderState.selectedDay
      }));
      toast.warn('Repeat end date cannot be before the selected day');
    }
  }, [reminderState.repeatEndDay, reminderState.selectedDay]);

  const handleReminderNameChange = (e) => {
    setReminderState(prev => ({ ...prev, reminderName: e.target.value }));
  };

  const handleRepeatOptionClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleRepeatOptionClose = () => {
    setAnchorEl(null);
  };

  const handleRepeatOptionSelect = (option) => {
    setReminderState(prev => ({ 
      ...prev, 
      repeatOption: option,
      repeatEndDay: option ? prev.repeatEndDay : null
    }));
    setAnchorEl(null);
  };

  const handleSubmit = async () => {
    const { reminderName, selectedDay, selectedTime, repeatOption, repeatEndDay } = reminderState;
    
    // Validation (matches task validation)
    if (!reminderName.trim()) {
      toast.error('Please enter a reminder name', { position: "top-center" });
      return;
    }
    
    if (!selectedDay || !selectedTime) {
      toast.error('Please select both date and time', { position: "top-center" });
      return;
    }
    
    if (repeatOption && !repeatEndDay) {
      toast.error('Please select a repeat end date', { position: "top-center" });
      return;
    }
    
    // Make sure the time part of selectedTime uses the date from selectedDay
    // This ensures the reminder has the correct date when edited
    let adjustedSelectedTime = new Date(selectedTime);
    adjustedSelectedTime.setFullYear(selectedDay.getFullYear());
    adjustedSelectedTime.setMonth(selectedDay.getMonth());
    adjustedSelectedTime.setDate(selectedDay.getDate());
    
    // Create consistent reminder object (matches task structure)
    const newReminder = {
      id: isEditing ? reminderToEdit.id : undefined,
      name: reminderName.trim(),
      selectedDay: selectedDay,
      selectedTime: adjustedSelectedTime, // Use the adjusted time that matches selectedDay
      repeatOption: repeatOption || null,
      repeatEndDay: repeatOption ? repeatEndDay : null,
      originalStartDay: selectedDay, // Consistent with tasks
      currentDay: new Date(),
      selectedDayUI: selectedDayUI
    };

    console.log("asaas", newReminder);
    
    // Debug log to verify the date parts match
    console.log("Submitting reminder with adjusted time:", {
      selectedDay: selectedDay.toISOString(),
      originalSelectedTime: selectedTime.toISOString(),
      adjustedSelectedTime: adjustedSelectedTime.toISOString()
    });
    
    try {
      const { result, latestReminder } = await submitReminder(newReminder, isEditing, reminderToEdit);
      
      if (result.message) {
        toast.success(result.message, { position: "top-center" });
        
        clearForm(setReminderState);
        setIsEditing(false);
        
        // Pass all needed parameters
        onAddOrUpdateReminder(
          latestReminder, 
          result.repeatReminderOnCurrentDay
        );
        
        // Consistent refresh logic with tasks
        if (weeklyGridOpen) {
          dispatch(setSelectedDayFlag(true));
        } else {
          const isSingleReminderOnCurrentView = !repeatOption && formatDate2(selectedDay) === selectedDayUI;
          const wasReminderMovedFromCurrentDay = isEditing && 
            reminderToEdit && 
            formatDate2(new Date(reminderToEdit.selectedDay)) === selectedDayUI && 
            formatDate2(selectedDay) !== selectedDayUI;
          
          if (isSingleReminderOnCurrentView || 
              wasReminderMovedFromCurrentDay || 
              shouldRefetchDayView({
                repeatOnSelectedDay: result.repeatReminderOnSelectedDay,
                repeatOnCurrentDay: result.repeatReminderOnCurrentDay
              }, formatDate2(selectedDay), formatDate2(new Date()), selectedDayUI, isEditing, 
              reminderToEdit ? formatDate2(new Date(reminderToEdit.selectedDay)) : null)) {
            dispatch(setSelectedDayFlag(true));
          }
        }
      }
    } catch (error) {
      console.error('Reminder submission error:', {
        error: error.message,
        stack: error.stack,
        reminder: newReminder,
        isEditing
      });
      toast.error(error.message || 'Failed to submit reminder', { position: "top-center" });
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className='input-container'>
        <div className="input-wrapper">
          <TextField
            type="text"
            value={reminderState.reminderName}
            onChange={handleReminderNameChange}
            placeholder="Enter reminder name"
            className="input-reminder"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {reminderState.reminderName && (
                    <IconButton onClick={() => clearInputField('reminderName', setReminderState)}>
                      <ClearIcon />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
          />

          <div className="date-time-row">
            <DatePicker
              label="Select Day"
              value={reminderState.selectedDay}
              onChange={(newValue) => setReminderState(prev => ({ ...prev, selectedDay: newValue }))}
              className="time-picker"
              renderInput={(params) => (
                <TextField
                  {...params}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        <InputAdornment position="end">
                          {reminderState.selectedDay && (
                            <IconButton onClick={() => clearInputField('selectedDay', setReminderState)}>
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
              label="Select Time"
              value={reminderState.selectedTime}
              onChange={(newValue) => setReminderState(prev => ({ ...prev, selectedTime: newValue }))}
              className="time-picker"
              timeSteps={{ minutes: 1 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        <InputAdornment position="end">
                          {reminderState.selectedTime && (
                            <IconButton onClick={() => clearInputField('selectedTime', setReminderState)}>
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
          </div>

          <TextField
            value={reminderState.repeatOption}
            placeholder="Repeat"
            className="input-duration"
            onClick={handleRepeatOptionClick}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {reminderState.repeatOption && (
                    <IconButton onClick={() => clearInputField('repeatOption', setReminderState)}>
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

          <Menu
            id="repeat-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleRepeatOptionClose}
          >
            <MenuItem onClick={() => handleRepeatOptionSelect('daily')}>Daily</MenuItem>
            <MenuItem onClick={() => handleRepeatOptionSelect('weekly')}>Weekly</MenuItem>
            <MenuItem onClick={() => handleRepeatOptionSelect('monthly')}>Monthly</MenuItem>
            <MenuItem onClick={() => handleRepeatOptionSelect('yearly')}>Yearly</MenuItem>
          </Menu>

          {reminderState.repeatOption && (
            <DatePicker
              label="Repeat End Date"
              value={reminderState.repeatEndDay}
              onChange={(newValue) => setReminderState(prev => ({ ...prev, repeatEndDay: newValue }))}
              minDate={reminderState.selectedDay || new Date()}
              className="time-picker"
              renderInput={(params) => (
                <TextField
                  {...params}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        <InputAdornment position="end">
                          {reminderState.repeatEndDay && (
                            <IconButton onClick={() => clearInputField('repeatEndDay', setReminderState)}>
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
          )}

          <button className="button-input" onClick={onCancel}>
            Go Back
          </button>
          <button className="button-input" onClick={handleSubmit}>
            {isEditing ? 'Update' : 'Add'}
          </button>
        </div>
      </div>
    </LocalizationProvider>
  );
};

export default ReminderInputBar;
