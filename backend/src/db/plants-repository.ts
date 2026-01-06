import pool from './client.js';
import { PlantConfig, PlantWithTelemetry, PlantConfigUpdate } from '../schema/plant-config.js';

/**
 * Repository for plant CRUD operations
 */
export class PlantsRepository {
  /**
   * Get all plants with their latest telemetry
   */
  async getAllWithLatestTelemetry(): Promise<PlantWithTelemetry[]> {
    const query = `
      SELECT 
        p.id,
        p.name,
        p.soil_moisture_min,
        p.soil_moisture_max,
        p.light_min,
        p.temperature_min,
        p.temperature_max,
        p.alert_cooldown_minutes,
        p.last_alert_sent_at,
        t.timestamp AS latest_timestamp,
        t.soil_moisture AS latest_soil_moisture,
        t.light AS latest_light,
        t.temperature AS latest_temperature
      FROM plants p
      LEFT JOIN LATERAL (
        SELECT timestamp, soil_moisture, light, temperature
        FROM telemetry
        WHERE plant_id = p.id
        ORDER BY timestamp DESC
        LIMIT 1
      ) t ON true
      ORDER BY p.name
    `;

    const result = await pool.query(query);
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      soil_moisture_min: row.soil_moisture_min,
      soil_moisture_max: row.soil_moisture_max,
      light_min: row.light_min,
      temperature_min: parseFloat(row.temperature_min),
      temperature_max: parseFloat(row.temperature_max),
      alert_cooldown_minutes: row.alert_cooldown_minutes,
      last_alert_sent_at: row.last_alert_sent_at,
      latest_telemetry: row.latest_timestamp ? {
        timestamp: row.latest_timestamp,
        soil_moisture: row.latest_soil_moisture,
        light: row.latest_light,
        temperature: parseFloat(row.latest_temperature),
      } : null,
    }));
  }

  /**
   * Get plant by ID
   */
  async getById(plantId: string): Promise<PlantConfig | null> {
    const query = `
      SELECT 
        id, name, soil_moisture_min, soil_moisture_max, light_min,
        temperature_min, temperature_max, alert_cooldown_minutes, last_alert_sent_at
      FROM plants
      WHERE id = $1
    `;

    const result = await pool.query(query, [plantId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      soil_moisture_min: row.soil_moisture_min,
      soil_moisture_max: row.soil_moisture_max,
      light_min: row.light_min,
      temperature_min: parseFloat(row.temperature_min),
      temperature_max: parseFloat(row.temperature_max),
      alert_cooldown_minutes: row.alert_cooldown_minutes,
      last_alert_sent_at: row.last_alert_sent_at,
    };
  }

  /**
   * Get telemetry history for a plant with time bucketing
   */
  async getTelemetryHistory(
    plantId: string,
    hours: number
  ): Promise<Array<{ timestamp: Date; soil_moisture: number; light: number; temperature: number }>> {
    const query = `
      SELECT 
        time_bucket('5 minutes', timestamp) AS bucket,
        AVG(soil_moisture)::INTEGER AS soil_moisture,
        AVG(light)::INTEGER AS light,
        AVG(temperature)::NUMERIC(5,2) AS temperature
      FROM telemetry
      WHERE plant_id = $1
        AND timestamp >= NOW() - INTERVAL '1 hour' * $2
      GROUP BY bucket
      ORDER BY bucket ASC
    `;

    const result = await pool.query(query, [plantId, hours]);
    
    return result.rows.map(row => ({
      timestamp: row.bucket,
      soil_moisture: row.soil_moisture,
      light: row.light,
      temperature: parseFloat(row.temperature),
    }));
  }

  /**
   * Update plant configuration
   */
  async updateConfig(plantId: string, updates: PlantConfigUpdate): Promise<PlantConfig | null> {
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (updates.soil_moisture_min !== undefined) {
      updateFields.push('soil_moisture_min = $' + paramIndex);
      updateValues.push(updates.soil_moisture_min);
      paramIndex++;
    }
    if (updates.soil_moisture_max !== undefined) {
      updateFields.push('soil_moisture_max = $' + paramIndex);
      updateValues.push(updates.soil_moisture_max);
      paramIndex++;
    }
    if (updates.light_min !== undefined) {
      updateFields.push('light_min = $' + paramIndex);
      updateValues.push(updates.light_min);
      paramIndex++;
    }
    if (updates.temperature_min !== undefined) {
      updateFields.push('temperature_min = $' + paramIndex);
      updateValues.push(updates.temperature_min);
      paramIndex++;
    }
    if (updates.temperature_max !== undefined) {
      updateFields.push('temperature_max = $' + paramIndex);
      updateValues.push(updates.temperature_max);
      paramIndex++;
    }
    if (updates.alert_cooldown_minutes !== undefined) {
      updateFields.push('alert_cooldown_minutes = $' + paramIndex);
      updateValues.push(updates.alert_cooldown_minutes);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return this.getById(plantId);
    }

    updateValues.push(plantId);
    
    const query = `
      UPDATE plants
      SET ` + updateFields.join(', ') + `
      WHERE id = $` + paramIndex + `
      RETURNING 
        id, name, soil_moisture_min, soil_moisture_max, light_min,
        temperature_min, temperature_max, alert_cooldown_minutes, last_alert_sent_at
    `;

    const result = await pool.query(query, updateValues);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      soil_moisture_min: row.soil_moisture_min,
      soil_moisture_max: row.soil_moisture_max,
      light_min: row.light_min,
      temperature_min: parseFloat(row.temperature_min),
      temperature_max: parseFloat(row.temperature_max),
      alert_cooldown_minutes: row.alert_cooldown_minutes,
      last_alert_sent_at: row.last_alert_sent_at,
    };
  }
}

export const plantsRepository = new PlantsRepository();
