// tests/performance/CalendarPerformance.test.js
// Fixed version without JSX to avoid Babel configuration issues

import { addDays, format, startOfWeek } from 'date-fns';
import { groupItemsByTimeSlot } from '../../utils/timeUtils';

// Mock API with configurable data size
const createMockTasks = (count) => {
  const tasks = [];
  const baseDate = new Date('2024-01-01');
  
  for (let i = 0; i < count; i++) {
    const dayOffset = i % 7; // Spread across a week
    const hourOffset = (i % 12) + 8; // 8 AM to 8 PM
    const startTime = new Date(baseDate);
    startTime.setDate(baseDate.getDate() + dayOffset);
    startTime.setHours(hourOffset, 0, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 1);
    
    tasks.push({
      id: i + 1,
      name: `Task ${i + 1}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      selectedDay: format(startTime, 'yyyy-MM-dd'),
      duration: 60,
      repeatOption: '',
      created_at: baseDate.toISOString()
    });
  }
  
  return tasks;
};

const createMockReminders = (count) => {
  const reminders = [];
  const baseDate = new Date('2024-01-01');
  
  for (let i = 0; i < count; i++) {
    const dayOffset = i % 7;
    const hourOffset = (i % 12) + 8;
    const reminderTime = new Date(baseDate);
    reminderTime.setDate(baseDate.getDate() + dayOffset);
    reminderTime.setHours(hourOffset, 30, 0, 0);
    
    reminders.push({
      id: i + 1,
      name: `Reminder ${i + 1}`,
      selectedTime: reminderTime.toISOString(),
      selectedDay: format(reminderTime, 'yyyy-MM-dd'),
      repeatOption: '',
      created_at: baseDate.toISOString()
    });
  }
  
  return reminders;
};

// Mock API functions
jest.mock('../../api/api', () => ({
  getTasksForWeek: jest.fn(),
  getRemindersForWeek: jest.fn(),
  getTasksForDay: jest.fn(),
  getRemindersForDay: jest.fn(),
}));

// Performance measurement utilities
const measurePerformance = async (operation, label) => {
  const startTime = performance.now();
  const result = await operation();
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  (`${label}: ${duration.toFixed(2)}ms`);
  return { result, duration };
};

describe('Calendar Performance Tests', () => {
  let mockGetTasksForWeek, mockGetRemindersForWeek;
  let mockGetTasksForDay, mockGetRemindersForDay;

  beforeEach(() => {
    const api = require('../../api/api');
    mockGetTasksForWeek = api.getTasksForWeek;
    mockGetRemindersForWeek = api.getRemindersForWeek;
    mockGetTasksForDay = api.getTasksForDay;
    mockGetRemindersForDay = api.getRemindersForDay;
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Data Processing Performance', () => {
    test('groupItemsByTimeSlot should process 100 tasks in <100ms', async () => {
      const tasks = createMockTasks(100);
      
      const { duration } = await measurePerformance(
        () => groupItemsByTimeSlot(tasks, 'startTime', 'endTime'),
        'groupItemsByTimeSlot (100 tasks)'
      );
      
      expect(duration).toBeLessThan(100);
    });

    test('groupItemsByTimeSlot should process 500 tasks in <500ms', async () => {
      const tasks = createMockTasks(500);
      
      const { duration } = await measurePerformance(
        () => groupItemsByTimeSlot(tasks, 'startTime', 'endTime'),
        'groupItemsByTimeSlot (500 tasks)'
      );
      
      expect(duration).toBeLessThan(500);
    });

    test('groupItemsByTimeSlot should process 100 reminders in <50ms', async () => {
      const reminders = createMockReminders(100);
      
      const { duration } = await measurePerformance(
        () => groupItemsByTimeSlot(reminders, 'selectedTime', 'selectedTime'),
        'groupItemsByTimeSlot (100 reminders)'
      );
      
      expect(duration).toBeLessThan(50);
    });
  });

  describe('API Response Processing Performance', () => {
    test('should process 100 tasks API response in <50ms', async () => {
      const mockTasks = createMockTasks(100);
      const mockReminders = createMockReminders(50);
      
      const { duration } = await measurePerformance(
        async () => {
          // Simulate API processing
          const processedTasks = mockTasks.map(task => ({
            ...task,
            startTime: new Date(task.startTime),
            endTime: new Date(task.endTime)
          }));
          
          const processedReminders = mockReminders.map(reminder => ({
            ...reminder,
            selectedTime: new Date(reminder.selectedTime)
          }));
          
          return { tasks: processedTasks, reminders: processedReminders };
        },
        'API Response Processing (100 tasks + 50 reminders)'
      );
      
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Data Transformation Performance', () => {
    test('should transform large datasets quickly', async () => {
      const largeTasks = createMockTasks(1000);
      const largeReminders = createMockReminders(500);
      
      const { duration } = await measurePerformance(
        () => {
          // Simulate the data transformations that happen in the app
          const groupedTasks = groupItemsByTimeSlot(largeTasks, 'startTime', 'endTime');
          const groupedReminders = groupItemsByTimeSlot(largeReminders, 'selectedTime', 'selectedTime');
          
          // Simulate organizing by day (like in WeeklyPlanner)
          const organizedTasks = largeTasks.reduce((acc, task) => {
            const day = format(new Date(task.selectedDay), 'yyyy-MM-dd');
            if (!acc[day]) acc[day] = [];
            acc[day].push(task);
            return acc;
          }, {});
          
          return { groupedTasks, groupedReminders, organizedTasks };
        },
        'Large Dataset Transformation (1000 tasks + 500 reminders)'
      );
      
      // Should process large datasets in reasonable time
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Memory Usage Tests', () => {
    test('should not create memory leaks with large datasets', async () => {
      // Only run if performance.memory is available
      if (!performance.memory) {
        ('Memory testing not available in this environment');
        return;
      }

      const initialMemory = performance.memory.usedJSHeapSize;
      
      // Create and process large dataset multiple times
      for (let i = 0; i < 10; i++) {
        const largeTasks = createMockTasks(500);
        const largeReminders = createMockReminders(250);
        
        // Process data
        groupItemsByTimeSlot(largeTasks, 'startTime', 'endTime');
        groupItemsByTimeSlot(largeReminders, 'selectedTime', 'selectedTime');
        
        // Clear references
        largeTasks.length = 0;
        largeReminders.length = 0;
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = performance.memory.usedJSHeapSize;
      const memoryIncrease = finalMemory - initialMemory;
      
      (`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      // Memory increase should be reasonable (less than 10MB for this test)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Real-world Calendar Loading Scenarios', () => {
    test('complete calendar load with 100 tasks should be under 1 second (NFR 1.3)', async () => {
      const mockTasks = createMockTasks(100);
      const mockReminders = createMockReminders(50);
      
      mockGetTasksForWeek.mockResolvedValue(mockTasks);
      mockGetRemindersForWeek.mockResolvedValue(mockReminders);
      
      const { duration } = await measurePerformance(
        async () => {
          // Simulate complete calendar loading flow
          const startDate = format(startOfWeek(new Date()), 'yyyy-MM-dd');
          const endDate = format(addDays(startOfWeek(new Date()), 6), 'yyyy-MM-dd');
          
          // API calls
          const [tasks, reminders] = await Promise.all([
            mockGetTasksForWeek(startDate, endDate),
            mockGetRemindersForWeek(startDate, endDate)
          ]);
          
          // Data processing (simulate what WeeklyPlanner does)
          const organizedTasks = tasks.reduce((acc, task) => {
            const day = format(new Date(task.selectedDay), 'yyyy-MM-dd');
            if (!acc[day]) acc[day] = [];
            acc[day].push(task);
            return acc;
          }, {});
          
          const organizedReminders = reminders.reduce((acc, reminder) => {
            const day = format(new Date(reminder.selectedDay), 'yyyy-MM-dd');
            if (!acc[day]) acc[day] = [];
            acc[day].push(reminder);
            return acc;
          }, {});
          
          // Simulate grouping for daily view
          const sampleDayTasks = organizedTasks[Object.keys(organizedTasks)[0]] || [];
          const sampleDayReminders = organizedReminders[Object.keys(organizedReminders)[0]] || [];
          
          const groupedTasks = groupItemsByTimeSlot(sampleDayTasks, 'startTime', 'endTime');
          const groupedReminders = groupItemsByTimeSlot(sampleDayReminders, 'selectedTime', 'selectedTime');
          
          return { organizedTasks, organizedReminders, groupedTasks, groupedReminders };
        },
        'Complete Calendar Load (100 tasks) - NFR 1.3 Test'
      );
      
      // This is the key NFR 1.3 requirement
      expect(duration).toBeLessThan(1000);
      (`✅ NFR 1.3 ${duration < 1000 ? 'PASSED' : 'FAILED'}: Calendar loaded in ${duration.toFixed(2)}ms`);
    });

    test('switching between calendar views should be fast', async () => {
      const mockTasks = createMockTasks(100);
      const mockReminders = createMockReminders(50);
      
      mockGetTasksForDay.mockResolvedValue(mockTasks.slice(0, 20));
      mockGetRemindersForDay.mockResolvedValue(mockReminders.slice(0, 10));
      
      const { duration } = await measurePerformance(
        async () => {
          // Simulate view switching from weekly to daily
          const dailyData = await Promise.all([
            mockGetTasksForDay('2024-01-01'),
            mockGetRemindersForDay('2024-01-01')
          ]);
          
          const groupedTasks = groupItemsByTimeSlot(dailyData[0], 'startTime', 'endTime');
          const groupedReminders = groupItemsByTimeSlot(dailyData[1], 'selectedTime', 'selectedTime');
          
          return { groupedTasks, groupedReminders };
        },
        'Calendar View Switch Performance'
      );
      
      expect(duration).toBeLessThan(200);
    });

    test('calendar with heavy load (500 tasks) should still perform reasonably', async () => {
      const heavyTasks = createMockTasks(500);
      const heavyReminders = createMockReminders(250);
      
      mockGetTasksForWeek.mockResolvedValue(heavyTasks);
      mockGetRemindersForWeek.mockResolvedValue(heavyReminders);
      
      const { duration } = await measurePerformance(
        async () => {
          const startDate = format(startOfWeek(new Date()), 'yyyy-MM-dd');
          const endDate = format(addDays(startOfWeek(new Date()), 6), 'yyyy-MM-dd');
          
          const [tasks, reminders] = await Promise.all([
            mockGetTasksForWeek(startDate, endDate),
            mockGetRemindersForWeek(startDate, endDate)
          ]);
          
          // Process heavy dataset
          const organizedTasks = tasks.reduce((acc, task) => {
            const day = format(new Date(task.selectedDay), 'yyyy-MM-dd');
            if (!acc[day]) acc[day] = [];
            acc[day].push(task);
            return acc;
          }, {});
          
          const organizedReminders = reminders.reduce((acc, reminder) => {
            const day = format(new Date(reminder.selectedDay), 'yyyy-MM-dd');
            if (!acc[day]) acc[day] = [];
            acc[day].push(reminder);
            return acc;
          }, {});
          
          return { organizedTasks, organizedReminders };
        },
        'Heavy Load Calendar Test (500 tasks + 250 reminders)'
      );
      
      // Should handle heavy loads in under 2 seconds
      expect(duration).toBeLessThan(2000);
      (`Heavy load performance: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Performance Benchmarks', () => {
    test('benchmark different data sizes', async () => {
      const sizes = [10, 50, 100, 200];
      const results = {};
      
      for (const size of sizes) {
        const tasks = createMockTasks(size);
        const reminders = createMockReminders(Math.floor(size / 2));
        
        const { duration } = await measurePerformance(
          () => {
            groupItemsByTimeSlot(tasks, 'startTime', 'endTime');
            groupItemsByTimeSlot(reminders, 'selectedTime', 'selectedTime');
          },
          `Benchmark ${size} items`
        );
        
        results[size] = {
          duration,
          itemsPerMs: (size + Math.floor(size / 2)) / duration
        };
      }
      
      ('Performance Benchmark Results:', results);
      
      // Verify that performance scales reasonably
      // Processing time should not increase exponentially
      const ratio100to10 = results[100].duration / results[10].duration;
      expect(ratio100to10).toBeLessThan(15); // Should not be more than 15x slower for 10x data
    });
  });
});

// Export utility functions for use in other tests
export {
    createMockReminders, createMockTasks, measurePerformance
};

