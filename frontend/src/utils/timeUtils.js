// utils/timeUtils.js
import { format, parse } from 'date-fns';

// DailyPlanner

/**
 * Formats the hour for display, converting it to a 12-hour format.
 * If hour is 0 (midnight), it returns 12.
 * 
 * @param {number} hour - The hour to be formatted (24-hour format).
 * @returns {string} - The formatted hour as a two-digit string.
 */
export const formatHour = (hour) => {
  const formattedHour = hour % 12 || 12; // Convert hour to 12-hour format
  return formattedHour.toString().padStart(2, '0'); // Ensure two-digit output (e.g., "01", "10")
};

/**
 * Groups a list of items by their time slots, considering the start and end time.
 * Fixed to handle task spanning logic correctly.
 * 
 * @param {Array} items - The list of items to group.
 * @param {string} timeField - The field name containing the start time of each item.
 * @param {string} endTimeField - The field name containing the end time of each item.
 * @returns {Object} - A dictionary grouping items by their time slots.
 */
export const groupItemsByTimeSlot = (items, timeField, endTimeField = null) => {
  const grouped = {};
  
  items.forEach(item => {
    let timeDate;
    let isReminder = false;
    
    // Handle both tasks and reminders
    if (timeField === 'selectedTime') {
      // This is a reminder
      timeDate = item.selectedTime instanceof Date ? 
        item.selectedTime : 
        new Date(item.selectedTime);
      isReminder = true;
    } else {
      // This is a task
      timeDate = item[timeField] instanceof Date ? 
        item[timeField] : 
        new Date(item[timeField]);
    }

    if (isNaN(timeDate.getTime())) {
      ('Invalid date for item:', item);
      return;
    }

    const startHour = timeDate.getHours();
    const startMinutes = timeDate.getMinutes();
    
    // For reminders, just add to the single time slot
    if (isReminder) {
      const isPM = startHour >= 12;
      const hourFormatted = `${startHour % 12 || 12}:00 ${isPM ? 'PM' : 'AM'}`;

      if (!grouped[hourFormatted]) {
        grouped[hourFormatted] = [];
      }
      grouped[hourFormatted].push(item);
      return;
    }

    // For tasks with duration, handle spanning logic
    if (endTimeField) {
      const endTimeDate = item[endTimeField] instanceof Date ? 
        item[endTimeField] : 
        new Date(item[endTimeField]);
      
      if (!isNaN(endTimeDate.getTime())) {
        const endHour = endTimeDate.getHours();
        const endMinutes = endTimeDate.getMinutes();
        
        // Calculate which time slots this task should appear in
        for (let h = startHour; h <= endHour; h++) {
          // Skip the end hour if the task ends exactly at the hour mark (e.g., 3:00)
          // This prevents tasks like "2:00 PM - 3:00 PM" from appearing in both slots
          if (h === endHour && endMinutes === 0 && h !== startHour) {
            continue;
          }
          
          // Also skip if the task starts at the very end of an hour
          // (though this is less common)
          if (h === startHour && h === endHour && startMinutes === 60) {
            continue;
          }
          
          const slotHour = h % 12 || 12;
          const slotIsPM = h >= 12;
          const slotFormatted = `${slotHour}:00 ${slotIsPM ? 'PM' : 'AM'}`;
          
          if (!grouped[slotFormatted]) {
            grouped[slotFormatted] = [];
          }
          
          // Only add once per slot (prevent duplicates)
          if (!grouped[slotFormatted].some(i => i.id === item.id)) {
            grouped[slotFormatted].push(item);
          }
        }
        return;
      }
    }

    // Fallback: add to single time slot based on start time
    const isPM = startHour >= 12;
    const hourFormatted = `${startHour % 12 || 12}:00 ${isPM ? 'PM' : 'AM'}`;
    
    if (!grouped[hourFormatted]) {
      grouped[hourFormatted] = [];
    }
    grouped[hourFormatted].push(item);
  });

  return grouped;
};

/**
 * Gets the total number of days in a specific month and year.
 * 
 * @param {number} year - The year of the month.
 * @param {number} month - The month (1 to 12).
 * @returns {number} - The number of days in the given month.
 */
export const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate(); // Create a Date object for the last day of the month and return the day of the month
};

// MonthlyPlanner

/**
 * Returns an array of years around the current year (5 years before and 5 years after).
 * 
 * @returns {Array} - An array of years from 5 years before the current year to 5 years after.
 */
export const getYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear - 5; year <= currentYear + 5; year++) {
    years.push(year);
  }
  return years;
};

/**
 * Returns an array of month numbers (1 to 12).
 * 
 * @returns {Array} - An array of month numbers.
 */
export const getMonths = () => {
  return Array.from({ length: 12 }, (_, index) => index + 1); // Returns [1, 2, ..., 12]
};

/**
 * Returns the full name of the month for a given month number and year.
 * 
 * @param {number} month - The month number (1 to 12).
 * @param {number} year - The year of the month.
 * @returns {string} - The full month name (e.g., "January", "February").
 */
export const getMonthName = (month, year) => {
  const options = { month: 'long' }; // Use long format for the month
  return new Intl.DateTimeFormat('en-US', options).format(new Date(year, month - 1, 1)); // Format the month
};

/**
 * Formats a date into 'YYYY-MM-DD' format.
 * 
 * @param {number} year - The year.
 * @param {number} month - The month.
 * @param {number} day - The day of the month.
 * @returns {string} - The formatted date as 'YYYY-MM-DD'.
 */
export const formatDate = (year, month, day) => {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// TaskInputBar

/**
 * Adjusts a given time to match the selected day while keeping the time portion intact.
 * 
 * @param {Date} time - The time to adjust.
 * @param {Date} selectedDay - The selected day to adjust the time to.
 * @returns {Date} - The adjusted Date object.
 */
export const adjustTimeToSelectedDay = (time, selectedDay) => {
  if (!(time instanceof Date) || !(selectedDay instanceof Date)) return time;
  return new Date(
    selectedDay.getFullYear(),
    selectedDay.getMonth(),
    selectedDay.getDate(),
    time.getHours(),
    time.getMinutes(),
    time.getSeconds()
  );
};

/**
 * Converts a date to ISO format, handling different date string formats.
 * 
 * @param {string | Date} date - The date to convert (could be a string or a Date object).
 * @returns {string | null} - The ISO formatted date string, or null if invalid.
 */
export const formatDateToISO = (date) => {
  if (date instanceof Date) {
    return format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"); // Format Date object to ISO string
  }
  if (typeof date === 'string') {
    if (date.match(/^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}$/)) {
      // Convert from "DD/MM/YYYY, HH:mm:ss" to ISO
      const parsedDate = parse(date, 'dd/MM/yyyy, HH:mm:ss', new Date());
      return format(parsedDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
    }
    if (date.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)) {
      // Already in ISO format
      return date;
    }
  }
  // Handle other date cases
  try {
    const newDate = new Date(date);
    return format(newDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
  } catch (error) {
    ('Invalid date format:', date);
    return null;
  }
};

/**
 * Calculates the end time of an event based on its start time and duration.
 * 
 * @param {Date} startTime - The start time of the event.
 * @param {number} selectedDuration - The duration in minutes.
 * @returns {Date | null} - The calculated end time, or null if invalid inputs.
 */
export const calculateEndTime = (startTime, selectedDuration) => {
  if (startTime && selectedDuration) {
    return new Date(startTime.getTime() + selectedDuration * 60 * 1000); // Add the duration (in ms) to the start time
  }
  return null;
};

/**
 * Formats a date object to 'YYYY-MM-DD' format.
 * 
 * @param {Date} date - The date to format.
 * @returns {string} - The formatted date as 'YYYY-MM-DD'.
 */
// Update the existing formatDate2 function to use the yyyy-MM-dd format
export const formatDate2 = (date) => {
  if (!date) return null;
  return formatDateForDB(date);
};

// TimeSlot

/**
 * Formats a time string into the "HH:MM AM/PM" format.
 * 
 * @param {string} timeString - The time string to format (in various formats).
 * @returns {string} - The formatted time string (e.g., "02:30 PM") or "Invalid Time" if format is invalid.
 */
export const formattedTime = (timeString) => {
  if (!timeString) return 'Invalid Time';
  
  let date;

  try {
    // Check for ISO format
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(timeString)) {
      date = new Date(timeString);
    } 
    // Check for GMT format
    else if (/^[A-Za-z]{3}\s[A-Za-z]{3}\s\d{2}\s\d{4}\s\d{2}:\d{2}:\d{2}\sGMT/.test(timeString)) {
      date = new Date(timeString);
    } 
    // Check for DD/MM/YYYY, HH:mm:ss format
    else if (/^\d{2}\/\d{2}\/\d{4},\s\d{2}:\d{2}:\d{2}$/.test(timeString)) {
      const [datePart, timePart] = timeString.split(', ');
      const [day, month, year] = datePart.split('/');
      const [hours, minutes, seconds] = timePart.split(':');
      date = new Date(year, month - 1, day, hours, minutes, seconds);
    } 
    // Try parsing as a direct date string
    else {
      date = new Date(timeString);
    }

    // Validate the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Time';
    }

    const hours = date.getHours() % 12 || 12; // Convert to 12-hour format
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const period = date.getHours() >= 12 ? 'PM' : 'AM';

    return `${hours}:${minutes} ${period}`;
  } catch (error) {
    // If any error occurs during parsing, return Invalid Time
    return 'Invalid Time';
  }
};

// App

/**
 * Parses a date string in the format "DD/MM/YYYY, HH:mm:ss" into a Date object.
 * 
 * @param {string} dateString - The date string to parse.
 * @returns {Date} - The parsed Date object.
 */
export const parseDateString = (dateString) => {
  const [datePart, timePart] = dateString.split(', ');
  const [day, month, year] = datePart.split('/').map(Number);
  const [hours, minutes, seconds] = timePart.split(':').map(Number);

  return new Date(year, month - 1, day, hours, minutes, seconds); // Create Date object from parsed values
};

/**
 * Parses a date string or object into a valid Date object
 * Handles multiple formats including DD/MM/YYYY, HH:mm:ss format used in the Redux store
 * @param {string|Date} dateStr - The date string or object to parse
 * @returns {Date|null} - The parsed Date object, or null if invalid
 */
export const parseDate = (dateStr) => {
  try {
    // Handle null/undefined input
    if (dateStr === null || dateStr === undefined) return null;
    
    // Already a Date object - validate and return
    if (dateStr instanceof Date) {
      return isNaN(dateStr.getTime()) ? null : dateStr;
    }
    
    // Handle DD/MM/YYYY, HH:mm:ss format (the format used in Redux store)
    if (typeof dateStr === 'string' && /^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}$/.test(dateStr)) {
      const [datePart, timePart] = dateStr.split(', ');
      const [day, month, year] = datePart.split('/').map(Number);
      const [hours, minutes, seconds] = timePart.split(':').map(Number);
      const date = new Date(year, month - 1, day, hours, minutes, seconds);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // ISO string format (with T separator)
    if (typeof dateStr === 'string' && dateStr.includes('T')) {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // YYYY-MM-DD format
    if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // DD-MM-YYYY format
    if (typeof dateStr === 'string' && dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const [day, month, year] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // HH:mm format (just time)
    if (typeof dateStr === 'string' && dateStr.match(/^\d{2}:\d{2}$/)) {
      const [hours, minutes] = dateStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    }
    
    // Default parsing attempt as last resort
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    ('Date parsing error:', error, 'for input:', dateStr);
    return null;
  }
};

// Add this to timeUtils.js
export const formatTimeForRedux = (timeString) => {
  if (!timeString) return null;

  try {
    let date;
    // If timeString is already a date object
    if (timeString instanceof Date) {
      date = timeString;
    }
    // If it's an ISO string
    else if (timeString.includes('T')) {
      date = new Date(timeString);
    }
    // If it's in the "DD/MM/YYYY, HH:mm:ss" format
    else if (timeString.includes(',')) {
      const [datePart, timePart] = timeString.split(', ');
      const [day, month, year] = datePart.split('/').map(Number);
      const [hours, minutes, seconds] = timePart.split(':').map(Number);
      date = new Date(year, month - 1, day, hours, minutes, seconds);
    }
    // If parsing failed, return original string
    if (isNaN(date.getTime())) {
      return timeString;
    }

    // Format to "DD/MM/YYYY, HH:mm:ss"
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    ('Error formatting time for Redux:', error);
    return timeString;
  }
};

// timeUtils.js

// Get array of years centered around current year (5 years before and after)
export const getYearsArray = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
};

// Get array of month names
export const getMonthsArray = () => {
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2000, i, 1);
    return format(date, 'MMMM');
  });
};

// Get visible hours based on settings
export const getVisibleHours = (settings) => {
  if (!settings.startHour || !settings.endHour) {
    return Array.from({ length: 24 }, (_, i) => i);
  }

  const startHour = parseInt(settings.startHour?.split(':')[0]) + 
    (settings.startHour?.includes('PM') ? 12 : 0);
  const endHour = parseInt(settings.endHour?.split(':')[0]) + 
    (settings.endHour?.includes('PM') ? 12 : 0);

  return [...Array(24)].map((_, hour) => hour)
    .filter(hour => {
      const hourStr = `${(hour % 12 || 12).toString().padStart(2, '0')}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
      
      if (settings.hiddenHours?.includes(hourStr)) {
        return false;
      }
      
      if (endHour >= startHour) {
        return hour >= startHour && hour <= endHour;
      } else {
        return hour >= startHour || hour <= endHour;
      }
    });
};

// Format hour to display format
export const formatTimeLabel = (hour) => {
  return `${hour.toString().padStart(2, '0')}:00`;
};

/**
 * Formats a date to the yyyy-MM-dd format for database storage
 * 
 * @param {Date|string} date - The date to format
 * @returns {string} - The formatted date in yyyy-MM-dd format
 */
export const formatDateForDB = (date) => {
  if (!date) return null;
  
  try {
    let dateObj;
    
    if (date instanceof Date) {
      // Create new date at UTC midnight using the year, month, day components
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      dateObj = new Date(Date.UTC(year, month, day));
    } else if (typeof date === 'string') {
      // Parse date strings, handling multiple formats but always setting to UTC midnight
      if (date.includes('T')) {
        // Extract just the date part from ISO strings
        const datePart = date.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        dateObj = new Date(Date.UTC(year, month - 1, day));
      } else if (date.includes('-')) {
        // Simple yyyy-MM-dd format
        const [year, month, day] = date.split('-').map(Number);
        dateObj = new Date(Date.UTC(year, month - 1, day));
      } else {
        // For any other string format, parse normally then reset to UTC midnight
        const tempDate = new Date(date);
        dateObj = new Date(Date.UTC(
          tempDate.getFullYear(),
          tempDate.getMonth(),
          tempDate.getDate()
        ));
      }
    } else {
      ('Unsupported date format:', date);
      return null;
    }
    
    if (isNaN(dateObj.getTime())) {
      ('Invalid date value:', date);
      return null;
    }
    
    // Format as yyyy-MM-dd
    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    ('Error formatting date for DB:', error);
    return null;
  }
};

/**
 * Utility function to safely parse a date from various formats to a Date object
 * with emphasis on handling yyyy-MM-dd format correctly
 * 
 * @param {string|Date} dateInput - The date to parse
 * @returns {Date|null} - JavaScript Date object or null if invalid
 */
export const parseDateSafely = (dateInput) => {
  if (!dateInput) return null;
  
  // Already a Date object
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  
  try {
    // Handle yyyy-MM-dd format
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      // Add time component to prevent timezone issues
      return new Date(`${dateInput}T00:00:00.000Z`);
    }
    
    // Handle other string formats
    if (typeof dateInput === 'string') {
      const date = new Date(dateInput);
      return isNaN(date.getTime()) ? null : date;
    }
    
    return null;
  } catch (error) {
    ('Error parsing date:', error);
    return null;
  }
};
