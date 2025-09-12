const request = require('supertest');
const express = require('express');
const createReminderRouter = require('../../routes/reminders');
const reminderController = require('../../controllers/reminderController');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

let app;
let db;
let testReminderId;

// Helper function to format dates in yyyy-MM-dd format for database storage
const formatDateForDB = (date) => {
  if (!date) return null;
  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Updated helper to create reminder with proper date formats
const createBaseReminder = (name, selectedTime, repeatOption = '', repeatEndDay = null) => {
  const selectedDay = '2023-07-20';
  
  return {
    name,
    // Use yyyy-MM-dd format for date fields
    selectedDay,
    selectedTime: new Date(`2023-07-20T${selectedTime}:00.000Z`).toISOString(),
    repeatOption,
    repeatEndDay: repeatEndDay ? formatDateForDB(repeatEndDay) : null,
    currentDay: formatDateForDB(new Date()),
    selectedDayUI: selectedDay
  };
};

beforeAll(async () => {
  db = await open({
    filename: ':memory:',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      selectedDay TEXT,
      originalStartDay TEXT,
      selectedTime TEXT,
      repeatOption TEXT,
      repeatEndDay TEXT,
      skipDates TEXT
    )
  `);

  // Insert test data using yyyy-MM-dd format for date fields
  await db.run(`
    INSERT INTO reminders (name, selectedDay, originalStartDay, selectedTime, repeatOption, repeatEndDay, skipDates)
    VALUES ('Daily Reminder', '2023-07-20', '2023-07-20', '2023-07-20T09:00:00.000Z', 'daily', '2023-07-25', '[]')`
  );

  const controller = reminderController(db);
  const reminderRouter = createReminderRouter(controller);

  app = express();
  app.use(express.json());
  app.use('/', reminderRouter);
});

afterAll(async () => {
  await db.close();
});

describe('Reminder Controller', () => {
  test('POST /add should create a new reminder', async () => {
    const reminderData = createBaseReminder('New Test Reminder', '08:00');

    const res = await request(app)
      .post('/add')
      .send(reminderData);

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Reminder added successfully');
    expect(res.body).toHaveProperty('id');
  });

  test('GET /date/:date should return reminders for a specific day', async () => {
    // Clear any test data first
    await db.run('DELETE FROM reminders');
    
    // Re-insert the expected test data
    await db.run(`
      INSERT INTO reminders (name, selectedDay, originalStartDay, selectedTime, repeatOption, repeatEndDay, skipDates)
      VALUES ('Daily Reminder', '2023-07-20', '2023-07-20', '2023-07-20T09:00:00.000Z', 'daily', '2023-07-25', '[]')
    `);
  
    const res = await request(app).get('/date/2023-07-20');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].name).toBe('Daily Reminder');
  });

  test('DELETE /id/:id should add a date to skipDates for a repeating reminder', async () => {
    // First create a reminder to delete
    const reminderData = createBaseReminder('Test Delete Reminder', '10:00', 'daily', '2023-07-25');
    
    const createRes = await request(app)
      .post('/add')
      .send(reminderData);

    expect(createRes.statusCode).toBe(201);
    const newReminderId = createRes.body.id;

    const res = await request(app)
      .delete(`/id/${newReminderId}`)
      .query({ deleteAll: 'false', date: '2023-07-22' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Single instance of the repeating reminder deleted successfully');
    
    const updatedReminder = await db.get('SELECT * FROM reminders WHERE id = ?', [newReminderId]);
    const skipDates = JSON.parse(updatedReminder.skipDates);
    expect(skipDates).toContain('2023-07-22');
  });

  test('GET /date/:date should not return skipped instances', async () => {
    const reminderData = createBaseReminder('Test Skip Reminder', '10:00', 'daily', '2023-07-25');
    const createRes = await request(app)
      .post('/add')
      .send(reminderData);

    // Skip an instance
    await request(app)
      .delete(`/id/${createRes.body.id}`)
      .query({ deleteAll: 'false', date: '2023-07-22' });

    const res = await request(app).get('/date/2023-07-22');
    expect(res.statusCode).toBe(200);
    const reminders = res.body;
    expect(reminders.some(reminder => reminder.id === createRes.body.id)).toBe(false);
  });

  test('DELETE /id/:id should delete all instances of a repeating reminder', async () => {
    const reminderData = createBaseReminder('Test Delete All Reminder', '10:00', 'daily', '2023-07-25');
    
    const createRes = await request(app)
      .post('/add')
      .send(reminderData);

    const newReminderId = createRes.body.id;

    const res = await request(app)
      .delete(`/id/${newReminderId}`)
      .query({ deleteAll: 'true' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('All instances of the repeating reminder deleted successfully');

    const deletedReminder = await db.get('SELECT * FROM reminders WHERE id = ?', [newReminderId]);
    expect(deletedReminder).toBeUndefined();
  });

  test('PUT /id/:id should update a reminder successfully', async () => {
    const createRes = await request(app)
      .post('/add')
      .send(createBaseReminder('Test Reminder', '10:00'));

    const updatedData = {
      name: 'Updated Reminder',
      selectedDay: '2023-07-20',
      selectedTime: new Date('2023-07-20T10:00:00.000Z').toISOString(),
      repeatOption: '',
      repeatEndDay: null,
      currentDay: formatDateForDB(new Date()),
      selectedDayUI: '2023-07-20'
    };

    const res = await request(app)
      .put(`/id/${createRes.body.id}`)
      .send(updatedData);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Reminder updated successfully');
  });

  test('PUT /id/:id should update a repeating reminder successfully', async () => {
    const createData = createBaseReminder('Test Reminder', '10:00', 'daily', '2023-07-25');

    const createRes = await request(app)
      .post('/add')
      .send(createData);

    const updatedData = {
      name: 'Updated Repeating Reminder',
      selectedDay: '2023-07-20',
      selectedTime: new Date('2023-07-20T10:00:00.000Z').toISOString(),
      repeatOption: 'daily',
      repeatEndDay: '2023-07-25',
      currentDay: formatDateForDB(new Date()),
      selectedDayUI: '2023-07-20'
    };

    const res = await request(app)
      .put(`/id/${createRes.body.id}`)
      .send(updatedData);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Reminder updated successfully');
  });

  

  
  

  test('GET /date/:date should return reminders sorted by time', async () => {
    await request(app).post('/add').send(createBaseReminder('Later Reminder', '14:00'));
    await request(app).post('/add').send(createBaseReminder('Earlier Reminder', '09:00'));

    const res = await request(app).get('/date/2023-07-20');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    // Check that reminders are sorted by time
    const times = res.body.map(r => new Date(r.selectedTime).getTime());
    const sortedTimes = [...times].sort((a, b) => a - b);
    expect(times).toEqual(sortedTimes);
  });
});

describe('Reminder Edge Cases', () => {
  test('GET /date/:date should handle date with no reminders', async () => {
    // Clear all reminders first
    await db.run('DELETE FROM reminders');
    
    const res = await request(app).get('/date/2023-06-01');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('PUT /id/:id should handle non-existent reminder', async () => {
    const res = await request(app)
      .put('/id/9999')
      .send({
        name: 'Updated Name',
        selectedDay: '2023-07-20',
        selectedTime: new Date('2023-07-20T10:00:00.000Z').toISOString(),
        repeatOption: '',
        repeatEndDay: null
      });
      
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Reminder not found');
  });

  test('DELETE /id/:id should handle non-existent reminder', async () => {
    const res = await request(app)
      .delete('/id/9999')
      .query({ deleteAll: 'true' });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Reminder not found');
  });

  test('GET /latest should handle empty database', async () => {
    await db.run('DELETE FROM reminders');
    
    const res = await request(app).get('/latest');

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('No reminders found');
  });

  
  test('Should handle reminders at midnight', async () => {
    const midnightReminder = createBaseReminder('Midnight Reminder', '00:00');
    const res = await request(app).post('/add').send(midnightReminder);
    expect(res.statusCode).toBe(201);
  });
});

describe('Boundary Cases', () => {
  beforeEach(async () => {
    await db.run('DELETE FROM reminders');
  });

  test('Should handle adding a reminder one day after the repeat end day of an existing reminder', async () => {
    await request(app).post('/add').send(createBaseReminder('Existing Repeating Reminder', '09:00', 'daily', '2023-07-25'));
    
    const newReminder = createBaseReminder('New Reminder', '09:00');
    newReminder.selectedDay = '2023-07-26';
    newReminder.selectedTime = new Date('2023-07-26T09:00:00.000Z').toISOString();
    
    const res = await request(app).post('/add').send(newReminder);
    expect(res.statusCode).toBe(201);
  });

  test('Should handle yearly repeating reminders', async () => {
    const yearlyReminder = createBaseReminder('Yearly Reminder', '10:00', 'yearly', '2024-07-20');
    const res = await request(app).post('/add').send(yearlyReminder);
    expect(res.statusCode).toBe(201);

    // Check that the reminder appears on the same day next year
    const nextYearRes = await request(app).get('/date/2024-07-20');
    expect(nextYearRes.statusCode).toBe(200);
    expect(nextYearRes.body.some(r => r.name === 'Yearly Reminder')).toBe(true);
  });

  test('Should handle reminders at the start of a month', async () => {
    const monthStartReminder = createBaseReminder('Month Start Reminder', '00:00');
    monthStartReminder.selectedDay = '2023-08-01';
    monthStartReminder.selectedTime = new Date('2023-08-01T00:00:00.000Z').toISOString();
    
    const res = await request(app).post('/add').send(monthStartReminder);
    expect(res.statusCode).toBe(201);
  });

  test('Should handle reminders at the end of a month', async () => {
    const monthEndReminder = createBaseReminder('Month End Reminder', '23:59');
    monthEndReminder.selectedDay = '2023-07-31';
    monthEndReminder.selectedTime = new Date('2023-07-31T23:59:00.000Z').toISOString();
    
    const res = await request(app).post('/add').send(monthEndReminder);
    expect(res.statusCode).toBe(201);
  });
});