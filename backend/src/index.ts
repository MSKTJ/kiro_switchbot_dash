import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config';
import { validateSwitchBotCredentials } from './utils/switchbot-auth';
import { environmentRoutes } from './routes/environment.routes';
import { alertRoutes } from './routes/alert.routes';
import { deviceRoutes } from './routes/device.routes';
import { WebSocketService } from './services/websocket.service';

const app = express();
const server = createServer(app);

// CORS configuration
const corsOptions = {
  origin: config.frontendUrl,
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Socket.IO setup
const io = new Server(server, {
  cors: corsOptions
});

// Initialize WebSocket service
const webSocketService = new WebSocketService(io, {
  updateInterval: 10000, // 10 seconds
  maxRetries: 3,
  retryDelay: 5000 // 5 seconds
});

// Serve static files for testing
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  const switchbotConfigured = validateSwitchBotCredentials();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    switchbotConfigured
  });
});

// Serve WebSocket test page
app.get('/test', (req, res) => {
  res.sendFile('websocket-test.html', { root: __dirname + '/../' });
});

// API routes
app.get('/api/status', (req, res) => {
  res.json({
    message: 'SwitchBot Dashboard API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Environment data routes
app.use('/api/environment', environmentRoutes);

// Alert routes
app.use('/api/alerts', alertRoutes);

// Device routes
app.use('/api/devices', deviceRoutes);

// WebSocket status endpoint
app.get('/api/websocket/status', (req, res) => {
  res.json({
    success: true,
    data: webSocketService.getStatus()
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
server.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Frontend URL: ${config.frontendUrl}`);
  console.log(`🤖 SwitchBot configured: ${validateSwitchBotCredentials()}`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  webSocketService.shutdown();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  webSocketService.shutdown();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { app, io, webSocketService };