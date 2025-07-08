const dateUtils = require('../utils/dateUtils');

// src/services/settingsService.js

/**
 * SettingsService
 * Handles user settings management including time preferences and sound settings
 */
class SettingsService {
  constructor(db) {
    this.db = db;
  }

  // User settings operations
  get userSettings() {
    return {
      get: async () => {
        try {
          let settings = await this.db.get('SELECT * FROM user_settings WHERE id = 1');
          
          if (!settings) {
            // Create default settings
            settings = await this.createDefaultSettings();
          }
          
          return this.parseSettings(settings);
        } catch (error) {
          console.error('Error getting user settings:', error);
          throw new Error('Failed to get user settings');
        }
      },

      update: async (settingsData) => {
        try {
          this.validateSettings(settingsData);
          
          const processedSettings = {
            ...settingsData,
            hidden_hours: Array.isArray(settingsData.hidden_hours) 
              ? JSON.stringify(settingsData.hidden_hours)
              : settingsData.hidden_hours,
            sound_settings: settingsData.sound_settings 
              ? JSON.stringify(settingsData.sound_settings)
              : null,
            updated_at: new Date().toISOString()
          };

          // Check if settings exist
          const existingSettings = await this.db.get('SELECT id FROM user_settings WHERE id = 1');
          
          if (existingSettings) {
            // Update existing settings
            const updateFields = [];
            const updateValues = [];
            
            Object.keys(processedSettings).forEach(key => {
              if (processedSettings[key] !== undefined) {
                updateFields.push(`${key} = ?`);
                updateValues.push(processedSettings[key]);
              }
            });
            
            if (updateFields.length > 0) {
              const updateQuery = `UPDATE user_settings SET ${updateFields.join(', ')} WHERE id = 1`;
              await this.db.run(updateQuery, updateValues);
            }
          } else {
            // Insert new settings
            const defaultSettings = {
              id: 1,
              start_hour: '12:00 AM',
              end_hour: '11:00 PM',
              hidden_hours: '[]',
              sound_settings: null,
              ...processedSettings
            };
            
            const insertFields = Object.keys(defaultSettings);
            const insertValues = Object.values(defaultSettings);
            const placeholders = insertFields.map(() => '?').join(', ');
            
            const insertQuery = `INSERT INTO user_settings (${insertFields.join(', ')}) VALUES (${placeholders})`;
            await this.db.run(insertQuery, insertValues);
          }
          
          // Return updated settings
          const updatedSettings = await this.db.get('SELECT * FROM user_settings WHERE id = 1');
          return {
            success: true,
            message: 'Settings updated successfully',
            settings: this.parseSettings(updatedSettings)
          };
        } catch (error) {
          console.error('Error updating user settings:', error);
          throw error;
        }
      }
    };
  }

  async createDefaultSettings() {
    const defaultSettings = {
      id: 1,
      start_hour: '12:00 AM',
      end_hour: '11:00 PM',
      hidden_hours: '[]',
      sound_settings: JSON.stringify({
        enabled: true,
        volume: 0.7,
        reminderSound: 'default',
        taskSound: 'default'
      })
    };

    await this.db.run(`
      INSERT INTO user_settings (id, start_hour, end_hour, hidden_hours, sound_settings)
      VALUES (?, ?, ?, ?, ?)
    `, [
      defaultSettings.id,
      defaultSettings.start_hour, 
      defaultSettings.end_hour, 
      defaultSettings.hidden_hours,
      defaultSettings.sound_settings
    ]);

    return this.parseSettings(defaultSettings);
  }

  // Fix for your SettingsService.js parseSettings method
  // Replace the parseSettings method in your settingsService.js with this:

  parseSettings(settings) {
    let parsedSoundSettings;
    
    try {
      // Handle different cases for sound_settings
      if (settings.sound_settings === null || settings.sound_settings === undefined || settings.sound_settings === '') {
        // Default sound settings if none exist
        parsedSoundSettings = {
          enabled: true,
          volume: 0.7,
          reminderSound: 'default',
          taskSound: 'default'
        };
      } else if (typeof settings.sound_settings === 'string') {
        // Parse JSON string
        parsedSoundSettings = JSON.parse(settings.sound_settings);
      } else {
        // Already an object
        parsedSoundSettings = settings.sound_settings;
      }
    } catch (error) {
      console.error('Error parsing sound_settings:', error);
      // Fallback to default if parsing fails
      parsedSoundSettings = {
        enabled: true,
        volume: 0.7,
        reminderSound: 'default',
        taskSound: 'default'
      };
    }

    let parsedHiddenHours;
    
    try {
      // Handle different cases for hidden_hours
      if (settings.hidden_hours === null || settings.hidden_hours === undefined || settings.hidden_hours === '') {
        parsedHiddenHours = [];
      } else if (typeof settings.hidden_hours === 'string') {
        parsedHiddenHours = JSON.parse(settings.hidden_hours);
      } else if (Array.isArray(settings.hidden_hours)) {
        parsedHiddenHours = settings.hidden_hours;
      } else {
        parsedHiddenHours = [];
      }
    } catch (error) {
      console.error('Error parsing hidden_hours:', error);
      parsedHiddenHours = [];
    }

    return {
      ...settings,
      hidden_hours: parsedHiddenHours,
      sound_settings: parsedSoundSettings
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