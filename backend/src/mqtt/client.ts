import mqtt from 'mqtt';

/**
 * MQTT client singleton with automatic reconnection
 * 
 * Features:
 * - Exponential backoff for reconnection (1s -> 2s -> 4s -> max 30s)
 * - Event-based error handling
 * - Graceful disconnect on shutdown
 */
export class MqttClient {
  private client: mqtt.MqttClient | null = null;
  private reconnectDelay = 1000;
  private readonly MAX_RECONNECT_DELAY = 30000;
  private isShuttingDown = false;

  /**
   * Connect to MQTT broker
   */
  connect(brokerUrl: string, clientId: string): mqtt.MqttClient {
    if (this.client) {
      console.log('MQTT client already connected');
      return this.client;
    }

    console.log(`Connecting to MQTT broker at ${brokerUrl} with client ID: ${clientId}`);

    this.client = mqtt.connect(brokerUrl, {
      clientId,
      clean: true,
      reconnectPeriod: 0, // Disable automatic reconnect, we'll handle it manually
      connectTimeout: 10000,
    });

    // Connection success
    this.client.on('connect', () => {
      console.log('MQTT client connected successfully');
      this.reconnectDelay = 1000; // Reset backoff on successful connection
    });

    // Connection error
    this.client.on('error', (error) => {
      console.error('MQTT client error:', error);
    });

    // Offline event
    this.client.on('offline', () => {
      console.warn('MQTT client is offline');
      if (!this.isShuttingDown) {
        this.scheduleReconnect();
      }
    });

    // Close event
    this.client.on('close', () => {
      console.log('MQTT client connection closed');
      if (!this.isShuttingDown) {
        this.scheduleReconnect();
      }
    });

    return this.client;
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    console.log(`Scheduling reconnect in ${this.reconnectDelay}ms...`);

    setTimeout(() => {
      if (!this.isShuttingDown && this.client) {
        console.log('Attempting to reconnect...');
        this.client.reconnect();
      }
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.MAX_RECONNECT_DELAY);
  }

  /**
   * Get the MQTT client instance
   */
  getClient(): mqtt.MqttClient | null {
    return this.client;
  }

  /**
   * Check if MQTT client is connected
   */
  isConnected(): boolean {
    return this.client?.connected || false;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down MQTT client...');
    this.isShuttingDown = true;

    if (this.client && this.client.connected) {
      return new Promise((resolve) => {
        this.client!.end(false, {}, () => {
          console.log('MQTT client disconnected');
          resolve();
        });
      });
    }

    console.log('MQTT client shutdown complete');
  }
}

export const mqttClient = new MqttClient();

/**
 * Get MQTT connection status for health checks
 */
export function getMqttConnectionStatus(): string {
  if (!mqttClient.getClient()) {
    return 'not_initialized';
  }
  return mqttClient.isConnected() ? 'connected' : 'disconnected';
}
