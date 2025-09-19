/**
 * Tests for Environment History Service
 */

import { EnvironmentHistoryService, TimePeriod } from '../environment-history.service';
import { EnvironmentData } from '../../models/environment';

describe('EnvironmentHistoryService', () => {
  let service: EnvironmentHistoryService;

  beforeEach(() => {
    service = new EnvironmentHistoryService({
      maxDataPoints: 100,
      aggregationInterval: 5,
      retentionPeriod: 24 * 31 // 31 days to accommodate all test data
    });
  });

  describe('addDataPoint', () => {
    it('should add a new data point', () => {
      const data: EnvironmentData = {
        temperature: 25.5,
        humidity: 60,
        light: 800,
        timestamp: new Date()
      };

      service.addDataPoint(data);
      const latest = service.getLatestDataPoint();

      expect(latest).toBeTruthy();
      expect(latest!.temperature).toBe(25.5);
      expect(latest!.humidity).toBe(60);
      expect(latest!.light).toBe(800);
      expect(latest!.sampleCount).toBe(1);
    });

    it('should aggregate data points within aggregation interval', () => {
      const baseTime = new Date();
      
      // First data point
      const data1: EnvironmentData = {
        temperature: 25.0,
        humidity: 60,
        light: 800,
        timestamp: baseTime
      };
      service.addDataPoint(data1);

      // Second data point within aggregation interval (2 minutes later)
      const data2: EnvironmentData = {
        temperature: 26.0,
        humidity: 65,
        light: 850,
        timestamp: new Date(baseTime.getTime() + 2 * 60 * 1000)
      };
      service.addDataPoint(data2);

      const status = service.getStatus();
      expect(status.dataPointCount).toBe(1); // Should be aggregated

      const latest = service.getLatestDataPoint();
      expect(latest!.temperature).toBe(25.5); // Average of 25.0 and 26.0
      expect(latest!.humidity).toBe(62.5); // Average of 60 and 65
      expect(latest!.light).toBe(825); // Average of 800 and 850
      expect(latest!.sampleCount).toBe(2);
    });

    it('should create separate data points outside aggregation interval', () => {
      const baseTime = new Date();
      
      // First data point
      const data1: EnvironmentData = {
        temperature: 25.0,
        humidity: 60,
        light: 800,
        timestamp: baseTime
      };
      service.addDataPoint(data1);

      // Second data point outside aggregation interval (10 minutes later)
      const data2: EnvironmentData = {
        temperature: 26.0,
        humidity: 65,
        light: 850,
        timestamp: new Date(baseTime.getTime() + 10 * 60 * 1000)
      };
      service.addDataPoint(data2);

      const status = service.getStatus();
      expect(status.dataPointCount).toBe(2); // Should be separate points
    });
  });

  describe('getHistoricalData', () => {
    it('should return data for 24h period', () => {
      const testService = new EnvironmentHistoryService({
        maxDataPoints: 100,
        aggregationInterval: 1000, // Very large interval to disable aggregation
        retentionPeriod: 24 * 31
      });

      // Add test data within 24h period
      const now = new Date();
      const testData = [
        { hours: 1, temp: 25.0, humidity: 60, light: 800 },
        { hours: 6, temp: 24.5, humidity: 58, light: 750 },
        { hours: 12, temp: 26.0, humidity: 62, light: 900 },
        { hours: 20, temp: 23.5, humidity: 55, light: 700 }
      ];

      testData.forEach(({ hours, temp, humidity, light }) => {
        const data: EnvironmentData = {
          temperature: temp,
          humidity,
          light,
          timestamp: new Date(now.getTime() - hours * 60 * 60 * 1000)
        };
        testService.addDataPoint(data);
      });

      const data = testService.getHistoricalData('24h');
      expect(data.length).toBe(4);
      
      // All data points should be within last 24 hours
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      data.forEach(point => {
        expect(point.timestamp.getTime()).toBeGreaterThanOrEqual(dayAgo.getTime());
      });
    });



    it('should return data for 1w period', () => {
      const testService = new EnvironmentHistoryService({
        maxDataPoints: 100,
        aggregationInterval: 1000,
        retentionPeriod: 24 * 31
      });

      // Add test data within 1w period
      const now = new Date();
      const testData = [
        { hours: 1, temp: 25.0, humidity: 60, light: 800 },
        { hours: 24, temp: 24.5, humidity: 58, light: 750 },
        { hours: 72, temp: 26.0, humidity: 62, light: 900 },
        { hours: 120, temp: 23.5, humidity: 55, light: 700 }
      ];

      testData.forEach(({ hours, temp, humidity, light }) => {
        const data: EnvironmentData = {
          temperature: temp,
          humidity,
          light,
          timestamp: new Date(now.getTime() - hours * 60 * 60 * 1000)
        };
        testService.addDataPoint(data);
      });

      const data = testService.getHistoricalData('1w');
      expect(data.length).toBe(4);
      
      // All data points should be within last week
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      data.forEach(point => {
        expect(point.timestamp.getTime()).toBeGreaterThanOrEqual(weekAgo.getTime());
      });
    });

    it('should return data for 1m period', () => {
      const testService = new EnvironmentHistoryService({
        maxDataPoints: 100,
        aggregationInterval: 1000,
        retentionPeriod: 24 * 31
      });

      // Add test data within 1m period
      const now = new Date();
      const testData = [
        { hours: 1, temp: 25.0, humidity: 60, light: 800 },
        { hours: 168, temp: 24.5, humidity: 58, light: 750 }, // 1 week
        { hours: 336, temp: 26.0, humidity: 62, light: 900 }, // 2 weeks
        { hours: 600, temp: 23.5, humidity: 55, light: 700 }  // 25 days
      ];

      testData.forEach(({ hours, temp, humidity, light }) => {
        const data: EnvironmentData = {
          temperature: temp,
          humidity,
          light,
          timestamp: new Date(now.getTime() - hours * 60 * 60 * 1000)
        };
        testService.addDataPoint(data);
      });

      const data = testService.getHistoricalData('1m');
      expect(data.length).toBe(4);
      
      // All data points should be within last month
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      data.forEach(point => {
        expect(point.timestamp.getTime()).toBeGreaterThanOrEqual(monthAgo.getTime());
      });
    });
  });

  describe('getDataStatistics', () => {
    it('should calculate correct statistics', () => {
      const testService = new EnvironmentHistoryService({
        maxDataPoints: 100,
        aggregationInterval: 1000,
        retentionPeriod: 24 * 31
      });

      // Add test data with known values - use separate timestamps to avoid aggregation
      const now = new Date();
      const testValues = [
        { temp: 20.0, humidity: 40, light: 500 },
        { temp: 25.0, humidity: 50, light: 750 },
        { temp: 30.0, humidity: 60, light: 1000 }
      ];

      testValues.forEach((values, index) => {
        const data: EnvironmentData = {
          temperature: values.temp,
          humidity: values.humidity,
          light: values.light,
          timestamp: new Date(now.getTime() - index * 2 * 60 * 60 * 1000) // 2 hours apart to avoid aggregation
        };
        testService.addDataPoint(data);
      });

      const stats = testService.getDataStatistics('24h');
      
      expect(stats).toBeTruthy();
      expect(stats!.temperature.min).toBe(20.0);
      expect(stats!.temperature.max).toBe(30.0);
      expect(stats!.temperature.avg).toBe(25.0);
      
      expect(stats!.humidity.min).toBe(40);
      expect(stats!.humidity.max).toBe(60);
      expect(stats!.humidity.avg).toBe(50);
      
      expect(stats!.light.min).toBe(500);
      expect(stats!.light.max).toBe(1000);
      expect(stats!.light.avg).toBe(750);
      
      expect(stats!.dataPointCount).toBe(3);
    });

    it('should return null for empty data', () => {
      const emptyService = new EnvironmentHistoryService();
      const stats = emptyService.getDataStatistics('24h');
      expect(stats).toBeNull();
    });
  });

  describe('clearHistory', () => {
    it('should clear all historical data', () => {
      // Add some data
      const data: EnvironmentData = {
        temperature: 25.0,
        humidity: 60,
        light: 800,
        timestamp: new Date()
      };
      service.addDataPoint(data);

      expect(service.getStatus().dataPointCount).toBe(1);

      // Clear history
      service.clearHistory();

      expect(service.getStatus().dataPointCount).toBe(0);
      expect(service.getLatestDataPoint()).toBeNull();
    });
  });

  describe('getStatus', () => {
    it('should return correct status information', () => {
      const data: EnvironmentData = {
        temperature: 25.0,
        humidity: 60,
        light: 800,
        timestamp: new Date()
      };
      service.addDataPoint(data);

      const status = service.getStatus();
      
      expect(status.dataPointCount).toBe(1);
      expect(status.oldestDataPoint).toBeTruthy();
      expect(status.newestDataPoint).toBeTruthy();
      expect(status.memoryUsageEstimate).toContain('KB');
    });

    it('should handle empty service', () => {
      const status = service.getStatus();
      
      expect(status.dataPointCount).toBe(0);
      expect(status.oldestDataPoint).toBeNull();
      expect(status.newestDataPoint).toBeNull();
    });
  });

  describe('data retention', () => {
    it('should remove old data beyond retention period', () => {
      const testService = new EnvironmentHistoryService({
        maxDataPoints: 100,
        aggregationInterval: 5,
        retentionPeriod: 24 // 24 hours retention
      });

      const now = new Date();
      
      // Add old data (beyond retention period)
      const oldData: EnvironmentData = {
        temperature: 20.0,
        humidity: 40,
        light: 500,
        timestamp: new Date(now.getTime() - 25 * 60 * 60 * 1000) // 25 hours ago (beyond 24h retention)
      };
      testService.addDataPoint(oldData);

      // Add recent data
      const recentData: EnvironmentData = {
        temperature: 25.0,
        humidity: 60,
        light: 800,
        timestamp: now
      };
      testService.addDataPoint(recentData);

      const status = testService.getStatus();
      expect(status.dataPointCount).toBe(1); // Only recent data should remain
      
      const latest = testService.getLatestDataPoint();
      expect(latest!.temperature).toBe(25.0);
    });
  });

  describe('max data points limit', () => {
    it('should respect max data points limit', () => {
      const smallService = new EnvironmentHistoryService({ maxDataPoints: 3 });
      
      // Add more data points than the limit
      for (let i = 0; i < 5; i++) {
        const data: EnvironmentData = {
          temperature: 20 + i,
          humidity: 50 + i,
          light: 700 + i * 100,
          timestamp: new Date(Date.now() + i * 10 * 60 * 1000) // 10 minutes apart to avoid aggregation
        };
        smallService.addDataPoint(data);
      }

      const status = smallService.getStatus();
      expect(status.dataPointCount).toBe(3); // Should not exceed max limit
    });
  });
});