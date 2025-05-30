const dateUtils = require('../utils/dateUtils');
const repeatPatternService = require('./repeatPatternService');

/**
 * Task Reminder Service (simple reminder functionality for tasks)
 * This is different from the main ReminderService which handles standalone reminders
 */
class TaskReminderService {
  constructor(db) {
    this.db = db;
  }

  async set(taskId, reminderTime) {
    try {
      const task = await this.db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
      if (!task) throw new Error('Task not found');
      
      const reminderTimeUTC = dateUtils.parseToUTCDate(reminderTime);
      if (!reminderTimeUTC) throw new Error('Invalid reminder time format');
      
      await this.db.run(
        'UPDATE tasks SET reminderTime = ?, hasReminder = 1 WHERE id = ?',
        [reminderTimeUTC.toISOString(), taskId]
      );
      
      return {
        success: true,
        message: 'Task reminder set successfully',
        task: await this.db.get('SELECT * FROM tasks WHERE id = ?', [taskId])
      };
    } catch (error) {
      console.error('Error setting task reminder:', error);
      throw error;
    }
  }

  async clear(taskId) {
    try {
      const task = await this.db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
      if (!task) throw new Error('Task not found');
      
      await this.db.run(
        'UPDATE tasks SET reminderTime = NULL, hasReminder = 0 WHERE id = ?',
        [taskId]
      );
      
      return {
        success: true,
        message: 'Task reminder cleared successfully'
      };
    } catch (error) {
      console.error('Error clearing task reminder:', error);
      throw error;
    }
  }
}

/**
 * Core Task Service
 */
class TaskService {
  constructor(db) {
    this.db = db;
    this.reminders = new TaskReminderService(db); // ✅ Use TaskReminderService for task reminders
  }

  // ==================== TASK METHODS ====================

  async getById(taskId) {
    try {
      return await this.db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
    } catch (error) {
      console.error('Error getting task by ID:', error);
      throw new Error('Failed to get task');
    }
  }

  async getAll() {
    try {
      return await this.db.all('SELECT * FROM tasks');
    } catch (error) {
      console.error('Error getting all tasks:', error);
      throw new Error('Failed to get tasks');
    }
  }

  async getForDay(date) {
    try {
      console.log('[TaskService] getForDay called with date:', date);
    
      console.log('[TaskService] Querying single tasks...');
      const singleTasks = await this.db.all(
        'SELECT * FROM tasks WHERE (repeatOption IS NULL OR repeatOption = "") AND DATE(selectedDay) = DATE(?)', 
        [date]
      );
      console.log('[TaskService] Single tasks found:', singleTasks.length, singleTasks);
    
      console.log('[TaskService] Querying repeating tasks...');
      const repeatingTasks = await this.db.all(`
        SELECT * FROM tasks 
        WHERE repeatOption IS NOT NULL AND repeatOption != ""
          AND DATE(selectedDay) <= DATE(?)
          AND (repeatEndDay IS NULL OR DATE(repeatEndDay) >= DATE(?))
      `, [date, date]);
      console.log('[TaskService] Repeating tasks found:', repeatingTasks.length, repeatingTasks);
    
      const allTasks = [...singleTasks];
      console.log('[TaskService] Initial tasks count:', allTasks.length);
      
      // Process repeating tasks
      repeatingTasks.forEach(task => {
        try {
          console.log('Processing repeating task:', task.id, task.name);
          
          const selectedDay = dateUtils.parseToUTCDate(task.selectedDay);
          const repeatEndDay = task.repeatEndDay ? dateUtils.parseToUTCDate(task.repeatEndDay) : null;
          const skipDates = task.skipDates ? JSON.parse(task.skipDates) : [];
      
          if (skipDates.includes(date)) {
            console.log('Skipping task due to skip date');
            return;
          }

          const selectedDate = dateUtils.parseToUTCDate(date); 
      
          const matchesPattern = repeatPatternService.checkRepeatPattern(
            selectedDate,  
            task.repeatOption, 
            selectedDay, 
            repeatEndDay
          );
      
          console.log('Repeat pattern matches:', matchesPattern);
          
          if (matchesPattern) {
            console.log('Adding task instance for date:', date);
            allTasks.push({
              ...task,
              selectedDay: date
            });
          }
        } catch (error) {
          console.error('Error processing repeating task:', error);
        }
      });
      
      return allTasks;
    } catch (error) {
      console.error('Error getting tasks for day:', error);
      throw new Error('Failed to get tasks for day');
    }
  }

  async create(taskData) {
    try {
      console.log('[TaskService] create called with data:', taskData);
      
      const { name, selectedDay, startTime, endTime, duration, repeatOption, repeatEndDay, currentDay, selectedDayUI } = taskData;
     
      // Validate required fields
      if (!name || !selectedDay || !startTime || !endTime) {
        throw new Error('Missing required fields');
      }

      // Parse and validate dates first
      const startTimeUTC = dateUtils.parseToUTCDate(startTime);
      const endTimeUTC = dateUtils.parseToUTCDate(endTime);
      const selectedDayUTC = dateUtils.parseToUTCDate(selectedDay);
      
      if (!startTimeUTC || !endTimeUTC || !selectedDayUTC) {
        throw new Error('Invalid date format');
      }
      
      if (endTimeUTC <= startTimeUTC) {
        throw new Error('End time must be after start time');
      }
      
      // Add logic to determine if the task repeats on current/selected day
      let repeatTaskOnCurrentDay = false;
      let repeatTaskOnSelectedDay = false;
      
      if (repeatOption) {
        const currentDayDate = dateUtils.parseToUTCDate(currentDay);
        const selectedDayUIDate = dateUtils.parseToUTCDate(selectedDayUI);
        const selectedDayDate = dateUtils.parseToUTCDate(selectedDay);
        const repeatEndDayDate = repeatEndDay ? dateUtils.parseToUTCDate(repeatEndDay) : null;
        
        // Check if task repeats on the current day
        repeatTaskOnCurrentDay = repeatPatternService.checkRepeatPattern(
          currentDayDate,
          repeatOption,
          selectedDayDate,
          repeatEndDayDate
        );
        
        // Check if task repeats on the selected UI day
        repeatTaskOnSelectedDay = repeatPatternService.checkRepeatPattern(
          selectedDayUIDate,
          repeatOption,
          selectedDayDate,
          repeatEndDayDate
        );
      }
  
      // Get potential overlapping tasks
      const potentialOverlappingTasks = await this.getPotentialOverlappingTasks(selectedDay);
      console.log(`Found ${potentialOverlappingTasks.length} potential overlapping tasks`);
      
      // Check for overlaps
      const isOverlapping = repeatPatternService.checkTaskOverlaps(
        { 
          startTime, 
          endTime, 
          selectedDay, 
          repeatOption, 
          repeatEndDay 
        },
        potentialOverlappingTasks
      );
      
      if (isOverlapping) {
        console.log("Task overlap detected, cannot create task");
        throw new Error('This task overlaps with another task.');
      }
      
      // Insert task
      const result = await this.db.run(`
        INSERT INTO tasks 
          (name, selectedDay, originalStartDay, startTime, endTime, duration, repeatOption, repeatEndDay, reminderTime, hasReminder, skipDates) 
        VALUES 
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          selectedDay,
          selectedDay,
          startTimeUTC.toISOString(),
          endTimeUTC.toISOString(),
          duration,
          repeatOption || '',
          repeatEndDay || null,
          null,
          0,
          '[]'
        ]
      );
      
      console.log("Task created successfully with ID:", result.lastID);
      
      return {
        id: result.lastID,
        message: 'Task added successfully',
        repeatTaskOnCurrentDay,
        repeatTaskOnSelectedDay
      };
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }
  
  async update(taskId, taskData) {
    const { name, selectedDay, originalStartDay, startTime, endTime, duration, repeatOption, repeatEndDay, currentDay, selectedDayUI } = taskData;
    
    try {
      const task = await this.getById(taskId);
      if (!task) throw new Error('Task not found');

      // Validate required fields
      if (!name || !selectedDay || !startTime || !endTime) {
        throw new Error('Missing required fields');
      }
    
      // We still need Date objects for time validation
      const startTimeUTC = dateUtils.parseToUTCDate(startTime);
      const endTimeUTC = dateUtils.parseToUTCDate(endTime);
      
      if (!startTimeUTC || !endTimeUTC) {
        throw new Error('Invalid date format');
      }
      
      if (endTimeUTC <= startTimeUTC) {
        throw new Error('End time must be after start time');
      }
      
      // Add logic to determine if the task repeats on current/selected day
      let repeatTaskOnCurrentDay = false;
      let repeatTaskOnSelectedDay = false;
      
      if (repeatOption) {
        const currentDayDate = dateUtils.parseToUTCDate(currentDay);
        const selectedDayUIDate = dateUtils.parseToUTCDate(selectedDayUI);
        const selectedDayDate = dateUtils.parseToUTCDate(selectedDay);
        const repeatEndDayDate = repeatEndDay ? dateUtils.parseToUTCDate(repeatEndDay) : null;
        
        // Check if task repeats on the current day
        repeatTaskOnCurrentDay = repeatPatternService.checkRepeatPattern(
          currentDayDate,
          repeatOption,
          selectedDayDate,
          repeatEndDayDate
        );
        
        // Check if task repeats on the selected UI day
        repeatTaskOnSelectedDay = repeatPatternService.checkRepeatPattern(
          selectedDayUIDate,
          repeatOption,
          selectedDayDate,
          repeatEndDayDate
        );
      }
  
      // Check for overlaps
      const potentialOverlappingTasks = await this.getPotentialOverlappingTasks(selectedDay);
      console.log(`Found ${potentialOverlappingTasks.length} potential overlapping tasks for update`);
      
      const isOverlapping = repeatPatternService.checkTaskOverlaps(
        { 
          id: taskId, // Include ID so we can exclude self from check
          startTime, 
          endTime, 
          selectedDay, 
          repeatOption, 
          repeatEndDay 
        },
        potentialOverlappingTasks
      );
      
      if (isOverlapping) {
        console.log("Task overlap detected, cannot update task");
        throw new Error('This task overlaps with another task.');
      }
      
      // Update task
      await this.db.run(
        `UPDATE tasks SET 
          name = ?, 
          selectedDay = ?,
          originalStartDay = ?,
          startTime = ?, 
          endTime = ?, 
          duration = ?, 
          repeatOption = ?, 
          repeatEndDay = ?
        WHERE id = ?`,
        [
          name, 
          selectedDay, 
          originalStartDay, 
          startTimeUTC.toISOString(), 
          endTimeUTC.toISOString(), 
          duration, 
          repeatOption || '', 
          repeatEndDay || null,
          taskId
        ]
      );
      
      console.log("Task updated successfully");
      
      return { 
        message: 'Task updated successfully',
        repeatTaskOnCurrentDay,
        repeatTaskOnSelectedDay 
      };
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }
  
  async delete(taskId, deleteAll, date) {
    try {
      const task = await this.getById(taskId);
      if (!task) throw new Error('Task not found');
      
      if (task.repeatOption && deleteAll === true) {
        await this.db.run('DELETE FROM tasks WHERE id = ?', [taskId]);
        return { 
          message: 'All instances of the repeating task deleted successfully',
          deleteAll: true
        };
      } else if (task.repeatOption) {
        let skipDates = task.skipDates ? JSON.parse(task.skipDates) : [];
        
        if (skipDates.includes(date)) {
          throw new Error('This instance is already deleted');
        }
        
        skipDates.push(date);
        await this.db.run(
          'UPDATE tasks SET skipDates = ? WHERE id = ?', 
          [JSON.stringify(skipDates), taskId]
        );
        
        return { 
          message: 'Single instance of the repeating task deleted successfully',
          deleteAll: false,
          deletedDate: date
        };
      } else {
        await this.db.run('DELETE FROM tasks WHERE id = ?', [taskId]);
        return { 
          message: 'Task deleted successfully',
          deleteAll: true
        };
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  async getLatest() {
    try {
      const task = await this.db.get('SELECT * FROM tasks ORDER BY id DESC LIMIT 1');
      if (!task) {
        return null; // Return null instead of throwing error
      }
      return task;
    } catch (error) {
      console.error('Error getting latest task:', error);
      throw new Error('Failed to get latest task');
    }
  }

  async getForWeek(startDate, endDate) {
    try {
      // Validate dates
      if (!dateUtils.parseToUTCDate(startDate) || !dateUtils.parseToUTCDate(endDate)) {
        throw new Error('Invalid date format');
      }
      
      // For pattern and occurrence checking, we need Date objects
      const startDateObj = dateUtils.parseToUTCDate(startDate);
      const endDateObj = dateUtils.parseToUTCDate(endDate);
      
      // Get single tasks - using dates directly
      const singleTasks = await this.db.all(`
        SELECT * FROM tasks 
        WHERE (repeatOption IS NULL OR repeatOption = "")
        AND DATE(selectedDay) >= DATE(?)
        AND DATE(selectedDay) <= DATE(?)
      `, [startDate, endDate]);

      // Get repeating tasks - using dates directly
      const repeatingTasks = await this.db.all(`
        SELECT * FROM tasks 
        WHERE repeatOption IS NOT NULL AND repeatOption != ""
        AND DATE(selectedDay) <= DATE(?)
        AND (repeatEndDay IS NULL OR DATE(repeatEndDay) >= DATE(?))
      `, [endDate, startDate]);

      const allTasks = [...singleTasks];

      // Process repeating tasks
      repeatingTasks.forEach(task => {
        const occurrences = repeatPatternService.getOccurrencesInRange(
          task,
          startDateObj,
          endDateObj
        );
        
        occurrences.forEach(occurrence => {
          const startTime = dateUtils.parseToUTCDate(task.startTime);
          const endTime = dateUtils.parseToUTCDate(task.endTime);
          
          const occurrenceStartTime = dateUtils.combineDateTime(
            occurrence.date,
            startTime
          );
          
          const occurrenceEndTime = dateUtils.combineDateTime(
            occurrence.date,
            endTime
          );
          
          allTasks.push({
            ...task,
            selectedDay: occurrence.dateStr, // Already in yyyy-MM-dd format
            startTime: occurrenceStartTime?.toISOString() || task.startTime,
            endTime: occurrenceEndTime?.toISOString() || task.endTime
          });
        });
      });

      // Sort tasks
      return allTasks.sort((a, b) => {
        const dateA = dateUtils.parseToUTCDate(a.selectedDay);
        const dateB = dateUtils.parseToUTCDate(b.selectedDay);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA - dateB;
        }
        
        const timeA = dateUtils.parseToUTCDate(a.startTime);
        const timeB = dateUtils.parseToUTCDate(b.startTime);
        return timeA - timeB;
      });
    } catch (error) {
      console.error('Error getting tasks for week:', error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  async getPotentialOverlappingTasks(dateStr) {
  console.log(`Getting potential overlapping tasks for date: ${dateStr}`);
  
  try {
    // FIXED: Get all repeating tasks, let overlap logic handle filtering
    const tasks = await this.db.all(`
      SELECT * FROM tasks 
      WHERE 
        (
          -- Get single tasks in a reasonable range around target date
          (repeatOption = '' OR repeatOption IS NULL) AND 
          DATE(selectedDay) BETWEEN DATE(?, '-6 months') AND DATE(?, '+6 months')
        ) OR (
          -- Get ALL repeating tasks - let JavaScript logic filter them
          repeatOption IS NOT NULL AND repeatOption != ''
        )`,
      [dateStr, dateStr]
    );
    
    console.log(`Found ${tasks.length} potential overlapping tasks`);
    return tasks;
  } catch (error) {
    console.error('Error getting potential overlapping tasks:', error);
    throw error;
  }
}
}

module.exports = TaskService;