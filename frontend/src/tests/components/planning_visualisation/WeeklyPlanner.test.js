// @ts-nocheck
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import WeeklyPlanner from '../../../components/planning_visualisation/WeeklyPlanner';
import { fetchWeekData } from '../../../utils/weekUtils';

// Mock console to suppress warnings
jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock date-fns functions
jest.mock('date-fns', () => ({
  addDays: jest.fn(date => new Date(date.getTime() + 24 * 60 * 60 * 1000)),
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') return '2023-07-20';
    if (formatStr === 'EEE') return 'Thu';
    if (formatStr === 'd') return '20';
    if (formatStr === 'h:mm a') return '10:00 AM';
    return date.toISOString();
  }),
  startOfWeek: jest.fn(date => {
    // Return array of dates for the week
    const result = new Date(date);
    result.setDate(result.getDate() - result.getDay()); // Set to Sunday
    return result;
  }),
  getHours: jest.fn(() => 10),
  isSameDay: jest.fn(() => true),
  getMinutes: jest.fn(() => 0)
}));

// Mock Redux
jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: jest.fn().mockImplementation(selector => {
    // Mock state for useSelector
    const mockState = {
      settings: {
        startHour: '08:00 AM',
        endHour: '06:00 PM',
        hiddenHours: []
      },
      dailyPlannerFlag: false
    };
    return selector(mockState);
  }),
  connect: () => Component => Component
}));

// Mock weekUtils
jest.mock('../../../utils/weekUtils', () => ({
  fetchWeekData: jest.fn().mockImplementation(async () => ({
    tasks: { '2023-07-20': [] },
    reminders: { '2023-07-20': [] }
  })),
  organizeTasksByDay: jest.fn(tasks => ({ '2023-07-20': tasks || [] })),
  organizeRemindersByDay: jest.fn(reminders => ({ '2023-07-20': reminders || [] }))
}));

// Mock components
jest.mock('../../../components/planning_visualisation/DailyPlanner', () => ({
  __esModule: true,
  default: function MockDailyPlanner(props) {
    return (
      <div data-testid="daily-planner">
        <div>Day: {props.day}</div>
        <div>Tasks: {Object.keys(props.tasks || {}).length}</div>
        <div>Reminders: {Object.keys(props.reminders || {}).length}</div>
        <div>Context: {props.context || 'default'}</div>
      </div>
    );
  }
}));

jest.mock('../../../components/planning_visualisation/DayCell', () => function MockDayCell(props) {
  return (
    <div 
      data-testid="day-cell"
      onClick={() => props.onDayClick && props.onDayClick(props.date)}
    >
      <div>Day: Thu</div>
      <div>Date: 20</div>
    </div>
  );
});

jest.mock('../../../components/planning_utilities/Sphere', () => function MockSphere() {
  return <div data-testid="sphere" />;
});

jest.mock('../../../components/planning_utilities/DeleteTaskModal', () => function MockDeleteTaskModal(props) {
  return props.isOpen ? <div data-testid="delete-modal">Mock Delete Modal</div> : null;
});

describe('WeeklyPlanner Component', () => {
  const mockSetTaskToEdit = jest.fn();
  const mockSetReminderToEdit = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    fetchWeekData.mockImplementation(async () => ({
      tasks: { '2023-07-20': [] },
      reminders: { '2023-07-20': [] }
    }));
  });

  test('renders without crashing', async () => {
    await act(async () => {
      render(
        <WeeklyPlanner 
          setTaskToEdit={mockSetTaskToEdit} 
          setReminderToEdit={mockSetReminderToEdit} 
        />
      );
    });
    expect(screen.getAllByTestId('day-cell').length).toBeGreaterThan(0);
  });

  test('handles day click', async () => {
    await act(async () => {
      render(
        <WeeklyPlanner 
          setTaskToEdit={mockSetTaskToEdit} 
          setReminderToEdit={mockSetReminderToEdit} 
        />
      );
    });

    const dayCells = screen.getAllByTestId('day-cell');
    await act(async () => {
      fireEvent.click(dayCells[0]);
    });
    expect(screen.queryByTestId('daily-planner')).toBeInTheDocument();
  });

  test('toggles view between all days and single day', async () => {
    await act(async () => {
      render(
        <WeeklyPlanner 
          setTaskToEdit={mockSetTaskToEdit} 
          setReminderToEdit={mockSetReminderToEdit} 
        />
      );
    });

    expect(screen.getAllByTestId('day-cell').length).toBeGreaterThan(1);
    
    const toggleButton = screen.getByText('Show Single Day');
    await act(async () => {
      fireEvent.click(toggleButton);
    });
    
    expect(screen.getByText('Show All Days')).toBeInTheDocument();
    expect(screen.queryByTestId('daily-planner')).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.click(screen.getByText('Show All Days'));
    });
    
    expect(screen.getByText('Show Single Day')).toBeInTheDocument();
    expect(screen.getAllByTestId('day-cell').length).toBeGreaterThan(1);
  });
  
  test('handles empty data state', async () => {
    fetchWeekData.mockImplementation(async () => ({
      tasks: {},
      reminders: {}
    }));

    await act(async () => {
      render(
        <WeeklyPlanner 
          setTaskToEdit={mockSetTaskToEdit} 
          setReminderToEdit={mockSetReminderToEdit} 
        />
      );
    });

    expect(screen.getAllByTestId('day-cell').length).toBeGreaterThan(0);
  });

  test('matches snapshot', async () => {
    const { asFragment } = await act(async () => {
      return render(
        <WeeklyPlanner 
          setTaskToEdit={mockSetTaskToEdit} 
          setReminderToEdit={mockSetReminderToEdit} 
        />
      );
    });
    
    expect(asFragment()).toMatchSnapshot();
  });
});