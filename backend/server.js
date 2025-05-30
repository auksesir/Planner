// server.js
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./src/db/database');
const tasksRouter = require('./src/routes/tasks');
const remindersRouter = require('./src/routes/reminders');
const settingsRouter = require('./src/routes/settings');
const projectsRouter = require('./src/routes/projects');
const pomodoroRouter = require('./src/routes/pomodoro'); // Add this line

(async () => {
  try {
    const db = await initializeDatabase();
    console.log('Database initialized successfully');

    const app = express();
    const PORT = process.env.PORT || 3001;

    app.use(cors({
      origin: '*', // Allow all origins in development
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Middleware
    app.use(express.json());

    // Add response headers middleware
    app.use((req, res, next) => {
      res.header('Content-Type', 'application/json');
      next();
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });

    // Controllers
    const taskControllerInstance = require('./src/controllers/taskController')(db);
    const reminderControllerInstance = require('./src/controllers/reminderController')(db);
    const settingsControllerInstance = require('./src/controllers/settingsController')(db);
    const projectControllerInstance = require('./src/controllers/projectController')(db);
    const pomodoroControllerInstance = require('./src/controllers/pomodoroController')(db); // Add this line

    // Routes
    app.use('/routes/tasks', tasksRouter(taskControllerInstance));
    app.use('/routes/reminders', remindersRouter(reminderControllerInstance));
    app.use('/routes/settings', settingsRouter(settingsControllerInstance));
    app.use('/routes/projects', projectsRouter(projectControllerInstance));
    app.use('/routes/pomodoro', pomodoroRouter(pomodoroControllerInstance)); // Add this line

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ error: 'Not Found' });
    });

    // Error handler
    app.use((err, req, res, next) => {
      console.error('Error:', err);
      
      // Ensure we're always sending JSON
      res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
      });
    });

    const server = app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log('Available endpoints:');
      console.log('- /routes/tasks/*');
      console.log('- /routes/reminders/*');
      console.log('- /routes/settings/*');
      console.log('- /routes/projects/*');
      console.log('- /routes/pomodoro/*'); // Add this line

      // Graceful shutdown
      process.on('SIGTERM', () => {
        console.log('SIGTERM received. Shutting down gracefully...');
        server.close(() => {
          console.log('Server closed');
          process.exit(0);
        });
      });
    });
  } catch (error) {
    console.error('Fatal error during startup:', error);
    process.exit(1);  // Exit on fatal startup errors
  }
})();

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});