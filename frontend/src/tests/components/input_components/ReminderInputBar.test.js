// src/tests/components/ReminderInputBar.test.js
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { toast } from 'react-toastify';
import ReminderInputBar from '../../../components/input_components/ReminderInputBar';
import * as reminderUtils from '../../../utils/reminderUtils';

// Mock the Redux store and hooks
jest.mock('react-redux', () => ({
  connect: () => (Component) => Component,
  useDispatch: () => jest.fn(),
  useSelector: jest.fn(fn => fn({
    weeklyGridOpen: false,
    currentDay: '2023-07-20',
    selectedDayUI: '2023-07-20',
    settings: {
      soundSettings: {
        enabled: true,
        volume: 0.7
      }
    }
  }))
}));

// Mock toast notifications
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

// Mock reminder utilities
jest.mock('../../../utils/reminderUtils', () => ({
  submitReminder: jest.fn(),
  clearForm: jest.fn(),
  clearInputField: jest.fn()
}));

// Mock MUI components with unique test IDs
jest.mock('@mui/material', () => ({
  TextField: ({ placeholder, value, onChange, ...props }) => (
    <input
      type="text"
      data-testid={
        placeholder === 'Enter reminder name' 
          ? 'reminder-name-input' 
          : placeholder === 'Repeat'
          ? 'repeat-option-input'
          : 'text-field'
      }
      placeholder={placeholder}
      value={value || ''}
      onChange={onChange || (() => {})}
      readOnly={!onChange}
      {...props}
    />
  ),
  IconButton: ({ children, ...props }) => (
    <button data-testid="icon-button" {...props}>
      {children}
    </button>
  ),
  InputAdornment: ({ children }) => (
    <div data-testid="input-adornment">{children}</div>
  ),
  Menu: ({ children }) => <div data-testid="repeat-menu">{children}</div>,
  MenuItem: ({ children, onClick }) => (
    <div data-testid="repeat-menu-item" onClick={onClick}>
      {children}
    </div>
  )
}));

// Mock date pickers
jest.mock('@mui/x-date-pickers', () => ({
  DatePicker: ({ value, onChange, label }) => (
    <div>
      <label>{label}</label>
      <input
        type="date"
        value={value ? value.toISOString().split('T')[0] : ''}
        onChange={(e) => onChange(new Date(e.target.value))}
        data-testid="date-picker"
      />
    </div>
  ),
  TimePicker: ({ value, onChange, label }) => (
    <div>
      <label>{label}</label>
      <input
        type="time"
        value={value ? value.toISOString().split('T')[1]?.slice(0,5) : ''}
        onChange={(e) => {
          const [hours, minutes] = e.target.value.split(':');
          const newDate = new Date(value || new Date());
          newDate.setHours(hours);
          newDate.setMinutes(minutes);
          onChange(newDate);
        }}
        data-testid="time-picker"
      />
    </div>
  ),
  LocalizationProvider: ({ children }) => (
    <div data-testid="localization-provider">{children}</div>
  ),
  AdapterDateFns: jest.fn()
}));

// Mock icons
jest.mock('@mui/icons-material/Clear', () => () => (
  <span data-testid="clear-icon">Clear</span>
));
jest.mock('@mui/icons-material/Repeat', () => () => (
  <span data-testid="repeat-icon">Repeat</span>
));

describe('ReminderInputBar Component', () => {
  const onAddOrUpdateReminder = jest.fn();
  const onCancel = jest.fn();
  const mockDate = new Date('2023-07-20T12:00:00.000Z');
  
  const mockReminder = {
    id: 1,
    name: 'Test Reminder',
    selectedDay: mockDate,
    selectedTime: new Date('2023-07-20T15:00:00.000Z'),
    repeatOption: '',
    repeatEndDay: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    reminderUtils.submitReminder.mockResolvedValue({
      result: {
        message: 'Reminder added successfully',
        success: true,
        repeatReminderOnCurrentDay: false,
        repeatReminderOnSelectedDay: false
      },
      latestReminder: {
        ...mockReminder,
        id: 123
      }
    });
  });

  test('renders in creation mode with correct elements', () => {
    render(
      <ReminderInputBar
        onAddOrUpdateReminder={onAddOrUpdateReminder}
        onCancel={onCancel}
        selectedDayUI="2023-07-20"
      />
    );
    
    expect(screen.getByTestId('reminder-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    expect(screen.getByTestId('time-picker')).toBeInTheDocument();
    expect(screen.getByTestId('repeat-option-input')).toBeInTheDocument();
    expect(screen.getByText('Go Back')).toBeInTheDocument();
    expect(screen.getByText('Add')).toBeInTheDocument();
  });

  test('renders in edit mode with update button', () => {
    render(
      <ReminderInputBar
        onAddOrUpdateReminder={onAddOrUpdateReminder}
        onCancel={onCancel}
        reminderToEdit={mockReminder}
        selectedDayUI="2023-07-20"
      />
    );
    
    expect(screen.getByText('Update')).toBeInTheDocument();
    expect(screen.getByTestId('reminder-name-input')).toHaveValue('Test Reminder');
  });

  test('validates input before submission', async () => {
    render(
      <ReminderInputBar
        onAddOrUpdateReminder={onAddOrUpdateReminder}
        onCancel={onCancel}
        selectedDayUI="2023-07-20"
      />
    );
    
    await act(async () => {
      fireEvent.click(screen.getByText('Add'));
    });
    
    expect(toast.error).toHaveBeenCalledWith(
      'Please enter a reminder name',
      expect.objectContaining({ position: "top-center" })
    );
    expect(reminderUtils.submitReminder).not.toHaveBeenCalled();
  });

  test('successfully submits a valid reminder', async () => {
    render(
      <ReminderInputBar
        onAddOrUpdateReminder={onAddOrUpdateReminder}
        onCancel={onCancel}
        selectedDayUI="2023-07-20"
      />
    );
    
    const nameInput = screen.getByTestId('reminder-name-input');
    fireEvent.change(nameInput, { target: { value: 'New Reminder' } });
    
    const datePickers = screen.getAllByTestId('date-picker');
    fireEvent.change(datePickers[0], { target: { value: '2023-07-21' } });
    
    const timeInput = screen.getByTestId('time-picker');
    fireEvent.change(timeInput, { target: { value: '14:30' } });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Add'));
    });
    
    expect(reminderUtils.submitReminder).toHaveBeenCalled();
    expect(onAddOrUpdateReminder).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  test('handles repeat option selection', () => {
    render(
      <ReminderInputBar
        onAddOrUpdateReminder={onAddOrUpdateReminder}
        onCancel={onCancel}
        selectedDayUI="2023-07-20"
      />
    );
    
    // Initially there should be one date picker (main date)
    expect(screen.getAllByTestId('date-picker')).toHaveLength(1);
    
    // Open repeat menu and select option
    const repeatInput = screen.getByTestId('repeat-option-input');
    fireEvent.click(repeatInput);
    const menuItems = screen.getAllByTestId('repeat-menu-item');
    fireEvent.click(menuItems[0]); // Select 'Daily'
    
    // Now there should be two date pickers (main date + repeat end date)
    const updatedDatePickers = screen.getAllByTestId('date-picker');
    expect(updatedDatePickers).toHaveLength(2);
    
    // Verify the label for the second date picker is "Repeat End Date"
    const datePickerLabels = screen.getAllByText(/Select Day|Repeat End Date/);
    expect(datePickerLabels).toHaveLength(2);
    expect(datePickerLabels[1].textContent).toBe('Repeat End Date');
  });
  
  test('cancel button functionality', () => {
    render(
      <ReminderInputBar
        onAddOrUpdateReminder={onAddOrUpdateReminder}
        onCancel={onCancel}
        selectedDayUI="2023-07-20"
      />
    );
    
    fireEvent.click(screen.getByText('Go Back'));
    expect(onCancel).toHaveBeenCalled();
  });

  test('handles submission error', async () => {
    reminderUtils.submitReminder.mockRejectedValue(new Error('Submission failed'));
    
    render(
      <ReminderInputBar
        onAddOrUpdateReminder={onAddOrUpdateReminder}
        onCancel={onCancel}
        selectedDayUI="2023-07-20"
      />
    );
    
    const nameInput = screen.getByTestId('reminder-name-input');
    fireEvent.change(nameInput, { target: { value: 'New Reminder' } });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Add'));
    });
    
    expect(toast.error).toHaveBeenCalled();
  });

  test('updates reminder in edit mode', async () => {
    const mockEditReminder = {
      id: 2,
      name: 'Edit Reminder',
      selectedDay: new Date('2023-07-20T12:00:00.000Z'),
      selectedTime: new Date('2023-07-20T16:30:00.000Z'),
      repeatOption: 'weekly',
      repeatEndDay: new Date('2023-08-20T12:00:00.000Z')
    };

    render(
      <ReminderInputBar
        onAddOrUpdateReminder={onAddOrUpdateReminder}
        onCancel={onCancel}
        reminderToEdit={mockEditReminder}
        selectedDayUI="2023-07-20"
      />
    );
    
    // Verify form is populated with existing reminder data
    expect(screen.getByTestId('reminder-name-input')).toHaveValue('Edit Reminder');
    
    // Use getAllByTestId for date pickers since there are multiple elements with this test ID
    const datePickers = screen.getAllByTestId('date-picker');
    expect(datePickers[0]).toHaveValue('2023-07-20'); // Main date picker
    expect(datePickers[1]).toHaveValue('2023-08-20'); // Repeat end date picker
    
    expect(screen.getByTestId('time-picker')).toHaveValue('16:30');
    expect(screen.getByTestId('repeat-option-input')).toHaveValue('weekly');
    
    // Modify the reminder name
    const nameInput = screen.getByTestId('reminder-name-input');
    fireEvent.change(nameInput, { target: { value: 'Updated Reminder Name' } });
    
    // Change the time
    const timePicker = screen.getByTestId('time-picker');
    fireEvent.change(timePicker, { target: { value: '17:45' } });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Update'));
    });
    
    // Verify the submitReminder function was called with the updated data
    expect(reminderUtils.submitReminder).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 2,
        name: 'Updated Reminder Name',
        repeatOption: 'weekly',
      }),
      true,
      mockEditReminder
    );
    
    // Verify callback was called
    expect(onAddOrUpdateReminder).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  test('handles repeat end date validation', async () => {
    render(
      <ReminderInputBar
        onAddOrUpdateReminder={onAddOrUpdateReminder}
        onCancel={onCancel}
        selectedDayUI="2023-07-20"
      />
    );
    
    // Enter reminder name
    const nameInput = screen.getByTestId('reminder-name-input');
    fireEvent.change(nameInput, { target: { value: 'Repeat Reminder' } });
    
    // Set date
    const dateInput = screen.getByTestId('date-picker');
    fireEvent.change(dateInput, { target: { value: '2023-07-25' } });
    
    // Set time
    const timeInput = screen.getByTestId('time-picker');
    fireEvent.change(timeInput, { target: { value: '10:00' } });
    
    // Open repeat menu and select option
    const repeatInput = screen.getByTestId('repeat-option-input');
    fireEvent.click(repeatInput);
    const menuItems = screen.getAllByTestId('repeat-menu-item');
    fireEvent.click(menuItems[0]); // Select 'Daily'
    
    // Try to submit without setting repeat end date
    await act(async () => {
      fireEvent.click(screen.getByText('Add'));
    });
    
    expect(toast.error).toHaveBeenCalledWith(
      'Please select a repeat end date',
      expect.objectContaining({ position: "top-center" })
    );
    expect(reminderUtils.submitReminder).not.toHaveBeenCalled();
  });

  test('sets repeat end date to at least selected day when selecting earlier date', async () => {
    const mockDate = new Date('2023-07-20T12:00:00.000Z');
    
    render(
      <ReminderInputBar
        onAddOrUpdateReminder={onAddOrUpdateReminder}
        onCancel={onCancel}
        selectedDayUI="2023-07-20"
      />
    );
    
    // Set date to July 20, 2023
    const datePickers = screen.getAllByTestId('date-picker');
    fireEvent.change(datePickers[0], { target: { value: '2023-07-20' } });
    
    // Set time
    const timeInput = screen.getByTestId('time-picker');
    fireEvent.change(timeInput, { target: { value: '10:00' } });
    
    // Open repeat menu and select option
    const repeatInput = screen.getByTestId('repeat-option-input');
    fireEvent.click(repeatInput);
    const menuItems = screen.getAllByTestId('repeat-menu-item');
    fireEvent.click(menuItems[0]); // Select 'Daily'
    
    // Try to set repeat end date to July 15, 2023 (earlier than selected day)
    // After selecting a repeat option, we'll have two date pickers - the main one and the repeat end date
    const updatedDatePickers = screen.getAllByTestId('date-picker');
    fireEvent.change(updatedDatePickers[1], { target: { value: '2023-07-15' } });
    
    // Check that toast warning was displayed
    expect(toast.warn).toHaveBeenCalledWith(
      'Repeat end date cannot be before the selected day'
    );
  });

  test('handles different repeat options correctly', () => {
    render(
      <ReminderInputBar
        onAddOrUpdateReminder={onAddOrUpdateReminder}
        onCancel={onCancel}
        selectedDayUI="2023-07-20"
      />
    );
    
    // Set date and time
    const dateInput = screen.getByTestId('date-picker');
    fireEvent.change(dateInput, { target: { value: '2023-07-20' } });
    
    const timeInput = screen.getByTestId('time-picker');
    fireEvent.change(timeInput, { target: { value: '10:00' } });
    
    // Test each repeat option
    const repeatOptions = ['daily', 'weekly', 'monthly', 'yearly'];
    const repeatInput = screen.getByTestId('repeat-option-input');
    
    for (let i = 0; i < repeatOptions.length; i++) {
      // Open repeat menu and select option
      fireEvent.click(repeatInput);
      const menuItems = screen.getAllByTestId('repeat-menu-item');
      fireEvent.click(menuItems[i]); // Select option
      
      // Verify the selected option is displayed
      expect(repeatInput).toHaveValue(repeatOptions[i]);
    }
  });

  test('handles validation for missing date or time', async () => {
    render(
      <ReminderInputBar
        onAddOrUpdateReminder={onAddOrUpdateReminder}
        onCancel={onCancel}
        selectedDayUI="2023-07-20"
      />
    );
    
    // Set name but no date or time
    const nameInput = screen.getByTestId('reminder-name-input');
    fireEvent.change(nameInput, { target: { value: 'Test Reminder' } });
    
    // Try to submit
    await act(async () => {
      fireEvent.click(screen.getByText('Add'));
    });
    
    expect(toast.error).toHaveBeenCalledWith(
      'Please select both date and time',
      expect.objectContaining({ position: "top-center" })
    );
    expect(reminderUtils.submitReminder).not.toHaveBeenCalled();
  });
});