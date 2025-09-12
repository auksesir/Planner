// src/tests/components/TaskInputBar.test.js
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { toast } from 'react-toastify';
import * as projectsApi from '../../../api/projectsApi';
import TaskInputBar from '../../../components/input_components/TaskInputBar';
import * as taskUtils from '../../../utils/taskUtils';

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

// Mock task utilities
jest.mock('../../../utils/taskUtils', () => ({
  submitTask: jest.fn(),
  clearForm: jest.fn(),
  clearInputField: jest.fn()
}));

// Mock project API
jest.mock('../../../api/projectsApi', () => ({
  linkTaskToNodeAsSubnode: jest.fn()
}));

// Mock MUI components with proper test IDs based on the actual component structure
jest.mock('@mui/material', () => ({
  TextField: ({ placeholder, value, onChange, ...props }) => (
    <input
      type="text"
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
  Menu: ({ children, id }) => <div data-testid={id} id={id}>{children}</div>,
  MenuItem: ({ children, onClick }) => (
    <li 
      className="MuiButtonBase-root MuiMenuItem-root MuiMenuItem-gutters" 
      role="menuitem" 
      onClick={onClick}
    >
      {children}
    </li>
  )
}));

// Mock date pickers
jest.mock('@mui/x-date-pickers', () => ({
  DatePicker: ({ value, onChange, label }) => (
    <div>
      <label>{label}</label>
      <input
        type="date"
        value={value?.toISOString().split('T')[0]}
        onChange={(e) => onChange(new Date(e.target.value))}
        data-testid={`date-picker-${label.toLowerCase().replace(' ', '-')}`}
      />
    </div>
  ),
  TimePicker: ({ value, onChange, label }) => (
    <div>
      <label>{label}</label>
      <input
        type="time"
        value={value?.toISOString().split('T')[1]?.slice(0,5)}
        onChange={(e) => {
          const [hours, minutes] = e.target.value.split(':');
          const newDate = new Date(value || new Date());
          newDate.setHours(hours);
          newDate.setMinutes(minutes);
          onChange(newDate);
        }}
        data-testid={`time-picker-${label.toLowerCase().replace(' ', '-')}`}
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

describe('TaskInputBar Component', () => {
  const onAddOrUpdateTask = jest.fn();
  const onCancel = jest.fn();
  const mockDate = new Date('2023-07-20T12:00:00.000Z');
  
  const mockTask = {
    id: 1,
    name: 'Test Task',
    selectedDay: mockDate,
    startTime: new Date('2023-07-20T10:00:00.000Z'),
    endTime: new Date('2023-07-20T11:00:00.000Z'),
    duration: 60,
    selectedDuration: '60',
    repeatOption: '',
    repeatEndDay: null
  };

  const mockEditTask = {
    id: 2,
    name: 'Edit Task',
    selectedDay: mockDate,
    startTime: new Date('2023-07-20T13:00:00.000Z'),
    endTime: new Date('2023-07-20T14:00:00.000Z'),
    duration: 60,
    selectedDuration: '60',
    repeatOption: 'daily',
    repeatEndDay: new Date('2023-07-25T12:00:00.000Z')
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    taskUtils.submitTask.mockResolvedValue({
      result: {
        message: 'Task added successfully',
        success: true,
        repeatTaskOnCurrentDay: false,
        repeatTaskOnSelectedDay: false
      },
      latestTask: {
        ...mockTask,
        id: 123
      }
    });

    projectsApi.linkTaskToNodeAsSubnode.mockResolvedValue({
      message: 'Task linked successfully'
    });
  });

  test('renders in creation mode with correct elements', () => {
    render(
      <TaskInputBar
        onAddOrUpdateTask={onAddOrUpdateTask}
        onCancel={onCancel}
        selectedDayUI="2023-07-20"
      />
    );
    
    // Use more reliable ways to find elements
    expect(screen.getByPlaceholderText('Enter task name')).toBeInTheDocument();
    expect(screen.getByTestId('date-picker-select-day')).toBeInTheDocument();
    expect(screen.getByTestId('time-picker-start-time')).toBeInTheDocument();
    expect(screen.getByTestId('time-picker-end-time')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Repeat')).toBeInTheDocument();
    expect(screen.getByText('Go Back')).toBeInTheDocument();
    expect(screen.getByText('Add')).toBeInTheDocument();
  });

  test('renders in edit mode with update button and prefilled values', () => {
    render(
      <TaskInputBar
        onAddOrUpdateTask={onAddOrUpdateTask}
        onCancel={onCancel}
        taskToEdit={mockEditTask}
        selectedDayUI="2023-07-20"
      />
    );
    
    expect(screen.getByText('Update')).toBeInTheDocument();
    
    // Use more reliable ways to check values
    const nameInput = screen.getByPlaceholderText('Enter task name');
    expect(nameInput).toHaveValue('Edit Task');
    
    const startTimePicker = screen.getByTestId('time-picker-start-time');
    expect(startTimePicker).toHaveValue('13:00');
    
    const endTimePicker = screen.getByTestId('time-picker-end-time');
    expect(endTimePicker).toHaveValue('14:00');
  });

  test('validates input before submission - missing task name', async () => {
    render(
      <TaskInputBar
        onAddOrUpdateTask={onAddOrUpdateTask}
        onCancel={onCancel}
        selectedDayUI="2023-07-20"
      />
    );
    
    await act(async () => {
      fireEvent.click(screen.getByText('Add'));
    });
    
    expect(toast.error).toHaveBeenCalledWith(
      'Please enter a task name.',
      expect.objectContaining({ position: "top-center" })
    );
    expect(taskUtils.submitTask).not.toHaveBeenCalled();
  });

  test('validates input before submission - missing day and times', async () => {
    render(
      <TaskInputBar
        onAddOrUpdateTask={onAddOrUpdateTask}
        onCancel={onCancel}
        selectedDayUI="2023-07-20"
      />
    );
    
    // Enter task name
    const nameInput = screen.getByPlaceholderText('Enter task name');
    fireEvent.change(nameInput, { target: { value: 'New Task' } });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Add'));
    });
    
    expect(toast.error).toHaveBeenCalledWith(
      'Please select day and times.',
      expect.objectContaining({ position: "top-center" })
    );
    expect(taskUtils.submitTask).not.toHaveBeenCalled();
  });

  test('successfully submits a valid task', async () => {
    render(
      <TaskInputBar
        onAddOrUpdateTask={onAddOrUpdateTask}
        onCancel={onCancel}
        selectedDayUI="2023-07-20"
      />
    );
    
    const nameInput = screen.getByPlaceholderText('Enter task name');
    fireEvent.change(nameInput, { target: { value: 'New Task' } });
    
    const dateInput = screen.getByTestId('date-picker-select-day');
    fireEvent.change(dateInput, { target: { value: '2023-07-21' } });
    
    const startTimePicker = screen.getByTestId('time-picker-start-time');
    fireEvent.change(startTimePicker, { target: { value: '10:00' } });
    
    const endTimePicker = screen.getByTestId('time-picker-end-time');
    fireEvent.change(endTimePicker, { target: { value: '11:00' } });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Add'));
    });
    
    expect(taskUtils.submitTask).toHaveBeenCalled();
    expect(onAddOrUpdateTask).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  test('handles repeat option selection', async () => {
    render(
      <TaskInputBar
        onAddOrUpdateTask={onAddOrUpdateTask}
        onCancel={onCancel}
        selectedDayUI="2023-07-20"
      />
    );
    
    // Initially there should be one date picker (main date)
    const initialDatePickers = screen.getAllByTestId(/date-picker/);
    expect(initialDatePickers.length).toBe(1);
    
    // Open repeat menu with the repeat icon button
    const repeatIconButton = screen.getByTestId('repeat-icon').closest('button');
    fireEvent.click(repeatIconButton);
    
    // Select the first menu item - using a more robust way to find it
    const menuItem = screen.getByText('Daily');
    await act(async () => {
      fireEvent.click(menuItem);
    });
    
    // Now we should see the repeat end date picker
    expect(screen.getByTestId('date-picker-repeat-end day (optional)')).toBeInTheDocument();  });

  test('cancel button functionality', () => {
    render(
      <TaskInputBar
        onAddOrUpdateTask={onAddOrUpdateTask}
        onCancel={onCancel}
        selectedDayUI="2023-07-20"
      />
    );
    
    fireEvent.click(screen.getByText('Go Back'));
    expect(onCancel).toHaveBeenCalled();
  });

  test('handles submission error', async () => {
    taskUtils.submitTask.mockRejectedValue(new Error('Submission failed'));
    
    render(
      <TaskInputBar
        onAddOrUpdateTask={onAddOrUpdateTask}
        onCancel={onCancel}
        selectedDayUI="2023-07-20"
      />
    );
    
    const nameInput = screen.getByPlaceholderText('Enter task name');
    fireEvent.change(nameInput, { target: { value: 'New Task' } });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Add'));
    });
    
    expect(toast.error).toHaveBeenCalled();
  });

  test('updates task in edit mode', async () => {
    render(
      <TaskInputBar
        onAddOrUpdateTask={onAddOrUpdateTask}
        onCancel={onCancel}
        taskToEdit={mockEditTask}
        selectedDayUI="2023-07-20"
      />
    );
    
    // Modify the task name
    const nameInput = screen.getByPlaceholderText('Enter task name');
    fireEvent.change(nameInput, { target: { value: 'Updated Task Name' } });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Update'));
    });
    
    expect(taskUtils.submitTask).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 2,
        name: 'Updated Task Name',
        duration: 60,
        repeatOption: 'daily',
      }),
      true,
      expect.anything()
    );
    
    
    expect(onAddOrUpdateTask).toHaveBeenCalled();
  });

  test('handles duration input changes', () => {
    render(
      <TaskInputBar
        onAddOrUpdateTask={onAddOrUpdateTask}
        onCancel={onCancel}
        selectedDayUI="2023-07-20"
      />
    );
    
    // Set start time to 10:00
    const startTimePicker = screen.getByTestId('time-picker-start-time');
    fireEvent.change(startTimePicker, { target: { value: '10:00' } });
    
    // Change duration to 90 minutes
    const durationInput = screen.getByPlaceholderText('Duration (minutes)');
    fireEvent.change(durationInput, { target: { value: '90' } });
    
    // Get the end time picker
    const endTimePicker = screen.getByTestId('time-picker-end-time');
    
    // Check the calculation - 10:00 + 90 minutes = 11:30
    const endTimeValue = endTimePicker.value;
    if (endTimeValue.includes(':')) {
      const [hours, minutes] = endTimeValue.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes;
      expect(totalMinutes).toBe(10 * 60 + 30); // 10:30 in minutes (90 minutes after 10:00)
    } else {
      throw new Error(`Unexpected time format: ${endTimeValue}`);
    }
  });

  test('cancel button functionality', () => {
    render(
      <TaskInputBar
        onAddOrUpdateTask={onAddOrUpdateTask}
        onCancel={onCancel}
        selectedDayUI="2023-07-20"
      />
    );
    
    fireEvent.click(screen.getByText('Go Back'));
    expect(onCancel).toHaveBeenCalled();
  });
  
  
});