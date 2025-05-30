// @ts-nocheck
import '@testing-library/jest-dom';
import { act, render } from '@testing-library/react';

// Set up the mocks before requiring the component
// First create a mock for react-router-dom at the module system level
jest.doMock('react-router-dom', () => ({
  useLocation: jest.fn(() => ({ pathname: '/dashboard' }))
}), { virtual: true });

// Now require the component after the mock is set up
// Using require instead of import to ensure the mocking happens first
const CombinedSphere = require('../../../components/planning_utilities/CombinedSphere').default;

// Get access to the mocked useLocation function
const useLocation = require('react-router-dom').useLocation;

// Suppress console logs/errors for cleaner test output
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('CombinedSphere Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Reset the mock between tests
    useLocation.mockReset();
    useLocation.mockReturnValue({ pathname: '/dashboard' });
  });
  
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<CombinedSphere />);
    
    // Check that the timer-sphere element is rendered
    expect(document.querySelector('.timer-sphere')).toBeInTheDocument();
  });

  test('has notcentered class when on home page', () => {
    // Override the default mock for this test
    useLocation.mockReturnValue({ pathname: '/' });
    
    const { container } = render(<CombinedSphere />);
    
    // Check for the notcentered class
    expect(container.querySelector('.timer-sphere')).toHaveClass('notcentered');
  });

  test('displays timer when task is provided', () => {
    // Create a mock task with start and end times
    const now = new Date('2023-07-20T10:00:00Z');
    jest.setSystemTime(now);
    
    const mockTask = {
      name: 'Test Task',
      startTime: '20/07/2023, 09:30:00', // 30 minutes ago
      endTime: '20/07/2023, 10:30:00',   // 30 minutes from now
    };
    
    render(<CombinedSphere currentTask={mockTask} />);
    
    // The timer should display minutes and seconds left
    expect(document.body.textContent).toMatch(/\d+:\d+/);
    
    // Should display percentage
    expect(document.body.textContent).toMatch(/\d+%/);
  });

  test('updates percentage over time', () => {
    // Create a current task
    const initialTime = new Date('2023-07-20T10:00:00Z');
    jest.setSystemTime(initialTime);
    
    const mockTask = {
      name: 'Timed Task',
      // Task that runs from 10:00 to 10:30 (30 minutes)
      startTime: '20/07/2023, 10:00:00',
      endTime: '20/07/2023, 10:30:00',
    };
    
    render(<CombinedSphere currentTask={mockTask} />);
    
    // Initially should show 0% or close to it
    const initialText = document.body.textContent;
    expect(initialText).toMatch(/0%|1%|2%/); // Allow for small variations
    
    // Fast-forward 15 minutes (halfway)
    act(() => {
      jest.advanceTimersByTime(15 * 60 * 1000);
    });
    
    // Should now show around 50%
    const midwayText = document.body.textContent;
    
    // The percentage won't be exactly 50% due to render timing
    expect(midwayText).toMatch(/4\d%|5\d%/);
  });
});