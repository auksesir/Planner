// src/routes/pomodoro.js
const express = require('express');
const router = express.Router();
const { 
  validate,
  idValidation,
  pomodoroSettingsValidation,
  pomodoroSessionValidation
} = require('../middleware/validation');

module.exports = (pomodoroController) => {
  // Pomodoro settings routes
  router.get('/', pomodoroController.getSettings);
  router.put('/', validate(pomodoroSettingsValidation), pomodoroController.updateSettings);
  
  // Pomodoro session routes
  router.post('/sessions', validate(pomodoroSessionValidation), pomodoroController.recordSession);
  router.get('/sessions', pomodoroController.getSessions);
  router.delete('/sessions/:id', validate(idValidation('id')), pomodoroController.deleteSession);
  
  // Pomodoro stats route
  router.get('/stats', pomodoroController.getStats);
  
  return router;
};