// src/tests/controllers/pomodoroController.test.js
const pomodoroController = require('./pomodoroController');

// Mock dependencies
jest.mock('../services/serviceFactory');
const ServiceFactory = require('../services/serviceFactory');

describe('pomodoroController', () => {
  // Setup mocks
  let mockDb;
  let mockPomodoroService;
  let mockServiceFactory;
  let controller;
  let req;
  let res;

  beforeEach(() => {
    // Create mock database
    mockDb = {};
    
    // Create mock pomodoro service with all required methods
    mockPomodoroService = {
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
      recordSession: jest.fn(),
      getSessions: jest.fn(),
      deleteSession: jest.fn(),
      getStats: jest.fn()
    };
    
    // Mock ServiceFactory to return our mock service
    mockServiceFactory = {
      getPomodoroService: jest.fn().mockReturnValue(mockPomodoroService)
    };
    
    ServiceFactory.mockImplementation(() => mockServiceFactory);
    
    // Create controller with mock database
    controller = pomodoroController(mockDb);
    
    // Setup mock request and response objects
    req = {
      params: {},
      body: {},
      query: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return pomodoro settings', async () => {
      // Setup
      const mockSettings = {
        id: 1,
        work_duration: 25,
        break_duration: 5,
        auto_start_breaks: true,
        sound_enabled: true
      };
      
      mockPomodoroService.getSettings.mockResolvedValue(mockSettings);
      
      // Execute
      await controller.getSettings(req, res);
      
      // Verify
      expect(mockPomodoroService.getSettings).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockSettings);
    });
    
    it('should handle errors', async () => {
      // Setup
      const error = new Error('Database error');
      mockPomodoroService.getSettings.mockRejectedValue(error);
      
      // Execute
      await controller.getSettings(req, res);
      
      // Verify
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to get Pomodoro settings' });
    });
  });

  describe('updateSettings', () => {
    it('should update pomodoro settings', async () => {
      // Setup
      req.body = {
        work_duration: 30,
        break_duration: 10,
        auto_start_breaks: false,
        sound_enabled: true
      };
      
      const mockUpdatedSettings = {
        id: 1,
        work_duration: 30,
        break_duration: 10,
        auto_start_breaks: false,
        sound_enabled: true
      };
      
      mockPomodoroService.updateSettings.mockResolvedValue(mockUpdatedSettings);
      
      // Execute
      await controller.updateSettings(req, res);
      
      // Verify
      expect(mockPomodoroService.updateSettings).toHaveBeenCalledWith(req.body);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Settings updated',
        settings: mockUpdatedSettings
      });
    });
    
    it('should validate input values', async () => {
      // Setup - invalid work_duration
      req.body = {
        work_duration: 150, // > 120 is invalid
        break_duration: 5
      };
      
      // Execute
      await controller.updateSettings(req, res);
      
      // Verify
      expect(mockPomodoroService.updateSettings).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid duration values' });
      
      // Reset
      jest.clearAllMocks();
      
      // Setup - invalid break_duration
      req.body = {
        work_duration: 25,
        break_duration: -5 // Negative is invalid
      };
      
      // Execute
      await controller.updateSettings(req, res);
      
      // Verify
      expect(mockPomodoroService.updateSettings).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid duration values' });
    });
    
    it('should handle service errors', async () => {
      // Setup
      req.body = {
        work_duration: 25,
        break_duration: 5
      };
      
      const error = new Error('Database error');
      mockPomodoroService.updateSettings.mockRejectedValue(error);
      
      // Execute
      await controller.updateSettings(req, res);
      
      // Verify
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update Pomodoro settings' });
    });
  });

  describe('recordSession', () => {
    it('should record a pomodoro session', async () => {
      // Setup
      const now = new Date();
      const startTime = new Date(now.getTime() - 25 * 60 * 1000); // 25 minutes ago
      
      req.body = {
        start_time: startTime.toISOString(),
        end_time: now.toISOString(),
        duration: 25 * 60, // 25 minutes in seconds
        is_work: true,
        is_completed: true
      };
      
      const mockSession = {
        id: 1,
        start_time: startTime.toISOString(),
        end_time: now.toISOString(),
        duration: 25 * 60,
        is_work: true,
        is_completed: true,
        task_id: null
      };
      
      mockPomodoroService.recordSession.mockResolvedValue(mockSession);
      
      // Execute
      await controller.recordSession(req, res);
      
      // Verify
      expect(mockPomodoroService.recordSession).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Session recorded successfully',
        session: mockSession
      });
    });
    
    it('should validate required fields', async () => {
      // Setup - missing start_time
      req.body = {
        // Missing start_time
        end_time: new Date().toISOString(),
        duration: 25 * 60
      };
      
      // Execute
      await controller.recordSession(req, res);
      
      // Verify
      expect(mockPomodoroService.recordSession).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields' });
      
      // Reset
      jest.clearAllMocks();
      
      // Setup - invalid duration
      req.body = {
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        duration: -10 // Negative duration is invalid
      };
      
      // Execute
      await controller.recordSession(req, res);
      
      // Verify
      expect(mockPomodoroService.recordSession).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Duration must be a positive number' });
    });
    
    it('should handle service errors', async () => {
      // Setup
      req.body = {
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        duration: 25 * 60
      };
      
      const error = new Error('Database error');
      mockPomodoroService.recordSession.mockRejectedValue(error);
      
      // Execute
      await controller.recordSession(req, res);
      
      // Verify
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to record Pomodoro session' });
    });
  });

  describe('getSessions', () => {
    it('should return pomodoro sessions', async () => {
      // Setup
      req.query = {
        limit: '10',
        offset: '0',
        start_date: '2023-01-01',
        end_date: '2023-01-31'
      };
      
      const mockResult = {
        sessions: [
          {
            id: 1,
            start_time: '2023-01-15T10:00:00.000Z',
            end_time: '2023-01-15T10:25:00.000Z',
            duration: 1500,
            is_work: true,
            is_completed: true
          },
          {
            id: 2,
            start_time: '2023-01-15T10:30:00.000Z',
            end_time: '2023-01-15T10:35:00.000Z',
            duration: 300,
            is_work: false,
            is_completed: true
          }
        ],
        pagination: {
          total: 2,
          limit: 10,
          offset: 0
        }
      };
      
      mockPomodoroService.getSessions.mockResolvedValue(mockResult);
      
      // Execute
      await controller.getSessions(req, res);
      
      // Verify
      expect(mockPomodoroService.getSessions).toHaveBeenCalledWith({
        limit: '10',
        offset: '0',
        start_date: '2023-01-01',
        end_date: '2023-01-31'
      });
      
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
    
    it('should handle service errors', async () => {
      // Setup
      const error = new Error('Database error');
      mockPomodoroService.getSessions.mockRejectedValue(error);
      
      // Execute
      await controller.getSessions(req, res);
      
      // Verify
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to get Pomodoro sessions' });
    });
  });

  describe('deleteSession', () => {
    it('should delete a pomodoro session', async () => {
      // Setup
      req.params = { id: '1' };
      
      mockPomodoroService.deleteSession.mockResolvedValue({ success: true });
      
      // Execute
      await controller.deleteSession(req, res);
      
      // Verify
      expect(mockPomodoroService.deleteSession).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({ message: 'Session deleted successfully' });
    });
    
    it('should handle session not found error', async () => {
      // Setup
      req.params = { id: '999' };
      
      const error = new Error('Session not found');
      mockPomodoroService.deleteSession.mockRejectedValue(error);
      
      // Execute
      await controller.deleteSession(req, res);
      
      // Verify
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Session not found' });
    });
    
    it('should handle general errors', async () => {
      // Setup
      req.params = { id: '1' };
      
      const error = new Error('Database error');
      mockPomodoroService.deleteSession.mockRejectedValue(error);
      
      // Execute
      await controller.deleteSession(req, res);
      
      // Verify
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to delete Pomodoro session' });
    });
  });

  describe('getStats', () => {
    it('should return pomodoro statistics', async () => {
      // Setup
      req.query = {
        start_date: '2023-01-01',
        end_date: '2023-01-31'
      };
      
      const mockStats = [
        {
          date: '2023-01-15',
          work_seconds: 7500, // 125 minutes
          break_seconds: 1500, // 25 minutes
          work_sessions: 5,
          break_sessions: 5
        },
        {
          date: '2023-01-16',
          work_seconds: 6000, // 100 minutes
          break_seconds: 1200, // 20 minutes
          work_sessions: 4,
          break_sessions: 4
        }
      ];
      
      mockPomodoroService.getStats.mockResolvedValue(mockStats);
      
      // Execute
      await controller.getStats(req, res);
      
      // Verify
      expect(mockPomodoroService.getStats).toHaveBeenCalledWith({
        start_date: '2023-01-01',
        end_date: '2023-01-31'
      });
      
      expect(res.json).toHaveBeenCalledWith({
        daily_stats: expect.arrayContaining([
          expect.objectContaining({
            date: '2023-01-15',
            work_minutes: 125,
            break_minutes: 25,
            work_sessions: 5,
            break_sessions: 5,
            total_minutes: 150
          }),
          expect.objectContaining({
            date: '2023-01-16',
            work_minutes: 100,
            break_minutes: 20,
            work_sessions: 4,
            break_sessions: 4,
            total_minutes: 120
          })
        ])
      });
    });
    
    it('should handle service errors', async () => {
      // Setup
      const error = new Error('Database error');
      mockPomodoroService.getStats.mockRejectedValue(error);
      
      // Execute
      await controller.getStats(req, res);
      
      // Verify
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to get Pomodoro statistics' });
    });
  });
});