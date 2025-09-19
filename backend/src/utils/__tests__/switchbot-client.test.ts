import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the config and auth modules
jest.mock('../../config', () => ({
  config: {
    switchbot: {
      token: 'test-token',
      secret: 'test-secret',
      baseUrl: 'https://api.switch-bot.com/v1.1'
    }
  }
}));

jest.mock('../switchbot-auth', () => ({
  generateSwitchBotHeaders: jest.fn(() => ({
    'Authorization': 'test-token',
    'sign': 'test-sign',
    't': '1234567890',
    'nonce': 'test-nonce',
    'Content-Type': 'application/json'
  }))
}));

// Mock axios instance
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  }
};

mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

// Import after mocking
import { SwitchBotClient, SwitchBotAPIError } from '../switchbot-client';

describe('SwitchBotClient - Core Functionality', () => {
  let client: SwitchBotClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new SwitchBotClient();
  });

  describe('constructor', () => {
    it('should create axios instance with correct configuration', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.switch-bot.com/v1.1',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    });

    it('should set up request and response interceptors', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('HTTP methods - success cases', () => {
    beforeEach(() => {
      // Mock successful response
      mockAxiosInstance.get.mockResolvedValue({ data: { success: true } });
      mockAxiosInstance.post.mockResolvedValue({ data: { success: true } });
      mockAxiosInstance.put.mockResolvedValue({ data: { success: true } });
      mockAxiosInstance.delete.mockResolvedValue({ data: { success: true } });
    });

    it('should make GET request successfully', async () => {
      const result = await client.get('/test-endpoint');
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test-endpoint');
      expect(result).toEqual({ success: true });
    });

    it('should make POST request successfully', async () => {
      const testData = { command: 'turnOn' };
      const result = await client.post('/test-endpoint', testData);
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test-endpoint', testData);
      expect(result).toEqual({ success: true });
    });

    it('should make PUT request successfully', async () => {
      const testData = { setting: 'value' };
      const result = await client.put('/test-endpoint', testData);
      
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test-endpoint', testData);
      expect(result).toEqual({ success: true });
    });

    it('should make DELETE request successfully', async () => {
      const result = await client.delete('/test-endpoint');
      
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test-endpoint');
      expect(result).toEqual({ success: true });
    });
  });

  describe('healthCheck', () => {
    it('should return true when API is accessible', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { devices: [] } });
      
      const result = await client.healthCheck();
      
      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/devices');
    });
  });
});

describe('SwitchBotAPIError', () => {
  it('should create error with all properties', () => {
    const error = new SwitchBotAPIError('Test error', 400, 'TEST_ERROR', { original: 'error' });
    
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.errorCode).toBe('TEST_ERROR');
    expect(error.originalError).toEqual({ original: 'error' });
    expect(error.name).toBe('SwitchBotAPIError');
  });

  it('should create error with minimal properties', () => {
    const error = new SwitchBotAPIError('Test error');
    
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBeUndefined();
    expect(error.errorCode).toBeUndefined();
    expect(error.originalError).toBeUndefined();
  });
});