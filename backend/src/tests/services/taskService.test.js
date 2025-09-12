const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const TaskService = require('../../services/taskService');
const dateUtils = require('../../utils/dateUtils');

describe('TaskService', () => {
  let db;
  let taskService;
  
  const createTestTask = async (data = {}) => {
    const defaultData = {
      name: 'Test Task',
      selectedDay: '2023-07-20',
      startTime: '2023-07-20T10:00:00Z',
      endTime: '2023-07-20T11:00:00Z',
      duration: 60,
      repeatOption: null,
      repeatEndDay: null,
      skipDates: '[]',
      originalStartDay: '2023-07-20'
    };
    
    const taskData = { ...defaultData, ...data };
    
    // Format dates consistently
    const formatDate = (date) => {
      if (!date) return null;
      if (date.includes('T')) return new Date(date).toISOString();
      return date; // Return date-only strings as-is
    };

    const result = await db.run(
      `INSERT INTO tasks (name, selectedDay, originalStartDay, startTime, endTime, duration, repeatOption, repeatEndDay, skipDates)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        taskData.name,
        taskData.selectedDay,
        taskData.originalStartDay || taskData.selectedDay,
        formatDate(taskData.startTime),
        formatDate(taskData.endTime),
        taskData.duration,
        taskData.repeatOption,
        taskData.repeatEndDay,
        taskData.skipDates
      ]
    );
    
    return await db.get('SELECT * FROM tasks WHERE id = ?', result.lastID);
  };

  beforeAll(async () => {
    db = await open({
      filename: ':memory:',
      driver: sqlite3.Database
    });
    
    await db.exec(`
      CREATE TABLE tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        selectedDay TEXT,
        originalStartDay TEXT,
        startTime TEXT,
        endTime TEXT,
        duration INTEGER,
        repeatOption TEXT,
        repeatEndDay TEXT,
        skipDates TEXT,
        reminderTime TEXT,
        hasReminder BOOLEAN DEFAULT 0
      )
    `);
    
    taskService = new TaskService(db);
  });
  
  beforeEach(async () => {
    await db.run('DELETE FROM tasks');
  });
  
  afterAll(async () => {
    await db.close();
  });


  describe('getById', () => {
    test('should return a task by ID', async () => {
      const testTask = await createTestTask();
      const task = await taskService.getById(testTask.id);
      expect(task).toBeDefined();
      expect(task.id).toBe(testTask.id);
    });
    
    test('should return undefined for non-existent ID', async () => {
      const task = await taskService.getById(999);
      expect(task).toBeUndefined();
    });
  });

  describe('getAll', () => {
    test('should return all tasks', async () => {
      await createTestTask({ name: 'Task 1' });
      await createTestTask({ name: 'Task 2' });
      
      const tasks = await taskService.getAll();
      expect(tasks).toHaveLength(2);
      expect(tasks.map(t => t.name)).toEqual(expect.arrayContaining(['Task 1', 'Task 2']));
    });
    
    test('should return empty array when no tasks exist', async () => {
      const tasks = await taskService.getAll();
      expect(tasks).toEqual([]);
    });
  });

  describe('create', () => {
    test('should create a new task with proper dates', async () => {
      const taskData = {
        name: 'New Task',
        selectedDay: '2023-07-21',
        startTime: '2023-07-21T09:00:00Z',
        endTime: '2023-07-21T10:00:00Z',
        duration: 60,
        currentDay: '2023-07-21',
        selectedDayUI: '2023-07-21'
      };
      
      const result = await taskService.create(taskData);
      const createdTask = await db.get('SELECT * FROM tasks WHERE id = ?', result.id);
      expect(createdTask.name).toBe('New Task');
      expect(createdTask.selectedDay).toBe('2023-07-21'); // Date-only format expected
    });
  });

  describe('update', () => {
    test('should update task with dates', async () => {
      const testTask = await createTestTask();
      
      const updateData = {
        name: 'Updated Task',
        selectedDay: '2023-07-22',
        startTime: '2023-07-22T11:00:00Z',
        endTime: '2023-07-22T12:00:00Z',
        duration: 60,
        currentDay: '2023-07-22',
        selectedDayUI: '2023-07-22',
        originalStartDay: '2023-07-20'
      };
      
      await taskService.update(testTask.id, updateData);
      const updatedTask = await db.get('SELECT * FROM tasks WHERE id = ?', testTask.id);
      expect(updatedTask.selectedDay).toBe('2023-07-22'); // Date-only format expected
    });
  });

  describe('getForDay', () => {
    test('should return tasks for UTC day', async () => {
      await createTestTask({
        selectedDay: '2023-07-20T00:00:00Z',
        startTime: '2023-07-20T10:00:00Z',
        endTime: '2023-07-20T11:00:00Z'
      });
      
      const tasks = await taskService.getForDay('2023-07-20T00:00:00Z');
      expect(tasks).toHaveLength(1);
      expect(tasks[0].name).toBe('Test Task');
    });

    test('should handle recurring tasks correctly', async () => {
      await createTestTask({
        selectedDay: '2023-07-19T00:00:00Z',
        repeatOption: 'daily',
        repeatEndDay: '2023-07-21T00:00:00Z'
      });
      
      const tasks = await taskService.getForDay('2023-07-20T00:00:00Z');
      expect(tasks).toHaveLength(1);
    });
  });

  describe('getForWeek', () => {
    test('should handle UTC week ranges', async () => {
      await createTestTask({ selectedDay: '2023-07-17T00:00:00Z' }); // Monday
      await createTestTask({ selectedDay: '2023-07-23T00:00:00Z' }); // Sunday
      
      const tasks = await taskService.getForWeek(
        '2023-07-17T00:00:00Z', 
        '2023-07-23T00:00:00Z'
      );
      expect(tasks).toHaveLength(2);
    });

    test('should include recurring tasks in range', async () => {
      await createTestTask({
        selectedDay: '2023-07-17T00:00:00Z',
        repeatOption: 'daily',
        repeatEndDay: '2023-07-19T00:00:00Z'
      });
      
      const tasks = await taskService.getForWeek(
        '2023-07-17T00:00:00Z',
        '2023-07-23T00:00:00Z'
      );
      expect(tasks.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('delete', () => {
    test('should handle dates for instance deletion', async () => {
      const recurringTask = await createTestTask({
        repeatOption: 'daily',
        repeatEndDay: '2023-07-25'
      });
      
      await taskService.delete(
        recurringTask.id, 
        false, 
        '2023-07-22'
      );
      
      const updatedTask = await db.get('SELECT * FROM tasks WHERE id = ?', recurringTask.id);
      expect(JSON.parse(updatedTask.skipDates)).toContain('2023-07-22'); // Date-only format expected
    });
  });

  describe('reminders', () => {
    test('should set reminder with time', async () => {
      const testTask = await createTestTask();
      const reminderTime = '2023-07-20T09:45:00Z';
      
      await taskService.reminders.set(testTask.id, reminderTime);
      const updatedTask = await db.get('SELECT * FROM tasks WHERE id = ?', testTask.id);
      // Match both formats (with or without milliseconds)
      expect(updatedTask.reminderTime).toMatch(/2023-07-20T09:45:00(\.000)?Z/);
    });
  });
});