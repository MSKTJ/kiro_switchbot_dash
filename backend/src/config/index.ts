import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  switchbot: {
    token: process.env.SWITCHBOT_TOKEN || '',
    secret: process.env.SWITCHBOT_SECRET || '',
    baseUrl: 'https://api.switch-bot.com/v1.1'
  },
  defaultUpdateInterval: parseInt(process.env.DEFAULT_UPDATE_INTERVAL || '30', 10)
};

// Validate required environment variables
if (!config.switchbot.token || !config.switchbot.secret) {
  console.warn('Warning: SwitchBot API credentials not configured. Please set SWITCHBOT_TOKEN and SWITCHBOT_SECRET environment variables.');
}