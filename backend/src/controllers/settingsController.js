const ServiceFactory = require('../services/serviceFactory');

/**
 * SettingsController organized by domains
 */
const settingsController = (db) => {
  const serviceFactory = new ServiceFactory(db);
  const settingsService = serviceFactory.getSettingsService();
  
  return {
    // User settings operations
    userSettings: {
      get: async (req, res) => {
        try {
          const settings = await settingsService.userSettings.get();
          res.json(settings);
        } catch (error) {
          console.error('Error in getUserSettings:', error);
          res.status(500).json({ error: 'Failed to get user settings' });
        }
      },
      
      update: async (req, res) => {
        try {
          const { start_hour, end_hour, hidden_hours, sound_settings } = req.body;
          
          try {
            const result = await settingsService.userSettings.update({
              start_hour,
              end_hour,
              hidden_hours,
              sound_settings
            });
            
            res.json(result);
          } catch (error) {
            if (error.message.includes('Invalid')) {
              res.status(400).json({ error: error.message });
            } else {
              throw error;
            }
          }
        } catch (error) {
          console.error('Error in updateUserSettings:', error);
          res.status(500).json({ error: 'Failed to update user settings' });
        }
      }
    },
    
    
  };
};

module.exports = settingsController;