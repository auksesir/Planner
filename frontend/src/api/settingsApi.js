// api/settingsApi.js
// User settings API calls

import { apiGet, apiPut, defaultApiErrorHandler, handleApiResponse } from '../utils/apiUtils';

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3001/routes'
  : 'http://localhost:3001/routes';

/**
 * Settings API operations
 * Handles user settings management
 */
export const settingsApi = {
  /**
   * Get user settings
   * @returns {Promise<Object>} - User settings object
   * @returns {Promise<Object>} settings - Settings object
   * @returns {string} settings.start_hour - Start hour preference (e.g., "12:00 AM")
   * @returns {string} settings.end_hour - End hour preference (e.g., "11:00 PM")
   * @returns {Array<string>} settings.hidden_hours - Array of hidden hour strings
   * @returns {Object} settings.sound_settings - Sound preferences
   * @returns {boolean} settings.sound_settings.enabled - Whether sounds are enabled
   * @returns {number} settings.sound_settings.volume - Volume level (0-1)
   * @returns {string} settings.sound_settings.reminderSound - Reminder sound type
   * @returns {string} settings.sound_settings.taskSound - Task sound type
   */
  getUserSettings: async () => {
    try {
      const response = await apiGet(`${API_BASE_URL}/settings`);
      
      return handleApiResponse(
        response,
        (settings) => {
          // Ensure hidden_hours is always an array
          const processedSettings = {
            ...settings,
            hidden_hours: Array.isArray(settings.hidden_hours) ? 
              settings.hidden_hours : 
              (typeof settings.hidden_hours === 'string' ? 
                JSON.parse(settings.hidden_hours || '[]') : 
                []
              ),
            // Ensure sound_settings has default structure
            sound_settings: {
              enabled: true,
              volume: 0.7,
              reminderSound: 'default',
              taskSound: 'default',
              ...(settings.sound_settings || {})
            },
            // Provide defaults for time settings
            start_hour: settings.start_hour || '12:00 AM',
            end_hour: settings.end_hour || '11:00 PM',
            created_at: settings.created_at ? new Date(settings.created_at) : null,
            updated_at: settings.updated_at ? new Date(settings.updated_at) : null
          };
          
          return processedSettings;
        },
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to fetch user settings',
        originalError: error
      });
    }
  },

  /**
   * Update user settings
   * @param {Object} settingsData - Settings data to update
   * @param {string} [settingsData.start_hour] - Start hour preference
   * @param {string} [settingsData.end_hour] - End hour preference
   * @param {Array<string>} [settingsData.hidden_hours] - Array of hours to hide
   * @param {Object} [settingsData.sound_settings] - Sound preferences
   * @param {boolean} [settingsData.sound_settings.enabled] - Enable/disable sounds
   * @param {number} [settingsData.sound_settings.volume] - Volume level (0-1)
   * @param {string} [settingsData.sound_settings.reminderSound] - Reminder sound type
   * @param {string} [settingsData.sound_settings.taskSound] - Task sound type
   * @returns {Promise<Object>} - Update response with new settings
   */
  updateUserSettings: async (settingsData) => {
    try {
      // Prepare settings data for backend
      const processedSettingsData = {
        ...settingsData,
        // Ensure hidden_hours is stored as JSON string if it's an array
        hidden_hours: Array.isArray(settingsData.hidden_hours) ? 
          JSON.stringify(settingsData.hidden_hours) : 
          settingsData.hidden_hours,
        // Ensure sound_settings is properly structured
        sound_settings: settingsData.sound_settings ? {
          enabled: settingsData.sound_settings.enabled !== undefined ? 
            settingsData.sound_settings.enabled : true,
          volume: settingsData.sound_settings.volume !== undefined ? 
            Math.max(0, Math.min(1, settingsData.sound_settings.volume)) : 0.7,
          reminderSound: settingsData.sound_settings.reminderSound || 'default',
          taskSound: settingsData.sound_settings.taskSound || 'default'
        } : undefined
      };

      const response = await apiPut(`${API_BASE_URL}/settings`, processedSettingsData);
      
      return handleApiResponse(
        response,
        (data) => {
          // Process the returned data in the same way as getUserSettings
          return {
            ...data,
            hidden_hours: Array.isArray(data.hidden_hours) ? 
              data.hidden_hours : 
              (typeof data.hidden_hours === 'string' ? 
                JSON.parse(data.hidden_hours || '[]') : 
                []
              ),
            sound_settings: {
              enabled: true,
              volume: 0.7,
              reminderSound: 'default',
              taskSound: 'default',
              ...(data.sound_settings || {})
            },
            updated_at: data.updated_at ? new Date(data.updated_at) : null
          };
        },
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to update user settings',
        originalError: error
      });
    }
  },

  /**
   * Reset user settings to defaults
   * @returns {Promise<Object>} - Reset response
   */
  resetUserSettings: async () => {
    try {
      const defaultSettings = {
        start_hour: '12:00 AM',
        end_hour: '11:00 PM',
        hidden_hours: [],
        sound_settings: {
          enabled: true,
          volume: 0.7,
          reminderSound: 'default',
          taskSound: 'default'
        }
      };

      return await settingsApi.updateUserSettings(defaultSettings);
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to reset user settings',
        originalError: error
      });
    }
  },

  /**
   * Update only sound settings
   * @param {Object} soundSettings - Sound settings to update
   * @returns {Promise<Object>} - Update response
   */
  updateSoundSettings: async (soundSettings) => {
    try {
      // Get current settings first
      const currentSettings = await settingsApi.getUserSettings();
      
      if (currentSettings.error) {
        return currentSettings;
      }

      // Update only sound settings
      const updatedSettings = {
        ...currentSettings,
        sound_settings: {
          ...currentSettings.sound_settings,
          ...soundSettings
        }
      };

      return await settingsApi.updateUserSettings(updatedSettings);
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to update sound settings',
        originalError: error
      });
    }
  },

  /**
   * Update only time slot settings
   * @param {Object} timeSettings - Time settings to update
   * @returns {Promise<Object>} - Update response
   */
  updateTimeSettings: async (timeSettings) => {
    try {
      // Get current settings first
      const currentSettings = await settingsApi.getUserSettings();
      
      if (currentSettings.error) {
        return currentSettings;
      }

      // Update only time-related settings
      const updatedSettings = {
        ...currentSettings,
        start_hour: timeSettings.start_hour || currentSettings.start_hour,
        end_hour: timeSettings.end_hour || currentSettings.end_hour,
        hidden_hours: timeSettings.hidden_hours !== undefined ? 
          timeSettings.hidden_hours : 
          currentSettings.hidden_hours
      };

      return await settingsApi.updateUserSettings(updatedSettings);
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to update time settings',
        originalError: error
      });
    }
  }
};

// Legacy function names for backward compatibility
export const getUserSettings = settingsApi.getUserSettings;
export const updateUserSettings = settingsApi.updateUserSettings;