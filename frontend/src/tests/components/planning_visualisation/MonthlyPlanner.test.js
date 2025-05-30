// @ts-nocheck
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import * as api from '../../../api/api';
import * as reduxActions from '../../../redux/tasks/actions/selectedDayUIActions';

// Mock console to suppress warnings
jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock the dependencies
jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: jest.fn()
}));

jest.mock('../../../api/api', () => ({
  getTasksForDay: jest.fn().mockResolvedValue([]),
  getRemindersForDay: jest.fn().mockResolvedValue([])
}));

jest.mock('../../../redux/tasks/actions/selectedDayUIActions', () => ({
  setSelectedDayUI: jest.fn()
}));

// Create a detailed mock for timeUtils
const createMockTimeUtils = () => ({
  formatDate: jest.fn((year, month, day) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`),
  getDaysInMonth: jest.fn(() => 30),
  getMonthName: jest.fn((month) => [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ][month-1]),
  getMonths: jest.fn(() => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
  getYears: jest.fn(() => [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030]),
  groupItemsByTimeSlot: jest.fn((items) => ({}))
});

jest.mock('../../../utils/timeUtils', () => createMockTimeUtils());

// Mock the DailyPlanner component
jest.mock('../../../components/planning_visualisation/DailyPlanner', () => ({
  __esModule: true,
  default: function DailyPlanner(props) {
    return (
      <div data-testid="daily-planner">
        <div data-testid="day-value">{props.day}</div>
        <div data-testid="tasks-count">{Object.keys(props.tasks || {}).length}</div>
        <div data-testid="reminders-count">{Object.keys(props.reminders || {}).length}</div>
      </div>
    );
  }
}));

// Now import the component
import MonthlyPlanner from '../../../components/planning_visualisation/MonthlyPlanner';

describe('MonthlyPlanner Component', () => {
  const mockSetTaskToEdit = jest.fn();
  const mockSetReminderToEdit = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations before each test
    const mockUtils = require('../../../utils/timeUtils');
    mockUtils.getYears.mockImplementation(() => [2020, 2021, 2022, 2023, 2024, 2025]);
    mockUtils.getMonths.mockImplementation(() => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    mockUtils.getMonthName.mockImplementation((month) => [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ][month-1]);
    mockUtils.getDaysInMonth.mockImplementation(() => 30);
    mockUtils.formatDate.mockImplementation((year, month, day) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  });

  const renderMonthlyPlanner = () => render(
    <MonthlyPlanner 
      setTaskToEdit={mockSetTaskToEdit} 
      setReminderToEdit={mockSetReminderToEdit} 
    />
  );

  test('renders without crashing', () => {
    renderMonthlyPlanner();

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText('Year:')).toBeInTheDocument();
    expect(screen.getByLabelText('Month:')).toBeInTheDocument();
  });

  test('renders day labels', () => {
    renderMonthlyPlanner();

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayLabels.forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  test('renders calendar days', () => {
    // Mock getDaysInMonth to return a specific number of days
    const mockUtils = require('../../../utils/timeUtils');
    mockUtils.getDaysInMonth.mockReturnValueOnce(31);
    
    renderMonthlyPlanner();

    // Find the calendar grid and get calendar day elements
    const calendarGrid = screen.getByText('Sun').closest('.calendar-grid');
    const calendarDays = within(calendarGrid).getAllByText(/^[0-9]+$/);
    
    // Check that the first and last day are present
    const dayNumbers = calendarDays.map(day => day.textContent);
    expect(dayNumbers).toContain('1');
    expect(dayNumbers).toContain('31');
  });

  test('fetches data when a day is clicked', async () => {
    const mockTasks = [{ id: 1, name: 'Test Task' }];
    const mockReminders = [{ id: 2, name: 'Test Reminder' }];
    
    api.getTasksForDay.mockResolvedValueOnce(mockTasks);
    api.getRemindersForDay.mockResolvedValueOnce(mockReminders);

    renderMonthlyPlanner();

    // Find the calendar grid and get calendar day elements
    const calendarGrid = screen.getByText('Sun').closest('.calendar-grid');
    const calendarDays = within(calendarGrid).getAllByText(/^[0-9]+$/);
    
    await act(async () => {
      fireEvent.click(calendarDays[0]); // Click the first day
    });

    expect(api.getTasksForDay).toHaveBeenCalled();
    expect(api.getRemindersForDay).toHaveBeenCalled();
    expect(reduxActions.setSelectedDayUI).toHaveBeenCalled();
  });

  test('renders DailyPlanner when a day is selected', async () => {
    const mockTasks = [{ id: 1, name: 'Test Task' }];
    const mockReminders = [{ id: 2, name: 'Test Reminder' }];
    
    api.getTasksForDay.mockResolvedValueOnce(mockTasks);
    api.getRemindersForDay.mockResolvedValueOnce(mockReminders);

    renderMonthlyPlanner();

    expect(screen.queryByTestId('daily-planner')).not.toBeInTheDocument();

    // Find the calendar grid and get calendar day elements
    const calendarGrid = screen.getByText('Sun').closest('.calendar-grid');
    const calendarDays = within(calendarGrid).getAllByText(/^[0-9]+$/);
    
    await act(async () => {
      fireEvent.click(calendarDays[0]); // Click the first day
    });

    expect(screen.getByTestId('daily-planner')).toBeInTheDocument();
  });

  test('changes month and year with selectors', async () => {
    renderMonthlyPlanner();

    const yearSelector = screen.getByLabelText('Year:');
    const monthSelector = screen.getByLabelText('Month:');

    await act(async () => {
      fireEvent.change(yearSelector, { target: { value: '2023' } });
    });

    expect(yearSelector.value).toBe('2023');

    await act(async () => {
      fireEvent.change(monthSelector, { target: { value: '2' } });
    });

    // Check the month name in the heading
    const monthHeading = screen.getByRole('heading', { level: 1 });
    expect(monthHeading).toHaveTextContent('February');
  });
});