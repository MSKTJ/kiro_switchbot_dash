/**
 * Environment data history service for SwitchBot Dashboard
 * Manages in-memory storage of historical environment data
 */

import { EnvironmentData } from '../models/environment';

/**
 * Time period options for data retrieval
 */
export type TimePeriod = '1h' | '6h' | '12h';

/**
 * Historical data point with aggregated values
 */
export interface HistoricalDataPoint {
  timestamp: Date;
  temperature: number;
  humidity: number;
  light: number;
  // Optional aggregated values for longer periods
  temperatureMin?: number;
  temperatureMax?: number;
  humidityMin?: number;
  humidityMax?: number;
  lightMin?: number;
  lightMax?: number;
  sampleCount?: number;
}

/**
 * History service configuration
 */
interface HistoryConfig {
  maxDataPoints: number;        // Maximum data points to keep in memory
  aggregationInterval: number;  // Interval for data aggregation in minutes
  retentionPeriod: number;     // Data retention period in hours
}

/**
 * Environment data history service
 */
export class EnvironmentHistoryService {
  private dataPoints: HistoricalDataPoint[] = [];
  private config: HistoryConfig;

  constructor(config: Partial<HistoryConfig> = {}) {
    this.config = {
      maxDataPoints: config.maxDataPoints || 8640, // ~30 days at 5min intervals
      aggregationInterval: config.aggregationInterval || (process.env.NODE_ENV === 'development' ? 0.1 : 2), // 6 seconds in dev, 2 minutes in prod
      retentionPeriod: config.retentionPeriod || 24 * 30 // 30 days
    };
  }

  /**
   * Add new environment data point to history
   */
  addDataPoint(data: EnvironmentData): void {
    const historicalPoint: HistoricalDataPoint = {
      timestamp: data.timestamp,
      temperature: data.temperature,
      humidity: data.humidity,
      light: data.light,
      sampleCount: 1
    };

    // Check if we should aggregate with the last point
    const lastPoint = this.dataPoints[this.dataPoints.length - 1];
    const shouldAggregate = this.shouldAggregateWithLastPoint(data.timestamp, lastPoint);

    if (shouldAggregate && lastPoint) {
      // Aggregate with the last point
      const timeDiff = (data.timestamp.getTime() - lastPoint.timestamp.getTime()) / (1000 * 60);
      console.log(`Aggregating data point at ${data.timestamp.toISOString()} with last point at ${lastPoint.timestamp.toISOString()} (${timeDiff.toFixed(1)} min diff, threshold: ${this.config.aggregationInterval} min)`);
      this.aggregateDataPoint(lastPoint, historicalPoint);
    } else {
      // Add as new point
      const timeDiff = lastPoint ? (data.timestamp.getTime() - lastPoint.timestamp.getTime()) / (1000 * 60) : 0;
      console.log(`Adding new data point at ${data.timestamp.toISOString()}. Total points: ${this.dataPoints.length + 1}. Time diff: ${timeDiff.toFixed(1)} min`);
      this.dataPoints.push(historicalPoint);
    }

    // Clean up old data
    this.cleanupOldData();

    // Ensure we don't exceed max data points
    if (this.dataPoints.length > this.config.maxDataPoints) {
      this.dataPoints = this.dataPoints.slice(-this.config.maxDataPoints);
    }
  }

  /**
   * Get historical data for specified time period
   */
  getHistoricalData(period: TimePeriod): HistoricalDataPoint[] {
    const now = new Date();
    let startTime: Date;

    switch (period) {
      case '1h':
        startTime = new Date(now.getTime() - 1 * 60 * 60 * 1000);
        break;
      case '6h':
        startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '12h':
        startTime = new Date(now.getTime() - 12 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    }

    // Filter data points within the time period
    const filteredData = this.dataPoints.filter(
      point => point.timestamp >= startTime && point.timestamp <= now
    );

    console.log(`Getting historical data for ${period}: ${filteredData.length} points found between ${startTime.toISOString()} and ${now.toISOString()}`);
    console.log(`Total data points in memory: ${this.dataPoints.length}`);

    // For longer periods, we might want to further aggregate the data
    return this.optimizeDataForPeriod(filteredData, period);
  }

  /**
   * Get latest data point
   */
  getLatestDataPoint(): HistoricalDataPoint | null {
    return this.dataPoints.length > 0 ? this.dataPoints[this.dataPoints.length - 1] : null;
  }

  /**
   * Get data statistics for a time period
   */
  getDataStatistics(period: TimePeriod): {
    temperature: { min: number; max: number; avg: number };
    humidity: { min: number; max: number; avg: number };
    light: { min: number; max: number; avg: number };
    dataPointCount: number;
  } | null {
    const data = this.getHistoricalData(period);
    
    if (data.length === 0) {
      return null;
    }

    const temperatures = data.map(d => d.temperature);
    const humidities = data.map(d => d.humidity);
    const lights = data.map(d => d.light);

    return {
      temperature: {
        min: Math.min(...temperatures),
        max: Math.max(...temperatures),
        avg: temperatures.reduce((sum, val) => sum + val, 0) / temperatures.length
      },
      humidity: {
        min: Math.min(...humidities),
        max: Math.max(...humidities),
        avg: humidities.reduce((sum, val) => sum + val, 0) / humidities.length
      },
      light: {
        min: Math.min(...lights),
        max: Math.max(...lights),
        avg: lights.reduce((sum, val) => sum + val, 0) / lights.length
      },
      dataPointCount: data.length
    };
  }

  /**
   * Clear all historical data
   */
  clearHistory(): void {
    this.dataPoints = [];
  }

  /**
   * Get service status
   */
  getStatus(): {
    dataPointCount: number;
    oldestDataPoint: Date | null;
    newestDataPoint: Date | null;
    memoryUsageEstimate: string;
  } {
    const oldestPoint = this.dataPoints.length > 0 ? this.dataPoints[0].timestamp : null;
    const newestPoint = this.dataPoints.length > 0 ? this.dataPoints[this.dataPoints.length - 1].timestamp : null;
    
    // Rough estimate of memory usage (each data point is approximately 200 bytes)
    const estimatedBytes = this.dataPoints.length * 200;
    const memoryUsageEstimate = estimatedBytes > 1024 * 1024 
      ? `${(estimatedBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(estimatedBytes / 1024).toFixed(2)} KB`;

    return {
      dataPointCount: this.dataPoints.length,
      oldestDataPoint: oldestPoint,
      newestDataPoint: newestPoint,
      memoryUsageEstimate
    };
  }

  /**
   * Check if new data should be aggregated with the last point
   */
  private shouldAggregateWithLastPoint(newTimestamp: Date, lastPoint?: HistoricalDataPoint): boolean {
    if (!lastPoint) return false;

    const timeDiffMinutes = (newTimestamp.getTime() - lastPoint.timestamp.getTime()) / (1000 * 60);
    return timeDiffMinutes < this.config.aggregationInterval;
  }

  /**
   * Aggregate new data point with existing point
   */
  private aggregateDataPoint(existingPoint: HistoricalDataPoint, newPoint: HistoricalDataPoint): void {
    const totalSamples = (existingPoint.sampleCount || 1) + (newPoint.sampleCount || 1);
    const existingSamples = existingPoint.sampleCount || 1;
    const newSamples = newPoint.sampleCount || 1;

    // Calculate weighted averages
    existingPoint.temperature = (
      (existingPoint.temperature * existingSamples) + 
      (newPoint.temperature * newSamples)
    ) / totalSamples;

    existingPoint.humidity = (
      (existingPoint.humidity * existingSamples) + 
      (newPoint.humidity * newSamples)
    ) / totalSamples;

    existingPoint.light = (
      (existingPoint.light * existingSamples) + 
      (newPoint.light * newSamples)
    ) / totalSamples;

    // Update min/max values
    existingPoint.temperatureMin = Math.min(
      existingPoint.temperatureMin || existingPoint.temperature,
      newPoint.temperature
    );
    existingPoint.temperatureMax = Math.max(
      existingPoint.temperatureMax || existingPoint.temperature,
      newPoint.temperature
    );

    existingPoint.humidityMin = Math.min(
      existingPoint.humidityMin || existingPoint.humidity,
      newPoint.humidity
    );
    existingPoint.humidityMax = Math.max(
      existingPoint.humidityMax || existingPoint.humidity,
      newPoint.humidity
    );

    existingPoint.lightMin = Math.min(
      existingPoint.lightMin || existingPoint.light,
      newPoint.light
    );
    existingPoint.lightMax = Math.max(
      existingPoint.lightMax || existingPoint.light,
      newPoint.light
    );

    // Update timestamp to the latest and sample count
    existingPoint.timestamp = newPoint.timestamp;
    existingPoint.sampleCount = totalSamples;
  }

  /**
   * Clean up data points older than retention period
   */
  private cleanupOldData(): void {
    const cutoffTime = new Date(Date.now() - this.config.retentionPeriod * 60 * 60 * 1000);
    this.dataPoints = this.dataPoints.filter(point => point.timestamp >= cutoffTime);
  }

  /**
   * Optimize data for display based on time period
   */
  private optimizeDataForPeriod(data: HistoricalDataPoint[], period: TimePeriod): HistoricalDataPoint[] {
    // For longer periods, we might want to reduce the number of data points for better performance
    const maxPointsForChart = 200; // Reasonable number for chart display

    if (data.length <= maxPointsForChart) {
      return data;
    }

    // Calculate step size to reduce data points
    const step = Math.ceil(data.length / maxPointsForChart);
    const optimizedData: HistoricalDataPoint[] = [];

    for (let i = 0; i < data.length; i += step) {
      const chunk = data.slice(i, i + step);
      if (chunk.length === 1) {
        optimizedData.push(chunk[0]);
      } else {
        // Aggregate the chunk
        const aggregated = this.aggregateChunk(chunk);
        optimizedData.push(aggregated);
      }
    }

    return optimizedData;
  }

  /**
   * Aggregate a chunk of data points
   */
  private aggregateChunk(chunk: HistoricalDataPoint[]): HistoricalDataPoint {
    const totalSamples = chunk.reduce((sum, point) => sum + (point.sampleCount || 1), 0);
    
    const avgTemperature = chunk.reduce((sum, point) => 
      sum + point.temperature * (point.sampleCount || 1), 0) / totalSamples;
    const avgHumidity = chunk.reduce((sum, point) => 
      sum + point.humidity * (point.sampleCount || 1), 0) / totalSamples;
    const avgLight = chunk.reduce((sum, point) => 
      sum + point.light * (point.sampleCount || 1), 0) / totalSamples;

    return {
      timestamp: chunk[chunk.length - 1].timestamp, // Use latest timestamp
      temperature: avgTemperature,
      humidity: avgHumidity,
      light: avgLight,
      temperatureMin: Math.min(...chunk.map(p => p.temperatureMin || p.temperature)),
      temperatureMax: Math.max(...chunk.map(p => p.temperatureMax || p.temperature)),
      humidityMin: Math.min(...chunk.map(p => p.humidityMin || p.humidity)),
      humidityMax: Math.max(...chunk.map(p => p.humidityMax || p.humidity)),
      lightMin: Math.min(...chunk.map(p => p.lightMin || p.light)),
      lightMax: Math.max(...chunk.map(p => p.lightMax || p.light)),
      sampleCount: totalSamples
    };
  }
}

// Export singleton instance
export const environmentHistoryService = new EnvironmentHistoryService();