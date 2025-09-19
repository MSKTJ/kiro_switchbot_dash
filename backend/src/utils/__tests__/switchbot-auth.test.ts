import { generateSwitchBotHeaders, validateSwitchBotCredentials } from '../switchbot-auth';

// Mock the config module
jest.mock('../../config', () => ({
  config: {
    switchbot: {
      token: 'test-token',
      secret: 'test-secret'
    }
  }
}));

describe('SwitchBot Authentication', () => {
  describe('generateSwitchBotHeaders', () => {
    it('should generate valid authentication headers', () => {
      const headers = generateSwitchBotHeaders();
      
      expect(headers).toHaveProperty('Authorization', 'test-token');
      expect(headers).toHaveProperty('sign');
      expect(headers).toHaveProperty('t');
      expect(headers).toHaveProperty('nonce');
      expect(headers).toHaveProperty('Content-Type', 'application/json');
      
      // Verify that sign is a base64 string
      expect(headers.sign).toMatch(/^[A-Za-z0-9+/]+=*$/);
      
      // Verify that timestamp is a number string
      expect(headers.t).toMatch(/^\d+$/);
      
      // Verify that nonce is a UUID
      expect(headers.nonce).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });

  describe('validateSwitchBotCredentials', () => {
    it('should return true for valid credentials', () => {
      expect(validateSwitchBotCredentials()).toBe(true);
    });
  });
});