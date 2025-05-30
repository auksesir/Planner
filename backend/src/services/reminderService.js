const dateUtils = require('../utils/dateUtils');
const repeatPatternService = require('./repeatPatternService');

class ReminderService {
  constructor(db) {
    this.db = db;
    this.alerts = new AlertService(db);
  }

  /**
   * Validates date format (yyyy-MM-dd)
   * @param {string} dateStr - Date string to validate
   * @returns {boolean} - Whether the date is valid
   */
  isValidDateFormat(dateStr) {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  }

  // Core reminder methods
  async getById(reminderId) {
    return this.db.get('SELECT * FROM reminders WHERE id = ?', [reminderId]);
  }

  async getAll() {
    return this.db.all('SELECT * FROM reminders');
  }

  async getForDay(date) {
    
  
    const singleReminders = await this.db.all(
      'SELECT * FROM reminders WHERE repeatOption IS NULL AND DATE(selectedDay) = DATE(?)', 
      [date]
    );
  
    const repeatingReminders = await this.db.all(`
      SELECT * FROM reminders 
      WHERE repeatOption IS NOT NULL 
        AND DATE(selectedDay) <= DATE(?)
        AND (repeatEndDay IS NULL OR DATE(repeatEndDay) >= DATE(?))
    `, [date, date]);
  
    const allReminders = [...singleReminders];
  
    // Process repeating reminders
    for (const reminder of repeatingReminders) {
      
      try {
        const selectedDay = dateUtils.parseToUTCDate(reminder.selectedDay);
        
        const repeatEndDay = reminder.repeatEndDay ? dateUtils.parseToUTCDate(reminder.repeatEndDay) : null;
        
        const skipDates = reminder.skipDates ? JSON.parse(reminder.skipDates) : [];
        
        // Skip check
        if (skipDates.includes(date)) {
          continue;
        }
        
        const selectedDate = dateUtils.parseToUTCDate(date);
        
        const matchesPattern = repeatPatternService.checkRepeatPattern(
          selectedDate, 
          reminder.repeatOption, 
          selectedDay, 
          repeatEndDay
        );
        
        if (matchesPattern) {
          allReminders.push({
            ...reminder,
            selectedDay: date
          });
        }
      } catch (error) {
        console.error('[getForDay] Error processing repeating reminder:', error);
      }
    }

    // Sort reminders by time before returning
    return allReminders.sort((a, b) => {
      const timeA = new Date(a.selectedTime).getTime();
      const timeB = new Date(b.selectedTime).getTime();
      return timeA - timeB;
    });
  }

  async create(reminderData) {
    const { name, selectedDay, selectedTime, repeatOption, repeatEndDay, currentDay, selectedDayUI } = reminderData;
    
    // Validate inputs
    if (!name || !selectedDay || !selectedTime) {
      throw new Error('Missing required fields');
    }
    
    if (!this.isValidDateFormat(selectedDay)) {
      throw new Error('Invalid selectedDay format. Expected yyyy-MM-dd');
    }
    
    if (repeatOption && repeatEndDay && !this.isValidDateFormat(repeatEndDay)) {
      throw new Error('Invalid repeatEndDay format. Expected yyyy-MM-dd');
    }
    
    // We still need to parse selectedTime for validation
    const selectedTimeUTC = dateUtils.parseToUTCDate(selectedTime);
    if (!selectedTimeUTC) {
      throw new Error('Invalid time format');
    }
    
    // Add logic to determine if the reminder repeats on current/selected day
    let repeatReminderOnCurrentDay = false;
    let repeatReminderOnSelectedDay = false;
    
    if (repeatOption) {
      const currentDayDate = dateUtils.parseToUTCDate(currentDay);
      const selectedDayUIDate = dateUtils.parseToUTCDate(selectedDayUI);
      const selectedDayDate = dateUtils.parseToUTCDate(selectedDay);
      const repeatEndDayDate = repeatEndDay ? dateUtils.parseToUTCDate(repeatEndDay) : null;
      
      // Check if reminder repeats on the current day
      repeatReminderOnCurrentDay = repeatPatternService.checkRepeatPattern(
        currentDayDate,
        repeatOption,
        selectedDayDate,
        repeatEndDayDate
      );
      
      // Check if reminder repeats on the selected UI day
      repeatReminderOnSelectedDay = repeatPatternService.checkRepeatPattern(
        selectedDayUIDate,
        repeatOption,
        selectedDayDate,
        repeatEndDayDate
      );
    }
    
    // Insert reminder
    const result = await this.db.run(`
      INSERT INTO reminders 
        (name, selectedDay, selectedTime, repeatOption, repeatEndDay, skipDates, originalStartDay) 
      VALUES 
        (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        selectedDay, // Use directly
        selectedTimeUTC.toISOString(), // Convert time to ISO
        repeatOption,
        repeatEndDay || null, // Use directly
        '[]', // Initialize empty skipDates array
        selectedDay // Original start day same as selected day
      ]
    );
    
    return {
      id: result.lastID,
      message: 'Reminder added successfully',
      repeatReminderOnCurrentDay,
      repeatReminderOnSelectedDay
    };
  }
  
  // Updated update method
  async update(reminderId, reminderData) {
    const reminder = await this.getById(reminderId);
    if (!reminder) throw new Error('Reminder not found');
    
    // Extract and validate data
    const { name, selectedDay, selectedTime, repeatOption, repeatEndDay, currentDay, selectedDayUI } = reminderData;
    
    if (!name || !selectedDay || !selectedTime) {
      throw new Error('Missing required fields');
    }
    
    if (!this.isValidDateFormat(selectedDay)) {
      throw new Error('Invalid selectedDay format. Expected yyyy-MM-dd');
    }
    
    if (repeatOption && repeatEndDay && !this.isValidDateFormat(repeatEndDay)) {
      throw new Error('Invalid repeatEndDay format. Expected yyyy-MM-dd');
    }
    
    // We still need to parse selectedTime for validation
    const selectedTimeUTC = dateUtils.parseToUTCDate(selectedTime);
    if (!selectedTimeUTC) {
      throw new Error('Invalid time format');
    }
    
    // Add logic to determine if the reminder repeats on current/selected day
    let repeatReminderOnCurrentDay = false;
    let repeatReminderOnSelectedDay = false;
    
    if (repeatOption) {
      const currentDayDate = dateUtils.parseToUTCDate(currentDay);
      const selectedDayUIDate = dateUtils.parseToUTCDate(selectedDayUI);
      const selectedDayDate = dateUtils.parseToUTCDate(selectedDay);
      const repeatEndDayDate = repeatEndDay ? dateUtils.parseToUTCDate(repeatEndDay) : null;
      
      // Check if reminder repeats on the current day
      repeatReminderOnCurrentDay = repeatPatternService.checkRepeatPattern(
        currentDayDate,
        repeatOption,
        selectedDayDate,
        repeatEndDayDate
      );
      
      // Check if reminder repeats on the selected UI day
      repeatReminderOnSelectedDay = repeatPatternService.checkRepeatPattern(
        selectedDayUIDate,
        repeatOption,
        selectedDayDate,
        repeatEndDayDate
      );
    }
    
    // Update reminder
    await this.db.run(
      `UPDATE reminders SET 
        name = ?, 
        selectedDay = ?,
        selectedTime = ?,
        repeatOption = ?, 
        repeatEndDay = ?
      WHERE id = ?`,
      [
        name,
        selectedDay, // Use directly
        selectedTimeUTC.toISOString(), // Convert time to ISO
        repeatOption,
        repeatEndDay || null, // Use directly
        reminderId
      ]
    );
    
    return { 
      message: 'Reminder updated successfully',
      repeatReminderOnCurrentDay,
      repeatReminderOnSelectedDay 
    };
  }

  async delete(reminderId, deleteAll, date) {
    const reminder = await this.getById(reminderId);
    if (!reminder) throw new Error('Reminder not found');
  
    if (deleteAll === 'true') {
      // Handle delete all instances of repeating reminder
      if (reminder.repeatOption) {
        // Delete all instances with the same originalStartDay
        await this.db.run(
          'DELETE FROM reminders WHERE originalStartDay = ?', 
          [reminder.originalStartDay || reminder.selectedDay]
        );
        return {
          success: true, 
          message: 'All instances of the repeating reminder deleted successfully',
          deleteAll: true
        };
      } else {
        // Not a repeating reminder - just delete it
        await this.db.run('DELETE FROM reminders WHERE id = ?', [reminderId]);
        return {
          success: true, 
          message: 'Reminder deleted successfully',
          deleteAll: true
        };
      }
    } else {
      // Handle single instance deletion
      if (!date) {
        throw new Error('Date parameter required for single instance deletion');
      }
      
      // Validate date format if provided
      if (!this.isValidDateFormat(date)) {
        throw new Error('Invalid date format. Expected yyyy-MM-dd');
      }
  
      if (reminder.repeatOption) {
        // For repeating reminders, add to skipDates
        let skipDates = reminder.skipDates ? JSON.parse(reminder.skipDates) : [];
        
        if (skipDates.includes(date)) {
          throw new Error('This instance is already deleted');
        }
        
        skipDates.push(date);
        await this.db.run(
          'UPDATE reminders SET skipDates = ? WHERE id = ?', 
          [JSON.stringify(skipDates), reminderId]
        );
        
        return {
          success: true, 
          message: 'Single instance of the repeating reminder deleted successfully',
          deleteAll: false,
          deletedDate: date
        };
      } else {
        // For non-repeating reminders, just delete
        await this.db.run('DELETE FROM reminders WHERE id = ?', [reminderId]);
        return {
          success: true, 
          message: 'Reminder deleted successfully',
          deleteAll: true
        };
      }
    }
  }

  async getLatest() {
    return this.db.get('SELECT * FROM reminders ORDER BY id DESC LIMIT 1');
  }

  async getForWeek(startDate, endDate) {
    // Validate date formats
    if (!this.isValidDateFormat(startDate) || !this.isValidDateFormat(endDate)) {
      throw new Error('Invalid date format. Expected yyyy-MM-dd');
    }
    
    // For pattern and occurrence checking, we still need Date objects
    const startDateObj = dateUtils.parseToUTCDate(startDate);
    const endDateObj = dateUtils.parseToUTCDate(endDate);
    
    if (!startDateObj || !endDateObj) {
      throw new Error('Failed to parse dates');
    }
    
    // Get single reminders - using dates directly
    const singleReminders = await this.db.all(`
      SELECT * FROM reminders 
      WHERE repeatOption IS NULL 
      AND DATE(selectedDay) >= DATE(?)
      AND DATE(selectedDay) <= DATE(?)
    `, [startDate, endDate]);

    // Get repeating reminders - using dates directly
    const repeatingReminders = await this.db.all(`
      SELECT * FROM reminders 
      WHERE repeatOption IS NOT NULL
      AND DATE(selectedDay) <= DATE(?)
      AND (repeatEndDay IS NULL OR DATE(repeatEndDay) >= DATE(?))
    `, [endDate, startDate]);

    const allReminders = [...singleReminders];
    
    // Process repeating reminders
    repeatingReminders.forEach(reminder => {
      const occurrences = repeatPatternService.getOccurrencesInRange(
        reminder,
        startDateObj,
        endDateObj
      );
      
      occurrences.forEach(occurrence => {
        const selectedTime = dateUtils.parseToUTCDate(reminder.selectedTime);
        
        const occurrenceTime = dateUtils.combineDateTime(
          occurrence.date,
          selectedTime
        );
        
        allReminders.push({
          ...reminder,
          selectedDay: occurrence.dateStr, // Already in yyyy-MM-dd format
          selectedTime: occurrenceTime?.toISOString() || reminder.selectedTime
        });
      });
    });

    // Sort reminders
    return allReminders.sort((a, b) => {
      const dateA = dateUtils.parseToUTCDate(a.selectedDay);
      const dateB = dateUtils.parseToUTCDate(b.selectedDay);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }
      
      const timeA = dateUtils.parseToUTCDate(a.selectedTime);
      const timeB = dateUtils.parseToUTCDate(b.selectedTime);
      return timeA - timeB;
    });
  }
}

class AlertService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Validates date format (yyyy-MM-dd)
   * @param {string} dateStr - Date string to validate
   * @returns {boolean} - Whether the date is valid
   */
  isValidDateFormat(dateStr) {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  }

  async set(reminderId, reminderTime) {
    const reminder = await this.db.get('SELECT * FROM reminders WHERE id = ?', [reminderId]);
    if (!reminder) throw new Error('Reminder not found');
    
    // We still need to parse reminderTime as it contains time component
    const reminderTimeUTC = dateUtils.parseToUTCDate(reminderTime);
    if (!reminderTimeUTC) throw new Error('Invalid reminder time format');
    
    await this.db.run(
      'UPDATE reminders SET reminderTime = ?, hasReminder = 1 WHERE id = ?',
      [reminderTimeUTC.toISOString(), reminderId]
    );
    
    return {
      success: true,
      message: 'Reminder alert set successfully'
    };
  }

  async clear(reminderId) {
    const reminder = await this.db.get('SELECT * FROM reminders WHERE id = ?', [reminderId]);
    if (!reminder) throw new Error('Reminder not found');
    
    await this.db.run(
      'UPDATE reminders SET reminderTime = NULL, hasReminder = 0 WHERE id = ?',
      [reminderId]
    );
    
    return {
      success: true,
      message: 'Reminder alert cleared successfully'
    };
  }
}

module.exports = ReminderService;