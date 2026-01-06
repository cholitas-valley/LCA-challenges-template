import { telemetrySubscriber } from './mqtt/subscriber.js';
import pool from './db/client.js';
import { startServer } from './api/server.js';

/**
 * PlantOps Backend - MQTT telemetry subscriber + REST API
 *
 * Subscribes to plant telemetry from MQTT broker
 * Validates and stores data in TimescaleDB
 * Serves REST API for frontend
 */
async function main(): Promise<void> {
  console.log('Starting PlantOps Backend...');

  // Configuration from environment
  const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://mosquitto:1883';
  const MQTT_CLIENT_ID = process.env.MQTT_CLIENT_ID || 'plantops-backend';
  const API_PORT = parseInt(process.env.API_PORT || '3001');

  // Validate database connection
  try {
    await pool.query('SELECT NOW()');
    console.log('Database connection verified');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }

  // Start Express API server
  try {
    await startServer(API_PORT);
    console.log(`Express API server started on port ${API_PORT}`);
  } catch (error) {
    console.error('Failed to start API server:', error);
    process.exit(1);
  }

  // Start MQTT subscriber
  telemetrySubscriber.start(MQTT_BROKER_URL, MQTT_CLIENT_ID);
  console.log('MQTT subscriber started');

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, starting graceful shutdown...`);

    try {
      await telemetrySubscriber.shutdown();
      await pool.end();
      console.log('Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  console.log('PlantOps Backend is running. Press Ctrl+C to stop.');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
