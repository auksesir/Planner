// src/utils/reminderUtils.test.js
import { toast } from 'react-toastify';
import {
    clearAllReminderNotifications,
    clearForm,
    clearInputField,
    clearReminderNotification,
    scheduleReminder,
    submitReminder,
    validateRepeatEndDate
} from '../../utils/reminderUtils';
  
  // Mock dependencies
  jest.mock('../../api/api', () => ({
    addReminder: jest.fn(),
    updateReminder: jest.fn(),
    getLatestReminder: jest.fn(),
    getRemindersForDay: jest.fn().mockResolvedValue([])
  }));
  
  // Mock date-fns functions
  jest.mock('date-fns', () => ({
    format: jest.fn(() => '20/07/2023, 10:00:00'),
    getHours: jest.fn().mockReturnValue(10),
    getMinutes: jest.fn().mockReturnValue(0),
    isSameDay: jest.fn().mockReturnValue(true),
    parseISO: jest.fn(() => new Date('2023-07-20T10:00:00Z')),
    compareAsc: jest.fn().mockReturnValue(0)
  }));
  
  // Mock react-toastify
  jest.mock('react-toastify', () => ({
    toast: {
      info: jest.fn(),
      dismiss: jest.fn()
    }
  }));
  
  jest.mock('../../utils/sharedUtils', () => ({
    formatDateTime: jest.fn(() => '20/07/2023, 10:00:00')
  }));
  
  describe('reminderUtils', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.useFakeTimers();
    });
  
    afterEach(() => {
      jest.useRealTimers();
    });
  
    describe('submitReminder', () => {
      test('should add a new reminder successfully', async () => {
        // Import the specific mocks so we can configure them
        const { addReminder, getLatestReminder } = require('../../api/api');
        
        // Configure both mocks needed for this test
        addReminder.mockResolvedValueOnce({
          success: true,
          message: 'Reminder added successfully',
          data: {
            id: 123,
            repeatReminderOnCurrentDay: false,
            repeatReminderOnSelectedDay: false
          }
        });
        
        // Make sure getLatestReminder returns properly too
        getLatestReminder.mockResolvedValueOnce({
          id: 123,
          name: 'Test Reminder',
          selectedTime: '20/07/2023, 10:00:00',
          selectedDay: '20/07/2023',
          originalStartDay: '20/07/2023',
          currentDay: '20/07/2023'
        });
        
        const newReminder = {
          name: 'New Test Reminder',
          selectedDay: new Date('2023-07-20T00:00:00Z'),
          originalStartDay: new Date('2023-07-20T00:00:00Z'),
          selectedTime: new Date('2023-07-20T10:00:00Z'),
          repeatOption: '',
          repeatEndDay: null,
          currentDay: new Date()
        };
        
        // Execute function under test
        const result = await submitReminder(newReminder, false, null);
        
        // Assertions
        expect(result.result.success).toBe(true);
        expect(result.result.message).toBe('Reminder added successfully');
        expect(result.latestReminder).toBeDefined();
        expect(result.latestReminder.id).toBe(123);
      });
  
      test('should update an existing reminder successfully', async () => {
        // Import the specific mock so we can configure it
        const { updateReminder } = require('../../api/api');
        
        // Configure mock for this specific test
        updateReminder.mockResolvedValueOnce({
          success: true,
          message: 'Reminder updated successfully',
          data: {
            repeatReminderOnCurrentDay: false,
            repeatReminderOnSelectedDay: false
          }
        });
        
        const existingReminder = {
          id: 123,
          name: 'Existing Reminder',
          selectedDay: new Date('2023-07-20T00:00:00Z'),
          originalStartDay: new Date('2023-07-20T00:00:00Z'),
          selectedTime: new Date('2023-07-20T10:00:00Z'),
          repeatOption: 'daily',
          repeatEndDay: new Date('2023-07-27T00:00:00Z'),
          currentDay: new Date()
        };
        
        // Execute function under test
        const result = await submitReminder(existingReminder, true, existingReminder);
        
        // Assertions
        expect(result.result.success).toBe(true);
        expect(result.result.message).toBe('Reminder updated successfully');
        expect(result.latestReminder).toEqual(existingReminder);
      });
  
      test('should handle reminder overlap error', async () => {
        // Import the specific mock so we can configure it
        const { addReminder } = require('../../api/api');
        
        // Configure mock for this specific test
        addReminder.mockResolvedValueOnce({
          success: false,
          message: 'This reminder conflicts with another reminder',
          error: {}
        });
  
        const newReminder = {
          name: 'Conflicting Reminder',
          selectedDay: new Date('2023-07-20T00:00:00Z'),
          selectedTime: new Date('2023-07-20T10:00:00Z'),
          repeatOption: ''
        };
  
        // Execute function under test
        const result = await submitReminder(newReminder, false, null);
        
        // Assertions
        expect(result.result.success).toBe(false);
        expect(result.result.message).toBe('This reminder conflicts with another reminder');
      });
    });
  
    describe('clearForm and clearInputField', () => {
      test('clearForm should reset all form fields', () => {
        const setReminderState = jest.fn();
        
        clearForm(setReminderState);
        
        expect(setReminderState).toHaveBeenCalledWith({
          reminderName: '',
          selectedDay: null,
          selectedTime: null,
          repeatOption: '',
          repeatEndDay: null
        });
      });
  
      test('clearInputField should clear a specific field', () => {
        const setReminderState = jest.fn();
        
        clearInputField('reminderName', setReminderState);
        
        expect(setReminderState).toHaveBeenCalled();
        // Should have been called with a function that updates just reminderName
        const updateFunction = setReminderState.mock.calls[0][0];
        const result = updateFunction({ reminderName: 'Old Value', otherField: 'Keep This' });
        expect(result).toEqual({ reminderName: '', otherField: 'Keep This' });
      });
  
      test('clearInputField should clear repeatOption and repeatEndDay when clearing repeatOption', () => {
        const setReminderState = jest.fn();
        
        clearInputField('repeatOption', setReminderState);
        
        expect(setReminderState).toHaveBeenCalled();
        // Should have been called with a function that updates just reminderName
        const updateFunction = setReminderState.mock.calls[0][0];
        const result = updateFunction({ 
          repeatOption: 'daily', 
          repeatEndDay: new Date(), 
          otherField: 'Keep This' 
        });
        
        expect(result).toEqual({ 
          repeatOption: '', 
          repeatEndDay: null, 
          otherField: 'Keep This' 
        });
      });
    });
  
    describe('validateRepeatEndDate', () => {
      test('should return true if repeatEndDay is null', () => {
        expect(validateRepeatEndDate(null, new Date())).toBe(true);
      });
  
      test('should return true if selectedDay is null', () => {
        expect(validateRepeatEndDate(new Date(), null)).toBe(true);
      });
  
      test('should return true if repeatEndDay is after selectedDay', () => {
        const selectedDay = new Date('2023-07-20');
        const repeatEndDay = new Date('2023-07-25');
        
        expect(validateRepeatEndDate(repeatEndDay, selectedDay)).toBe(true);
      });
  
      test('should return true if repeatEndDay is equal to selectedDay', () => {
        const selectedDay = new Date('2023-07-20');
        const repeatEndDay = new Date('2023-07-20');
        
        expect(validateRepeatEndDate(repeatEndDay, selectedDay)).toBe(true);
      });
  
      test('should return false if repeatEndDay is before selectedDay', () => {
        const selectedDay = new Date('2023-07-20');
        const repeatEndDay = new Date('2023-07-19');
        
        expect(validateRepeatEndDate(repeatEndDay, selectedDay)).toBe(false);
      });
    });
  
    describe('scheduleReminder', () => {
      test('should schedule a reminder toast notification for future reminders', () => {
        // Setup
        const reminderItem = {
          id: 123,
          name: 'Test Reminder',
          selectedTime: new Date(Date.now() + 5000).toISOString() // 5 seconds in the future
        };
        
        // Execute
        scheduleReminder(reminderItem);
        
        // Fast-forward time
        jest.advanceTimersByTime(5000);
        
        // Verify
        expect(toast.info).toHaveBeenCalled();
      });
  
      test('should not schedule a reminder toast for past reminders', () => {
        // Setup
        const reminderItem = {
          id: 123,
          name: 'Test Reminder',
          selectedTime: new Date(Date.now() - 5000).toISOString() // 5 seconds in the past
        };
        
        // Execute
        scheduleReminder(reminderItem);
        
        // Fast-forward time
        jest.advanceTimersByTime(5000);
        
        // Verify
        expect(toast.info).not.toHaveBeenCalled();
      });
  
      test('should clear existing timeout when scheduling the same reminder again', () => {
        // Setup
        const reminderItem = {
          id: 123,
          name: 'Test Reminder',
          selectedTime: new Date(Date.now() + 10000).toISOString() // 10 seconds in the future
        };
        
        // Execute first time
        scheduleReminder(reminderItem);
        
        // Schedule again with new time
        const updatedReminder = {
          ...reminderItem,
          selectedTime: new Date(Date.now() + 5000).toISOString() // 5 seconds in the future
        };
        
        scheduleReminder(updatedReminder);
        
        // Fast-forward time by 5 seconds
        jest.advanceTimersByTime(5000);
        
        // Verify the toast was shown after 5 seconds (not 10)
        expect(toast.info).toHaveBeenCalledTimes(1);
      });
    });
  
    describe('clearReminderNotification', () => {
      test('should clear a scheduled reminder notification', () => {
        // Setup
        const reminderItem = {
          id: 123,
          name: 'Test Reminder',
          selectedTime: new Date(Date.now() + 5000).toISOString() // 5 seconds in the future
        };
        
        // Schedule the reminder
        scheduleReminder(reminderItem);
        
        // Clear the notification
        clearReminderNotification(reminderItem.id);
        
        // Fast-forward time
        jest.advanceTimersByTime(5000);
        
        // Verify toast was not triggered
        expect(toast.info).not.toHaveBeenCalled();
      });
  
      test('should dismiss an active toast notification', () => {
        // Clear an active notification
        clearReminderNotification(123);
        
        // Verify toast dismiss was called
        expect(toast.dismiss).toHaveBeenCalledWith('reminder-123');
      });
    });
  
    describe('clearAllReminderNotifications', () => {
      test('should clear all scheduled reminders and dismiss all toasts', () => {
        // Setup multiple reminders
        const reminder1 = {
          id: 123,
          name: 'Test Reminder 1',
          selectedTime: new Date(Date.now() + 5000).toISOString()
        };
        
        const reminder2 = {
          id: 456,
          name: 'Test Reminder 2',
          selectedTime: new Date(Date.now() + 10000).toISOString()
        };
        
        // Schedule both reminders
        scheduleReminder(reminder1);
        scheduleReminder(reminder2);
        
        // Clear all notifications
        clearAllReminderNotifications();
        
        // Fast-forward time
        jest.advanceTimersByTime(10000);
        
        // Verify no toasts were shown
        expect(toast.info).not.toHaveBeenCalled();
        
        // Verify all active toasts were dismissed
        expect(toast.dismiss).toHaveBeenCalledWith('reminder-123');
        expect(toast.dismiss).toHaveBeenCalledWith('reminder-456');
      });
    });
  });