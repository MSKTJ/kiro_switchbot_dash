import '@testing-library/jest-dom';

// Mock environment variables for tests
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_WEBSOCKET_URL: 'http://localhost:3001',
    VITE_API_BASE_URL: 'http://localhost:3001/api'
  },
  writable: true
});

// Mock WebSocket for tests
(globalThis as any).WebSocket = class MockWebSocket {
  constructor(_url: string) {
    // Mock implementation
  }
  
  close() {}
  send() {}
};