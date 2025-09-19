/**
 * Unit tests for environment data models and validation
 */

import { EnvironmentDataValidator, RawEnvironmentData, EnvironmentData } from '../environment';

describe('EnvironmentDataValidator', () => {
  describe('validate', () => {
    it('should validate correct environment data', () => {
      const rawData: RawEnvironmentData = {
        temperature: 25.5,
        humidity: 60,
        lightLevel: 500
      };

      const result = EnvironmentDataValidator.validate(rawData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toBeDefined();
      expect(result.data!.temperature).toBe(25.5);
      expect(result.data!.humidity).toBe(60);
      expect(result.data!.light).toBe(500);
      expect(result.data!.timestamp).toBeInstanceOf(Date);
    });

    it('should reject null or undefined data', () => {
      const result1 = EnvironmentDataValidator.validate(null as any);
      const result2 = EnvironmentDataValidator.validate(undefined as any);

      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Invalid data format: expected object');
      
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Invalid data format: expected object');
    });

    it('should reject invalid data format', () => {
      const result = EnvironmentDataValidator.validate('invalid' as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid data format: expected object');
    });

    it('should reject missing temperature', () => {
      const rawData: RawEnvironmentData = {
        humidity: 60,
        lightLevel: 500
      };

      const result = EnvironmentDataValidator.validate(rawData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Temperature is required');
    });

    it('should reject missing humidity', () => {
      const rawData: RawEnvironmentData = {
        temperature: 25.5,
        lightLevel: 500
      };

      const result = EnvironmentDataValidator.validate(rawData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Humidity is required');
    });

    it('should reject missing light level', () => {
      const rawData: RawEnvironmentData = {
        temperature: 25.5,
        humidity: 60
      };

      const result = EnvironmentDataValidator.validate(rawData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Light level is required');
    });

    it('should reject invalid temperature values', () => {
      const testCases = [
        { value: 'not-a-number', expectedError: 'Temperature must be a valid number' },
        { value: -50, expectedError: 'Temperature must be between -40°C and 80°C' },
        { value: 100, expectedError: 'Temperature must be between -40°C and 80°C' }
      ];

      testCases.forEach(({ value, expectedError }) => {
        const rawData: RawEnvironmentData = {
          temperature: value as any,
          humidity: 60,
          lightLevel: 500
        };

        const result = EnvironmentDataValidator.validate(rawData);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(expectedError);
      });
    });

    it('should reject invalid humidity values', () => {
      const testCases = [
        { value: 'not-a-number', expectedError: 'Humidity must be a valid number' },
        { value: -10, expectedError: 'Humidity must be between 0% and 100%' },
        { value: 150, expectedError: 'Humidity must be between 0% and 100%' }
      ];

      testCases.forEach(({ value, expectedError }) => {
        const rawData: RawEnvironmentData = {
          temperature: 25.5,
          humidity: value as any,
          lightLevel: 500
        };

        const result = EnvironmentDataValidator.validate(rawData);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(expectedError);
      });
    });

    it('should reject invalid light level values', () => {
      const testCases = [
        { value: 'not-a-number', expectedError: 'Light level must be a valid number' },
        { value: -100, expectedError: 'Light level must be between 0 and 100000 lux' },
        { value: 200000, expectedError: 'Light level must be between 0 and 100000 lux' }
      ];

      testCases.forEach(({ value, expectedError }) => {
        const rawData: RawEnvironmentData = {
          temperature: 25.5,
          humidity: 60,
          lightLevel: value as any
        };

        const result = EnvironmentDataValidator.validate(rawData);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(expectedError);
      });
    });

    it('should handle multiple validation errors', () => {
      const rawData: RawEnvironmentData = {
        temperature: -100,
        humidity: 150,
        lightLevel: -50
      };

      const result = EnvironmentDataValidator.validate(rawData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('Temperature must be between -40°C and 80°C');
      expect(result.errors).toContain('Humidity must be between 0% and 100%');
      expect(result.errors).toContain('Light level must be between 0 and 100000 lux');
    });

    it('should accept boundary values', () => {
      const testCases = [
        { temperature: -40, humidity: 0, lightLevel: 0 },
        { temperature: 80, humidity: 100, lightLevel: 100000 }
      ];

      testCases.forEach((rawData) => {
        const result = EnvironmentDataValidator.validate(rawData);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.data).toBeDefined();
      });
    });
  });

  describe('isReasonableData', () => {
    it('should return true for reasonable indoor data', () => {
      const data: EnvironmentData = {
        temperature: 22,
        humidity: 45,
        light: 300,
        timestamp: new Date()
      };

      const result = EnvironmentDataValidator.isReasonableData(data);

      expect(result).toBe(true);
    });

    it('should return false for unreasonable temperature', () => {
      const data: EnvironmentData = {
        temperature: 5, // Too cold for indoor
        humidity: 45,
        light: 300,
        timestamp: new Date()
      };

      const result = EnvironmentDataValidator.isReasonableData(data);

      expect(result).toBe(false);
    });

    it('should return false for unreasonable humidity', () => {
      const data: EnvironmentData = {
        temperature: 22,
        humidity: 15, // Too dry for indoor
        light: 300,
        timestamp: new Date()
      };

      const result = EnvironmentDataValidator.isReasonableData(data);

      expect(result).toBe(false);
    });

    it('should return false for unreasonable light level', () => {
      const data: EnvironmentData = {
        temperature: 22,
        humidity: 45,
        light: 15000, // Too bright for indoor
        timestamp: new Date()
      };

      const result = EnvironmentDataValidator.isReasonableData(data);

      expect(result).toBe(false);
    });
  });
});