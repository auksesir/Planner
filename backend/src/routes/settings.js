const express = require('express');
const router = express.Router();
const { 
  validate,
  settingsValidation 
} = require('../middleware/validation');

module.exports = (settingsController) => {
  // User settings routes
  router.get('/', settingsController.userSettings.get);
  router.put('/', validate(settingsValidation), settingsController.userSettings.update);

  return router;
};