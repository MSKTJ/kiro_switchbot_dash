import crypto from 'crypto';
import { config } from '../config';

/**
 * Generate authentication headers for SwitchBot API V1.1
 * @returns Authentication headers object
 */
export function generateSwitchBotHeaders(): Record<string, string> {
  const { token, secret } = config.switchbot;
  
  if (!token || !secret) {
    throw new Error('SwitchBot API credentials not configured');
  }

  const timestamp = Date.now().toString();
  const nonce = crypto.randomUUID();
  
  // Generate signature according to SwitchBot API V1.1 specification
  const data = token + timestamp + nonce;
  const sign = crypto.createHmac('sha256', secret).update(data).digest('base64');

  return {
    'Authorization': token,
    'sign': sign,
    't': timestamp,
    'nonce': nonce,
    'Content-Type': 'application/json'
  };
}

/**
 * Validate SwitchBot API credentials
 * @returns boolean indicating if credentials are valid
 */
export function validateSwitchBotCredentials(): boolean {
  const { token, secret } = config.switchbot;
  return !!(token && secret && token.length > 0 && secret.length > 0);
}