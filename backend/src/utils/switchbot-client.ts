import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { config } from '../config';
import { generateSwitchBotHeaders } from './switchbot-auth';

/**
 * Rate limiter for SwitchBot API calls
 * SwitchBot API allows 1000 requests per day, approximately 1 request per 86.4 seconds
 * We'll be more conservative and limit to 1 request per 10 seconds
 */
class RateLimiter {
  private lastRequestTime: number = 0;
  private readonly minInterval: number = 10000; // 10 seconds in milliseconds

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }
}

/**
 * Retry configuration for API calls
 */
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

/**
 * SwitchBot API error types
 */
export class SwitchBotAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'SwitchBotAPIError';
  }
}

/**
 * SwitchBot API client with rate limiting, retry logic, and error handling
 */
export class SwitchBotClient {
  private axiosInstance: AxiosInstance;
  private rateLimiter: RateLimiter;
  private retryConfig: RetryConfig;

  constructor() {
    this.rateLimiter = new RateLimiter();
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 10000  // 10 seconds
    };

    this.axiosInstance = axios.create({
      baseURL: config.switchbot.baseUrl,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor for authentication
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const authHeaders = generateSwitchBotHeaders();
        Object.assign(config.headers, authHeaders);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => this.handleResponseError(error)
    );
  }

  /**
   * Handle response errors and convert them to SwitchBotAPIError
   */
  private handleResponseError(error: AxiosError): Promise<never> {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      const errorMessage = this.extractErrorMessage(data);
      
      throw new SwitchBotAPIError(
        `SwitchBot API error: ${errorMessage}`,
        status,
        this.extractErrorCode(data),
        error
      );
    } else if (error.request) {
      // Request was made but no response received
      throw new SwitchBotAPIError(
        'Network error: No response from SwitchBot API',
        undefined,
        'NETWORK_ERROR',
        error
      );
    } else {
      // Something else happened
      throw new SwitchBotAPIError(
        `Request setup error: ${error.message}`,
        undefined,
        'REQUEST_ERROR',
        error
      );
    }
  }

  /**
   * Extract error message from API response
   */
  private extractErrorMessage(data: any): string {
    if (typeof data === 'object' && data !== null) {
      return data.message || data.error || 'Unknown API error';
    }
    return 'Unknown API error';
  }

  /**
   * Extract error code from API response
   */
  private extractErrorCode(data: any): string | undefined {
    if (typeof data === 'object' && data !== null) {
      return data.statusCode || data.code;
    }
    return undefined;
  }

  /**
   * Calculate delay for exponential backoff
   */
  private calculateDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(2, attempt);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Determine if error is retryable
   */
  private isRetryableError(error: SwitchBotAPIError): boolean {
    // Retry on network errors or server errors (5xx)
    if (error.errorCode === 'NETWORK_ERROR') return true;
    if (error.statusCode && error.statusCode >= 500) return true;
    
    // Retry on rate limit errors (429)
    if (error.statusCode === 429) return true;
    
    // Don't retry on client errors (4xx except 429)
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return false;
    }
    
    return true;
  }

  /**
   * Execute API request with rate limiting and retry logic
   */
  private async executeWithRetry<T>(
    requestFn: () => Promise<AxiosResponse<T>>
  ): Promise<T> {
    let lastError: SwitchBotAPIError;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        // Apply rate limiting
        await this.rateLimiter.waitIfNeeded();
        
        // Execute the request
        const response = await requestFn();
        return response.data;
      } catch (error) {
        lastError = error instanceof SwitchBotAPIError ? error : 
          new SwitchBotAPIError('Unknown error occurred', undefined, undefined, error);

        // Don't retry on the last attempt or if error is not retryable
        if (attempt === this.retryConfig.maxRetries || !this.isRetryableError(lastError)) {
          throw lastError;
        }

        // Wait before retrying
        const delay = this.calculateDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * GET request with retry logic
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.executeWithRetry(() => this.axiosInstance.get<T>(endpoint));
  }

  /**
   * POST request with retry logic
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.executeWithRetry(() => this.axiosInstance.post<T>(endpoint, data));
  }

  /**
   * PUT request with retry logic
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.executeWithRetry(() => this.axiosInstance.put<T>(endpoint, data));
  }

  /**
   * DELETE request with retry logic
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.executeWithRetry(() => this.axiosInstance.delete<T>(endpoint));
  }

  /**
   * Health check method to test API connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/devices');
      return true;
    } catch (error) {
      console.error('SwitchBot API health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const switchBotClient = new SwitchBotClient();