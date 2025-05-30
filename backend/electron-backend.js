const express = require('express');
const { initializeDatabase, getDb } = require('./src/db/database');
const path = require('path');
const { app } = require('electron');

const startBackend = async () => {
  try {
    const expressApp = express();
    
    // Custom CORS middleware
    expressApp.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }
      
      next();
    });

    // Debug middleware to log all requests
    expressApp.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      next();
    });

    // Add a diagnostic endpoint
    expressApp.get('/debug/database', async (req, res) => {
      try {
        const db = getDb();
        const tables = ['tasks', 'reminders', 'projects', 'project_nodes'];
        const results = {};
        
        for (const table of tables) {
          results[table] = await db.all(`SELECT * FROM ${table}`);
        }
        
        res.json(results);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    expressApp.use(express.json());
    
    // Initialize database
    await initializeDatabase();
    
    // Get the database connection
    const db = getDb();
    
    // Determine base directory for controller and route paths
    const baseDir = path.join(__dirname);
    console.log('Base directory:', baseDir);
    
    // Set up your controllers with absolute paths
    const reminderController = require(path.join(baseDir, 'src', 'controllers', 'reminderController'))(db);
    const taskController = require(path.join(baseDir, 'src', 'controllers', 'taskController'))(db);
    const settingsController = require(path.join(baseDir, 'src', 'controllers', 'settingsController'))(db);
    const projectController = require(path.join(baseDir, 'src', 'controllers', 'projectController'))(db);
    
    // Set up your routes with absolute paths
    expressApp.use('/routes/reminders', require(path.join(baseDir, 'src', 'routes', 'reminders'))(reminderController));
    expressApp.use('/routes/tasks', require(path.join(baseDir, 'src', 'routes', 'tasks'))(taskController));
    expressApp.use('/routes/settings', require(path.join(baseDir, 'src', 'routes', 'settings'))(settingsController));
    expressApp.use('/routes/projects', require(path.join(baseDir, 'src', 'routes', 'projects'))(projectController));
    
    // Error handling middleware
    expressApp.use((err, req, res, next) => {
      console.error('Express error:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    });
    
    // Start the server
    const server = expressApp.listen(3001, () => {
      console.log('Backend server running on port 3001');
    });
    
    return server;
  } catch (error) {
    console.error('Error starting backend:', error);
    throw error;
  }
};

module.exports = { startBackend };