const request = require('supertest');
const express = require('express');
const createSettingsRouter = require('../../routes/settings');
const settingsController = require('../../controllers/settingsController');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

let app;
let db;

beforeAll(async () => {
  db = await open({
    filename: ':memory:',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY,
      start_hour TEXT NOT NULL DEFAULT '12:00 AM',
      end_hour TEXT NOT NULL DEFAULT '11:00 PM',
      hidden_hours TEXT DEFAULT '[]',
      sound_settings TEXT DEFAULT '{"enabled":true,"volume":0.7,"reminderSound":"reminder","taskSound":"task"}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const controller = settingsController(db);
  const settingsRouter = createSettingsRouter(controller);

  app = express();
  app.use(express.json());
  app.use('/', settingsRouter);
});

beforeEach(async () => {
  // Clear the table and insert test data
  await db.run('DELETE FROM user_settings');
  
  await db.run(`
    INSERT INTO user_settings (id, start_hour, end_hour, hidden_hours, sound_settings)
    VALUES (1, '12:00 AM', '11:00 PM', '[]', '{"enabled":true,"volume":0.7,"reminderSound":"reminder","taskSound":"task"}')`
  );
});

afterAll(async () => {
  await db.close();
});

describe('Settings Controller', () => {
  test('GET / should return user settings', async () => {
    const res = await request(app).get('/');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('start_hour', '12:00 AM');
    expect(res.body).toHaveProperty('end_hour', '11:00 PM');
    expect(res.body).toHaveProperty('hidden_hours');
    expect(Array.isArray(res.body.hidden_hours)).toBe(true);
    expect(res.body).toHaveProperty('sound_settings');
    expect(res.body.sound_settings).toHaveProperty('enabled', true);
    expect(res.body.sound_settings).toHaveProperty('volume', 0.7);
  });

  test('PUT / should update user settings', async () => {
    const updatedSettings = {
      start_hour: '08:00 AM',
      end_hour: '10:00 PM',
      hidden_hours: ['12:00 AM', '01:00 AM'],
      sound_settings: {
        enabled: false,
        volume: 0.5,
        reminderSound: 'custom',
        taskSound: 'custom'
      }
    };

    const res = await request(app)
      .put('/')
      .send(updatedSettings);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Settings updated successfully');
    expect(res.body.settings.start_hour).toBe('08:00 AM');
    expect(res.body.settings.end_hour).toBe('10:00 PM');
    expect(res.body.settings.hidden_hours).toEqual(['12:00 AM', '01:00 AM']);
    expect(res.body.settings.sound_settings.enabled).toBe(false);
    expect(res.body.settings.sound_settings.volume).toBe(0.5);
    expect(res.body.settings.sound_settings.reminderSound).toBe('custom');
    expect(res.body.settings.sound_settings.taskSound).toBe('custom');
  });


  test('PUT / should handle partial updates', async () => {
    const partialUpdate = {
      start_hour: '09:00 AM'
    };

    const res = await request(app)
      .put('/')
      .send(partialUpdate);

    expect(res.statusCode).toBe(200);
    expect(res.body.settings.start_hour).toBe('09:00 AM');
    expect(res.body.settings.end_hour).toBe('11:00 PM'); // Unchanged
    expect(Array.isArray(res.body.settings.hidden_hours)).toBe(true);
  });

  test('GET / should create default settings if none exist', async () => {
    // Delete all settings
    await db.run('DELETE FROM user_settings');
    
    const res = await request(app).get('/');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('start_hour', '12:00 AM');
    expect(res.body).toHaveProperty('end_hour', '11:00 PM');
    expect(res.body).toHaveProperty('hidden_hours');
    expect(Array.isArray(res.body.hidden_hours)).toBe(true);
  });
});