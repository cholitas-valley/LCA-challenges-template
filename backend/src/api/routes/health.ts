import { Router, Request, Response } from 'express';
import pool from '../../db/client.js';
import { getMqttConnectionStatus } from '../../mqtt/client.js';

const router = Router();

/**
 * GET /api/health
 * Health check endpoint for service monitoring
 */
router.get('/', async (_req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'unknown',
    mqtt: 'unknown',
  };

  try {
    // Check database connection
    await pool.query('SELECT 1');
    health.database = 'connected';
  } catch (error) {
    health.database = 'disconnected';
    health.status = 'unhealthy';
    console.error('Database health check failed:', error);
  }

  try {
    // Check MQTT connection status
    health.mqtt = getMqttConnectionStatus();
    if (health.mqtt !== 'connected') {
      health.status = 'degraded';
    }
  } catch (error) {
    health.mqtt = 'error';
    health.status = 'degraded';
    console.error('MQTT health check failed:', error);
  }

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
