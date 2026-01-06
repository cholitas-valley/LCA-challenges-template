import pool from './client.js';
import { TelemetryRecord } from '../schema/telemetry.js';

/**
 * Repository for batched telemetry inserts into TimescaleDB
 * 
 * Implements batching strategy:
 * - Buffer messages until 100 messages accumulated OR
 * - 2 seconds elapsed since first message in batch
 * - Flush on demand (e.g., during graceful shutdown)
 */
export class TelemetryRepository {
  private batch: TelemetryRecord[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL_MS = 2000;
  private isShuttingDown = false;

  /**
   * Add a telemetry record to the batch
   * Automatically flushes when batch size is reached
   */
  async addTelemetry(record: TelemetryRecord): Promise<void> {
    if (this.isShuttingDown) {
      console.warn('Repository is shutting down, rejecting new telemetry');
      return;
    }

    this.batch.push(record);

    // Start flush timer if this is the first message in batch
    if (this.batch.length === 1) {
      this.startFlushTimer();
    }

    // Flush immediately if batch is full
    if (this.batch.length >= this.BATCH_SIZE) {
      await this.flush();
    }
  }

  /**
   * Start timer to flush batch after interval
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      return; // Timer already running
    }

    this.flushTimer = setTimeout(async () => {
      await this.flush();
    }, this.FLUSH_INTERVAL_MS);
  }

  /**
   * Clear the flush timer
   */
  private clearFlushTimer(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Flush all pending telemetry to database
   * Uses ON CONFLICT DO NOTHING to handle duplicate messages (QoS 1)
   */
  async flush(): Promise<void> {
    this.clearFlushTimer();

    if (this.batch.length === 0) {
      return;
    }

    const recordsToInsert = [...this.batch];
    this.batch = []; // Clear batch immediately

    try {
      const values: any[] = [];
      const placeholders: string[] = [];
      let paramIndex = 1;

      for (const record of recordsToInsert) {
        const ph = `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4})`;
        placeholders.push(ph);
        values.push(
          record.timestamp,
          record.plant_id,
          Math.round(record.soil_moisture),
          Math.round(record.light),
          record.temperature
        );
        paramIndex += 5;
      }

      const joinedPlaceholders = placeholders.join(', ');
      const query = `
        INSERT INTO telemetry (timestamp, plant_id, soil_moisture, light, temperature)
        VALUES ${joinedPlaceholders}
        ON CONFLICT (timestamp, plant_id) DO NOTHING
      `;

      const result = await pool.query(query, values);
      const inserted = result.rowCount || 0;
      const duplicates = recordsToInsert.length - inserted;
      console.log(`Flushed ${recordsToInsert.length} telemetry records (${inserted} inserted, ${duplicates} duplicates)`);
    } catch (error) {
      console.error('Failed to flush telemetry batch:', error);
      this.batch.unshift(...recordsToInsert);
      throw error;
    }
  }

  /**
   * Graceful shutdown: flush remaining batch and close
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down telemetry repository...');
    this.isShuttingDown = true;
    this.clearFlushTimer();
    
    if (this.batch.length > 0) {
      console.log(`Flushing remaining ${this.batch.length} records...`);
      await this.flush();
    }
    
    console.log('Telemetry repository shutdown complete');
  }

  /**
   * Get current batch size (for testing/monitoring)
   */
  getBatchSize(): number {
    return this.batch.length;
  }
}

export const telemetryRepository = new TelemetryRepository();
