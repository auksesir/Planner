const dateUtils = require('../utils/dateUtils');



class UserSettingsService {
  constructor(db) {
    this.db = db;
  }

  async get() {
    try {
      const settings = await this.db.get(`
        SELECT start_hour, end_hour, hidden_hours, sound_settings
        FROM user_settings
        WHERE id = 1
      `);

      if (!settings) {
        return this.createDefaultSettings();
      }

      return this.parseSettings(settings);
    } catch (error) {
      console.error('Error in getUserSettings:', error);
      throw new Error('Failed to get user settings');
    }
  }

  async update(settingsData) {
    try {
      const { start_hour, end_hour, hidden_hours, sound_settings } = settingsData;
      
      this.validateSettings(settingsData);
      
      const existingSettings = await this.get();
      
      const updatedSettings = {
        start_hour: start_hour || existingSettings.start_hour,
        end_hour: end_hour || existingSettings.end_hour,
        hidden_hours: hidden_hours !== undefined ? 
          JSON.stringify(hidden_hours) : 
          JSON.stringify(existingSettings.hidden_hours),
        sound_settings: sound_settings !== undefined ? 
          JSON.stringify(sound_settings) : 
          JSON.stringify(existingSettings.sound_settings)
      };
      
      await this.db.run(`
        UPDATE user_settings
        SET start_hour = ?,
            end_hour = ?,
            hidden_hours = ?,
            sound_settings = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `, [
        updatedSettings.start_hour, 
        updatedSettings.end_hour, 
        updatedSettings.hidden_hours,
        updatedSettings.sound_settings
      ]);
      
      return {
        message: 'Settings updated successfully',
        settings: this.parseSettings(updatedSettings)
      };
    } catch (error) {
      console.error('Error in updateUserSettings:', error);
      throw error;
    }
  }

  // Helper methods
  async createDefaultSettings() {
    const defaultSettings = {
      start_hour: '12:00 AM',
      end_hour: '11:00 PM',
      hidden_hours: '[]',
      sound_settings: JSON.stringify({
        enabled: true,
        volume: 0.7,
        reminderSound: 'reminder',
        taskSound: 'task'
      })
    };

    await this.db.run(`
      INSERT INTO user_settings (id, start_hour, end_hour, hidden_hours, sound_settings)
      VALUES (1, ?, ?, ?, ?)
    `, [
      defaultSettings.start_hour, 
      defaultSettings.end_hour, 
      defaultSettings.hidden_hours,
      defaultSettings.sound_settings
    ]);

    return this.parseSettings(defaultSettings);
  }

  parseSettings(settings) {
    return {
      ...settings,
      hidden_hours: JSON.parse(settings.hidden_hours || '[]'),
      sound_settings: settings.sound_settings ? 
        JSON.parse(settings.sound_settings) : 
        {
          enabled: true,
          volume: 0.7,
          reminderSound: 'reminder',
          taskSound: 'task'
        }
    };
  }

  validateSettings(settings) {
    if (settings.start_hour && !this.isValidTimeFormat(settings.start_hour)) {
      throw new Error('Invalid start hour format');
    }
    
    if (settings.end_hour && !this.isValidTimeFormat(settings.end_hour)) {
      throw new Error('Invalid end hour format');
    }
    
    if (settings.hidden_hours !== undefined && !Array.isArray(settings.hidden_hours)) {
      throw new Error('Hidden hours must be an array');
    }
  }

  isValidTimeFormat(timeStr) {
    const timeRegex = /^(0?[1-9]|1[0-2]):00\s(AM|PM)$/;
    return timeRegex.test(timeStr);
  }
}


module.exports = SettingsService;