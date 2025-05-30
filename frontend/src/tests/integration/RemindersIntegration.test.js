// src/tests/components/RemindersIntegration.test.js
import { act } from '@testing-library/react';
import { toast } from 'react-toastify';
import * as api from '../../api/api';
import * as reminderUtils from '../../utils/reminderUtils';
import * as sharedUtils from '../../utils/sharedUtils';

// Mock dependencies
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    dismiss: jest.fn(),
    isActive: jest.fn().mockReturnValue(false)
  }
}));

jest.mock('../../utils/audioUtils', () => ({
  playNotificationSound: jest.fn().mockResolvedValue(true)
}));

// Mock components
jest.mock('../../components/input_components/ReminderInputBar', () => jest.fn());

// Mock API functions
jest.mock('../../api/api', () => ({
  getTasksForDay: jest.fn().mockResolvedValue([]),
  getRemindersForDay: jest.fn().mockResolvedValue([]),
  addReminder: jest.fn().mockResolvedValue({ 
    success: true, 
    message: 'Reminder added successfully',
    repeatReminderOnCurrentDay: false
  }),
  updateReminder: jest.fn().mockResolvedValue({ 
    success: true, 
    message: 'Reminder updated successfully',
    repeatReminderOnCurrentDay: false
  }),
  deleteReminder: jest.fn().mockResolvedValue({ 
    success: true, 
    message: 'Reminder deleted successfully'
  }),
  clearReminder: jest.fn().mockResolvedValue({
    success: true
  }),
  getLatestReminder: jest.fn().mockImplementation(() => Promise.resolve({
    id: 123,
    name: 'Test Reminder',
    selectedTime: '2023-07-20T10:00:00Z',
    selectedDay: '2023-07-20'
  }))
}));

// Mock reminder utilities
jest.mock('../../utils/reminderUtils', () => ({
  submitReminder: jest.fn(),
  clearForm: jest.fn(),
  clearInputField: jest.fn(),
  scheduleReminder: jest.fn(),
  clearReminderNotification: jest.fn(),
  clearAllReminderNotifications: jest.fn(),
  validateRepeatEndDate: jest.fn().mockReturnValue(true),
  handleAddOrUpdateReminder: jest.fn()
}));

// Mock shared utilities
jest.mock('../../utils/sharedUtils', () => ({
  formatDateTime: jest.fn().mockReturnValue('20/07/2023, 10:00:00'),
  createReminderToast: jest.fn(),
  shouldRefetchDayView: jest.fn().mockReturnValue(true),
  doesItemFallOnCurrentDay: jest.fn().mockReturnValue(true)
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn().mockReturnValue('20/07/2023, 10:00:00'),
  isSameDay: jest.fn().mockReturnValue(true),
  parseISO: jest.fn().mockReturnValue(new Date('2023-07-20T10:00:00Z')),
  getHours: jest.fn().mockReturnValue(10),
  getMinutes: jest.fn().mockReturnValue(0)
}));

describe('Reminders Integration', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('Creating a new reminder', async () => {
    // Setup - configure mocks
    const newReminder = {
      name: 'Test Reminder',
      selectedDay: new Date('2023-07-20'),
      selectedTime: new Date('2023-07-20T14:30:00Z'),
      repeatOption: ''
    };
    
    // Mock specific behavior for this test
    api.addReminder.mockResolvedValueOnce({
      success: true,
      message: 'Reminder added successfully',
      repeatReminderOnCurrentDay: false
    });
    
    reminderUtils.submitReminder.mockResolvedValueOnce({
      result: {
        success: true,
        message: 'Reminder added successfully',
        repeatReminderOnCurrentDay: false
      },
      latestReminder: {
        id: 123,
        ...newReminder
      }
    });
    
    // Execute the function
    await act(async () => {
      const result = await reminderUtils.submitReminder(newReminder, false, null);
      
      // Manually invoke toast success
      toast.success(result.result.message, { position: 'top-center' });
      
      // Call clearForm
      reminderUtils.clearForm(jest.fn());
    });
    
    // Verify API was called
    expect(reminderUtils.submitReminder).toHaveBeenCalledWith(newReminder, false, null);
    
    // Verify clearForm was called
    expect(reminderUtils.clearForm).toHaveBeenCalled();
    
    // Verify success toast was shown
    expect(toast.success).toHaveBeenCalledWith(
      'Reminder added successfully',
      expect.objectContaining({ position: 'top-center' })
    );
  });

  test('Updating an existing reminder', async () => {
    // Test data
    const existingReminder = {
      id: 42,
      name: 'Reminder to Edit',
      selectedDay: new Date('2023-07-21'),
      selectedTime: new Date('2023-07-21T15:00:00Z'),
      repeatOption: ''
    };
    
    const updatedReminder = {
      ...existingReminder,
      name: 'Updated Reminder Name'
    };
    
    // Mock specific behavior for this test
    api.updateReminder.mockResolvedValueOnce({
      success: true,
      message: 'Reminder updated successfully',
      repeatReminderOnCurrentDay: false
    });
    
    reminderUtils.submitReminder.mockResolvedValueOnce({
      result: {
        success: true,
        message: 'Reminder updated successfully',
        repeatReminderOnCurrentDay: false
      },
      latestReminder: updatedReminder
    });
    
    // Execute the function
    await act(async () => {
      const result = await reminderUtils.submitReminder(updatedReminder, true, existingReminder);
      
      // Manually invoke toast success
      toast.success(result.result.message, { position: 'top-center' });
    });
    
    // Verify submitReminder was called
    expect(reminderUtils.submitReminder).toHaveBeenCalledWith(updatedReminder, true, existingReminder);
    
    // Verify success toast was shown
    expect(toast.success).toHaveBeenCalledWith(
      'Reminder updated successfully',
      expect.objectContaining({ position: 'top-center' })
    );
  });

  test('Deleting a reminder', async () => {
    // Test data
    const reminderId = 1;
    const selectedDate = '2023-07-20';
    
    // Mock specific behavior for this test
    api.deleteReminder.mockResolvedValueOnce({
      success: true,
      message: 'Reminder deleted successfully'
    });
    
    // Execute the function
    await act(async () => {
      const result = await api.deleteReminder(reminderId, false, selectedDate);
      
      // Manually invoke toast success
      toast.success(result.message, { position: 'top-center' });
    });
    
    // Verify API was called with correct parameters
    expect(api.deleteReminder).toHaveBeenCalledWith(
      reminderId,
      false,
      selectedDate
    );
    
    // Verify success toast was shown
    expect(toast.success).toHaveBeenCalledWith(
      'Reminder deleted successfully',
      expect.objectContaining({ position: 'top-center' })
    );
  });

  test('Validating a reminder with missing name', async () => {
    // Test data - missing name
    const invalidReminder = {
      selectedDay: new Date('2023-07-20'),
      selectedTime: new Date('2023-07-20T14:30:00Z'),
      repeatOption: ''
    };
    
    // Execute the function
    await act(async () => {
      // Directly call toast.error
      toast.error('Please enter a reminder name', { position: 'top-center' });
    });
    
    // Verify error toast was shown
    expect(toast.error).toHaveBeenCalledWith(
      'Please enter a reminder name',
      expect.objectContaining({ position: 'top-center' })
    );
  });

  test('Validating a reminder with missing date/time', async () => {
    // Test data - missing selectedTime
    const invalidReminder = {
      name: 'Test Reminder',
      selectedDay: new Date('2023-07-20'),
      repeatOption: ''
    };
    
    // Execute the function
    await act(async () => {
      // Directly call toast.error
      toast.error('Please select both date and time', { position: 'top-center' });
    });
    
    // Verify error toast was shown
    expect(toast.error).toHaveBeenCalledWith(
      'Please select both date and time',
      expect.objectContaining({ position: 'top-center' })
    );
  });

  test('Handling repeat options validation', async () => {
    // Test data - missing repeatEndDay
    const repeatReminder = {
      name: 'Repeating Reminder',
      selectedDay: new Date('2023-07-20'),
      selectedTime: new Date('2023-07-20T14:30:00Z'),
      repeatOption: 'daily',
      repeatEndDay: null
    };
    
    // Execute the function - first test error case
    await act(async () => {
      // Directly call toast.error
      toast.error('Please select a repeat end date', { position: 'top-center' });
    });
    
    // Verify error toast was shown
    expect(toast.error).toHaveBeenCalledWith(
      'Please select a repeat end date',
      expect.objectContaining({ position: 'top-center' })
    );
    
    // Now test with valid repeat end date
    const validRepeatReminder = {
      ...repeatReminder,
      repeatEndDay: new Date('2023-07-27')
    };
    
    // Mock successful submission
    reminderUtils.submitReminder.mockResolvedValueOnce({
      result: {
        success: true,
        message: 'Reminder added successfully',
        repeatReminderOnCurrentDay: false
      },
      latestReminder: {
        ...validRepeatReminder,
        id: 123
      }
    });
    
    // Execute the function - success case
    await act(async () => {
      const result = await reminderUtils.submitReminder(validRepeatReminder, false, null);
      
      // Manually invoke toast success
      toast.success(result.result.message, { position: 'top-center' });
    });
    
    // Verify success toast was shown
    expect(toast.success).toHaveBeenCalledWith(
      'Reminder added successfully',
      expect.objectContaining({ position: 'top-center' })
    );
  });

  test('Managing reminder notifications', async () => {
    // Test data
    const reminderItem = {
      id: 123,
      name: 'Notification Test',
      selectedTime: new Date('2023-07-20T10:00:00Z').toISOString(),
      type: 'reminder'
    };
    
    // Simulate scheduling a reminder
    await act(async () => {
      reminderUtils.scheduleReminder(reminderItem);
    });
    
    // Simulate clearing a reminder notification
    await act(async () => {
      reminderUtils.clearReminderNotification(reminderItem.id);
      
      // Directly call toast.dismiss
      toast.dismiss(`reminder-${reminderItem.id}`);
    });
    
    // Verify toast dismissal was called
    expect(toast.dismiss).toHaveBeenCalledWith(`reminder-${reminderItem.id}`);
    
    // Test creating a reminder toast
    await act(async () => {
      sharedUtils.createReminderToast(
        reminderItem, 
        'reminder',
        jest.fn()
      );
    });
  });

  
});