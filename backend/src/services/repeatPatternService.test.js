const repeatPatternService = require('./repeatPatternService');


describe('RepeatPatternService', () => {
  describe('checkRepeatPattern', () => {
    test('should return false for invalid dates', () => {
      const validDate = new Date('2023-01-01');
      
      expect(repeatPatternService.checkRepeatPattern(null, 'daily', validDate, null)).toBe(false);
      expect(repeatPatternService.checkRepeatPattern(undefined, 'daily', validDate, null)).toBe(false);
      expect(repeatPatternService.checkRepeatPattern(validDate, 'daily', null, null)).toBe(false);
      expect(repeatPatternService.checkRepeatPattern(validDate, 'daily', undefined, null)).toBe(false);
      expect(repeatPatternService.checkRepeatPattern('not-a-date', 'daily', validDate, null)).toBe(false);
      expect(repeatPatternService.checkRepeatPattern(validDate, 'daily', 'not-a-date', null)).toBe(false);
      expect(repeatPatternService.checkRepeatPattern(new Date('invalid'), 'daily', validDate, null)).toBe(false);
    });

    test('should return false for dates before the start date', () => {
      const startDate = new Date('2023-01-15');
      const beforeStartDate = new Date('2023-01-14');
      
      expect(repeatPatternService.checkRepeatPattern(beforeStartDate, 'daily', startDate, null)).toBe(false);
    });

    test('should return false for dates after the end date', () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const afterEndDate = new Date('2023-02-01');
      
      expect(repeatPatternService.checkRepeatPattern(afterEndDate, 'daily', startDate, endDate)).toBe(false);
    });

    test('should return true for exact start date regardless of repeat pattern', () => {
      const startDate = new Date('2023-01-01');
      
      expect(repeatPatternService.checkRepeatPattern(startDate, '', startDate, null)).toBe(true);
      expect(repeatPatternService.checkRepeatPattern(startDate, null, startDate, null)).toBe(true);
      expect(repeatPatternService.checkRepeatPattern(startDate, 'daily', startDate, null)).toBe(true);
    });

    test('should match daily repeat pattern correctly', () => {
      const startDate = new Date('2023-01-01');
      const nextDay = new Date('2023-01-02');
      const tenDaysLater = new Date('2023-01-11');
      
      expect(repeatPatternService.checkRepeatPattern(nextDay, 'daily', startDate, null)).toBe(true);
      expect(repeatPatternService.checkRepeatPattern(tenDaysLater, 'daily', startDate, null)).toBe(true);
    });

    test('should match weekly repeat pattern correctly', () => {
      const startDate = new Date('2023-01-01'); // Sunday
      const oneWeekLater = new Date('2023-01-08');
      const twoWeeksLater = new Date('2023-01-15');
      const notWeekly = new Date('2023-01-02');
      
      expect(repeatPatternService.checkRepeatPattern(oneWeekLater, 'weekly', startDate, null)).toBe(true);
      expect(repeatPatternService.checkRepeatPattern(twoWeeksLater, 'weekly', startDate, null)).toBe(true);
      expect(repeatPatternService.checkRepeatPattern(notWeekly, 'weekly', startDate, null)).toBe(false);
    });

    test('should match biweekly repeat pattern correctly', () => {
      const startDate = new Date('2023-01-01');
      const twoWeeksLater = new Date('2023-01-15');
      const fourWeeksLater = new Date('2023-01-29');
      const notBiweekly = new Date('2023-01-08');
      
      expect(repeatPatternService.checkRepeatPattern(twoWeeksLater, 'biweekly', startDate, null)).toBe(true);
      expect(repeatPatternService.checkRepeatPattern(fourWeeksLater, 'biweekly', startDate, null)).toBe(true);
      expect(repeatPatternService.checkRepeatPattern(notBiweekly, 'biweekly', startDate, null)).toBe(false);
    });

    test('should match monthly repeat pattern correctly', () => {
      const startDate = new Date('2023-01-15');
      const oneMonthLater = new Date('2023-02-15');
      const twoMonthsLater = new Date('2023-03-15');
      const notMonthly = new Date('2023-02-14');
      
      expect(repeatPatternService.checkRepeatPattern(oneMonthLater, 'monthly', startDate, null)).toBe(true);
      expect(repeatPatternService.checkRepeatPattern(twoMonthsLater, 'monthly', startDate, null)).toBe(true);
      expect(repeatPatternService.checkRepeatPattern(notMonthly, 'monthly', startDate, null)).toBe(false);
    });

    test('should handle month end correctly for monthly repeat pattern', () => {
      const startDate = new Date('2023-01-31');
      const february = new Date('2023-02-28');
      const march = new Date('2023-03-31');
      const april30 = new Date('2023-04-30');
      
      expect(repeatPatternService.checkRepeatPattern(february, 'monthly', startDate, null)).toBe(true);
      expect(repeatPatternService.checkRepeatPattern(march, 'monthly', startDate, null)).toBe(true);
      expect(repeatPatternService.checkRepeatPattern(april30, 'monthly', startDate, null)).toBe(true);
    });

    test('should match yearly repeat pattern correctly', () => {
      const startDate = new Date('2023-01-15');
      const oneYearLater = new Date('2024-01-15');
      const twoYearsLater = new Date('2025-01-15');
      const notYearly = new Date('2024-01-16');
      
      expect(repeatPatternService.checkRepeatPattern(oneYearLater, 'yearly', startDate, null)).toBe(true);
      expect(repeatPatternService.checkRepeatPattern(twoYearsLater, 'yearly', startDate, null)).toBe(true);
      expect(repeatPatternService.checkRepeatPattern(notYearly, 'yearly', startDate, null)).toBe(false);
    });

    test('should match every two days repeat pattern correctly', () => {
      const startDate = new Date('2023-01-01');
      const twoDaysLater = new Date('2023-01-03');
      const fourDaysLater = new Date('2023-01-05');
      const notEveryTwoDays = new Date('2023-01-02');
      
      expect(repeatPatternService.checkRepeatPattern(twoDaysLater, 'every two days', startDate, null)).toBe(true);
      expect(repeatPatternService.checkRepeatPattern(fourDaysLater, 'every two days', startDate, null)).toBe(true);
      expect(repeatPatternService.checkRepeatPattern(notEveryTwoDays, 'every two days', startDate, null)).toBe(false);
    });

    test('should match every three days repeat pattern correctly', () => {
      const startDate = new Date('2023-01-01');
      const threeDaysLater = new Date('2023-01-04');
      const sixDaysLater = new Date('2023-01-07');
      const notEveryThreeDays = new Date('2023-01-03');
      
      expect(repeatPatternService.checkRepeatPattern(threeDaysLater, 'every three days', startDate, null)).toBe(true);
      expect(repeatPatternService.checkRepeatPattern(sixDaysLater, 'every three days', startDate, null)).toBe(true);
      expect(repeatPatternService.checkRepeatPattern(notEveryThreeDays, 'every three days', startDate, null)).toBe(false);
    });
  });

  describe('getOccurrencesInRange', () => {
    test('should return empty array for invalid input', () => {
      expect(repeatPatternService.getOccurrencesInRange(null, new Date(), new Date())).toEqual([]);
      expect(repeatPatternService.getOccurrencesInRange({}, null, new Date())).toEqual([]);
      expect(repeatPatternService.getOccurrencesInRange({}, new Date(), null)).toEqual([]);
      expect(repeatPatternService.getOccurrencesInRange({}, 'not-a-date', new Date())).toEqual([]);
      expect(repeatPatternService.getOccurrencesInRange({}, new Date(), 'not-a-date')).toEqual([]);
    });

    test('should return empty array if start date is after end date', () => {
      const start = new Date('2023-02-01');
      const end = new Date('2023-01-01');
      
      expect(repeatPatternService.getOccurrencesInRange({
        selectedDay: '2023-01-01',
        repeatOption: 'daily'
      }, start, end)).toEqual([]);
    });

    test('should return occurrences for a daily repeat pattern', () => {
      const start = new Date('2023-01-01');
      const end = new Date('2023-01-05');
      
      const occurrences = repeatPatternService.getOccurrencesInRange({
        selectedDay: '2023-01-01',
        repeatOption: 'daily'
      }, start, end);
      
      expect(occurrences.length).toBe(5); // 5 days from Jan 1 to Jan 5 inclusive
      expect(occurrences[0].dateStr).toBe('2023-01-01');
      expect(occurrences[4].dateStr).toBe('2023-01-05');
    });

    test('should respect the repeat end date', () => {
      const start = new Date('2023-01-01');
      const end = new Date('2023-01-10');
      
      const occurrences = repeatPatternService.getOccurrencesInRange({
        selectedDay: '2023-01-01',
        repeatOption: 'daily',
        repeatEndDay: '2023-01-05'
      }, start, end);
      
      expect(occurrences.length).toBe(5); // Jan 1 to Jan 5, not Jan 6 to 10
      expect(occurrences[0].dateStr).toBe('2023-01-01');
      expect(occurrences[4].dateStr).toBe('2023-01-05');
    });

    test('should exclude dates in skipDates', () => {
      const start = new Date('2023-01-01');
      const end = new Date('2023-01-05');
      
      // Test with array
      const occurrences1 = repeatPatternService.getOccurrencesInRange({
        selectedDay: '2023-01-01',
        repeatOption: 'daily',
        skipDates: ['2023-01-03']
      }, start, end);
      
      expect(occurrences1.length).toBe(4); // 5 days, but Jan 3 is skipped
      expect(occurrences1.some(o => o.dateStr === '2023-01-03')).toBe(false);
      
      // Test with JSON string
      const occurrences2 = repeatPatternService.getOccurrencesInRange({
        selectedDay: '2023-01-01',
        repeatOption: 'daily',
        skipDates: '["2023-01-03"]'
      }, start, end);
      
      expect(occurrences2.length).toBe(4);
      expect(occurrences2.some(o => o.dateStr === '2023-01-03')).toBe(false);
    });

    test('should handle weekly repeat pattern correctly', () => {
      const start = new Date('2023-01-01'); // Sunday
      const end = new Date('2023-01-31');
      
      const occurrences = repeatPatternService.getOccurrencesInRange({
        selectedDay: '2023-01-01',
        repeatOption: 'weekly'
      }, start, end);
      
      expect(occurrences.length).toBe(5); // Jan 1, 8, 15, 22, 29
      expect(occurrences[0].dateStr).toBe('2023-01-01');
      expect(occurrences[1].dateStr).toBe('2023-01-08');
      expect(occurrences[2].dateStr).toBe('2023-01-15');
      expect(occurrences[3].dateStr).toBe('2023-01-22');
      expect(occurrences[4].dateStr).toBe('2023-01-29');
    });

    test('should handle monthly repeat pattern correctly', () => {
      const start = new Date('2023-01-15');
      const end = new Date('2023-05-31');
      
      const occurrences = repeatPatternService.getOccurrencesInRange({
        selectedDay: '2023-01-15',
        repeatOption: 'monthly'
      }, start, end);
      
      expect(occurrences.length).toBe(5); // Jan 15, Feb 15, Mar 15, Apr 15, May 15
      expect(occurrences[0].dateStr).toBe('2023-01-15');
      expect(occurrences[1].dateStr).toBe('2023-02-15');
      expect(occurrences[2].dateStr).toBe('2023-03-15');
      expect(occurrences[3].dateStr).toBe('2023-04-15');
      expect(occurrences[4].dateStr).toBe('2023-05-15');
    });
  });

  describe('checkTimeOverlap', () => {
    test('should return false for invalid dates', () => {
      const validDate = new Date();
      
      expect(repeatPatternService.checkTimeOverlap(null, validDate, validDate, validDate)).toBe(false);
      expect(repeatPatternService.checkTimeOverlap(validDate, null, validDate, validDate)).toBe(false);
      expect(repeatPatternService.checkTimeOverlap(validDate, validDate, null, validDate)).toBe(false);
      expect(repeatPatternService.checkTimeOverlap(validDate, validDate, validDate, null)).toBe(false);
      expect(repeatPatternService.checkTimeOverlap('not-a-date', validDate, validDate, validDate)).toBe(false);
      expect(repeatPatternService.checkTimeOverlap(new Date('invalid'), validDate, validDate, validDate)).toBe(false);
    });

    test('should detect overlapping time ranges', () => {
      // 9:00 - 11:00 overlaps with 10:00 - 12:00
      const start1 = new Date('2023-01-01T09:00:00');
      const end1 = new Date('2023-01-01T11:00:00');
      const start2 = new Date('2023-01-01T10:00:00');
      const end2 = new Date('2023-01-01T12:00:00');
      
      expect(repeatPatternService.checkTimeOverlap(start1, end1, start2, end2)).toBe(true);
      // Commutative property - order shouldn't matter
      expect(repeatPatternService.checkTimeOverlap(start2, end2, start1, end1)).toBe(true);
    });

    test('should detect when one range is contained within another', () => {
      // 10:00 - 11:00 is contained within 9:00 - 12:00
      const start1 = new Date('2023-01-01T09:00:00');
      const end1 = new Date('2023-01-01T12:00:00');
      const start2 = new Date('2023-01-01T10:00:00');
      const end2 = new Date('2023-01-01T11:00:00');
      
      expect(repeatPatternService.checkTimeOverlap(start1, end1, start2, end2)).toBe(true);
      // Commutative property - order shouldn't matter
      expect(repeatPatternService.checkTimeOverlap(start2, end2, start1, end1)).toBe(true);
    });

    test('should return false for non-overlapping ranges', () => {
      // 9:00 - 10:00 doesn't overlap with 10:00 - 11:00 (they touch but don't overlap)
      const start1 = new Date('2023-01-01T09:00:00');
      const end1 = new Date('2023-01-01T10:00:00');
      const start2 = new Date('2023-01-01T10:00:00');
      const end2 = new Date('2023-01-01T11:00:00');
      
      expect(repeatPatternService.checkTimeOverlap(start1, end1, start2, end2)).toBe(false);
      
      // 9:00 - 10:00 doesn't overlap with 11:00 - 12:00
      const start3 = new Date('2023-01-01T11:00:00');
      const end3 = new Date('2023-01-01T12:00:00');
      
      expect(repeatPatternService.checkTimeOverlap(start1, end1, start3, end3)).toBe(false);
    });

    test('should detect overlap even if dates are different but times overlap on same day', () => {
      // Task from July 20th, 10:00 to 12:00
      const start1 = new Date('2023-07-20T10:00:00');
      const end1 = new Date('2023-07-20T12:00:00');
      
      // Task from July 20th, 11:00 to 13:00
      const start2 = new Date('2023-07-20T11:00:00'); 
      const end2 = new Date('2023-07-20T13:00:00');
      
      // If this function is called directly, it will still detect the overlap
      // because it only compares the time components
      expect(repeatPatternService.checkTimeOverlap(start1, end1, start2, end2)).toBe(true);
    });
  });

  describe('checkTaskOverlaps', () => {
    test('should return false for invalid input', () => {
      expect(repeatPatternService.checkTaskOverlaps(null, [])).toBe(false);
      expect(repeatPatternService.checkTaskOverlaps({}, null)).toBe(false);
      expect(repeatPatternService.checkTaskOverlaps({ startTime: new Date() }, [])).toBe(false);
      expect(repeatPatternService.checkTaskOverlaps({ endTime: new Date() }, [])).toBe(false);
    });

    test('should detect overlap between single tasks on the same day', () => {
      const task = {
        selectedDay: '2023-07-20',
        startTime: '2023-07-20T10:00:00.000Z',
        endTime: '2023-07-20T12:00:00.000Z'
      };
      
      const existingTasks = [{
        id: 1,
        selectedDay: '2023-07-20',
        startTime: '2023-07-20T11:00:00.000Z',
        endTime: '2023-07-20T13:00:00.000Z'
      }];
      
      expect(repeatPatternService.checkTaskOverlaps(task, existingTasks)).toBe(true);
    });

    test('should not detect overlap when tasks are on different days', () => {
      const task = {
        selectedDay: '2023-07-20',
        startTime: '2023-07-20T10:00:00.000Z',
        endTime: '2023-07-20T12:00:00.000Z'
      };
      
      const existingTasks = [{
        id: 1,
        selectedDay: '2023-07-21', // Different day
        startTime: '2023-07-21T10:00:00.000Z',
        endTime: '2023-07-21T12:00:00.000Z'
      }];
      
      expect(repeatPatternService.checkTaskOverlaps(task, existingTasks)).toBe(false);
    });

    test('should detect overlap between repeating tasks', () => {
      const task = {
        selectedDay: '2023-07-20',
        startTime: '2023-07-20T10:00:00.000Z',
        endTime: '2023-07-20T12:00:00.000Z',
        repeatOption: 'daily',
        repeatEndDay: '2023-07-25'
      };
      
      const existingTasks = [{
        id: 1,
        selectedDay: '2023-07-21', // Different day, but repeat pattern overlaps
        startTime: '2023-07-21T11:00:00.000Z',
        endTime: '2023-07-21T13:00:00.000Z',
        repeatOption: 'daily',
        repeatEndDay: '2023-07-26'
      }];
      
      expect(repeatPatternService.checkTaskOverlaps(task, existingTasks)).toBe(true);
    });

    test('should not detect overlap when repeating tasks do not overlap in date range', () => {
      const task = {
        selectedDay: '2023-07-20',
        startTime: '2023-07-20T10:00:00.000Z',
        endTime: '2023-07-20T12:00:00.000Z',
        repeatOption: 'daily',
        repeatEndDay: '2023-07-25'
      };
      
      const existingTasks = [{
        id: 1,
        selectedDay: '2023-07-26', // Starts after the other task ends
        startTime: '2023-07-26T10:00:00.000Z',
        endTime: '2023-07-26T12:00:00.000Z',
        repeatOption: 'daily',
        repeatEndDay: '2023-07-30'
      }];
      
      expect(repeatPatternService.checkTaskOverlaps(task, existingTasks)).toBe(false);
    });

    test('should not detect overlap when tasks occur at different times of day', () => {
      const task = {
        selectedDay: '2023-07-20',
        startTime: '2023-07-20T08:00:00.000Z',
        endTime: '2023-07-20T10:00:00.000Z',
        repeatOption: 'daily',
        repeatEndDay: '2023-07-25'
      };
      
      const existingTasks = [{
        id: 1,
        selectedDay: '2023-07-20',
        startTime: '2023-07-20T10:00:00.000Z', // Starts when the other task ends
        endTime: '2023-07-20T12:00:00.000Z',
        repeatOption: 'daily',
        repeatEndDay: '2023-07-25'
      }];
      
      expect(repeatPatternService.checkTaskOverlaps(task, existingTasks)).toBe(false);
    });

    test('should ignore tasks with the same ID when checking for overlaps', () => {
      const task = {
        id: 1, // Same ID as the existing task
        selectedDay: '2023-07-20',
        startTime: '2023-07-20T10:00:00.000Z',
        endTime: '2023-07-20T12:00:00.000Z'
      };
      
      const existingTasks = [{
        id: 1, // Same ID as the task being checked
        selectedDay: '2023-07-20',
        startTime: '2023-07-20T11:00:00.000Z',
        endTime: '2023-07-20T13:00:00.000Z'
      }];
      
      // Should not detect overlap with itself
      expect(repeatPatternService.checkTaskOverlaps(task, existingTasks)).toBe(false);
    });

    test('should respect skipDates when checking for overlaps', () => {
      const task = {
        selectedDay: '2023-07-20',
        startTime: '2023-07-20T10:00:00.000Z',
        endTime: '2023-07-20T12:00:00.000Z',
        repeatOption: 'daily',
        repeatEndDay: '2023-07-25'
      };
      
      // Test with skipDates as array
      const existingTasksWithArraySkip = [{
        id: 1,
        selectedDay: '2023-07-20',
        startTime: '2023-07-20T11:00:00.000Z',
        endTime: '2023-07-20T13:00:00.000Z',
        repeatOption: 'daily',
        repeatEndDay: '2023-07-25',
        skipDates: ['2023-07-20', '2023-07-21', '2023-07-22']
      }];
      
      // Should not detect overlap because the relevant dates are skipped
      expect(repeatPatternService.checkTaskOverlaps(task, existingTasksWithArraySkip)).toBe(false);
      
      // Test with skipDates as JSON string
      const existingTasksWithJsonSkip = [{
        id: 1,
        selectedDay: '2023-07-20',
        startTime: '2023-07-20T11:00:00.000Z',
        endTime: '2023-07-20T13:00:00.000Z',
        repeatOption: 'daily',
        repeatEndDay: '2023-07-25',
        skipDates: '["2023-07-20", "2023-07-21", "2023-07-22"]'
      }];
      
      // Should not detect overlap because the relevant dates are skipped
      expect(repeatPatternService.checkTaskOverlaps(task, existingTasksWithJsonSkip)).toBe(false);
    });

    test('should handle tasks that span multiple days', () => {
      const newTask = {
        selectedDay: '2023-07-20',
        startTime: '2023-07-20T23:00:00.000Z',  // 11 PM on July 20
        endTime: '2023-07-21T02:00:00.000Z'     // 2 AM on July 21
      };
      
      const existingTasks = [{
        id: 1,
        selectedDay: '2023-07-21',
        startTime: '2023-07-21T01:00:00.000Z',  // 1 AM on July 21
        endTime: '2023-07-21T03:00:00.000Z'     // 3 AM on July 21
      }];
      
      // These tasks overlap at 1-2 AM on July 21
      expect(repeatPatternService.checkTaskOverlaps(newTask, existingTasks)).toBe(true);
    });
  });
});