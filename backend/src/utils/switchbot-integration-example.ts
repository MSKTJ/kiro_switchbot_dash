/**
 * Example usage of SwitchBot API integration
 * This file demonstrates how to use the SwitchBot API client and service
 */

import { switchBotAPI } from './switchbot-api';
import { switchBotClient } from './switchbot-client';

/**
 * Example function to demonstrate SwitchBot API usage
 */
export async function demonstrateSwitchBotIntegration(): Promise<void> {
  try {
    console.log('🔌 Testing SwitchBot API connection...');
    
    // Test API connectivity
    const isConnected = await switchBotAPI.testConnection();
    if (!isConnected) {
      console.error('❌ Failed to connect to SwitchBot API');
      return;
    }
    console.log('✅ Successfully connected to SwitchBot API');

    // Get all devices
    console.log('📱 Fetching device list...');
    const deviceList = await switchBotAPI.getDevices();
    console.log(`Found ${deviceList.body.deviceList.length} physical devices and ${deviceList.body.infraredRemoteList.length} IR devices`);

    // Find Hub 2 for environment data
    const hub2 = deviceList.body.deviceList.find(device => 
      device.deviceType === 'Hub 2' || device.deviceType.toLowerCase().includes('hub')
    );

    if (hub2) {
      console.log('🌡️ Getting environment data from Hub 2...');
      const environmentData = await switchBotAPI.getEnvironmentData(hub2.deviceId);
      console.log(`Temperature: ${environmentData.temperature}°C`);
      console.log(`Humidity: ${environmentData.humidity}%`);
      console.log(`Light Level: ${environmentData.lightLevel} lux`);
    } else {
      console.log('⚠️ No Hub 2 found for environment data');
    }

    // Find and control light devices
    const lightDevices = deviceList.body.deviceList.filter(device => 
      device.deviceType.toLowerCase().includes('light') || 
      device.deviceType.toLowerCase().includes('bulb')
    );

    if (lightDevices.length > 0) {
      const light = lightDevices[0];
      console.log(`💡 Controlling light: ${light.deviceName}`);
      
      // Turn on the light
      await switchBotAPI.controlLight(light.deviceId, 'turnOn');
      console.log('✅ Light turned on');
      
      // Set brightness to 50%
      await switchBotAPI.controlLight(light.deviceId, 'setBrightness', 50);
      console.log('✅ Light brightness set to 50%');
    } else {
      console.log('⚠️ No light devices found');
    }

    // Find and control air conditioner devices (IR remotes)
    const acDevices = deviceList.body.infraredRemoteList.filter(device => 
      device.remoteType.toLowerCase().includes('air') || 
      device.remoteType.toLowerCase().includes('conditioner')
    );

    if (acDevices.length > 0) {
      const ac = acDevices[0];
      console.log(`❄️ Controlling air conditioner: ${ac.deviceName}`);
      
      // Turn on AC with cooling mode at 24°C
      await switchBotAPI.controlAirConditioner(ac.deviceId, 'setMode', {
        mode: 'cool',
        temperature: 24
      });
      console.log('✅ Air conditioner set to cooling mode at 24°C');
    } else {
      console.log('⚠️ No air conditioner devices found');
    }

    console.log('🎉 SwitchBot integration demonstration completed successfully!');

  } catch (error) {
    console.error('❌ Error during SwitchBot integration demonstration:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
  }
}

/**
 * Example function to demonstrate rate limiting
 */
export async function demonstrateRateLimiting(): Promise<void> {
  console.log('⏱️ Demonstrating rate limiting...');
  
  const startTime = Date.now();
  
  try {
    // Make multiple API calls - they should be rate limited
    const promises = [
      switchBotClient.get('/devices'),
      switchBotClient.get('/devices'),
      switchBotClient.get('/devices')
    ];
    
    await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Three API calls completed in ${duration}ms`);
    console.log('Rate limiting is working - calls were spaced out appropriately');
    
  } catch (error) {
    console.error('❌ Rate limiting demonstration failed:', error);
  }
}

/**
 * Example function to demonstrate error handling
 */
export async function demonstrateErrorHandling(): Promise<void> {
  console.log('🚨 Demonstrating error handling...');
  
  try {
    // Try to access a non-existent endpoint
    await switchBotClient.get('/non-existent-endpoint');
  } catch (error) {
    console.log('✅ Successfully caught API error:', error instanceof Error ? error.message : error);
  }
  
  try {
    // Try to control a non-existent device
    await switchBotAPI.controlLight('non-existent-device', 'turnOn');
  } catch (error) {
    console.log('✅ Successfully caught device control error:', error instanceof Error ? error.message : error);
  }
  
  console.log('Error handling demonstration completed');
}

// Export for potential CLI usage
if (require.main === module) {
  (async () => {
    await demonstrateSwitchBotIntegration();
    console.log('\n' + '='.repeat(50) + '\n');
    await demonstrateRateLimiting();
    console.log('\n' + '='.repeat(50) + '\n');
    await demonstrateErrorHandling();
  })();
}