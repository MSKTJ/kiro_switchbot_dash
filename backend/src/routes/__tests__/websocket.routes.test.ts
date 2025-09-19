/**
 * WebSocket routes integration tests
 */

import request from 'supertest';
import { app } from '../../index';

describe('WebSocket Routes', () => {
  describe('GET /api/websocket/status', () => {
    it('should return WebSocket service status', async () => {
      const response = await request(app)
        .get('/api/websocket/status')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      
      const data = response.body.data;
      expect(data).toHaveProperty('isRunning');
      expect(data).toHaveProperty('connectedClients');
      expect(data).toHaveProperty('subscribedClients');
      expect(data).toHaveProperty('updateInterval');
      expect(data).toHaveProperty('retryCount');
      expect(data).toHaveProperty('lastUpdate');
      
      expect(typeof data.isRunning).toBe('boolean');
      expect(typeof data.connectedClients).toBe('number');
      expect(typeof data.subscribedClients).toBe('number');
      expect(typeof data.updateInterval).toBe('number');
      expect(typeof data.retryCount).toBe('number');
    });

    it('should return correct initial status values', async () => {
      const response = await request(app)
        .get('/api/websocket/status')
        .expect(200);

      const data = response.body.data;
      expect(data.isRunning).toBe(false);
      expect(data.connectedClients).toBe(0);
      expect(data.subscribedClients).toBe(0);
      expect(data.retryCount).toBe(0);
      expect(data.lastUpdate).toBeNull();
    });
  });
});