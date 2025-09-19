/**
 * Tests for Alert models and validation
 */

import { AlertGenerator, AlertThresholdValidator, DEFAULT_ALERT_THRESHOLDS } from '../alert';
import { EnvironmentData } from '../environment';

describe('AlertThresholdValidator', () => {
  describe('validate', () => {
    it('should validate correct thresholds', () => {
      const result = AlertThresholdValidator.validate(DEFAULT_ALERT_THRESHOLDS);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject temperature min >= max', () => {
      const thresholds = {
        temperature: { min: 25, max: 20 },
        humidity: { min: 30, max: 70 }
      };
      const result = AlertThresholdValidator.validate(thresholds);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Temperature minimum must be less than maximum');
    });

    it('should reject humidity min >= max', () => {
      const thresholds = {
        temperature: { min: 18, max: 28 },
        humidity: { min: 70, max: 60 }
      };
      const result = AlertThresholdValidator.validate(thresholds);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Humidity minimum must be less than maximum');
    });

    it('should reject out-of-range temperature values', () => {
      const thresholds = {
        temperature: { min: -50, max: 100 },
        humidity: { min: 30, max: 70 }
      };
      const result = AlertThresholdValidator.validate(thresholds);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Temperature minimum'))).toBe(true);
      expect(result.errors.some(error => error.includes('Temperature maximum'))).toBe(true);
    });

    it('should reject out-of-range humidity values', () => {
      const thresholds = {
        temperature: { min: 18, max: 28 },
        humidity: { min: -10, max: 110 }
      };
      const result = AlertThresholdValidator.validate(thresholds);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Humidity minimum'))).toBe(true);
      expect(result.errors.some(error => error.includes('Humidity maximum'))).toBe(true);
    });
  });
});

describe('AlertGenerator', () => {
  const mockEnvironmentData: EnvironmentData = {
    temperature: 25,
    humidity: 50,
    light: 500,
    timestamp: new Date()
  };

  const mockThresholds = {
    temperature: { min: 20, max: 30 },
    humidity: { min: 40, max: 60 }
  };

  describe('generateAlerts', () => {
    it('should generate no alerts for normal values', () => {
      const alerts = AlertGenerator.generateAlerts(mockEnvironmentData, mockThresholds);
      expect(alerts).toHaveLength(0);
    });

    it('should generate temperature low alert', () => {
      const data = { ...mockEnvironmentData, temperature: 15 };
      const alerts = AlertGenerator.generateAlerts(data, mockThresholds);
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('temperature');
      expect(alerts[0].condition).toBe('below');
      expect(alerts[0].severity).toBe('warning');
      expect(alerts[0].value).toBe(15);
      expect(alerts[0].threshold).toBe(20);
    });

    it('should generate temperature high alert', () => {
      const data = { ...mockEnvironmentData, temperature: 35 };
      const alerts = AlertGenerator.generateAlerts(data, mockThresholds);
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('temperature');
      expect(alerts[0].condition).toBe('above');
      expect(alerts[0].severity).toBe('warning');
      expect(alerts[0].value).toBe(35);
      expect(alerts[0].threshold).toBe(30);
    });

    it('should generate critical temperature alert for extreme values', () => {
      const data = { ...mockEnvironmentData, temperature: 40 }; // 10 degrees above max
      const alerts = AlertGenerator.generateAlerts(data, mockThresholds);
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe('critical');
    });

    it('should generate humidity low alert', () => {
      const data = { ...mockEnvironmentData, humidity: 25 };
      const alerts = AlertGenerator.generateAlerts(data, mockThresholds);
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('humidity');
      expect(alerts[0].condition).toBe('below');
      expect(alerts[0].severity).toBe('critical'); // 25 is 15 below 40, so critical
      expect(alerts[0].value).toBe(25);
      expect(alerts[0].threshold).toBe(40);
    });

    it('should generate humidity high alert', () => {
      const data = { ...mockEnvironmentData, humidity: 75 };
      const alerts = AlertGenerator.generateAlerts(data, mockThresholds);
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('humidity');
      expect(alerts[0].condition).toBe('above');
      expect(alerts[0].severity).toBe('critical'); // 75 is 15 above 60, so critical
      expect(alerts[0].value).toBe(75);
      expect(alerts[0].threshold).toBe(60);
    });

    it('should generate multiple alerts', () => {
      const data = { ...mockEnvironmentData, temperature: 10, humidity: 80 };
      const alerts = AlertGenerator.generateAlerts(data, mockThresholds);
      
      expect(alerts).toHaveLength(2);
      expect(alerts.some(alert => alert.type === 'temperature')).toBe(true);
      expect(alerts.some(alert => alert.type === 'humidity')).toBe(true);
    });

    it('should include Japanese messages', () => {
      const data = { ...mockEnvironmentData, temperature: 35 };
      const alerts = AlertGenerator.generateAlerts(data, mockThresholds);
      
      expect(alerts[0].message).toContain('温度が高すぎます');
      expect(alerts[0].message).toContain('35.0°C');
      expect(alerts[0].message).toContain('30°C');
    });
  });
});