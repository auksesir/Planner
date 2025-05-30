// src/controllers/pomodoroController.js

const ServiceFactory = require('../services/serviceFactory');

const pomodoroController = (db) => {
  const serviceFactory = new ServiceFactory(db);
  const pomodoroService = serviceFactory.getPomodoroService();
  
  // Get Pomodoro settings
  const getSettings = async (req, res) => {
    try {
      const settings = await pomodoroService.getSettings();
      return res.json(settings);
    } catch (error) {
      console.error('Error in getSettings:', error);
      return res.status(500).json({ error: 'Failed to get Pomodoro settings' });
    }
  };
  
  // Update Pomodoro settings
  const updateSettings = async (req, res) => {
    try {
      const { work_duration, break_duration, auto_start_breaks, sound_enabled } = req.body;
      
      // Validate inputs (additional validation)
      if (
        (work_duration !== undefined && (isNaN(work_duration) || work_duration < 1 || work_duration > 120)) ||
        (break_duration !== undefined && (isNaN(break_duration) || break_duration < 1 || break_duration > 60))
      ) {
        return res.status(400).json({ error: 'Invalid duration values' });
      }
      
      const updatedSettings = await pomodoroService.updateSettings(req.body);
      
      return res.json({ 
        message: 'Settings updated', 
        settings: updatedSettings 
      });
    } catch (error) {
      console.error('Error in updateSettings:', error);
      return res.status(500).json({ error: 'Failed to update Pomodoro settings' });
    }
  };
  
  // Record a Pomodoro session
  const recordSession = async (req, res) => {
    try {
      const { start_time, end_time, duration, is_work, is_completed, task_id } = req.body;
      
      // Additional validation
      if (!start_time || !end_time || !duration) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      if (isNaN(duration) || duration <= 0) {
        return res.status(400).json({ error: 'Duration must be a positive number' });
      }
      
      const session = await pomodoroService.recordSession(req.body);
      
      return res.status(201).json({ 
        message: 'Session recorded successfully', 
        session 
      });
    } catch (error) {
      console.error('Error in recordSession:', error);
      return res.status(500).json({ error: 'Failed to record Pomodoro session' });
    }
  };
  
  // Get Pomodoro session history
  const getSessions = async (req, res) => {
    try {
      const { limit, offset, start_date, end_date } = req.query;
      
      const result = await pomodoroService.getSessions({
        limit,
        offset,
        start_date,
        end_date
      });
      
      return res.json(result);
    } catch (error) {
      console.error('Error in getSessions:', error);
      return res.status(500).json({ error: 'Failed to get Pomodoro sessions' });
    }
  };
  
  // Delete a Pomodoro session
  const deleteSession = async (req, res) => {
    try {
      const { id } = req.params;
      
      await pomodoroService.deleteSession(id);
      
      return res.json({ message: 'Session deleted successfully' });
    } catch (error) {
      if (error.message === 'Session not found') {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      console.error('Error in deleteSession:', error);
      return res.status(500).json({ error: 'Failed to delete Pomodoro session' });
    }
  };
  
  // Get session stats grouped by day
  const getStats = async (req, res) => {
    try {
      const { start_date, end_date } = req.query;
      
      const stats = await pomodoroService.getStats({
        start_date,
        end_date
      });
      
      // Convert seconds to minutes for easier readability
      const formattedStats = stats.map(day => ({
        date: day.date,
        work_minutes: Math.round(day.work_seconds / 60),
        break_minutes: Math.round(day.break_seconds / 60),
        work_sessions: day.work_sessions,
        break_sessions: day.break_sessions,
        total_minutes: Math.round((day.work_seconds + day.break_seconds) / 60)
      }));
      
      return res.json({
        daily_stats: formattedStats
      });
    } catch (error) {
      console.error('Error in getStats:', error);
      return res.status(500).json({ error: 'Failed to get Pomodoro statistics' });
    }
  };
  
  return {
    getSettings,
    updateSettings,
    recordSession,
    getSessions,
    deleteSession,
    getStats
  };
};

module.exports = pomodoroController;