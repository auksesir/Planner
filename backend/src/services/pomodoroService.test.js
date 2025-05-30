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
  
  // Test getting sessions
  test('getSessions should retrieve all sessions', async () => {
    // Add a couple of sessions
    const now = new Date();
    
    // Work session
    await pomodoroService.recordSession({
      start_time: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      end_time: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      duration: 25 * 60,
      is_work: true,
      is_completed: true
    });
    
    // Break session
    await pomodoroService.recordSession({
      start_time: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      end_time: now.toISOString(),
      duration: 5 * 60,
      is_work: false,
      is_completed: true
    });
    
    const result = await pomodoroService.getSessions();
    
    expect(result.sessions).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    
    // First session should be the most recent (break)
    expect(result.sessions[0]).toEqual(expect.objectContaining({
      duration: 5 * 60,
      is_work: 0 // Break session
    }));
  });
  
  // Test date filtering
  test('getSessions should allow date filtering', async () => {
    // Add sessions on different days
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Yesterday session
    await pomodoroService.recordSession({
      start_time: yesterday.toISOString(),
      end_time: new Date(yesterday.getTime() + 25 * 60 * 1000).toISOString(),
      duration: 25 * 60,
      is_work: true,
      is_completed: true
    });
    
    // Today session
    await pomodoroService.recordSession({
      start_time: today.toISOString(),
      end_time: new Date(today.getTime() + 25 * 60 * 1000).toISOString(),
      duration: 25 * 60,
      is_work: true,
      is_completed: true
    });
    
    // Get just today's sessions
    const todayStr = today.toISOString().split('T')[0];
    const result = await pomodoroService.getSessions({
      start_date: todayStr,
      end_date: todayStr
    });
    
    expect(result.sessions).toHaveLength(1);
    
    // Should be the today session
    const sessionDate = new Date(result.sessions[0].start_time).toISOString().split('T')[0];
    expect(sessionDate).toBe(todayStr);
  });
  
  // Test pagination
  test('getSessions should support pagination', async () => {
    // Add 3 sessions
    const now = new Date();
    
    for (let i = 0; i < 3; i++) {
      await pomodoroService.recordSession({
        start_time: new Date(now.getTime() - (i + 1) * 30 * 60 * 1000).toISOString(),
        end_time: new Date(now.getTime() - i * 30 * 60 * 1000).toISOString(),
        duration: 25 * 60,
        is_work: true,
        is_completed: true
      });
    }
    
    // Get first page of 2 sessions
    const page1 = await pomodoroService.getSessions({
      limit: 2,
      offset: 0
    });
    
    expect(page1.sessions).toHaveLength(2);
    expect(page1.pagination).toEqual({
      total: 3,
      limit: 2,
      offset: 0
    });
    
    // Get second page (just 1 session)
    const page2 = await pomodoroService.getSessions({
      limit: 2,
      offset: 2
    });
    
    expect(page2.sessions).toHaveLength(1);
    expect(page2.pagination).toEqual({
      total: 3,
      limit: 2,
      offset: 2
    });
  });
  
  // Test deleting a session
  test('deleteSession should remove a session', async () => {
    // Add a session
    const session = await pomodoroService.recordSession({
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
      duration: 25 * 60,
      is_work: true,
      is_completed: true
    });
    
    // Delete it
    await pomodoroService.deleteSession(session.id);
    
    // Verify it's gone
    const sessions = await db.all('SELECT * FROM pomodoro_sessions');
    expect(sessions).toHaveLength(0);
  });
  
  // Test getting stats
  test('getStats should return aggregated session statistics', async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Add some work and break sessions
    // Work session 1 - 25 minutes
    await pomodoroService.recordSession({
      start_time: new Date(today.getTime() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      end_time: new Date(today.getTime() - 35 * 60 * 1000).toISOString(), // 35 minutes ago
      duration: 25 * 60, // 25 minutes
      is_work: true,
      is_completed: true
    });
    
    // Break session - 5 minutes
    await pomodoroService.recordSession({
      start_time: new Date(today.getTime() - 35 * 60 * 1000).toISOString(), // 35 minutes ago
      end_time: new Date(today.getTime() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      duration: 5 * 60, // 5 minutes
      is_work: false,
      is_completed: true
    });
    
    // Work session 2 - 25 minutes
    await pomodoroService.recordSession({
      start_time: new Date(today.getTime() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      end_time: new Date(today.getTime() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      duration: 25 * 60, // 25 minutes
      is_work: true,
      is_completed: true
    });
    
    const stats = await pomodoroService.getStats();
    
    expect(stats).toHaveLength(1); // One day of stats
    
    const todayStats = stats[0];
    expect(todayStats.date).toBe(todayStr);
    expect(todayStats.work_seconds).toBe(50 * 60); // 50 minutes (25+25)
    expect(todayStats.break_seconds).toBe(5 * 60); // 5 minutes
    expect(todayStats.work_sessions).toBe(2);
    expect(todayStats.break_sessions).toBe(1);
  });
});