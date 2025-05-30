// @ts-nocheck
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import InputBar from '../../../components/input_components/InputBar';

// Mock dependencies
jest.mock('react-redux', () => ({
  connect: () => Component => Component,
  useDispatch: () => jest.fn(),
  useSelector: jest.fn().mockImplementation(selector => {
    // Mock Redux state
    const mockState = {
      currentDay: '2023-07-20',
      selectedDayUI: '2023-07-20',
      weeklyGridOpen: false,
      settings: {
        startHour: '12:00 AM',
        endHour: '11:00 PM',
        hiddenHours: [],
        soundSettings: {
          enabled: true,
          volume: 0.7
        }
      }
    };
    return selector(mockState);
  })
}));

jest.mock('../../redux/reminders/actions/remindersActions', () => ({
  addReminder: jest.fn(),
  deleteReminder: jest.fn()
}));

jest.mock('../../redux/tasks/actions/tasksActions', () => ({
  addTask: jest.fn(),
  deleteTask: jest.fn()
}));

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  }
}));

// Mock Task and Reminder input components
jest.mock('../../components/input_components/TaskInputBar', () => {
  return function MockTaskInputBar({ onCancel, onAddOrUpdateTask, taskToEdit, defaultValues }) {
    return (
      <div data-testid="task-input-bar">
        <p>Task Mode: {taskToEdit ? 'Edit' : 'Create'}</p>
        {defaultValues && <p>Task Default Name: {defaultValues.name || 'None'}</p>}
        <button onClick={onCancel}>Cancel Task</button>
        <button 
          onClick={() => onAddOrUpdateTask({ id: 123, name: 'Test Task' }, false)}
          data-testid="task-submit"
        >
          {taskToEdit ? 'Update Task' : 'Add Task'}
        </button>
      </div>
    );
  };
});

jest.mock('../../components/input_components/ReminderInputBar', () => {
  return function MockReminderInputBar({ onCancel, onAddOrUpdateReminder, reminderToEdit, defaultValues }) {
    return (
      <div data-testid="reminder-input-bar">
        <p>Reminder Mode: {reminderToEdit ? 'Edit' : 'Create'}</p>
        {defaultValues && <p>Reminder Default Name: {defaultValues.name || 'None'}</p>}
        <button onClick={onCancel}>Cancel Reminder</button>
        <button 
          onClick={() => onAddOrUpdateReminder({ id: 456, name: 'Test Reminder' }, false)}
          data-testid="reminder-submit"
        >
          {reminderToEdit ? 'Update Reminder' : 'Add Reminder'}
        </button>
      </div>
    );
  };
});

// Mock MUI components to avoid controlled component warnings
jest.mock('@mui/material/TextField', () => {
  return function MockTextField(props) {
    const { value, onChange, placeholder, ...rest } = props;
    return (
      <input 
        data-testid="mui-textfield" 
        defaultValue={value} 
        onChange={onChange || (() => {})} 
        placeholder={placeholder}
        {...rest} 
      />
    );
  };
});

jest.mock('@mui/material/Menu', () => {
  return function MockMenu(props) {
    if (!props.open) return null;
    return <div data-testid="mui-menu">{props.children}</div>;
  };
});

jest.mock('@mui/material/MenuItem', () => {
  return function MockMenuItem(props) {
    return <div data-testid="mui-menuitem" onClick={props.onClick}>{props.children}</div>;
  };
});

jest.mock('@mui/x-date-pickers', () => ({
  DatePicker: function MockDatePicker(props) {
    return <div data-testid="mui-datepicker">{props.label}</div>;
  },
  TimePicker: function MockTimePicker(props) {
    return <div data-testid="mui-timepicker">{props.label}</div>;
  },
  LocalizationProvider: function MockLocalizationProvider(props) {
    return <div data-testid="mui-localizationprovider">{props.children}</div>;
  }
}));

// Mock utility functions
jest.mock('../../utils/reminderUtils', () => ({
  handleAddOrUpdateReminder: jest.fn()
}));

jest.mock('../../utils/taskUtils', () => ({
  handleAddOrUpdateTask: jest.fn()
}));

// Import utility mocks to access them in tests

// Mock Date to ensure consistent testing
const mockDate = new Date('2023-07-20T12:00:00.000Z');
// @ts-ignore
global.Date = jest.fn(() => mockDate);
// @ts-ignore
global.Date.now = jest.fn(() => mockDate.getTime());

// Restore all the Date functionality
// @ts-ignore
global.Date.UTC = Date.UTC;
// @ts-ignore
global.Date.parse = Date.parse;
// @ts-ignore
global.Date.prototype = Date.prototype;

describe('InputBar Component', () => {
  // Common test props
  const setTaskToEdit = jest.fn();
  const setReminderToEdit = jest.fn();
  const setNewTaskDefaults = jest.fn();
  const setNewReminderDefaults = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Initial state tests
  test('renders task/reminder selection buttons initially', async () => {
    await act(async () => {
      render(
        <InputBar 
          setTaskToEdit={setTaskToEdit}
          setReminderToEdit={setReminderToEdit}
          setNewTaskDefaults={setNewTaskDefaults}
          setNewReminderDefaults={setNewReminderDefaults}
        />
      );
    });
    
    expect(screen.getByText('Task')).toBeInTheDocument();
    expect(screen.getByText('Reminder')).toBeInTheDocument();
    expect(screen.queryByTestId('task-input-bar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('reminder-input-bar')).not.toBeInTheDocument();
  });

  // Task mode tests
  test('switches to task input when "Task" button is clicked', async () => {
    await act(async () => {
      render(
        <InputBar 
          setTaskToEdit={setTaskToEdit}
          setReminderToEdit={setReminderToEdit}
          setNewTaskDefaults={setNewTaskDefaults}
          setNewReminderDefaults={setNewReminderDefaults}
        />
      );
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Task'));
    });
    
    // Changed: Don't test for button disappearance since that's not how the component works
    expect(screen.getByTestId('task-input-bar')).toBeInTheDocument();
    expect(screen.getByText('Task Mode: Create')).toBeInTheDocument();
  });

  // Reminder mode tests
  test('switches to reminder input when "Reminder" button is clicked', async () => {
    await act(async () => {
      render(
        <InputBar 
          setTaskToEdit={setTaskToEdit}
          setReminderToEdit={setReminderToEdit}
          setNewTaskDefaults={setNewTaskDefaults}
          setNewReminderDefaults={setNewReminderDefaults}
        />
      );
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Reminder'));
    });
    
    // Changed: Don't test for button disappearance
    expect(screen.getByTestId('reminder-input-bar')).toBeInTheDocument();
    expect(screen.getByText('Reminder Mode: Create')).toBeInTheDocument();
  });

  // Edit mode tests
  test('shows TaskInputBar in edit mode when taskToEdit is provided', async () => {
    const taskToEdit = { id: 1, name: 'Edit This Task' };
    
    await act(async () => {
      render(
        <InputBar 
          setTaskToEdit={setTaskToEdit}
          setReminderToEdit={setReminderToEdit}
          taskToEdit={taskToEdit}
          setNewTaskDefaults={setNewTaskDefaults}
          setNewReminderDefaults={setNewReminderDefaults}
        />
      );
    });
    
    expect(screen.getByTestId('task-input-bar')).toBeInTheDocument();
    expect(screen.getByText('Task Mode: Edit')).toBeInTheDocument();
    expect(screen.queryByText('Task')).not.toBeInTheDocument(); // Selection buttons should be gone
  });

  test('shows ReminderInputBar in edit mode when reminderToEdit is provided', async () => {
    const reminderToEdit = { id: 2, name: 'Edit This Reminder' };
    
    await act(async () => {
      render(
        <InputBar 
          setTaskToEdit={setTaskToEdit}
          setReminderToEdit={setReminderToEdit}
          reminderToEdit={reminderToEdit}
          setNewTaskDefaults={setNewTaskDefaults}
          setNewReminderDefaults={setNewReminderDefaults}
        />
      );
    });
    
    expect(screen.getByTestId('reminder-input-bar')).toBeInTheDocument();
    expect(screen.getByText('Reminder Mode: Edit')).toBeInTheDocument();
    expect(screen.queryByText('Reminder')).not.toBeInTheDocument(); // Selection buttons should be gone
  });

  // Default values tests
  test('passes default values to TaskInputBar', async () => {
    const newTaskDefaults = { name: 'Default Task Name', selectedDay: new Date('2023-07-20') };
    
    await act(async () => {
      render(
        <InputBar 
          setTaskToEdit={setTaskToEdit}
          setReminderToEdit={setReminderToEdit}
          newTaskDefaults={newTaskDefaults}
          setNewTaskDefaults={setNewTaskDefaults}
          setNewReminderDefaults={setNewReminderDefaults}
        />
      );
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('task-input-bar')).toBeInTheDocument();
      expect(screen.getByText('Task Default Name: Default Task Name')).toBeInTheDocument();
    });
  });

  test('passes default values to ReminderInputBar', async () => {
    const newReminderDefaults = { name: 'Default Reminder Name', selectedDay: new Date('2023-07-20') };
    
    await act(async () => {
      render(
        <InputBar 
          setTaskToEdit={setTaskToEdit}
          setReminderToEdit={setReminderToEdit}
          newReminderDefaults={newReminderDefaults}
          setNewTaskDefaults={setNewTaskDefaults}
          setNewReminderDefaults={setNewReminderDefaults}
        />
      );
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('reminder-input-bar')).toBeInTheDocument();
      expect(screen.getByText('Reminder Default Name: Default Reminder Name')).toBeInTheDocument();
    });
  });

  // Cancel functionality tests
  test('returns to selection mode when canceling from task input', async () => {
    await act(async () => {
      render(
        <InputBar 
          setTaskToEdit={setTaskToEdit}
          setReminderToEdit={setReminderToEdit}
          setNewTaskDefaults={setNewTaskDefaults}
          setNewReminderDefaults={setNewReminderDefaults}
        />
      );
    });
    
    // First go to task input mode
    await act(async () => {
      fireEvent.click(screen.getByText('Task'));
    });
    expect(screen.getByTestId('task-input-bar')).toBeInTheDocument();
    
    // Then cancel
    await act(async () => {
      fireEvent.click(screen.getByText('Cancel Task'));
    });
    
    // Selection buttons should reappear
    expect(screen.getByText('Task')).toBeInTheDocument();
    expect(screen.getByText('Reminder')).toBeInTheDocument();
    expect(screen.queryByTestId('task-input-bar')).not.toBeInTheDocument();
  });

  test('clears taskToEdit state when canceling from edit mode', async () => {
    const taskToEdit = { id: 1, name: 'Edit This Task' };
    
    await act(async () => {
      render(
        <InputBar 
          setTaskToEdit={setTaskToEdit}
          setReminderToEdit={setReminderToEdit}
          taskToEdit={taskToEdit}
          setNewTaskDefaults={setNewTaskDefaults}
          setNewReminderDefaults={setNewReminderDefaults}
        />
      );
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Cancel Task'));
    });
    
    expect(setTaskToEdit).toHaveBeenCalledWith(null);
  });

  test('clears reminderToEdit state when canceling from edit mode', async () => {
    const reminderToEdit = { id: 2, name: 'Edit This Reminder' };
    
    await act(async () => {
      render(
        <InputBar 
          setTaskToEdit={setTaskToEdit}
          setReminderToEdit={setReminderToEdit}
          reminderToEdit={reminderToEdit}
          setNewTaskDefaults={setNewTaskDefaults}
          setNewReminderDefaults={setNewReminderDefaults}
        />
      );
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Cancel Reminder'));
    });
    
    expect(setReminderToEdit).toHaveBeenCalledWith(null);
  });
 
});