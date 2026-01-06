import { mqttClient } from './client.js';
import { TelemetryPayloadSchema, TelemetryRecord } from '../schema/telemetry.js';
import { telemetryRepository } from '../db/telemetry-repository.js';
import { ZodError } from 'zod';

/**
 * MQTT subscriber for plant telemetry
 * 
 * Subscribes to: plants/+/telemetry (QoS 1)
 * Validates payloads with Zod
 * Inserts into TimescaleDB via batched repository
 */
export class TelemetrySubscriber {
  private readonly TOPIC_PATTERN = 'plants/+/telemetry';
  private readonly QOS = 1;

  /**
   * Start subscribing to telemetry topics
   */
  start(brokerUrl: string, clientId: string): void {
    const client = mqttClient.connect(brokerUrl, clientId);

    client.on('connect', () => {
      console.log(`Subscribing to topic: ${this.TOPIC_PATTERN} with QoS ${this.QOS}`);
      
      client.subscribe(this.TOPIC_PATTERN, { qos: this.QOS }, (err, granted) => {
        if (err) {
          console.error('Failed to subscribe:', err);
          return;
        }
        console.log('Subscribed successfully:', granted);
      });
    });

    client.on('message', async (topic, payload) => {
      await this.handleMessage(topic, payload);
    });
  }

  /**
   * Handle incoming MQTT message
   */
  private async handleMessage(topic: string, payload: Buffer): Promise<void> {
    try {
      // Extract plant_id from topic: plants/<plant_id>/telemetry
      const plantId = this.extractPlantId(topic);
      if (!plantId) {
        console.warn(`Invalid topic format: ${topic}`);
        return;
      }

      // Parse JSON payload
      const rawPayload = payload.toString('utf-8');
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawPayload);
      } catch (parseError) {
        console.error(`Failed to parse JSON from topic ${topic}:`, parseError);
        return;
      }

      // Validate with Zod schema
      const validated = TelemetryPayloadSchema.parse(parsed);

      // Create telemetry record
      const record: TelemetryRecord = {
        timestamp: new Date(validated.timestamp),
        plant_id: plantId,
        soil_moisture: validated.soil_moisture,
        light: validated.light,
        temperature: validated.temperature,
      };

      // Add to repository batch
      await telemetryRepository.addTelemetry(record);

    } catch (error) {
      if (error instanceof ZodError) {
        console.error(`Validation error for topic ${topic}:`, error.errors);
      } else {
        console.error(`Error handling message from topic ${topic}:`, error);
      }
      // Don't crash on invalid messages - just log and continue
    }
  }

  /**
   * Extract plant_id from topic
   * Topic format: plants/<plant_id>/telemetry
   */
  private extractPlantId(topic: string): string | null {
    const match = topic.match(/^plants\/([^/]+)\/telemetry$/);
    return match ? match[1] : null;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down telemetry subscriber...');
    
    // Shutdown repository first (flushes pending batch)
    await telemetryRepository.shutdown();
    
    // Then disconnect MQTT client
    await mqttClient.shutdown();
    
    console.log('Telemetry subscriber shutdown complete');
  }
}

export const telemetrySubscriber = new TelemetrySubscriber();
