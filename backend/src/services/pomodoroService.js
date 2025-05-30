// src/services/pomodoroService.js

class PomodoroService {
    constructor(db) {
      this.db = db;
    }
  
    async getSettings() {
      try {
        // First check if any settings exist
        let settings = await this.db.get('SELECT * FROM pomodoro_settings LIMIT 1');
        
        // If no settings exist, create default ones
        if (!settings) {
          const result = await this.db.run(`
            INSERT INTO pomodoro_settings 
              (work_duration, break_duration, auto_start_breaks, sound_enabled) 
            VALUES 
              (25, 5, 1, 1)
          `);
          
          settings = await this.db.get('SELECT * FROM pomodoro_settings WHERE id = ?', [result.lastID]);
        }
        
        return settings;
      } catch (error) {
        console.error('Error getting Pomodoro settings:', error);
        throw new Error('Failed to get Pomodoro settings');
      }
    }
  
    async updateSettings(settingsData) {
      try {
        const { work_duration, break_duration, auto_start_breaks, sound_enabled } = settingsData;
        
        // Get existing settings
        const currentSettings = await this.getSettings();
        
        // Update settings
        await this.db.run(`
          UPDATE pomodoro_settings SET
            work_duration = COALESCE(?, work_duration),
            break_duration = COALESCE(?, break_duration),
            auto_start_breaks = COALESCE(?, auto_start_breaks),
            sound_enabled = COALESCE(?, sound_enabled),
            updated_at = datetime('now','localtime')
          WHERE id = ?
        `, [
          work_duration, 
          break_duration, 
          auto_start_breaks, 
          sound_enabled, 
          currentSettings.id
        ]);
        
        return await this.db.get('SELECT * FROM pomodoro_settings WHERE id = ?', [currentSettings.id]);
      } catch (error) {
        console.error('Error updating Pomodoro settings:', error);
        throw new Error('Failed to update Pomodoro settings');
      }
    }
  
    async recordSession(sessionData) {
      try {
        const { start_time, end_time, duration, is_work, is_completed, task_id } = sessionData;
        
        const result = await this.db.run(`
          INSERT INTO pomodoro_sessions 
            (start_time, end_time, duration, is_work, is_completed, task_id) 
          VALUES 
            (?, ?, ?, ?, ?, ?)
        `, [
          start_time,
          end_time,
          duration,
          is_work ? 1 : 0,
          is_completed ? 1 : 0,
          task_id || null
        ]);
        
        return await this.db.get('SELECT * FROM pomodoro_sessions WHERE id = ?', [result.lastID]);
      } catch (error) {
        console.error('Error recording Pomodoro session:', error);
        throw new Error('Failed to record Pomodoro session');
      }
    }
  
    async getSessions(options = {}) {
      try {
        const { limit, offset, start_date, end_date } = options;
        
        // Build query with optional filters
        let query = 'SELECT * FROM pomodoro_sessions';
        const params = [];
        
        // WHERE clause for date filtering
        if (start_date || end_date) {
          query += ' WHERE';
          
          if (start_date) {
            query += ' DATE(start_time) >= DATE(?)';
            params.push(start_date);
          }
          
          if (start_date && end_date) {
            query += ' AND';
          }
          
          if (end_date) {
            query += ' DATE(end_time) <= DATE(?)';
            params.push(end_date);
          }
        }
        
        // Order by start time descending (newest first)
        query += ' ORDER BY start_time DESC';
        
        // Add pagination
        if (limit) {
          query += ' LIMIT ?';
          params.push(parseInt(limit));
          
          if (offset) {
            query += ' OFFSET ?';
            params.push(parseInt(offset));
          }
        }
        
        const sessions = await this.db.all(query, params);
        
        // Get total count for pagination
        const countResult = await this.db.get('SELECT COUNT(*) as total FROM pomodoro_sessions');
        
        return {
          sessions,
          pagination: {
            total: countResult.total,
            limit: limit ? parseInt(limit) : null,
            offset: offset ? parseInt(offset) : 0
          }
        };
      } catch (error) {
        console.error('Error getting Pomodoro sessions:', error);
        throw new Error('Failed to get Pomodoro sessions');
      }
    }
  
    async deleteSession(sessionId) {
      try {
        // Check if session exists
        const session = await this.db.get('SELECT * FROM pomodoro_sessions WHERE id = ?', [sessionId]);
        if (!session) {
          throw new Error('Session not found');
        }
        
        await this.db.run('DELETE FROM pomodoro_sessions WHERE id = ?', [sessionId]);
        return { success: true };
      } catch (error) {
        console.error('Error deleting Pomodoro session:', error);
        throw error;
      }
    }
  
    async getStats(options = {}) {
      try {
        const { start_date, end_date } = options;
        
        // Build query with optional filters
        let query = `
          SELECT 
            DATE(start_time) as date,
            SUM(CASE WHEN is_work = 1 THEN duration ELSE 0 END) as work_seconds,
            SUM(CASE WHEN is_work = 0 THEN duration ELSE 0 END) as break_seconds,
            COUNT(CASE WHEN is_work = 1 THEN 1 END) as work_sessions,
            COUNT(CASE WHEN is_work = 0 THEN 1 END) as break_sessions
          FROM pomodoro_sessions
        `;
        
        const params = [];
        
        // WHERE clause for date filtering
        if (start_date || end_date) {
          query += ' WHERE';
          
          if (start_date) {
            query += ' DATE(start_time) >= DATE(?)';
            params.push(start_date);
          }
          
          if (start_date && end_date) {
            query += ' AND';
          }
          
          if (end_date) {
            query += ' DATE(end_time) <= DATE(?)';
            params.push(end_date);
          }
        }
        
        query += ' GROUP BY DATE(start_time) ORDER BY DATE(start_time) DESC';
        
        return await this.db.all(query, params);
      } catch (error) {
        console.error('Error getting Pomodoro stats:', error);
        throw new Error('Failed to get Pomodoro stats');
      }
    }
  }
  
  module.exports = PomodoroService;