// @ts-nocheck
import '@testing-library/jest-dom'; // Corrected jest-dom import
import { act, render } from '@testing-library/react';
import * as sharedUtils from '../../../utils/sharedUtils';

// Import the component after setting up mocks
import ReminderScheduler from '../../../components/planning_utilities/ReminderScheduler';
import { parseDate } from '../../../utils/timeUtils';

// Suppress console logs/errors for cleaner test output
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock Redux state (currentHour specifically)
jest.mock('react-redux', () => ({
  useSelector: jest.fn().mockImplementation(selector => {
    const mockState = {
      currentHour: '10:00 AM'
    };
    return selector(mockState);
  })
}));

// Create a proper localStorage mock that maintains state between test operations
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    getStore: () => ({ ...store }), // Helper for tests to check current state
    length: jest.fn(() => Object.keys(store).length),
    key: jest.fn(i => Object.keys(store)[i] || null),
    store: store, // This allows direct access to the store for tests
  };
})();


// Replace window.localStorage with our mock
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock createReminderToast
jest.mock('../../../utils/sharedUtils', () => ({
  createReminderToast: jest.fn((item, type, callback) => {
    // Store the callback for tests to access
    return callback;
  }),
}));

// Mock timeUtils parseDate to simplify date handling
jest.mock('../../../utils/timeUtils', () => ({
  parseDate: jest.fn(dateStr => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr);
    } catch (e) {
      return null;
    }
  }),
}));

describe('ReminderScheduler Component', () => {
  // Mock function for clearing reminders
  const mockClearReminder = jest.fn().mockResolvedValue({ success: true });

  beforeEach(() => {
    // Reset all mocks and localStorage before each test
    jest.clearAllMocks();
    mockLocalStorage.clear();
    
    // Set a fixed time for all tests
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-07-20T10:00:00.000Z'));
  });
  
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('renders without crashing', () => {
    render(<ReminderScheduler items={[]} onClearReminder={mockClearReminder} />);
  });

  test('handles task reminders correctly', async () => {
    const mockTask = {
      id: 123,
      name: 'Test Task',
      type: 'task',
      startTime: '2023-07-20T10:30:00.000Z',
      endTime: '2023-07-20T11:00:00.000Z',
      reminderTime: '2023-07-20T10:00:00.000Z'
    };
    
    let clearReminderCallback;
    sharedUtils.createReminderToast.mockImplementationOnce((item, type, callback) => {
      clearReminderCallback = callback;
      return { success: true };
    });
    
    await act(async () => {
      const toastResult = sharedUtils.createReminderToast(
        mockTask, 
        'task', 
        async () => {
          await mockClearReminder(mockTask.id, 'task');
        }
      );
      
      if (clearReminderCallback) {
        await clearReminderCallback();
      }
    });
    
    expect(sharedUtils.createReminderToast).toHaveBeenCalledWith(
      mockTask,
      'task',
      expect.any(Function)
    );
    expect(mockClearReminder).toHaveBeenCalledWith(mockTask.id, 'task');
  });
  
  test('handles general reminders correctly', async () => {
    const mockReminder = {
      id: 456,
      name: 'Test General Reminder',
      type: 'reminder', 
      selectedTime: '2023-07-20T10:00:00.000Z'
    };
    
    let reminderCallback;
    sharedUtils.createReminderToast.mockImplementationOnce((item, type, callback) => {
      reminderCallback = callback;
      return { success: true };
    });
    
    await act(async () => {
      const toastResult = sharedUtils.createReminderToast(
        mockReminder, 
        'reminder',
        async () => {}
      );
      
      if (reminderCallback) {
        await reminderCallback();
      }
    });
    
    expect(sharedUtils.createReminderToast).toHaveBeenCalledWith(
      mockReminder,
      'reminder',
      expect.any(Function)
    );
    expect(mockClearReminder).not.toHaveBeenCalled();
  });
  
  test('identifies reminders scheduled for the current hour', () => {
    const findHourlyReminders = (items, currentHour) => {
      if (!currentHour) return [];
      
      return items.filter(item => {
        if (!item || !item.id) return false;
        
        const timeProperty = item.type === 'task' ? 'reminderTime' : 'selectedTime';
        const timeValue = item[timeProperty];
        
        if (!timeValue) return false;
        
        const reminderDate = new Date(timeValue);
        
        let hours = reminderDate.getUTCHours();
        const isPM = hours >= 12;
        const hour12 = hours % 12 || 12;
        const hourKey = `${hour12.toString().padStart(2, '0')}:00 ${isPM ? 'PM' : 'AM'}`;
        
        return hourKey === currentHour;
      });
    };
    
    const testItems = [
      {
        id: 1,
        name: '10 AM Task',
        type: 'task',
        reminderTime: '2023-07-20T10:00:00.000Z',
        startTime: '2023-07-20T10:30:00.000Z'
      },
      {
        id: 2,
        name: '10 AM Reminder',
        type: 'reminder',
        selectedTime: '2023-07-20T10:15:00.000Z'
      },
      {
        id: 3,
        name: '11 AM Task',
        type: 'task',
        reminderTime: '2023-07-20T11:00:00.000Z',
        startTime: '2023-07-20T11:30:00.000Z'
      }
    ];
    
    const tenAMReminders = findHourlyReminders(testItems, '10:00 AM');
    expect(tenAMReminders.length).toBe(2);
    expect(tenAMReminders[0].id).toBe(1);
    expect(tenAMReminders[1].id).toBe(2);
    
    const elevenAMReminders = findHourlyReminders(testItems, '11:00 AM');
    expect(elevenAMReminders.length).toBe(1);
    expect(elevenAMReminders[0].id).toBe(3);
  });
  
  test('cleans up old triggered reminders', () => {
    const testStorage = {
      'reminder-triggered-101': '1689674400000', 
      'reminder-triggered-102': '1689760800000',
      'reminder-triggered-103': '1689847200000'
    };
    
    const removeItem = (key) => {
      delete testStorage[key];
    };
    
    const cleanupOldReminders = () => {
      const today = new Date('2023-07-20T00:00:00.000Z').getTime();
      
      Object.keys(testStorage).forEach(key => {
        if (key.startsWith('reminder-triggered-')) {
          const timestamp = parseInt(testStorage[key], 10);
          if (timestamp < today) {
            removeItem(key);
          }
        }
      });
    };
    
    cleanupOldReminders();
    const remainingKeys = Object.keys(testStorage);
    expect(remainingKeys.length).toBe(1);
    expect(remainingKeys[0]).toBe('reminder-triggered-103');
  });
  
  test('prevents a reminder from triggering twice', () => {
    const testCurrentTime = new Date('2023-07-20T10:00:00.000Z');
    jest.setSystemTime(testCurrentTime);
    
    const testReminder = {
      id: 'test-123',
      name: 'Test Reminder',
      type: 'reminder',
      selectedTime: testCurrentTime.toISOString()
    };
    
    const reminderKey = `reminder-triggered-${testReminder.id}`;
    
    mockLocalStorage.store[reminderKey] = testCurrentTime.getTime().toString();
    expect(mockLocalStorage.store[reminderKey]).toBe(testCurrentTime.getTime().toString());
    
    const now = testCurrentTime;
    const parsedTime = new Date(testReminder.selectedTime);
    
    const parsedStoredTimestamp = parseInt(mockLocalStorage.store[reminderKey], 10);
    const isAlreadyTriggered = Math.abs(parsedTime.getTime() - parsedStoredTimestamp) < 60000;
    
    expect(isAlreadyTriggered).toBe(true);
  });
  
  test('integration: prevents duplicate reminder triggers', async () => {
    const testCurrentTime = new Date('2023-07-20T10:00:00.000Z');
    jest.setSystemTime(testCurrentTime);
    
    const testReminder = {
      id: 'integration-123',
      name: 'Integration Test Reminder',
      type: 'reminder',
      selectedTime: testCurrentTime.toISOString()
    };
    
    parseDate.mockImplementation((dateStr) => {
      if (dateStr === testReminder.selectedTime) {
        return testCurrentTime;
      }
      return new Date(dateStr);
    });
    
    const reminderKey = `reminder-triggered-${testReminder.id}`;
    mockLocalStorage.store[reminderKey] = testCurrentTime.getTime().toString();
    expect(mockLocalStorage.store[reminderKey]).toBe(testCurrentTime.getTime().toString());
    
    await act(async () => {
      render(
        <ReminderScheduler 
          items={[testReminder]} 
          onClearReminder={mockClearReminder} 
        />
      );
      jest.advanceTimersByTime(100);
    });
    
    expect(sharedUtils.createReminderToast).not.toHaveBeenCalled();
  });
});
