const ServiceFactory = require('../services/serviceFactory');
const dateUtils = require('../utils/dateUtils');

/**
 * TaskController with enhanced error logging for debugging
 */
const taskController = (db) => {
  const serviceFactory = new ServiceFactory(db);
  const taskService = serviceFactory.getTaskService();
  
  return {
    // Task operations
    tasks: {
      getById: async (req, res) => {
        try {
          const task = await taskService.getById(req.params.id);
          task ? res.json(task) : res.status(404).json({ error: 'Task not found' });
        } catch (error) {
          console.error('Error in getTaskById:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      },
      
      getAll: async (req, res) => {
        try {
          res.json(await taskService.getAll());
        } catch (error) {
          console.error('Error in getAllTasks:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      },
      
      getForDay: async (req, res) => {
        try {
          console.log('[TaskController] getForDay called with date:', req.params.date);
          const tasks = await taskService.getForDay(req.params.date);
          console.log('[TaskController] Tasks returned from service:', tasks.length);
          res.json(tasks || []);
        } catch (error) {
          console.error('[TaskController] Error in getForDay:', error);
          if (error.message === 'Invalid date format') {
            res.status(400).json({ error: error.message });
          } else {
            res.status(500).json({ error: 'Internal Server Error' });
          }
        }
      },
      
      create: async (req, res) => {
        try {
          const { name, selectedDay, startTime, endTime, duration, repeatOption, repeatEndDay, currentDay, selectedDayUI } = req.body;
          
          if (!name || !selectedDay || !startTime || !endTime) {
            return res.status(400).json({ error: 'Missing required fields' });
          }
          
          if (repeatOption && !repeatEndDay) {
            return res.status(400).json({ error: 'Repeat end day is required for repeating tasks' });
          }
          
          const result = await taskService.create(req.body);
          res.status(201).json({ message: 'Task added successfully', ...result });
        } catch (error) {
          if (error.message === 'This task overlaps with another task.') {
            res.status(409).json({ error: 'This task overlaps with another task.' });
          } else if (error.message === 'Invalid date format') {
            res.status(400).json({ error: 'Invalid date format' });
          } else if (error.message === 'Missing required fields') {
            res.status(400).json({ error: 'Missing required fields' });
          } else {
            console.error('Error in addTask:', error);
            res.status(500).json({ error: 'Internal Server Error' });
          }
        }
      },
      
      update: async (req, res) => {
        try {
          // Validate required fields first before checking if task exists
          const { name, selectedDay, startTime, endTime } = req.body;
          if (!name || !selectedDay || !startTime || !endTime) {
            return res.status(400).json({ error: 'Missing required fields' });
          }
          
          // Check if task exists
          const existingTask = await taskService.getById(req.params.id);
          if (!existingTask) {
            return res.status(404).json({ error: 'Task not found' });
          }
          
          const result = await taskService.update(req.params.id, req.body);
          res.json(result);
        } catch (error) {
          if (error.message === 'Task not found') {
            res.status(404).json({ error: error.message });
          } else if (error.message === 'This task overlaps with another task.') {
            res.status(409).json({ error: error.message });
          } else if (error.message === 'Invalid date format') {
            res.status(400).json({ error: error.message });
          } else {
            console.error('Error in updateTask:', error);
            res.status(500).json({ error: 'Internal Server Error' });
          }
        }
      },
      
      delete: async (req, res) => {
        try {
          // Check if task exists first
          const existingTask = await taskService.getById(req.params.id);
          if (!existingTask) {
            return res.status(404).json({ error: 'Task not found' });
          }
          
          const result = await taskService.delete(
            req.params.id, 
            req.query.deleteAll === 'true', // ensure boolean conversion
            req.query.date
          );
          
          // Return appropriate success message based on delete type
          if (req.query.deleteAll === 'true') {
            res.json({ message: 'All instances of the repeating task deleted successfully', ...result });
          } else {
            res.json({ message: 'Single instance of the repeating task deleted successfully', ...result });
          }
        } catch (error) {
          if (error.message === 'Task not found') {
            res.status(404).json({ error: error.message });
          } else if (error.message === 'This instance is already deleted') {
            res.status(400).json({ error: error.message });
          } else if (error.message === 'Invalid date format') {
            res.status(400).json({ error: error.message });
          } else {
            console.error('Error in deleteTask:', error);
            res.status(500).json({ error: 'Internal Server Error' });
          }
        }
      },
      
      getLatest: async (req, res) => {
        try {
          const task = await taskService.getLatest();
          task ? res.json(task) : res.status(404).json({ error: 'No tasks found' });
        } catch (error) {
          console.error('Error in getLatestTask:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      },
      
      getForWeek: async (req, res) => {
        try {
          res.json(await taskService.getForWeek(req.params.startDate, req.params.endDate));
        } catch (error) {
          if (error.message === 'Invalid date format') {
            res.status(400).json({ error: error.message });
          } else {
            console.error('Error in getTasksForWeek:', error);
            res.status(500).json({ error: 'Internal Server Error' });
          }
        }
      }
    },
    
    // Reminder operations
    reminders: {
      set: async (req, res) => {
        try {
          // Check if task exists first
          const existingTask = await taskService.getById(req.params.taskId);
          if (!existingTask) {
            return res.status(404).json({ error: 'Task not found' });
          }
          
          const result = await taskService.reminders.set(req.params.taskId, req.body.reminderTime);
          res.json(result);
        } catch (error) {
          if (error.message === 'Task not found') {
            res.status(404).json({ error: error.message });
          } else if (error.message === 'Invalid reminder time format') {
            res.status(400).json({ error: error.message });
          } else {
            console.error('Error in setTaskReminder:', error);
            res.status(500).json({ error: 'Internal Server Error' });
          }
        }
      },
      
      clear: async (req, res) => {
        try {
          // Check if task exists first
          const existingTask = await taskService.getById(req.params.taskId);
          if (!existingTask) {
            return res.status(404).json({ error: 'Task not found' });
          }
          
          const result = await taskService.reminders.clear(req.params.taskId);
          res.json(result);
        } catch (error) {
          if (error.message === 'Task not found') {
            res.status(404).json({ error: error.message });
          } else {
            console.error('Error in clearTaskReminder:', error);
            res.status(500).json({ error: 'Internal Server Error' });
          }
        }
      }
    }
  };
};

module.exports = taskController;