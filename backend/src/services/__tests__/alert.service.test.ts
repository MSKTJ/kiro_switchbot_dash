/**
 * Tests for Alert service
 */

import { AlertService, AlertServiceError } from '../alert.service';
import { DEFAULT_ALERT_THRESHOLDS } from '../../models/alert';
import { EnvironmentData } from '../../models/environment';

describe('AlertService', () => {
  let alertService: AlertService;

  beforeEach(() => {
    alertService = new AlertService();
  });

  describe('getThresholds', () => {
    it('should return default thresholds initially', () => {
      const thresholds = alertService.getThresholds();
      expect(thresholds).toEqual(DEFAULT_ALERT_THRESHOLDS);
    });
  });

  describe('updateThresholds', () => {
    it('should update thresholds with valid values', () => {
      const newThresholds = {
        temperature: { min: 15, max: 25 },
        humidity: { min: 35, max: 65 }
      };

      alertService.updateThresholds(newThresholds);
      expect(alertService.getThresholds()).toEqual(newThresholds);
    });

    it('should throw error for invalid thresholds', () => {
      const invalidThresholds = {
        temperature: { min: 25, max: 20 }, // min > max
        humidity: { min: 30, max: 70 }
      };

      expect(() => {
        alertService.updateThresholds(invalidThresholds);
      }).toThrow(AlertServiceError);
    });
  });

  describe('checkEnvironmentData', () => {
    const mockEnvironmentData: EnvironmentData = {
      temperature: 25,
      humidity: 50,
      light: 500,
      timestamp: new Date()
    };

    it('should return no alerts for normal values', () => {
      const alerts = alertService.checkEnvironmentData(mockEnvironmentData);
      expect(alerts).toHaveLength(0);
    });

    it('should generate and track alerts for abnormal values', () => {
      const abnormalData = { ...mockEnvironmentData, temperature: 35 };
      const alerts = alertService.checkEnvironmentData(abnormalData);
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('temperature');
      expect(alerts[0].isActive).toBe(true);
    });

    it('should deactivate alerts when values return to normal', () => {
      // First, trigger an alert
      const abnormalData = { ...mockEnvironmentData, temperature: 35 };
      alertService.checkEnvironmentData(abnormalData);
      
      // Then return to normal
      const normalData = { ...mockEnvironmentData, temperature: 25 };
      const alerts = alertService.checkEnvironmentData(normalData);
      
      expect(alerts).toHaveLength(0);
    });

    it('should update existing alerts with new values', () => {
      // First alert
      const data1 = { ...mockEnvironmentData, temperature: 35 };
      alertService.checkEnvironmentData(data1);
      
      // Updated alert with different temperature
      const data2 = { ...mockEnvironmentData, temperature: 40 };
      const alerts = alertService.checkEnvironmentData(data2);
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0].value).toBe(40);
      expect(alerts[0].severity).toBe('critical'); // Should be critical now
    });
  });

  describe('getActiveAlerts', () => {
    it('should return only active alerts', () => {
      const abnormalData: EnvironmentData = {
        temperature: 35,
        humidity: 80,
        light: 500,
        timestamp: new Date()
      };

      alertService.checkEnvironmentData(abnormalData);
      const activeAlerts = alertService.getActiveAlerts();
      
      expect(activeAlerts).toHaveLength(2);
      expect(activeAlerts.every(alert => alert.isActive)).toBe(true);
    });
  });

  describe('dismissAlert', () => {
    it('should dismiss an active alert', () => {
      const abnormalData: EnvironmentData = {
        temperature: 35,
        humidity: 50,
        light: 500,
        timestamp: new Date()
      };

      const alerts = alertService.checkEnvironmentData(abnormalData);
      expect(alerts).toHaveLength(1);
      
      const alertId = alerts[0].id;
      const dismissed = alertService.dismissAlert(alertId);
      expect(dismissed).toBe(true);
      
      const activeAlerts = alertService.getActiveAlerts();
      expect(activeAlerts).toHaveLength(0);
    });

    it('should return false for non-existent alert', () => {
      const dismissed = alertService.dismissAlert('non-existent-id');
      expect(dismissed).toBe(false);
    });
  });

  describe('clearAllAlerts', () => {
    it('should clear all active alerts', () => {
      const abnormalData: EnvironmentData = {
        temperature: 35,
        humidity: 80,
        light: 500,
        timestamp: new Date()
      };

      alertService.checkEnvironmentData(abnormalData);
      expect(alertService.getActiveAlerts()).toHaveLength(2);
      
      alertService.clearAllAlerts();
      expect(alertService.getActiveAlerts()).toHaveLength(0);
    });
  });

  describe('getAlertHistory', () => {
    it('should return alert history', () => {
      const abnormalData: EnvironmentData = {
        temperature: 35,
        humidity: 50,
        light: 500,
        timestamp: new Date()
      };

      alertService.checkEnvironmentData(abnormalData);
      const history = alertService.getAlertHistory();
      
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('temperature');
    });

    it('should limit history results', () => {
      // Generate multiple alerts by triggering and then clearing them
      for (let i = 0; i < 5; i++) {
        const data: EnvironmentData = {
          temperature: 35 + i,
          humidity: 50,
          light: 500,
          timestamp: new Date(Date.now() + i * 1000) // Different timestamps
        };
        alertService.checkEnvironmentData(data);
        
        // Clear the alert to add it to history
        const alerts = alertService.getActiveAlerts();
        if (alerts.length > 0) {
          alertService.dismissAlert(alerts[0].id);
        }
      }

      const limitedHistory = alertService.getAlertHistory(3);
      expect(limitedHistory).toHaveLength(3);
    });
  });

  describe('getAlertStatistics', () => {
    it('should return correct statistics', () => {
      const abnormalData: EnvironmentData = {
        temperature: 35,
        humidity: 80,
        light: 500,
        timestamp: new Date()
      };

      alertService.checkEnvironmentData(abnormalData);
      const stats = alertService.getAlertStatistics();
      
      expect(stats.activeCount).toBe(2);
      expect(stats.totalToday).toBe(2);
      expect(stats.temperatureAlerts).toBe(1);
      expect(stats.humidityAlerts).toBe(1);
    });
  });

  describe('reset', () => {
    it('should reset service to initial state', () => {
      // Generate some alerts and change thresholds
      const abnormalData: EnvironmentData = {
        temperature: 35,
        humidity: 80,
        light: 500,
        timestamp: new Date()
      };

      alertService.checkEnvironmentData(abnormalData);
      alertService.updateThresholds({
        temperature: { min: 15, max: 25 },
        humidity: { min: 35, max: 65 }
      });

      // Reset
      alertService.reset();

      // Check everything is back to defaults
      expect(alertService.getActiveAlerts()).toHaveLength(0);
      expect(alertService.getAlertHistory()).toHaveLength(0);
      expect(alertService.getThresholds()).toEqual(DEFAULT_ALERT_THRESHOLDS);
    });
  });
});