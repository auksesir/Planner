// @ts-nocheck
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import PomodoroInputBar from '../../../components/input_components/PomodoroInputBar';

// Mock dependencies
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  }
}));

// Mock API calls - we don't need to mock the API directly
// since the component handles loading internally
jest.mock('../../../api/pomodoroApi', () => ({
  getPomodoroSettings: jest.fn().mockImplementation(() => Promise.resolve({
    work_duration: 25,
    break_duration: 5
  }))
}));

describe('PomodoroInputBar Component', () => {
  // Common test props
  const onCancel = jest.fn();
  const onStartPomodoro = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the component with default values', async () => {
    await act(async () => {
      render(
        <PomodoroInputBar 
          onCancel={onCancel}
          onStartPomodoro={onStartPomodoro}
        />
      );
    });
    
    expect(screen.getByText('Pomodoro Timer')).toBeInTheDocument();
    
    // Check that the inputs have the default values
    const workDurationInput = screen.getByLabelText('Work Duration (minutes)');
    const breakDurationInput = screen.getByLabelText('Break Duration (minutes)');
    
    expect(workDurationInput).toHaveValue(25);
    expect(breakDurationInput).toHaveValue(5);
  });

  test('calls onCancel when Go Back button is clicked', async () => {
    await act(async () => {
      render(
        <PomodoroInputBar 
          onCancel={onCancel}
          onStartPomodoro={onStartPomodoro}
        />
      );
    });
    
    fireEvent.click(screen.getByText('Go Back'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('calls onStartPomodoro with default values when Start Pomodoro button is clicked', async () => {
    await act(async () => {
      render(
        <PomodoroInputBar 
          onCancel={onCancel}
          onStartPomodoro={onStartPomodoro}
        />
      );
    });
    
    // Start with default values
    fireEvent.click(screen.getByText('Start Pomodoro'));
    expect(onStartPomodoro).toHaveBeenCalledWith(25, 5);
  });

  test('updates work duration when input changes', async () => {
    await act(async () => {
      render(
        <PomodoroInputBar 
          onCancel={onCancel}
          onStartPomodoro={onStartPomodoro}
        />
      );
    });
    
    const workDurationInput = screen.getByLabelText('Work Duration (minutes)');
    
    fireEvent.change(workDurationInput, { target: { value: '45' } });
    
    fireEvent.click(screen.getByText('Start Pomodoro'));
    expect(onStartPomodoro).toHaveBeenCalledWith(45, 5);
  });

  test('updates break duration when input changes', async () => {
    await act(async () => {
      render(
        <PomodoroInputBar 
          onCancel={onCancel}
          onStartPomodoro={onStartPomodoro}
        />
      );
    });
    
    const breakDurationInput = screen.getByLabelText('Break Duration (minutes)');
    
    fireEvent.change(breakDurationInput, { target: { value: '15' } });
    
    fireEvent.click(screen.getByText('Start Pomodoro'));
    expect(onStartPomodoro).toHaveBeenCalledWith(25, 15);
  });

  test('enforces minimum and maximum values for durations', async () => {
    await act(async () => {
      render(
        <PomodoroInputBar 
          onCancel={onCancel}
          onStartPomodoro={onStartPomodoro}
        />
      );
    });
    
    const workDurationInput = screen.getByLabelText('Work Duration (minutes)');
    const breakDurationInput = screen.getByLabelText('Break Duration (minutes)');
    
    // Test below minimum
    fireEvent.change(workDurationInput, { target: { value: '0' } });
    fireEvent.change(breakDurationInput, { target: { value: '0' } });
    
    fireEvent.click(screen.getByText('Start Pomodoro'));
    expect(onStartPomodoro).toHaveBeenCalledWith(1, 1); // Should use minimum values
    
    // Test above maximum
    fireEvent.change(workDurationInput, { target: { value: '200' } });
    fireEvent.change(breakDurationInput, { target: { value: '100' } });
    
    fireEvent.click(screen.getByText('Start Pomodoro'));
    expect(onStartPomodoro).toHaveBeenCalledWith(120, 60); // Should use maximum values
  });
});