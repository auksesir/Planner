/**
 * Comprehensive Date and Time Utilities
 * Handles all date/time operations with consistent UTC handling
 */

/**
 * Checks if a date is valid
 * @param {*} date - Date to validate
 * @returns {boolean} - True if valid Date object
 */
const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Parses a string or Date into a proper UTC Date object
 * @param {string|Date} value - The date value to parse
 * @returns {Date|null} - The parsed Date object or null if invalid
 */
const parseToUTCDate = (value) => {
  if (!value) return null;
  
  // If it's already a Date object
  if (value instanceof Date) {
    return new Date(value);
  }
  
  try {
    // For ISO string format
    if (typeof value === 'string') {
      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // For YYYY-MM-DD format
        const [year, month, day] = value.split('-').map(Number);
        return new Date(Date.UTC(year, month - 1, day));
      } else {
        // For full ISO strings or other formats
        const date = new Date(value);
        if (isValidDate(date)) {
          return date;
        }
      }
    }
    
    // For number (timestamp)
    if (typeof value === 'number') {
      const date = new Date(value);
      if (isValidDate(date)) {
        return date;
      }
    }
  } catch (error) {
    console.error("Error parsing date:", error, value);
  }
  
  return null;
};

/**
 * Formats a Date object as YYYY-MM-DD string in UTC
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string
 */
const formatDateString = (date) => {
  if (!isValidDate(date)) {
    console.error("Invalid date in formatDateString", date);
    return null;
  }
  
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Gets time portion as HH:MM:SS
 * @param {Date} date - Date to format
 * @returns {string} - Time string
 */
const getTimeString = (date) => {
  if (!isValidDate(date)) return '';
  return date.toISOString().split('T')[1].substring(0, 8);
};

/**
 * Calculates progress percentage between two dates
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @param {Date} current - Current date
 * @returns {number} - Progress percentage (0-100)
 */
const getTimeProgress = (start, end, current) => {
  if (!isValidDate(start) || !isValidDate(end) || !isValidDate(current)) {
    return 0;
  }
  
  const total = end.getTime() - start.getTime();
  const elapsed = current.getTime() - start.getTime();
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
};

/**
 * Calculates days between two dates
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} - Days between dates
 */
const daysBetween = (date1, date2) => {
  if (!isValidDate(date1) || !isValidDate(date2)) return 0;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs(date2 - date1) / msPerDay);
};

/**
 * Combines a date with a time to create a new Date object
 * @param {Date} dateObj - The date to use
 * @param {Date} timeObj - The time to extract and combine
 * @returns {Date} - A new Date object with the combined date and time
 */
const combineDateTime = (dateObj, timeObj) => {
  if (!isValidDate(dateObj) || !isValidDate(timeObj)) {
    console.error("Invalid date in combineDateTime", { dateObj, timeObj });
    return null;
  }
  
  const combinedDate = new Date(dateObj.getTime());
  combinedDate.setUTCHours(
    timeObj.getUTCHours(),
    timeObj.getUTCMinutes(),
    timeObj.getUTCSeconds(),
    timeObj.getUTCMilliseconds()
  );
  
  return combinedDate;
};

/**
 * Gets last day of month for a date
 * @param {Date} date - Date to check
 * @returns {number} - Last day of month (28-31)
 */
const getLastDayOfMonth = (date) => {
  if (!isValidDate(date)) return 0;
  return new Date(date.getUTCFullYear(), date.getUTCMonth() + 1, 0).getUTCDate();
};

module.exports = {
  isValidDate,
  parseToUTCDate,
  formatDateString,
  getTimeString,
  getTimeProgress,
  daysBetween,
  combineDateTime,
  getLastDayOfMonth
};