// src/tests/services/pomodoroService.test.js

const PomodoroService = require('../../services/pomodoroService');
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');

describe('PomodoroService', () => {
  let db;
  let pomodoroService;
  
  // Setup test database
  beforeAll(async () => {
    db = await sqlite.open({
      filename: ':memory:',
      driver: sqlite3.Database
    });
    
    // Create test tables
    await db.exec(`
      CREATE TABLE pomodoro_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        work_duration INTEGER DEFAULT 25,
        break_duration INTEGER DEFAULT 5,
        auto_start_breaks BOOLEAN DEFAULT 1,
        sound_enabled BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await db.exec(`
      CREATE TABLE pomodoro_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        duration INTEGER NOT NULL,
        is_work BOOLEAN NOT NULL,
        is_completed BOOLEAN DEFAULT 0,
        task_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    pomodoroService = new PomodoroService(db);
  });
  
  // Clean up after tests
  afterAll(async () => {
    await db.close();
  });
  
  // Clean up after each test
  afterEach(async () => {
    // Clean up database
    await db.exec('DELETE FROM pomodoro_settings');
    await db.exec('DELETE FROM pomodoro_sessions');
  });
  
  // Test getting default settings
  test('getSettings should create default settings if none exist', async () => {
    const settings = await pomodoroService.getSettings();
    
    expect(settings).toEqual(expect.objectContaining({
      work_duration: 25,
      break_duration: 5,
      auto_start_breaks: 1,
      sound_enabled: 1
    }));
    
    // Should have created a record
    const settingsCount = await db.get('SELECT COUNT(*) as count FROM pomodoro_settings');
    expect(settingsCount.count).toBe(1);
  });
  
  // Test updating settings
  test('updateSettings should update existing settings', async () => {
    // First get default settings to ensure they exist
    await pomodoroService.getSettings();
    
    // Now update settings
    const updatedSettings = await pomodoroService.updateSettings({
      work_duration: 30,
      break_duration: 10,
      auto_start_breaks: 0
    });
    
    expect(updatedSettings).toEqual(expect.objectContaining({
      work_duration: 30,
      break_duration: 10,
      auto_start_breaks: 0,
      sound_enabled: 1 // Not changed
    }));
    
    // Still should have only one record
    const settingsCount = await db.get('SELECT COUNT(*) as count FROM pomodoro_settings');
    expect(settingsCount.count).toBe(1);
  });
  
  // Test partial update
  test('updateSettings should allow partial updates', async () => {
    // First get default settings to ensure they exist
    await pomodoroService.getSettings();
    
    // Now update only one setting
    const updatedSettings = await pomodoroService.updateSettings({
      work_duration: 40
    });
    
    expect(updatedSettings).toEqual(expect.objectContaining({
      work_duration: 40,
      break_duration: 5, // Default
      auto_start_breaks: 1, // Default
      sound_enabled: 1 // Default
    }));
  });
  
  // Test recording a session
  test('recordSession should save a Pomodoro session', async () => {
    const now = new Date();
    const startTime = new Date(now.getTime() - 25 * 60 * 1000); // 25 minutes ago
    
    const sessionData = {
      start_time: startTime.toISOString(),
      end_time: now.toISOString(),
      duration: 25 * 60, // 25 minutes in seconds
      is_work: true,
      is_completed: true,
      task_id: null
    };
    
    const result = await pomodoroService.recordSession(sessionData);
    
    expect(result).toEqual(expect.objectContaining({
      id: expect.any(Number),
      duration: 25 * 60,
      is_work: 1, // SQLite stores booleans as 0/1
      is_completed: 1
    }));
    
    // Check it was saved to the database
    const sessions = await db.all('SELECT * FROM pomodoro_sessions');
    expect(sessions).toHaveLength(1);
  });
});