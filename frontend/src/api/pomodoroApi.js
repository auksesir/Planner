// api/pomodoroApi.js
// Pomodoro timer API calls

import { apiDelete, apiGet, apiPost, apiPut, defaultApiErrorHandler, handleApiResponse } from '../utils/apiUtils';

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3001/routes'
  : 'http://localhost:3001/routes';

/**
 * Pomodoro API operations
 * Handles Pomodoro settings, sessions, and statistics
 * Includes proper date format conversions for backend compatibility
 */
export const pomodoroApi = {
  // Settings Operations
  getSettings: async () => {
    try {
      const response = await apiGet(`${API_BASE_URL}/pomodoro`);
      
      return handleApiResponse(
        response,
        (settings) => {
          // Provide defaults and ensure proper data types
          return {
            work_duration: settings.work_duration || 25,
            break_duration: settings.break_duration || 5,
            auto_start_breaks: settings.auto_start_breaks !== undefined ? 
              settings.auto_start_breaks : true,
            sound_enabled: settings.sound_enabled !== undefined ? 
              settings.sound_enabled : true,
            created_at: settings.created_at ? new Date(settings.created_at) : null,
            updated_at: settings.updated_at ? new Date(settings.updated_at) : null,
            ...settings
          };
        },
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to fetch Pomodoro settings',
        originalError: error
      });
    }
  },
  
  updateSettings: async (settingsData) => {
    try {
      // Validate and process settings data
      const processedSettings = {
        work_duration: Math.max(1, Math.min(120, settingsData.work_duration || 25)),
        break_duration: Math.max(1, Math.min(60, settingsData.break_duration || 5)),
        auto_start_breaks: settingsData.auto_start_breaks !== undefined ? 
          settingsData.auto_start_breaks : true,
        sound_enabled: settingsData.sound_enabled !== undefined ? 
          settingsData.sound_enabled : true,
        ...settingsData
      };

      const response = await apiPut(`${API_BASE_URL}/pomodoro`, processedSettings);
      
      return handleApiResponse(
        response,
        (data) => ({
          ...data,
          updated_at: data.updated_at ? new Date(data.updated_at) : null
        }),
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to update Pomodoro settings',
        originalError: error
      });
    }
  },

  // Session Operations
  recordSession: async (sessionData) => {
    try {
      const formattedSessionData = {
        start_time: sessionData.start_time instanceof Date ? 
          sessionData.start_time.toISOString() : 
          sessionData.start_time,
        end_time: sessionData.end_time instanceof Date ? 
          sessionData.end_time.toISOString() : 
          sessionData.end_time,
        duration: sessionData.duration || 0,
        is_work: sessionData.is_work !== undefined ? sessionData.is_work : true,
        is_completed: sessionData.is_completed !== undefined ? sessionData.is_completed : true,
        task_id: sessionData.task_id || null,
        ...sessionData
      };

      const response = await apiPost(`${API_BASE_URL}/pomodoro/sessions`, formattedSessionData);
      
      return handleApiResponse(
        response,
        (data) => ({
          ...data,
          start_time: data.start_time ? new Date(data.start_time) : null,
          end_time: data.end_time ? new Date(data.end_time) : null,
          created_at: data.created_at ? new Date(data.created_at) : null
        }),
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to record Pomodoro session',
        originalError: error
      });
    }
  },
  
  getSessions: async (params = {}) => {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (params.start_date) {
        queryParams.append('start_date', 
          params.start_date instanceof Date ? 
            params.start_date.toISOString().split('T')[0] : 
            params.start_date
        );
      }
      
      if (params.end_date) {
        queryParams.append('end_date', 
          params.end_date instanceof Date ? 
            params.end_date.toISOString().split('T')[0] : 
            params.end_date
        );
      }
      
      if (params.is_work !== undefined) {
        queryParams.append('is_work', String(params.is_work));
      }
      
      if (params.is_completed !== undefined) {
        queryParams.append('is_completed', String(params.is_completed));
      }
      
      if (params.task_id) {
        queryParams.append('task_id', String(params.task_id));
      }

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await apiGet(`${API_BASE_URL}/pomodoro/sessions${queryString}`);
      
      return handleApiResponse(
        response,
        (sessions) => {
          return sessions.map(session => ({
            ...session,
            start_time: session.start_time ? new Date(session.start_time) : null,
            end_time: session.end_time ? new Date(session.end_time) : null,
            created_at: session.created_at ? new Date(session.created_at) : null
          }));
        },
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to fetch Pomodoro sessions',
        originalError: error
      });
    }
  },
  
  deleteSession: async (id) => {
    try {
      const response = await apiDelete(`${API_BASE_URL}/pomodoro/sessions/${id}`);
      
      return handleApiResponse(
        response,
        (data) => data,
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to delete Pomodoro session',
        originalError: error
      });
    }
  },

  // Statistics Operations
  getStats: async (params = {}) => {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (params.start_date) {
        queryParams.append('start_date', 
          params.start_date instanceof Date ? 
            params.start_date.toISOString().split('T')[0] : 
            params.start_date
        );
      }
      
      if (params.end_date) {
        queryParams.append('end_date', 
          params.end_date instanceof Date ? 
            params.end_date.toISOString().split('T')[0] : 
            params.end_date
        );
      }
      
      if (params.group_by) {
        queryParams.append('group_by', params.group_by);
      }

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await apiGet(`${API_BASE_URL}/pomodoro/stats${queryString}`);
      
      return handleApiResponse(
        response,
        (stats) => {
          // Process stats data - convert any date strings to Date objects
          const processedStats = { ...stats };
          
          // If stats include daily/weekly breakdowns, process those dates
          if (stats.daily_breakdown) {
            processedStats.daily_breakdown = stats.daily_breakdown.map(day => ({
              ...day,
              date: day.date ? new Date(day.date) : null
            }));
          }
          
          if (stats.weekly_breakdown) {
            processedStats.weekly_breakdown = stats.weekly_breakdown.map(week => ({
              ...week,
              week_start: week.week_start ? new Date(week.week_start) : null,
              week_end: week.week_end ? new Date(week.week_end) : null
            }));
          }
          
          return processedStats;
        },
        defaultApiErrorHandler
      );
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to fetch Pomodoro statistics',
        originalError: error
      });
    }
  },

  // Additional helper methods
  getTodaysSessions: async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      return await pomodoroApi.getSessions({
        start_date: startOfDay,
        end_date: endOfDay
      });
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to fetch today\'s Pomodoro sessions',
        originalError: error
      });
    }
  },

  getWeeklyStats: async (weekStart = null) => {
    try {
      const start = weekStart || (() => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        return startOfWeek;
      })();
      
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      
      return await pomodoroApi.getStats({
        start_date: start,
        end_date: end,
        group_by: 'day'
      });
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to fetch weekly Pomodoro statistics',
        originalError: error
      });
    }
  },

  getMonthlyStats: async (monthStart = null) => {
    try {
      const start = monthStart || (() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1);
      })();
      
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      
      return await pomodoroApi.getStats({
        start_date: start,
        end_date: end,
        group_by: 'week'
      });
    } catch (error) {
      return defaultApiErrorHandler({
        message: 'Failed to fetch monthly Pomodoro statistics',
        originalError: error
      });
    }
  }
};

// Legacy function names for backward compatibility
export const getPomodoroSettings = pomodoroApi.getSettings;
export const updatePomodoroSettings = pomodoroApi.updateSettings;
export const recordPomodoroSession = pomodoroApi.recordSession;
export const getPomodoroSessions = pomodoroApi.getSessions;
export const deletePomodoroSession = pomodoroApi.deleteSession;
export const getPomodoroStats = pomodoroApi.getStats;