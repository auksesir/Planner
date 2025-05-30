const ServiceFactory = require('../services/serviceFactory');
const dateUtils = require('../utils/dateUtils');

/**
 * ReminderController organized by domains
 */
const reminderController = (db) => {
  const serviceFactory = new ServiceFactory(db);
  const reminderService = serviceFactory.getReminderService();
  
  return {
    // Reminder operations
    reminders: {
      getById: async (req, res) => {
        try {
          const reminder = await reminderService.getById(req.params.id);
          reminder ? res.json(reminder) : res.status(404).json({ error: 'Reminder not found' });
        } catch (error) {
          console.error('Error in getReminderById:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      },
      
      getAll: async (req, res) => {
        try {
          res.json(await reminderService.getAll());
        } catch (error) {
          console.error('Error in getAllReminders:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      },
      
      getForDay: async (req, res) => {
        try {
          const reminders = await reminderService.getForDay(req.params.date);
          res.json(reminders || []);
        } catch (error) {
          if (error.message === 'Invalid date format') {
            res.status(400).json({ error: error.message });
          } else {
            console.error('Error in getRemindersForDay:', error);
            res.status(500).json({ error: 'Internal Server Error' });
          }
        }
      },
      
      create: async (req, res) => {
        try {
          const { name, selectedDay, selectedTime, repeatOption, repeatEndDay } = req.body;
          
          if (!name || !selectedDay || !selectedTime) {
            return res.status(400).json({ error: 'Missing required fields' });
          }
          
          if (repeatOption && !repeatEndDay) {
            return res.status(400).json({ error: 'Repeat end day is required for repeating reminders' });
          }
          
          const result = await reminderService.create(req.body);
          res.status(201).json(result);
        } catch (error) {
          console.error('Error in addReminder:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      },
      
      update: async (req, res) => {
        try {
          const result = await reminderService.update(req.params.id, req.body);
          res.json(result);
        } catch (error) {
          if (error.message === 'Reminder not found') {
            res.status(404).json({ error: error.message });
          } else {
            console.error('Error in updateReminder:', error);
            res.status(500).json({ error: 'Internal Server Error' });
          }
        }
      },
      
      delete: async (req, res) => {
        try {
          const result = await reminderService.delete(
            req.params.id, 
            req.query.deleteAll, 
            req.query.date
          );
          res.json(result);
        } catch (error) {
          if (error.message === 'Reminder not found') {
            res.status(404).json({ error: error.message });
          } else if (error.message === 'This instance is already deleted') {
            res.status(400).json({ error: error.message });
          } else {
            console.error('Error in deleteReminder:', error);
            res.status(500).json({ error: 'Internal Server Error' });
          }
        }
      },
      
      getLatest: async (req, res) => {
        try {
          const reminder = await reminderService.getLatest();
          reminder ? res.json(reminder) : res.status(404).json({ error: 'No reminders found' });
        } catch (error) {
          console.error('Error in getLatestReminder:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      },
      
      getForWeek: async (req, res) => {
        try {
          res.json(await reminderService.getForWeek(req.params.startDate, req.params.endDate));
        } catch (error) {
          if (error.message === 'Invalid date format') {
            res.status(400).json({ error: error.message });
          } else {
            console.error('Error in getRemindersForWeek:', error);
            res.status(500).json({ error: 'Internal Server Error' });
          }
        }
      }
    },
    
    // Alert operations
    alerts: {
      set: async (req, res) => {
        try {
          const result = await reminderService.alerts.set(req.params.id, req.body.reminderTime);
          res.json(result);
        } catch (error) {
          if (error.message === 'Reminder not found') {
            res.status(404).json({ error: error.message });
          } else if (error.message === 'Invalid reminder time format') {
            res.status(400).json({ error: error.message });
          } else {
            console.error('Error in setReminderAlert:', error);
            res.status(500).json({ error: 'Internal Server Error' });
          }
        }
      },
      
      clear: async (req, res) => {
        try {
          const result = await reminderService.alerts.clear(req.params.id);
          res.json(result);
        } catch (error) {
          if (error.message === 'Reminder not found') {
            res.status(404).json({ error: error.message });
          } else {
            console.error('Error in clearReminderAlert:', error);
            res.status(500).json({ error: 'Internal Server Error' });
          }
        }
      }
    }
  };
};

module.exports = reminderController;