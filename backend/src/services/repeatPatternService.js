// services/repeatPatternService.js
const dateUtils = require('../utils/dateUtils');

/**
 * Checks if an item (task or reminder) should occur on a specific day based on repeat pattern
 * @param {Date} day - The day to check
 * @param {string} repeatOption - Repeat pattern (daily, weekly, monthly, etc.)
 * @param {Date} selectedDay - Original start day of the item
 * @param {Date|null} repeatEndDay - End date for repetition
 * @returns {boolean} - Whether the item should occur on the specified day
 */
const checkRepeatPattern = (day, repeatOption, selectedDay, repeatEndDay) => {
  if (!dateUtils.isValidDate(day) || !dateUtils.isValidDate(selectedDay)) {
    console.error("Invalid date in checkRepeatPattern");
    return false;
  }

  // If day is before the start date or after the end date, it doesn't repeat
  if (day < selectedDay) return false;
  if (repeatEndDay && day > repeatEndDay) return false;

  // If it's the exact same day as start day, always return true
  if (day.getUTCFullYear() === selectedDay.getUTCFullYear() && 
      day.getUTCMonth() === selectedDay.getUTCMonth() && 
      day.getUTCDate() === selectedDay.getUTCDate()) {
    return true;
  }

  // If no repeat option, only match the exact day
  if (!repeatOption || repeatOption === '') {
    return dateUtils.formatDateString(day) === dateUtils.formatDateString(selectedDay);
  }

  // Calculate difference in days
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round(Math.abs(day - selectedDay) / msPerDay);

  let result = false;
  switch (repeatOption) {
    case 'daily':
      result = true;
      break;
    case 'every two days':
      result = diffDays % 2 === 0;
      break;
    case 'every three days':
      result = diffDays % 3 === 0;
      break;
    case 'weekly':
      result = diffDays % 7 === 0;
      break;
    case 'biweekly':
      result = diffDays % 14 === 0;
      break;
    case 'monthly':
      // First check if dates match
      if (day.getUTCDate() === selectedDay.getUTCDate()) {
        result = true;
      } else {
        // Handle last day of month logic
        const lastDayOfStartMonth = new Date(
          Date.UTC(selectedDay.getUTCFullYear(), selectedDay.getUTCMonth() + 1, 0)
        ).getUTCDate();
        
        const isStartOnLastDay = selectedDay.getUTCDate() === lastDayOfStartMonth;
        
        if (isStartOnLastDay) {
          const lastDayOfCurrentMonth = new Date(
            Date.UTC(day.getUTCFullYear(), day.getUTCMonth() + 1, 0)
          ).getUTCDate();
          
          result = day.getUTCDate() === lastDayOfCurrentMonth;
        }
      }
      break;
    case 'yearly':
      // Same month and day
      result = day.getUTCMonth() === selectedDay.getUTCMonth() && 
               day.getUTCDate() === selectedDay.getUTCDate();
      break;
    default:
      result = false;
  }
  
  return result;
};

/**
 * Safely parses JSON or returns an empty array
 * @param {string|Array} value - JSON string or array
 * @returns {Array} - Parsed array or empty array if invalid
 */
const safeParseJSON = (value) => {
  if (Array.isArray(value)) return value;
  
  if (typeof value !== 'string' || value.trim() === '') return [];
  
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error parsing JSON:', error.message);
    return [];
  }
};

/**
 * Gets all occurrences of a repeating item within a date range
 * @param {Object} item - The task or reminder
 * @param {Date} startDate - Range start date
 * @param {Date} endDate - Range end date
 * @returns {Array} - Array of occurrences with dates
 */
const getOccurrencesInRange = (item, startDate, endDate) => {
  const occurrences = [];
  
  if (!item || !item.selectedDay) {
    console.log("Missing item properties for getOccurrencesInRange");
    return occurrences;
  }

  // Parse and validate dates
  const itemStartDate = dateUtils.parseToUTCDate(item.selectedDay);
  const rangeStart = dateUtils.parseToUTCDate(startDate);
  const rangeEnd = dateUtils.parseToUTCDate(endDate);
  const repeatEndDate = item.repeatEndDay ? dateUtils.parseToUTCDate(item.repeatEndDay) : null;
  
  if (!itemStartDate || !rangeStart || !rangeEnd) {
    console.error("Invalid date in getOccurrencesInRange");
    return occurrences;
  }
  
  // If start date is after end date, return empty array
  if (rangeStart > rangeEnd) {
    console.log("Range start is after range end");
    return occurrences;
  }
  
  // Get the max end date between range end and item's repeat end date
  const effectiveEndDate = repeatEndDate && repeatEndDate < rangeEnd ? 
    repeatEndDate : rangeEnd;
  
  // Get skip dates if available - safely parse JSON
  const skipDates = safeParseJSON(item.skipDates);
  
  // Start checking from the max of item's start date and range start date
  let currentDate = new Date(Math.max(itemStartDate.getTime(), rangeStart.getTime()));
  
  // Iterate through days until the end date
  while (currentDate <= effectiveEndDate) {
    const currentDateStr = dateUtils.formatDateString(currentDate);
    
    // Skip if date is in skipDates
    if (!skipDates.includes(currentDateStr) && 
        checkRepeatPattern(currentDate, item.repeatOption, itemStartDate, repeatEndDate)) {
      
      occurrences.push({
        date: new Date(currentDate),
        dateStr: currentDateStr
      });
    }
    
    // Advance to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return occurrences;
};

/**
 * Check for time overlap between two time ranges
 * SIMPLIFIED: Since tasks cannot span across midnight, this is much simpler
 * @param {Date} start1 - First range start
 * @param {Date} end1 - First range end
 * @param {Date} start2 - Second range start
 * @param {Date} end2 - Second range end
 * @returns {boolean} - Whether the ranges overlap
 */
const checkTimeOverlap = (start1, end1, start2, end2) => {
  if (!dateUtils.isValidDate(start1) || !dateUtils.isValidDate(end1) || 
      !dateUtils.isValidDate(start2) || !dateUtils.isValidDate(end2)) {
    console.error("Invalid date in checkTimeOverlap", { start1, end1, start2, end2 });
    return false;
  }
  
  // STANDARD OVERLAP FORMULA: Two intervals [a,b] and [c,d] overlap if: a < d && c < b
  console.log('Checking time overlap:', {
    start1: start1.toISOString(),
    end1: end1.toISOString(),
    start2: start2.toISOString(),
    end2: end2.toISOString()
  });
  
  const overlap = start1 < end2 && start2 < end1;
  
  console.log('Overlap calculation:', {
    condition1: `${start1.toISOString()} < ${end2.toISOString()} = ${start1 < end2}`,
    condition2: `${start2.toISOString()} < ${end1.toISOString()} = ${start2 < end1}`,
    finalResult: overlap
  });
  
  return overlap;
};

/**
 * Checks if a task overlaps with any existing tasks
 * SIMPLIFIED: Removed multi-day logic since tasks cannot span midnight
 * @param {Object} newTask - The new task to check
 * @param {Array} existingTasks - Array of existing tasks
 * @returns {boolean} - Whether there's an overlap
 */
const checkTaskOverlaps = (newTask, existingTasks) => {

  // Handle invalid input cases
  if (!newTask || !Array.isArray(existingTasks)) {
    console.log('Invalid input - newTask or existingTasks not valid');
    return false;
  }

  console.log('=== CHECKING TASK OVERLAPS ===');
  console.log('New task:', {
    id: newTask.id,
    name: newTask.name,
    startTime: newTask.startTime,
    endTime: newTask.endTime,
    selectedDay: newTask.selectedDay,
    repeatOption: newTask.repeatOption
  });
  console.log('Existing tasks count:', Array.isArray(existingTasks) ? existingTasks.length : 0);
  
  // Basic validation
  if (!newTask.startTime || !newTask.endTime) {
    console.log('Missing startTime or endTime in newTask');
    return false;
  }
  
  // Parse task dates for consistent handling
  const newTaskStart = dateUtils.parseToUTCDate(newTask.startTime);
  const newTaskEnd = dateUtils.parseToUTCDate(newTask.endTime);
  const newTaskDay = dateUtils.parseToUTCDate(newTask.selectedDay);
  const newTaskEndDay = newTask.repeatEndDay ? 
    dateUtils.parseToUTCDate(newTask.repeatEndDay) : 
    newTaskDay;
  
  if (!newTaskStart || !newTaskEnd || !newTaskDay) {
    console.log('Failed to parse new task dates');
    return false;
  }
  
  console.log('New task parsed dates:', {
    start: newTaskStart.toISOString(),
    end: newTaskEnd.toISOString(),
    day: newTaskDay.toISOString()
  });

  // Check against each existing task
  for (let i = 0; i < existingTasks.length; i++) {
    const existingTask = existingTasks[i];
    
    console.log(`\n--- Checking against existing task ${i + 1}/${existingTasks.length} ---`);
    console.log('Existing task:', {
      id: existingTask.id,
      name: existingTask.name,
      startTime: existingTask.startTime,
      endTime: existingTask.endTime,
      selectedDay: existingTask.selectedDay,
      repeatOption: existingTask.repeatOption
    });
    
    // Skip if the task being checked is the same as the existing one (for edit scenarios)
    if (newTask.id && existingTask.id === newTask.id) {
      console.log('Skipping self-comparison for task ID:', newTask.id);
      continue;
    }
    
    // Handle skipDates for existing repeating tasks
    const skipDates = safeParseJSON(existingTask.skipDates);
    if (skipDates.includes(newTask.selectedDay)) {
      console.log('Skipping existing task due to skipDates containing:', newTask.selectedDay);
      continue; 
    }
    
    // Parse existing task dates
    const existingTaskStart = dateUtils.parseToUTCDate(existingTask.startTime);
    const existingTaskEnd = dateUtils.parseToUTCDate(existingTask.endTime);
    const existingTaskDay = dateUtils.parseToUTCDate(existingTask.selectedDay);
    const existingTaskEndDay = existingTask.repeatEndDay ? 
      dateUtils.parseToUTCDate(existingTask.repeatEndDay) : 
      existingTaskDay;
    
    if (!existingTaskStart || !existingTaskEnd || !existingTaskDay) {
      console.log('Failed to parse existing task dates, skipping');
      continue;
    }
    
    console.log('Existing task parsed dates:', {
      start: existingTaskStart.toISOString(),
      end: existingTaskEnd.toISOString(),
      day: existingTaskDay.toISOString()
    });
    
    // CASE 1: Both tasks are non-repeating (simple same-day check)
    if (!newTask.repeatOption && !existingTask.repeatOption) {
      console.log('CASE 1: Both tasks are non-repeating');
      
      // Only check overlap if they're on the same day
      const newDayStr = dateUtils.formatDateString(newTaskDay);
      const existingDayStr = dateUtils.formatDateString(existingTaskDay);
      
      console.log('Comparing days:', { newDay: newDayStr, existingDay: existingDayStr });
      
      if (newDayStr === existingDayStr) {
        console.log('Both tasks on same day - checking time overlap');
        
        // Create time objects for the same day (since tasks can't span midnight)
        const baseDate = new Date(newTaskDay);
        
        const newStart = new Date(baseDate);
        newStart.setHours(newTaskStart.getHours(), newTaskStart.getMinutes(), newTaskStart.getSeconds(), 0);
        
        const newEnd = new Date(baseDate);
        newEnd.setHours(newTaskEnd.getHours(), newTaskEnd.getMinutes(), newTaskEnd.getSeconds(), 0);
        
        const existingStart = new Date(baseDate);
        existingStart.setHours(existingTaskStart.getHours(), existingTaskStart.getMinutes(), existingTaskStart.getSeconds(), 0);
        
        const existingEnd = new Date(baseDate);
        existingEnd.setHours(existingTaskEnd.getHours(), existingTaskEnd.getMinutes(), existingTaskEnd.getSeconds(), 0);
        
        console.log('Time comparison objects:', {
          newStart: newStart.toISOString(),
          newEnd: newEnd.toISOString(),
          existingStart: existingStart.toISOString(),
          existingEnd: existingEnd.toISOString()
        });
        
        if (checkTimeOverlap(newStart, newEnd, existingStart, existingEnd)) {
          return true;
        } 
      } else {
        console.log('Tasks on different days, no overlap possible');
      }
      continue;
    }
    
    // CASE 2: One or both tasks repeat - check all occurrences
    console.log('CASE 2: One or both tasks repeat - checking occurrences');
    
    // Find potential date range overlap between the repeating patterns
    const overlapStart = new Date(Math.max(
      newTaskDay.getTime(), 
      existingTaskDay.getTime()
    ));
    
    const overlapEnd = new Date(Math.min(
      newTaskEndDay ? newTaskEndDay.getTime() : 8640000000000000, 
      existingTaskEndDay ? existingTaskEndDay.getTime() : 8640000000000000
    ));
    
    console.log('Date range to check for occurrences:', {
      start: overlapStart.toISOString(),
      end: overlapEnd.toISOString()
    });
    
    // Skip if no date range overlap in the repeat patterns
    if (overlapStart > overlapEnd) {
      console.log('No date range overlap between repeat patterns');
      continue;
    }
    
    // Get all occurrences for both tasks in the overlap date range
    const newTaskOccurrences = newTask.repeatOption ?
      getOccurrencesInRange(newTask, overlapStart, overlapEnd) :
      [{ date: new Date(newTaskDay), dateStr: dateUtils.formatDateString(newTaskDay) }];
    
    const existingTaskOccurrences = existingTask.repeatOption ?
      getOccurrencesInRange(existingTask, overlapStart, overlapEnd) :
      [{ date: new Date(existingTaskDay), dateStr: dateUtils.formatDateString(existingTaskDay) }];
    
    console.log('Occurrences found:', {
      newTaskCount: newTaskOccurrences.length,
      existingTaskCount: existingTaskOccurrences.length
    });
    
    // Check for overlap on each occurrence combination
    for (const newOcc of newTaskOccurrences) {
      for (const existingOcc of existingTaskOccurrences) {
        console.log(`Checking occurrence overlap: ${newOcc.dateStr} vs ${existingOcc.dateStr}`);
        
        // Skip if this existing occurrence is in skipDates
        if (skipDates.includes(existingOcc.dateStr)) {
          console.log('Skipping existing occurrence due to skipDates');
          continue;
        }
        
        // Only check time overlap if occurrences are on the same day
        if (newOcc.dateStr === existingOcc.dateStr) {
          console.log('Same day occurrence - checking time overlap');
          
          // Create time objects for this occurrence day
          const occurrenceDate = new Date(newOcc.date);
          
          const newStart = new Date(occurrenceDate);
          newStart.setHours(newTaskStart.getHours(), newTaskStart.getMinutes(), newTaskStart.getSeconds(), 0);
          
          const newEnd = new Date(occurrenceDate);
          newEnd.setHours(newTaskEnd.getHours(), newTaskEnd.getMinutes(), newTaskEnd.getSeconds(), 0);
          
          const existingStart = new Date(occurrenceDate);
          existingStart.setHours(existingTaskStart.getHours(), existingTaskStart.getMinutes(), existingTaskStart.getSeconds(), 0);
          
          const existingEnd = new Date(occurrenceDate);
          existingEnd.setHours(existingTaskEnd.getHours(), existingTaskEnd.getMinutes(), existingTaskEnd.getSeconds(), 0);
          
          console.log('Occurrence time comparison:', {
            newStart: newStart.toISOString(),
            newEnd: newEnd.toISOString(),
            existingStart: existingStart.toISOString(),
            existingEnd: existingEnd.toISOString()
          });
          
          if (checkTimeOverlap(newStart, newEnd, existingStart, existingEnd)) {
            console.log('❌ OVERLAP DETECTED: Repeating task occurrence overlap!');
            return true;
          } else {
            console.log('✅ No time overlap for this occurrence');
          }
        } else {
          console.log('Different day occurrences, no overlap');
        }
      }
    }
  }
  
  console.log('✅ No overlaps found after checking all tasks');
  return false; // No overlap found
};

module.exports = {
  checkRepeatPattern,
  getOccurrencesInRange,
  checkTimeOverlap,
  checkTaskOverlaps
};