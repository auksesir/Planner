// @ts-nocheck
import '@testing-library/jest-dom'; // Add this import for toBeInTheDocument
import { render } from '@testing-library/react';
import TimeSlot from '../../../components/planning_visualisation/TimeSlot';

// Mock the taskUtils functions
jest.mock('../../../utils/taskUtils', () => ({
  isCurrentTask: jest.fn().mockReturnValue(false),
}));

// Mock the timeUtils functions
jest.mock('../../../utils/timeUtils', () => ({
  formattedTime: jest.fn(time => '10:00 AM'),
}));

// Mock the TaskReminderIcon component
jest.mock('../../../components/planning_utilities/TaskReminderIcon', () => {
  return function MockTaskReminderIcon(props) {
    return (
      <div data-testid="task-reminder-icon">
        Mock Task Reminder Icon
      </div>
    );
  };
});

describe('TimeSlot Component', () => {
  const defaultProps = {
    time: '10:00 AM',
    day: '2023-07-20',
    currentDay: '2023-07-20',
    currentHour: '10:00 AM',
    tasks: {
      '10:00 AM': [
        {
          id: 1,
          name: 'Test Task',
          startTime: '2023-07-20T10:00:00.000Z',
          endTime: '2023-07-20T11:00:00.000Z',
          duration: 60,
          type: 'task'
        }
      ]
    },
    reminders: {
      '09:00 AM': [
        {
          id: 2,
          name: 'Test Reminder',
          selectedTime: '2023-07-20T09:00:00.000Z',
          type: 'reminder'
        }
      ]
    },
    handleDeleteTask: jest.fn(),
    handleEditTask: jest.fn(),
    handleSetReminder: jest.fn(),
    handleClearReminder: jest.fn(),
    currentTask: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with tasks', () => {
    const { container } = render(<TimeSlot {...defaultProps} />);
    
    // Use a more flexible way to find elements if toBeInTheDocument is missing
    expect(container.textContent).toContain('10:00 AM');
    expect(container.textContent).toContain('Test Task');
  });

  test('renders empty slot when no tasks or reminders', () => {
    const propsWithoutItems = {
      ...defaultProps,
      tasks: {},
      reminders: {}
    };
    
    const { container } = render(<TimeSlot {...propsWithoutItems} />);
    
    // Use a more flexible way to find elements if toBeInTheDocument is missing
    expect(container.textContent).toContain('10:00 AM');
    // There should be a no-items element
    expect(container.querySelector('[data-testid="no-items"]')).toBeTruthy();
  });
});