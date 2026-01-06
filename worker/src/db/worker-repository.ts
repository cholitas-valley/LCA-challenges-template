import { pool } from './client.js';

// Plant with threshold configuration
export interface Plant {
  id: string;
  name: string;
  soil_moisture_min: number;
  soil_moisture_max: number;
  light_min: number;
  temperature_min: number;
  temperature_max: number;
  alert_cooldown_minutes: number;
  last_alert_sent_at: Date | null;
}

// Latest telemetry reading
export interface Telemetry {
  timestamp: Date;
  plant_id: string;
  soil_moisture: number;
  light: number;
  temperature: number;
}

// Alert record
export interface Alert {
  id: number;
  timestamp: Date;
  plant_id: string;
  alert_type: string;
  message: string;
  sent_to_discord: boolean;
}

/**
 * Fetch all plants with their threshold configurations
 */
export async function getAllPlants(): Promise<Plant[]> {
  const result = await pool.query<Plant>(`
    SELECT id, name, soil_moisture_min, soil_moisture_max, light_min, 
           temperature_min, temperature_max, alert_cooldown_minutes, last_alert_sent_at
    FROM plants
    ORDER BY id
  `);
  return result.rows;
}

/**
 * Get the latest telemetry reading for a plant (within last 5 minutes)
 */
export async function getLatestTelemetry(plantId: string): Promise<Telemetry | null> {
  const result = await pool.query<Telemetry>(
    `
    SELECT timestamp, plant_id, soil_moisture, light, temperature
    FROM telemetry
    WHERE plant_id = $1
      AND timestamp >= NOW() - INTERVAL '5 minutes'
    ORDER BY timestamp DESC
    LIMIT 1
    `,
    [plantId]
  );
  return result.rows[0] || null;
}

/**
 * Get the most recent alert for a specific plant and alert type
 */
export async function getLastAlert(plantId: string, alertType: string): Promise<Alert | null> {
  const result = await pool.query<Alert>(
    `
    SELECT id, timestamp, plant_id, alert_type, message, sent_to_discord
    FROM alerts
    WHERE plant_id = $1 AND alert_type = $2
    ORDER BY timestamp DESC
    LIMIT 1
    `,
    [plantId, alertType]
  );
  return result.rows[0] || null;
}

/**
 * Create a new alert record
 */
export async function createAlert(
  plantId: string,
  alertType: string,
  message: string,
  sentToDiscord: boolean
): Promise<Alert> {
  const result = await pool.query<Alert>(
    `
    INSERT INTO alerts (plant_id, alert_type, message, sent_to_discord)
    VALUES ($1, $2, $3, $4)
    RETURNING id, timestamp, plant_id, alert_type, message, sent_to_discord
    `,
    [plantId, alertType, message, sentToDiscord]
  );
  return result.rows[0];
}

/**
 * Update the last_alert_sent_at timestamp for a plant
 */
export async function updateLastAlertTime(plantId: string): Promise<void> {
  await pool.query(
    `
    UPDATE plants
    SET last_alert_sent_at = NOW()
    WHERE id = $1
    `,
    [plantId]
  );
}
