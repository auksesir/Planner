const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const SettingsService = require('./settingsService');

describe('SettingsService', () => {
  let db;
  let settingsService;

  beforeAll(async () => {
    // Set up an in-memory SQLite database for testing
    db = await open({
      filename: ':memory:',
      driver: sqlite3.Database
    });
    
    // Create the user_settings table
    await db.exec(`
      CREATE TABLE user_settings (
        id INTEGER PRIMARY KEY,
        start_hour TEXT NOT NULL DEFAULT '12:00 AM',
        end_hour TEXT NOT NULL DEFAULT '11:00 PM',
        hidden_hours TEXT DEFAULT '[]',
        sound_settings TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Initialize the SettingsService with the test database
    settingsService = new SettingsService(db);
  });
  
  beforeEach(async () => {
    // Clear the table before each test
    await db.run('DELETE FROM user_settings');
  });
  
  afterAll(async () => {
    // Close the database connection
    await db.close();
  });
  
  describe('userSettings.get', () => {
    test('should create default settings if none exist', async () => {
      // Ensure no settings exist
      const count = await db.get('SELECT COUNT(*) as count FROM user_settings');
      expect(count.count).toBe(0);
      
      // Get settings
      const settings = await settingsService.userSettings.get();
      
      // Check that default settings were created
      expect(settings).toBeDefined();
      expect(settings.start_hour).toBe('12:00 AM');
      expect(settings.end_hour).toBe('11:00 PM');
      expect(settings.hidden_hours).toEqual([]);
      
      // Verify settings were saved to the database
      const dbSettings = await db.get('SELECT * FROM user_settings WHERE id = 1');
      expect(dbSettings).toBeDefined();
    });
    
    test('should return existing settings', async () => {
      // Create settings in the database
      await db.run(`
        INSERT INTO user_settings (id, start_hour, end_hour, hidden_hours)
        VALUES (1, '09:00 AM', '05:00 PM', '["12:00 PM"]')
      `);
      
      // Get settings
      const settings = await settingsService.userSettings.get();
      
      // Check that the correct settings are returned
      expect(settings).toBeDefined();
      expect(settings.start_hour).toBe('09:00 AM');
      expect(settings.end_hour).toBe('05:00 PM');
      expect(settings.hidden_hours).toEqual(['12:00 PM']);
    });
    
    test('should parse sound settings correctly', async () => {
      // Create settings with sound settings in the database
      const soundSettings = {
        enabled: true,
        volume: 0.7,
        reminderSound: 'bell',
        taskSound: 'chime'
      };
      
      await db.run(`
        INSERT INTO user_settings (id, sound_settings)
        VALUES (1, ?)
      `, [JSON.stringify(soundSettings)]);
      
      // Get settings
      const settings = await settingsService.userSettings.get();
      
      // Check that sound settings are parsed correctly
      expect(settings.sound_settings).toEqual(soundSettings);
    });
    
    test('should handle missing sound settings', async () => {
      // Create settings without sound settings
      await db.run(`
        INSERT INTO user_settings (id, sound_settings)
        VALUES (1, NULL)
      `);
      
      // Get settings
      const settings = await settingsService.userSettings.get();
      
      // Check that default sound settings are provided
      expect(settings.sound_settings).toEqual({
        enabled: true,
        volume: 0.7,
        reminderSound: 'reminder',
        taskSound: 'task'
      });
    });
  });
  
  describe('userSettings.update', () => {
    test('should update existing settings', async () => {
      // Create default settings
      await settingsService.userSettings.get();
      
      // Update settings
      const updatedSettings = {
        start_hour: '09:00 AM',
        end_hour: '05:00 PM',
        hidden_hours: ['12:00 PM', '01:00 PM']
      };
      
      const result = await settingsService.userSettings.update(updatedSettings);
      
      // Check result message
      expect(result).toBeDefined();
      expect(result.message).toBe('Settings updated successfully');
      
      // Verify settings were updated in the database
      const dbSettings = await db.get('SELECT * FROM user_settings WHERE id = 1');
      expect(dbSettings.start_hour).toBe('09:00 AM');
      expect(dbSettings.end_hour).toBe('05:00 PM');
      expect(JSON.parse(dbSettings.hidden_hours)).toEqual(['12:00 PM', '01:00 PM']);
    });
    
    test('should validate time format', async () => {
      // Create default settings
      await settingsService.userSettings.get();
      
      // Try to update with invalid time format
      const invalidSettings = {
        start_hour: 'not a time',
        end_hour: '05:00 PM'
      };
      
      await expect(settingsService.userSettings.update(invalidSettings))
        .rejects
        .toThrow('Invalid start hour format');
      
      // Try another invalid format
      const invalidSettings2 = {
        start_hour: '09:00 AM',
        end_hour: '5 PM' // Missing leading zero
      };
      
      await expect(settingsService.userSettings.update(invalidSettings2))
        .rejects
        .toThrow('Invalid end hour format');
    });
    
    test('should validate hidden_hours is an array', async () => {
      // Create default settings
      await settingsService.userSettings.get();
      
      // Try to update with invalid hidden_hours format
      const invalidSettings = {
        hidden_hours: 'not an array'
      };
      
      await expect(settingsService.userSettings.update(invalidSettings))
        .rejects
        .toThrow('Hidden hours must be an array');
    });
    
    test('should update only provided fields', async () => {
      // Create settings in the database
      await db.run(`
        INSERT INTO user_settings (id, start_hour, end_hour, hidden_hours)
        VALUES (1, '09:00 AM', '05:00 PM', '["12:00 PM"]')
      `);
      
      // Update only start_hour
      const partialUpdate = {
        start_hour: '10:00 AM'
      };
      
      const result = await settingsService.userSettings.update(partialUpdate);
      
      // Check result
      expect(result).toBeDefined();
      expect(result.message).toBe('Settings updated successfully');
      
      // Verify only the specified field was updated
      const updatedSettings = await settingsService.userSettings.get();
      expect(updatedSettings.start_hour).toBe('10:00 AM');
      expect(updatedSettings.end_hour).toBe('05:00 PM'); // Unchanged
      expect(updatedSettings.hidden_hours).toEqual(['12:00 PM']); // Unchanged
    });
    
    test('should update sound settings', async () => {
      // Create default settings
      await settingsService.userSettings.get();
      
      // Update sound settings
      const newSoundSettings = {
        sound_settings: {
          enabled: false,
          volume: 0.5,
          reminderSound: 'custom',
          taskSound: 'beep'
        }
      };
      
      const result = await settingsService.userSettings.update(newSoundSettings);
      
      // Check result
      expect(result).toBeDefined();
      expect(result.message).toBe('Settings updated successfully');
      
      // Verify sound settings were updated
      const updatedSettings = await settingsService.userSettings.get();
      expect(updatedSettings.sound_settings).toEqual(newSoundSettings.sound_settings);
    });
  });
});