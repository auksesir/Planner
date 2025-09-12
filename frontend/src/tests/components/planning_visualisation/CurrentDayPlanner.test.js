import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

// Import the component AFTER all mocks are set up
import CurrentDayPlanner from '../../../components/planning_visualisation/CurrentDayPlanner';

// Mock dependencies first, before any component imports
const mockDispatch = jest.fn();
const mockSetSelectedDayUI = jest.fn();

// Mock react-redux
jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  connect: () => (Component) => (props) => <Component currentDay="2023-07-20" currentDayTasks={{}} currentDayReminders={{}} {...props} />
}));

// Mock action creator
jest.mock('../../../redux/tasks/actions/selectedDayUIActions', () => ({
  setSelectedDayUI: (day) => {
    mockSetSelectedDayUI(day);
    return { type: 'SET_SELECTED_DAY_UI', payload: day };
  }
}));

// Mock DailyPlanner component
jest.mock('../../../components/planning_visualisation/DailyPlanner', () => (props) => (
  <div data-testid="daily-planner">
    <div data-testid="day-value">{props.day}</div>
    <div data-testid="is-current-day">{props.isCurrentDay ? 'true' : 'false'}</div>
    {props.setTaskToEdit && <div data-testid="has-set-task-edit">true</div>}
    {props.setReminderToEdit && <div data-testid="has-set-reminder-edit">true</div>}
  </div>
));

describe('CurrentDayPlanner Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the DailyPlanner with correct props', () => {
    const mockSetTaskToEdit = jest.fn();
    const mockSetReminderToEdit = jest.fn();

    render(
      <CurrentDayPlanner
        setTaskToEdit={mockSetTaskToEdit}
        setReminderToEdit={mockSetReminderToEdit}
      />
    );

    expect(screen.getByTestId('daily-planner')).toBeInTheDocument();
    expect(screen.getByTestId('day-value')).toHaveTextContent('2023-07-20');
    expect(screen.getByTestId('is-current-day')).toHaveTextContent('true');
    expect(screen.getByTestId('has-set-task-edit')).toBeInTheDocument();
    expect(screen.getByTestId('has-set-reminder-edit')).toBeInTheDocument();
  });

  test('dispatches setSelectedDayUI action on mount', () => {
    const mockSetTaskToEdit = jest.fn();
    const mockSetReminderToEdit = jest.fn();

    render(
      <CurrentDayPlanner
        setTaskToEdit={mockSetTaskToEdit}
        setReminderToEdit={mockSetReminderToEdit}
      />
    );

    // Verify the action creator was called with the correct day
    expect(mockSetSelectedDayUI).toHaveBeenCalledWith('2023-07-20');
    
    // Verify dispatch was called (any argument)
    expect(mockDispatch).toHaveBeenCalled();
    
    // We can also verify dispatch was called with an object that has the right type and payload
    const dispatchCall = mockDispatch.mock.calls[0][0];
    expect(dispatchCall.type).toBe('SET_SELECTED_DAY_UI');
    expect(dispatchCall.payload).toBe('2023-07-20');
  });
});