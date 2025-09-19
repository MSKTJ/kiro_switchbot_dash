/**
 * WebSocket service tests
 */

import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { WebSocketService } from '../websocket.service';
import { environmentService } from '../environment.service';
import { EnvironmentData } from '../../models/environment';

// Mock the environment service
jest.mock('../environment.service');

describe('WebSocketService', () => {
  let httpServer: any;
  let io: SocketIOServer;
  let webSocketService: WebSocketService;
  let mockEnvironmentService: jest.Mocked<typeof environmentService>;
  let originalConsoleLog: typeof console.log;
  let originalConsoleError: typeof console.error;
  let originalConsoleWarn: typeof console.warn;

  const mockEnvironmentData: EnvironmentData = {
    temperature: 25.5,
    humidity: 60,
    light: 800,
    timestamp: new Date('2024-01-01T12:00:00Z')
  };

  beforeAll(() => {
    // Suppress console logs during testing
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterAll(() => {
    // Restore console logs
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  beforeEach(() => {
    // Create HTTP server and Socket.IO instance
    httpServer = createServer();
    io = new SocketIOServer(httpServer);
    
    // Mock environment service
    mockEnvironmentService = environmentService as jest.Mocked<typeof environmentService>;
    mockEnvironmentService.getCurrentEnvironmentData.mockResolvedValue(mockEnvironmentData);

    // Create WebSocket service with test configuration
    webSocketService = new WebSocketService(io, {
      updateInterval: 1000, // 1 second for testing
      maxRetries: 2,
      retryDelay: 100
    });
  });

  afterEach(() => {
    webSocketService.shutdown();
    io.close();
    if (httpServer.listening) {
      httpServer.close();
    }
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should initialize with correct default status', () => {
      const status = webSocketService.getStatus();
      
      expect(status.isRunning).toBe(false);
      expect(status.connectedClients).toBe(0);
      expect(status.subscribedClients).toBe(0);
      expect(status.updateInterval).toBe(1000);
      expect(status.retryCount).toBe(0);
      expect(status.lastUpdate).toBeNull();
    });

    it('should create WebSocket service with custom configuration', () => {
      const customService = new WebSocketService(io, {
        updateInterval: 5000,
        maxRetries: 5,
        retryDelay: 2000
      });

      const status = customService.getStatus();
      expect(status.updateInterval).toBe(5000);
      
      customService.shutdown();
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration correctly', () => {
      const newConfig = {
        updateInterval: 5000,
        maxRetries: 5
      };

      webSocketService.updateConfig(newConfig);
      
      const status = webSocketService.getStatus();
      expect(status.updateInterval).toBe(5000);
    });

    it('should maintain existing config when partial update is provided', () => {
      const originalStatus = webSocketService.getStatus();
      
      webSocketService.updateConfig({ updateInterval: 3000 });
      
      const updatedStatus = webSocketService.getStatus();
      expect(updatedStatus.updateInterval).toBe(3000);
      // Other config should remain the same
      expect(updatedStatus.retryCount).toBe(originalStatus.retryCount);
    });
  });

  describe('Manual Environment Data Fetching', () => {
    it('should manually trigger environment data update', async () => {
      await webSocketService.triggerUpdate();
      
      expect(mockEnvironmentService.getCurrentEnvironmentData).toHaveBeenCalled();
      
      const status = webSocketService.getStatus();
      expect(status.lastUpdate).toBeDefined();
    });

    it('should handle errors during manual trigger', async () => {
      mockEnvironmentService.getCurrentEnvironmentData.mockRejectedValueOnce(
        new Error('API Error')
      );

      await webSocketService.triggerUpdate();
      
      expect(mockEnvironmentService.getCurrentEnvironmentData).toHaveBeenCalled();
      // Should not throw, but handle error gracefully
    });
  });

  describe('Service Status', () => {
    it('should provide accurate service status structure', () => {
      const status = webSocketService.getStatus();
      
      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('connectedClients');
      expect(status).toHaveProperty('subscribedClients');
      expect(status).toHaveProperty('updateInterval');
      expect(status).toHaveProperty('retryCount');
      expect(status).toHaveProperty('lastUpdate');
      
      expect(typeof status.isRunning).toBe('boolean');
      expect(typeof status.connectedClients).toBe('number');
      expect(typeof status.subscribedClients).toBe('number');
      expect(typeof status.updateInterval).toBe('number');
      expect(typeof status.retryCount).toBe('number');
    });

    it('should update last update timestamp after successful data fetch', async () => {
      const statusBefore = webSocketService.getStatus();
      expect(statusBefore.lastUpdate).toBeNull();

      await webSocketService.triggerUpdate();

      const statusAfter = webSocketService.getStatus();
      expect(statusAfter.lastUpdate).toBeDefined();
      expect(statusAfter.lastUpdate).not.toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle environment service errors gracefully', async () => {
      const error = new Error('SwitchBot API Error');
      mockEnvironmentService.getCurrentEnvironmentData.mockRejectedValueOnce(error);

      // Should not throw
      await expect(webSocketService.triggerUpdate()).resolves.not.toThrow();
      
      expect(mockEnvironmentService.getCurrentEnvironmentData).toHaveBeenCalled();
    });

    it('should reset retry count on successful data fetch', async () => {
      // First, simulate some failures to increase retry count
      mockEnvironmentService.getCurrentEnvironmentData
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce(mockEnvironmentData);

      // Trigger multiple updates
      await webSocketService.triggerUpdate(); // Should fail
      await webSocketService.triggerUpdate(); // Should fail  
      await webSocketService.triggerUpdate(); // Should succeed

      const status = webSocketService.getStatus();
      expect(status.retryCount).toBe(0); // Should be reset after success
    });
  });

  describe('Shutdown', () => {
    it('should shutdown gracefully', () => {
      // Start with some state
      webSocketService.updateConfig({ updateInterval: 2000 });
      
      expect(() => webSocketService.shutdown()).not.toThrow();
      
      const status = webSocketService.getStatus();
      expect(status.isRunning).toBe(false);
      expect(status.connectedClients).toBe(0);
    });

    it('should be safe to call shutdown multiple times', () => {
      expect(() => {
        webSocketService.shutdown();
        webSocketService.shutdown();
        webSocketService.shutdown();
      }).not.toThrow();
    });
  });

  describe('Socket.IO Integration', () => {
    it('should integrate with Socket.IO server', () => {
      // Verify that the service is properly integrated with Socket.IO
      expect(io).toBeDefined();
      expect(webSocketService).toBeDefined();
      
      // The service should have set up event handlers
      expect(io.listenerCount('connection')).toBeGreaterThan(0);
    });

    it('should be ready to handle Socket.IO connections', () => {
      // Verify that the WebSocket service is properly initialized
      const status = webSocketService.getStatus();
      expect(status).toBeDefined();
      expect(status.connectedClients).toBe(0);
      expect(status.subscribedClients).toBe(0);
      
      // The service should be ready to handle connections
      expect(webSocketService.getStatus).toBeDefined();
      expect(webSocketService.updateConfig).toBeDefined();
      expect(webSocketService.triggerUpdate).toBeDefined();
      expect(webSocketService.shutdown).toBeDefined();
    });
  });
});