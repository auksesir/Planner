const { app } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');

let db;

const initializeDatabase = async () => {
  try {
    // Always use the same database location
    const dbPath = 'database.sqlite';
    console.log('Using database at:', path.resolve(dbPath));
      
    db = await sqlite.open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

await db.exec(`
  CREATE TABLE IF NOT EXISTS pomodoro_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_duration INTEGER DEFAULT 25,
    break_duration INTEGER DEFAULT 5,
    auto_start_breaks BOOLEAN DEFAULT 1,
    sound_enabled BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT (datetime('now','localtime'))
  )
`);

await db.exec(`
  CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    duration INTEGER NOT NULL,
    is_work BOOLEAN NOT NULL,
    is_completed BOOLEAN DEFAULT 0,
    task_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE SET NULL
  )
`);

    // Create tasks table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
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

    // Create reminders table for general (non-task) reminders
    await db.exec(`
      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        selectedDay DATE,
        selectedTime DATETIME,
        repeatOption TEXT,
        repeatEndDay DATE,
        originalStartDay DATE,
        skipDates TEXT
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY,
        start_hour TEXT NOT NULL DEFAULT '12:00 AM',
        end_hour TEXT NOT NULL DEFAULT '11:00 PM',
        hidden_hours TEXT DEFAULT '[]',
        sound_settings TEXT DEFAULT '{"enabled":true,"volume":0.7,"reminderSound":"default","taskSound":"default"}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT (datetime('now','localtime'))
      )
    `);

    // Projects table for storing project information
    await db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        start_date TEXT,
        end_date TEXT,
        deadline TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Project nodes table for storing mind map structure
    // Update this line specifically:
    await db.run(`
      CREATE TABLE IF NOT EXISTS project_nodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        parent_node_id INTEGER,
        position_x REAL DEFAULT 100,
        position_y REAL DEFAULT 100,
        completion REAL DEFAULT 0,
        deadline TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        FOREIGN KEY (parent_node_id) REFERENCES project_nodes (id) ON DELETE SET NULL
      )
    `);

    

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Error initializing database:', error.message);
    throw error;
  }
};

module.exports = { 
  initializeDatabase,
  getDb: () => db
};