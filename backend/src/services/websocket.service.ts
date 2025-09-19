/**
 * WebSocket service for real-time environment data broadcasting
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { environmentService, EnvironmentServiceError } from './environment.service';
import { environmentHistoryService, TimePeriod, HistoricalDataPoint } from './environment-history.service';
import { alertService } from './alert.service';
import { EnvironmentData } from '../models/environment';
import { Alert } from '../models/alert';

/**
 * WebSocket events interface
 */
export interface WebSocketEvents {
  // Server to client events
  environmentUpdate: EnvironmentData;
  historyUpdate: HistoricalDataPoint[];
  alertUpdate: Alert[];
  alertTriggered: Alert;
  alertDismissed: { alertId: string };
  error: { code: string; message: string };
  connectionStatus: { connected: boolean; timestamp: string };
  
  // Client to server events
  subscribeEnvironment: void;
  unsubscribeEnvironment: void;
  getHistory: TimePeriod;
}

/**
 * WebSocket service configuration
 */
interface WebSocketConfig {
  updateInterval: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
}

/**
 * Connected client information
 */
interface ConnectedClient {
  id: string;
  socket: Socket;
  subscribed: boolean;
  connectedAt: Date;
}

/**
 * WebSocket service for managing real-time communication
 */
export class WebSocketService {
  private io: SocketIOServer;
  private clients: Map<string, ConnectedClient> = new Map();
  private updateTimer: NodeJS.Timeout | null = null;
  private config: WebSocketConfig;
  private isRunning: boolean = false;
  private retryCount: number = 0;
  private lastEnvironmentData: EnvironmentData | null = null;

  constructor(io: SocketIOServer, config: Partial<WebSocketConfig> = {}) {
    this.io = io;
    this.config = {
      updateInterval: config.updateInterval || 10000, // 10 seconds default
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 5000 // 5 seconds
    };

    this.setupSocketHandlers();
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.handleClientConnection(socket);
    });
  }

  /**
   * Handle new client connection
   */
  private handleClientConnection(socket: Socket): void {
    const clientId = socket.id;
    
    console.log(`WebSocket client connected: ${clientId}`);
    
    // Add client to tracking
    this.clients.set(clientId, {
      id: clientId,
      socket,
      subscribed: false,
      connectedAt: new Date()
    });

    // Send connection status
    socket.emit('connectionStatus', {
      connected: true,
      timestamp: new Date().toISOString()
    });

    // Send last known environment data if available
    if (this.lastEnvironmentData) {
      socket.emit('environmentUpdate', this.lastEnvironmentData);
    }

    // Handle subscription to environment updates
    socket.on('subscribeEnvironment', () => {
      this.handleSubscribeEnvironment(clientId);
    });

    // Handle unsubscription from environment updates
    socket.on('unsubscribeEnvironment', () => {
      this.handleUnsubscribeEnvironment(clientId);
    });

    // Handle history data requests
    socket.on('getHistory', (period: TimePeriod) => {
      this.handleGetHistory(clientId, period);
    });

    // Handle client disconnection
    socket.on('disconnect', (reason) => {
      this.handleClientDisconnection(clientId, reason);
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
    });
  }

  /**
   * Handle client subscription to environment updates
   */
  private handleSubscribeEnvironment(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`Client ${clientId} subscribed to environment updates`);
    client.subscribed = true;

    // Start periodic updates if this is the first subscriber
    if (this.getSubscribedClientCount() === 1) {
      this.startPeriodicUpdates();
    }
  }

  /**
   * Handle client unsubscription from environment updates
   */
  private handleUnsubscribeEnvironment(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`Client ${clientId} unsubscribed from environment updates`);
    client.subscribed = false;

    // Stop periodic updates if no subscribers remain
    if (this.getSubscribedClientCount() === 0) {
      this.stopPeriodicUpdates();
    }
  }

  /**
   * Handle history data request
   */
  private handleGetHistory(clientId: string, period: TimePeriod): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`Client ${clientId} requested history for period: ${period}`);
    
    try {
      const historyData = environmentHistoryService.getHistoricalData(period);
      client.socket.emit('historyUpdate', historyData);
    } catch (error) {
      console.error(`Failed to get history data for client ${clientId}:`, error);
      client.socket.emit('error', {
        code: 'HISTORY_ERROR',
        message: 'Failed to retrieve historical data'
      });
    }
  }

  /**
   * Handle client disconnection
   */
  private handleClientDisconnection(clientId: string, reason: string): void {
    console.log(`WebSocket client disconnected: ${clientId}, reason: ${reason}`);
    
    const client = this.clients.get(clientId);
    if (client && client.subscribed) {
      // If this was a subscribed client, check if we should stop updates
      this.clients.delete(clientId);
      if (this.getSubscribedClientCount() === 0) {
        this.stopPeriodicUpdates();
      }
    } else {
      this.clients.delete(clientId);
    }
  }

  /**
   * Start periodic environment data updates
   */
  private startPeriodicUpdates(): void {
    if (this.isRunning) return;

    console.log(`Starting periodic environment updates (interval: ${this.config.updateInterval}ms)`);
    this.isRunning = true;
    this.retryCount = 0;

    // Fetch initial data immediately
    this.fetchAndBroadcastEnvironmentData();

    // Set up periodic updates
    this.updateTimer = setInterval(() => {
      this.fetchAndBroadcastEnvironmentData();
    }, this.config.updateInterval);
  }

  /**
   * Stop periodic environment data updates
   */
  private stopPeriodicUpdates(): void {
    if (!this.isRunning) return;

    console.log('Stopping periodic environment updates');
    this.isRunning = false;

    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  /**
   * Fetch environment data and broadcast to subscribed clients
   */
  private async fetchAndBroadcastEnvironmentData(): Promise<void> {
    try {
      const environmentData = await environmentService.getCurrentEnvironmentData();
      this.lastEnvironmentData = environmentData;
      this.retryCount = 0; // Reset retry count on success

      // Add to history
      environmentHistoryService.addDataPoint(environmentData);

      // Check for alerts
      const previousActiveAlerts = alertService.getActiveAlerts();
      const currentAlerts = alertService.checkEnvironmentData(environmentData);
      
      // Broadcast environment data to all subscribed clients
      this.broadcastToSubscribedClients('environmentUpdate', environmentData);
      
      // Broadcast alert updates
      this.broadcastToSubscribedClients('alertUpdate', currentAlerts);
      
      // Check for new alerts to trigger individual notifications
      const previousAlertIds = new Set(previousActiveAlerts.map(alert => alert.id));
      const newAlerts = currentAlerts.filter(alert => !previousAlertIds.has(alert.id));
      
      // Broadcast individual alert notifications for new alerts
      for (const newAlert of newAlerts) {
        this.broadcastToSubscribedClients('alertTriggered', newAlert);
      }

      console.log(`Environment data and ${currentAlerts.length} alerts broadcasted to ${this.getSubscribedClientCount()} clients`);
    } catch (error) {
      console.error('Failed to fetch environment data for broadcast:', error);
      
      this.retryCount++;
      
      // Broadcast error to subscribed clients
      const errorMessage = error instanceof EnvironmentServiceError 
        ? { code: error.code, message: error.message }
        : { code: 'FETCH_ERROR', message: 'Failed to fetch environment data' };
      
      this.broadcastToSubscribedClients('error', errorMessage);

      // If max retries exceeded, stop updates temporarily
      if (this.retryCount >= this.config.maxRetries) {
        console.warn(`Max retries (${this.config.maxRetries}) exceeded, stopping updates temporarily`);
        this.stopPeriodicUpdates();
        
        // Retry after delay
        setTimeout(() => {
          if (this.getSubscribedClientCount() > 0) {
            console.log('Retrying periodic updates after delay');
            this.startPeriodicUpdates();
          }
        }, this.config.retryDelay);
      }
    }
  }

  /**
   * Broadcast message to all subscribed clients
   */
  private broadcastToSubscribedClients<K extends keyof WebSocketEvents>(
    event: K, 
    data: WebSocketEvents[K]
  ): void {
    for (const client of this.clients.values()) {
      if (client.subscribed) {
        client.socket.emit(event, data);
      }
    }
  }

  /**
   * Get count of subscribed clients
   */
  private getSubscribedClientCount(): number {
    return Array.from(this.clients.values()).filter(client => client.subscribed).length;
  }

  /**
   * Get WebSocket service status
   */
  public getStatus() {
    return {
      isRunning: this.isRunning,
      connectedClients: this.clients.size,
      subscribedClients: this.getSubscribedClientCount(),
      updateInterval: this.config.updateInterval,
      retryCount: this.retryCount,
      lastUpdate: this.lastEnvironmentData?.timestamp?.toISOString() || null
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<WebSocketConfig>): void {
    const oldInterval = this.config.updateInterval;
    this.config = { ...this.config, ...newConfig };

    // If update interval changed and we're running, restart with new interval
    if (newConfig.updateInterval && newConfig.updateInterval !== oldInterval && this.isRunning) {
      this.stopPeriodicUpdates();
      if (this.getSubscribedClientCount() > 0) {
        this.startPeriodicUpdates();
      }
    }
  }

  /**
   * Manually trigger environment data fetch and broadcast
   */
  public async triggerUpdate(): Promise<void> {
    await this.fetchAndBroadcastEnvironmentData();
  }

  /**
   * Shutdown the WebSocket service
   */
  public shutdown(): void {
    console.log('Shutting down WebSocket service');
    this.stopPeriodicUpdates();
    
    // Notify all clients about shutdown
    for (const client of this.clients.values()) {
      client.socket.emit('connectionStatus', {
        connected: false,
        timestamp: new Date().toISOString()
      });
    }
    
    this.clients.clear();
  }
}