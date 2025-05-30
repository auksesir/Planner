const dateUtils = require('./dateUtils');

let originalConsoleError;

beforeAll(() => {
  originalConsoleError = console.error;
  console.error = jest.fn(); // Replace with a mock function
});

afterAll(() => {
  console.error = originalConsoleError; // Restore original
});

describe('DateUtils', () => {
  describe('isValidDate', () => {
    test('should return true for valid Date objects', () => {
      expect(dateUtils.isValidDate(new Date())).toBe(true);
      expect(dateUtils.isValidDate(new Date('2023-07-20'))).toBe(true);
    });
    
    test('should return false for invalid Date objects', () => {
      expect(dateUtils.isValidDate(new Date('invalid'))).toBe(false);
      expect(dateUtils.isValidDate(new Date('2023-99-99'))).toBe(false);
    });
    
    test('should return false for non-Date objects', () => {
      expect(dateUtils.isValidDate('2023-07-20')).toBe(false);
      expect(dateUtils.isValidDate(123)).toBe(false);
      expect(dateUtils.isValidDate(null)).toBe(false);
      expect(dateUtils.isValidDate(undefined)).toBe(false);
      expect(dateUtils.isValidDate({})).toBe(false);
    });
  });
  
  describe('parseToUTCDate', () => {
    test('should parse ISO date strings correctly', () => {
      const isoDate = '2023-07-20T10:00:00.000Z';
      const result = dateUtils.parseToUTCDate(isoDate);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe(isoDate);
    });
    
    test('should parse YYYY-MM-DD format correctly', () => {
      const dateStr = '2023-07-20';
      const result = dateUtils.parseToUTCDate(dateStr);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getUTCFullYear()).toBe(2023);
      expect(result.getUTCMonth()).toBe(6); // 0-based, so July is 6
      expect(result.getUTCDate()).toBe(20);
    });
    
    test('should return a copy when given a Date object', () => {
      const original = new Date('2023-07-20T10:00:00.000Z');
      const result = dateUtils.parseToUTCDate(original);
      
      expect(result).toBeInstanceOf(Date);
      expect(result).not.toBe(original); // Should be a different object
      expect(result.getTime()).toBe(original.getTime()); // But represent the same time
    });
    
    test('should return null for invalid input', () => {
      expect(dateUtils.parseToUTCDate('invalid')).toBeNull();
      expect(dateUtils.parseToUTCDate(null)).toBeNull();
      expect(dateUtils.parseToUTCDate(undefined)).toBeNull();
      expect(dateUtils.parseToUTCDate({})).toBeNull();
    });
    
    test('should handle numeric timestamps', () => {
      const timestamp = new Date('2023-07-20').getTime();
      const result = dateUtils.parseToUTCDate(timestamp);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(timestamp);
    });
  });
  
  describe('formatDateString', () => {
    test('should format Date objects as YYYY-MM-DD', () => {
      const date = new Date('2023-07-20T10:00:00.000Z');
      const result = dateUtils.formatDateString(date);
      
      expect(result).toBe('2023-07-20');
    });
    
    test('should handle date at UTC midnight correctly', () => {
      const date = new Date('2023-07-20T00:00:00.000Z');
      const result = dateUtils.formatDateString(date);
      
      expect(result).toBe('2023-07-20');
    });
    
    test('should pad month and day with leading zeros', () => {
      const date = new Date('2023-01-02T10:00:00.000Z');
      const result = dateUtils.formatDateString(date);
      
      expect(result).toBe('2023-01-02');
    });
    
    test('should return null for invalid dates', () => {
      expect(dateUtils.formatDateString(new Date('invalid'))).toBeNull();
      expect(dateUtils.formatDateString('not a date')).toBeNull();
      expect(dateUtils.formatDateString(null)).toBeNull();
    });
  });
  
  describe('getTimeString', () => {
    test('should return time portion as HH:MM:SS', () => {
      const date = new Date('2023-07-20T10:30:45.000Z');
      const result = dateUtils.getTimeString(date);
      
      expect(result).toBe('10:30:45');
    });
    
    test('should handle midnight correctly', () => {
      const date = new Date('2023-07-20T00:00:00.000Z');
      const result = dateUtils.getTimeString(date);
      
      expect(result).toBe('00:00:00');
    });
    
    test('should return empty string for invalid dates', () => {
      expect(dateUtils.getTimeString(new Date('invalid'))).toBe('');
      expect(dateUtils.getTimeString('not a date')).toBe('');
      expect(dateUtils.getTimeString(null)).toBe('');
    });
  });
  
  describe('getTimeProgress', () => {
    test('should calculate progress percentage between dates', () => {
      const start = new Date('2023-07-20T10:00:00.000Z');
      const end = new Date('2023-07-20T11:00:00.000Z');
      const current = new Date('2023-07-20T10:30:00.000Z'); // Halfway through
      
      const result = dateUtils.getTimeProgress(start, end, current);
      
      expect(result).toBe(50); // 50%
    });
    
    test('should handle boundary conditions', () => {
      const start = new Date('2023-07-20T10:00:00.000Z');
      const end = new Date('2023-07-20T11:00:00.000Z');
      
      // At the start
      expect(dateUtils.getTimeProgress(start, end, start)).toBe(0);
      
      // At the end
      expect(dateUtils.getTimeProgress(start, end, end)).toBe(100);
      
      // After the end
      const afterEnd = new Date('2023-07-20T12:00:00.000Z');
      expect(dateUtils.getTimeProgress(start, end, afterEnd)).toBe(100);
      
      // Before the start
      const beforeStart = new Date('2023-07-20T09:00:00.000Z');
      expect(dateUtils.getTimeProgress(start, end, beforeStart)).toBe(0);
    });
    
    test('should return 0 for invalid dates', () => {
      const validDate = new Date();
      
      expect(dateUtils.getTimeProgress(null, validDate, validDate)).toBe(0);
      expect(dateUtils.getTimeProgress(validDate, null, validDate)).toBe(0);
      expect(dateUtils.getTimeProgress(validDate, validDate, null)).toBe(0);
      expect(dateUtils.getTimeProgress(new Date('invalid'), validDate, validDate)).toBe(0);
    });
  });
  
  describe('daysBetween', () => {
    test('should calculate days between two dates', () => {
      const date1 = new Date('2023-07-20');
      const date2 = new Date('2023-07-25');
      
      expect(dateUtils.daysBetween(date1, date2)).toBe(5);
    });
    
    test('should handle same day', () => {
      const date = new Date('2023-07-20');
      
      expect(dateUtils.daysBetween(date, date)).toBe(0);
    });
    
    test('should return absolute value regardless of order', () => {
      const date1 = new Date('2023-07-20');
      const date2 = new Date('2023-07-25');
      
      expect(dateUtils.daysBetween(date1, date2)).toBe(5);
      expect(dateUtils.daysBetween(date2, date1)).toBe(5);
    });
    
    test('should return 0 for invalid dates', () => {
      const validDate = new Date();
      
      expect(dateUtils.daysBetween(null, validDate)).toBe(0);
      expect(dateUtils.daysBetween(validDate, null)).toBe(0);
      expect(dateUtils.daysBetween(new Date('invalid'), validDate)).toBe(0);
    });
  });
  
  describe('combineDateTime', () => {
    test('should combine date from one Date and time from another', () => {
      const dateObj = new Date('2023-07-20T00:00:00.000Z');
      const timeObj = new Date('2000-01-01T14:30:45.000Z');
      
      const result = dateUtils.combineDateTime(dateObj, timeObj);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getUTCFullYear()).toBe(2023);
      expect(result.getUTCMonth()).toBe(6); // July
      expect(result.getUTCDate()).toBe(20);
      expect(result.getUTCHours()).toBe(14);
      expect(result.getUTCMinutes()).toBe(30);
      expect(result.getUTCSeconds()).toBe(45);
    });
    
    test('should return null for invalid inputs', () => {
      const validDate = new Date();
      
      expect(dateUtils.combineDateTime(null, validDate)).toBeNull();
      expect(dateUtils.combineDateTime(validDate, null)).toBeNull();
      expect(dateUtils.combineDateTime(new Date('invalid'), validDate)).toBeNull();
      expect(dateUtils.combineDateTime(validDate, new Date('invalid'))).toBeNull();
    });
  });
  
  
  
  
 
});