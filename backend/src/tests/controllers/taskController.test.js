const request = require('supertest');
const express = require('express');
const createTaskRouter = require('../../routes/tasks');
const taskController = require('../../controllers/taskController');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

let app;
let db;
let taskId;

const createBaseTask = (name, startTime, endTime, repeatOption = '', repeatEndDay = null) => ({
  name,
  selectedDay: new Date('2023-07-20T00:00:00.000Z').toISOString(),
  startTime: new Date(`2023-07-20T${startTime}:00.000Z`).toISOString(),
  endTime: new Date(`2023-07-20T${endTime}:00.000Z`).toISOString(),
  duration: (new Date(`2023-07-20T${endTime}:00.000Z`) - new Date(`2023-07-20T${startTime}:00.000Z`)) / 60000,
  repeatOption,
  repeatEndDay: repeatEndDay ? new Date(repeatEndDay).toISOString() : null,
  currentDay: new Date().toISOString().split('T')[0],
  selectedDayUI: '2023-07-20'
});

beforeAll(async () => {
  db = await open({
    filename: ':memory:',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      selectedDay DATE,
      originalStartDay DATE,
      startTime DATETIME,
      endTime DATETIME,
      duration INTEGER,
      repeatOption TEXT,
      repeatEndDay DATE,
      skipDates TEXT,
      reminderTime DATETIME,
      hasReminder BOOLEAN DEFAULT 0
    )
  `);

  // Insert test data
  await db.run(`
    INSERT INTO tasks (name, selectedDay, startTime, endTime, duration, repeatOption, repeatEndDay, skipDates)
    VALUES 
    ('Daily Task', '2023-07-20', '2023-07-20T09:00:00.000Z', '2023-07-20T10:00:00.000Z', 60, 'daily', '2023-07-25', '[]'),
    ('Weekly Task', '2023-07-20', '2023-07-20T11:00:00.000Z', '2023-07-20T12:00:00.000Z', 60, 'weekly', '2023-08-20', '[]'),
    ('Monthly Task', '2023-07-20', '2023-07-20T13:00:00.000Z', '2023-07-20T14:00:00.000Z', 60, 'monthly', '2023-10-20', '[]'),
    ('Single Task', '2023-07-21', '2023-07-21T15:00:00.000Z', '2023-07-21T16:00:00.000Z', 60, '', null, '[]'),
    ('Task with Skip Dates', '2023-07-22', '2023-07-22T17:00:00.000Z', '2023-07-22T18:00:00.000Z', 60, 'daily', '2023-07-26', '["2023-07-24"]')
  `);

  // Create a task for testing deletion
  const taskData = {
    name: 'Test Repeating Task',
    selectedDay: new Date('2023-07-20T00:00:00.000Z').toISOString(),
    startTime: new Date('2023-07-20T10:00:00.000Z').toISOString(),
    endTime: new Date('2023-07-20T11:00:00.000Z').toISOString(),
    duration: 60,
    repeatOption: 'daily',
    repeatEndDay: new Date('2023-07-25T00:00:00.000Z').toISOString(),
    skipDates: '[]'
  };

  const result = await db.run(`
    INSERT INTO tasks (name, selectedDay, startTime, endTime, duration, repeatOption, repeatEndDay, skipDates)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [taskData.name, taskData.selectedDay, taskData.startTime, taskData.endTime, taskData.duration, taskData.repeatOption, taskData.repeatEndDay, taskData.skipDates]
  );

  taskId = result.lastID;

  const controller = taskController(db);
  const taskRouter = createTaskRouter(controller);

  app = express();
  app.use(express.json());
  app.use('/', taskRouter); // This should match your actual route setup
});

afterAll(async () => {
  await db.close();
});

describe('Task Controller', () => {
  test('POST /add should create a new task', async () => {
    const taskData = {
      name: 'New Test Task',
      selectedDay: new Date('2023-07-20T00:00:00.000Z').toISOString(),
      startTime: new Date('2023-07-20T08:00:00.000Z').toISOString(),
      endTime: new Date('2023-07-20T09:00:00.000Z').toISOString(),
      duration: 60,
      repeatOption: 'daily',
      repeatEndDay: new Date('2023-07-25T00:00:00.000Z').toISOString(),
      currentDay: new Date().toISOString().split('T')[0],
      selectedDayUI: '2023-07-20'
    };

    const res = await request(app)
      .post('/add')
      .send(taskData);

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Task added successfully');
  });

  test('POST /add should not create an overlapping task', async () => {
    const overlappingTaskData = {
      name: 'Overlapping Task',
      selectedDay: new Date('2023-07-20T00:00:00.000Z').toISOString(),
      startTime: new Date('2023-07-20T09:30:00.000Z').toISOString(),
      endTime: new Date('2023-07-20T10:30:00.000Z').toISOString(),
      duration: 60,
      repeatOption: 'daily',
      repeatEndDay: new Date('2023-07-25T00:00:00.000Z').toISOString(),
      currentDay: new Date().toISOString().split('T')[0],
      selectedDayUI: '2023-07-20'
    };

    const res = await request(app)
      .post('/add')
      .send(overlappingTaskData);

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe('This task overlaps with another task.'); // Fixed: matches controller
  });

  test('GET /date/:date should return tasks for a specific day', async () => {
    const res = await request(app).get('/date/2023-07-20');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].name).toBe('Daily Task');
  });

  test('DELETE /id/:id should add a date to skipDates for a repeating task', async () => {
    const res = await request(app)
      .delete(`/id/${taskId}`)
      .query({ deleteAll: 'false', date: '2023-07-22' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Single instance of the repeating task deleted successfully'); // Fixed: matches controller
    
    // Verify that the date was added to skipDates
    const updatedTask = await db.get('SELECT * FROM tasks WHERE id = ?', taskId);
    const skipDates = JSON.parse(updatedTask.skipDates);
    expect(skipDates).toContain('2023-07-22');
  });

  test('GET /date/:date should not return skipped instances', async () => {
    const res = await request(app).get('/date/2023-07-22');

    expect(res.statusCode).toBe(200);
    const tasks = res.body;
    expect(tasks.some(task => task.id === taskId)).toBe(false);
  });

  test('POST /add should create a task in a deleted repeating task instance slot', async () => {
    const newTaskData = {
      name: 'New Task in Deleted Slot',
      selectedDay: new Date('2023-07-22T00:00:00.000Z').toISOString(),
      startTime: new Date('2023-07-22T10:00:00.000Z').toISOString(),
      endTime: new Date('2023-07-22T11:00:00.000Z').toISOString(),
      duration: 60,
      repeatOption: '',
      repeatEndDay: null,
      currentDay: new Date().toISOString().split('T')[0],
      selectedDayUI: '2023-07-22'
    };

    const res = await request(app)
      .post('/add')
      .send(newTaskData);

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Task added successfully');
  });

  test('DELETE /id/:id should delete all instances of a repeating task', async () => {
    const res = await request(app)
      .delete(`/id/${taskId}`)
      .query({ deleteAll: 'true' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('All instances of the repeating task deleted successfully'); // Fixed: matches controller

    // Verify that the task was actually deleted
    const deletedTask = await db.get('SELECT * FROM tasks WHERE id = ?', taskId);
    expect(deletedTask).toBeUndefined();
  });

  test('GET /latest should return the latest task', async () => {
    const res = await request(app).get('/latest');

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('New Task in Deleted Slot');
  });
});

describe('Boundary Cases', () => {
  test('GET /date/:date should handle date with no tasks', async () => {
    const res = await request(app).get('/date/2023-06-01');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('PUT /id/:id should handle non-existent task', async () => {
    const res = await request(app)
      .put('/id/9999')
      .send({ 
        name: 'Updated Name',
        selectedDay: '2023-07-20T00:00:00.000Z',
        startTime: '2023-07-20T09:00:00.000Z',
        endTime: '2023-07-20T10:00:00.000Z',
        duration: 60
      }); // ✅ Include all required fields
    expect(res.statusCode).toBe(404); // Should be 404 as per controller logic
    expect(res.body.error).toBe('Task not found');
  });

  test('DELETE /id/:id should handle non-existent task', async () => {
    const res = await request(app)
      .delete('/id/9999')
      .query({ deleteAll: 'true' });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Task not found');
  });

  test('GET /latest should handle empty database', async () => {
    await db.run('DELETE FROM tasks');
    
    const res = await request(app).get('/latest');

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('No tasks found');
  });

  test('POST /add should handle invalid date formats', async () => {
    const invalidTaskData = {
      name: 'Invalid Date Task',
      selectedDay: 'invalid-date',
      startTime: 'invalid-time',
      endTime: 'invalid-time',
      duration: 60,
      repeatOption: '',
      repeatEndDay: null,
      currentDay: 'invalid-date',
      selectedDayUI: 'invalid-date'
    };

    const res = await request(app)
      .post('/add')
      .send(invalidTaskData);

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toBeDefined(); // ✅ Validation middleware returns "errors" array
    expect(res.body.errors.length).toBeGreaterThan(0); // ✅ Make sure there are validation errors
    expect(res.body.errors[0].msg).toContain('Valid'); // ✅ Check that error mentions validation
  });
});

describe('Comprehensive Task Overlap Tests', () => {
  beforeEach(async () => {
    // Clear the tasks table before each test
    await db.run('DELETE FROM tasks');
  });

  describe('Single Task Overlaps', () => {
    test('Should not add a task that starts during an existing task', async () => {
      await request(app).post('/add').send(createBaseTask('Existing Task', '09:00', '10:00'));
      const res = await request(app).post('/add').send(createBaseTask('Overlapping Task', '09:30', '10:30'));
      expect(res.statusCode).toBe(409);
    });

    test('Should not add a task that ends during an existing task', async () => {
      await request(app).post('/add').send(createBaseTask('Existing Task', '10:00', '11:00'));
      const res = await request(app).post('/add').send(createBaseTask('Overlapping Task', '09:30', '10:30'));
      expect(res.statusCode).toBe(409);
    });

    test('Should not add a task that encompasses an existing task', async () => {
      await request(app).post('/add').send(createBaseTask('Existing Task', '10:00', '11:00'));
      const res = await request(app).post('/add').send(createBaseTask('Overlapping Task', '09:00', '12:00'));
      expect(res.statusCode).toBe(409);
    });

    test('Should not add a task that is encompassed by an existing task', async () => {
      await request(app).post('/add').send(createBaseTask('Existing Task', '09:00', '12:00'));
      const res = await request(app).post('/add').send(createBaseTask('Overlapping Task', '10:00', '11:00'));
      expect(res.statusCode).toBe(409);
    });

    test('Should add a task that starts exactly when another ends', async () => {
      await request(app).post('/add').send(createBaseTask('Existing Task', '09:00', '10:00'));
      const res = await request(app).post('/add').send(createBaseTask('Non-overlapping Task', '10:00', '11:00'));
      expect(res.statusCode).toBe(201);
    });

    test('Should add a task that ends exactly when another starts', async () => {
      await request(app).post('/add').send(createBaseTask('Existing Task', '10:00', '11:00'));
      const res = await request(app).post('/add').send(createBaseTask('Non-overlapping Task', '09:00', '10:00'));
      expect(res.statusCode).toBe(201);
    });
  });

  describe('Repeating Task Overlaps', () => {
    test('Should not add a daily repeating task that overlaps with an existing daily task', async () => {
      await request(app).post('/add').send(createBaseTask('Existing Daily Task', '09:00', '10:00', 'daily', '2023-07-25'));
      const res = await request(app).post('/add').send(createBaseTask('Overlapping Daily Task', '09:30', '10:30', 'daily', '2023-07-25'));
      expect(res.statusCode).toBe(409);
    });

    test('Should not add a weekly repeating task that overlaps with an existing daily task', async () => {
      await request(app).post('/add').send(createBaseTask('Existing Daily Task', '09:00', '10:00', 'daily', '2023-08-20'));
      const res = await request(app).post('/add').send(createBaseTask('Overlapping Weekly Task', '09:30', '10:30', 'weekly', '2023-08-20'));
      expect(res.statusCode).toBe(409);
    });

    test('Should not add a monthly repeating task that overlaps with an existing weekly task', async () => {
      await request(app).post('/add').send(createBaseTask('Existing Weekly Task', '09:00', '10:00', 'weekly', '2023-09-20'));
      const res = await request(app).post('/add').send(createBaseTask('Overlapping Monthly Task', '09:30', '10:30', 'monthly', '2023-09-20'));
      expect(res.statusCode).toBe(409);
    });

    test('Should add a repeating task that starts after another repeating task ends', async () => {
      await request(app).post('/add').send(createBaseTask('Existing Daily Task', '09:00', '10:00', 'daily', '2023-07-25'));
      const res = await request(app).post('/add').send(createBaseTask('Non-overlapping Daily Task', '10:00', '11:00', 'daily', '2023-07-25'));
      expect(res.statusCode).toBe(201);
    });

    test('Should not add a single task that overlaps with a future instance of a repeating task', async () => {
      await request(app).post('/add').send(createBaseTask('Existing Daily Task', '09:00', '10:00', 'daily', '2023-07-25'));
      const futureTask = createBaseTask('Future Overlapping Task', '09:30', '10:30');
      futureTask.selectedDay = new Date('2023-07-22').toISOString();
      futureTask.startTime = new Date('2023-07-22T09:30:00.000Z').toISOString();
      futureTask.endTime = new Date('2023-07-22T10:30:00.000Z').toISOString();
      const res = await request(app).post('/add').send(futureTask);
      expect(res.statusCode).toBe(409);
    });

    test('Should add a task that occurs after the end date of a repeating task', async () => {
      await request(app).post('/add').send(createBaseTask('Existing Daily Task', '09:00', '10:00', 'daily', '2023-07-25'));
      const futureTask = createBaseTask('Future Non-overlapping Task', '09:00', '10:00');
      futureTask.selectedDay = new Date('2023-07-26').toISOString();
      futureTask.startTime = new Date('2023-07-26T09:00:00.000Z').toISOString();
      futureTask.endTime = new Date('2023-07-26T10:00:00.000Z').toISOString();
      const res = await request(app).post('/add').send(futureTask);
      expect(res.statusCode).toBe(201);
    });
  });
});

describe('Additional Edge Cases', () => {
  beforeEach(async () => {
    // Clear the tasks table before each test
    await db.run('DELETE FROM tasks');
  });

  test('Should handle adding a task one day after the repeat end day of an existing task', async () => {
    await request(app).post('/add').send(createBaseTask('Existing Repeating Task', '09:00', '10:00', 'daily', '2023-07-25'));
    const newTask = createBaseTask('New Task', '09:00', '10:00');
    newTask.selectedDay = new Date('2023-07-26').toISOString();
    newTask.startTime = new Date('2023-07-26T09:00:00.000Z').toISOString();
    newTask.endTime = new Date('2023-07-26T10:00:00.000Z').toISOString();
    const res = await request(app).post('/add').send(newTask);
    expect(res.statusCode).toBe(201);
  });

  test('Should handle adding a task that overlaps with multiple existing tasks', async () => {
    await request(app).post('/add').send(createBaseTask('Existing Task 1', '09:00', '10:00'));
    await request(app).post('/add').send(createBaseTask('Existing Task 2', '10:00', '11:00'));
    const overlappingTask = createBaseTask('Overlapping Task', '09:30', '10:30');
    const res = await request(app).post('/add').send(overlappingTask);
    expect(res.statusCode).toBe(409);
  });
});

describe('Repeating Task Deletion Scenarios', () => {
  let taskId;

  const addTask = async (taskData) => {
    const res = await request(app)
      .post('/add')
      .send(taskData);
    expect(res.statusCode).toBe(201);
    
    const latestTaskRes = await request(app).get('/latest');
    expect(latestTaskRes.statusCode).toBe(200);
    return latestTaskRes.body.id;
  };

  beforeEach(async () => {
    await db.run('DELETE FROM tasks');

    const repeatingTask = {
      name: 'Daily Repeating Task',
      selectedDay: '2023-07-01T00:00:00.000Z',
      startTime: '2023-07-01T09:00:00.000Z',
      endTime: '2023-07-01T10:00:00.000Z',
      duration: 60,
      repeatOption: 'daily',
      repeatEndDay: '2023-07-10T00:00:00.000Z',
      currentDay: '2023-07-01',
      selectedDayUI: '2023-07-01'
    };

    taskId = await addTask(repeatingTask);
  });

  test('Should handle single instance deletions', async () => {
    const deleteRes = await request(app)
      .delete(`/id/${taskId}`)
      .query({ deleteAll: 'false', date: '2023-07-05' });

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body).toHaveProperty('message');
    expect(typeof deleteRes.body.message).toBe('string');
  });

  test('Should handle attempting to delete an already deleted instance', async () => {
    // First deletion
    await request(app)
      .delete(`/id/${taskId}`)
      .query({ deleteAll: 'false', date: '2023-07-05' });

    // Attempt to delete the same instance again
    const secondDeleteRes = await request(app)
      .delete(`/id/${taskId}`)
      .query({ deleteAll: 'false', date: '2023-07-05' });

    expect(secondDeleteRes.statusCode).toBe(400);
    expect(secondDeleteRes.body).toHaveProperty('error');
    expect(typeof secondDeleteRes.body.error).toBe('string');
  });
});