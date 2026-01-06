import * as mqtt from 'mqtt';

// Plant IDs must match database seed
const PLANT_IDS = [
  'monstera',
  'snake-plant',
  'pothos',
  'fiddle-leaf',
  'spider-plant',
  'peace-lily'
];

// Telemetry ranges
const RANGES = {
  soilMoisture: { min: 0, max: 100 },
  light: { min: 0, max: 100 },
  temperature: { min: 15, max: 35 }
};

interface PlantState {
  soilMoisture: number;
  light: number;
  temperature: number;
}

interface TelemetryPayload {
  timestamp: string;
  soil_moisture: number;
  light: number;
  temperature: number;
}

// Initialize random state for each plant
const plantStates = new Map<string, PlantState>();

function initializePlantState(_plantId: string): PlantState {
  return {
    soilMoisture: 40 + Math.random() * 30,
    light: 50 + Math.random() * 30,
    temperature: 20 + Math.random() * 8
  };
}

// Random walk with bounds
function randomWalk(current: number, min: number, max: number, step: number = 2): number {
  const change = (Math.random() - 0.5) * step;
  let newValue = current + change;
  
  newValue = Math.max(min, Math.min(max, newValue));
  
  if (Math.random() < 0.05) {
    const spike = Math.random() > 0.5;
    if (spike) {
      newValue = Math.min(max, newValue + 10);
    } else {
      newValue = Math.max(min, newValue - 10);
    }
  }
  
  return newValue;
}

function updatePlantState(state: PlantState): PlantState {
  return {
    soilMoisture: randomWalk(
      state.soilMoisture,
      RANGES.soilMoisture.min,
      RANGES.soilMoisture.max,
      3
    ),
    light: randomWalk(
      state.light,
      RANGES.light.min,
      RANGES.light.max,
      5
    ),
    temperature: randomWalk(
      state.temperature,
      RANGES.temperature.min,
      RANGES.temperature.max,
      1
    )
  };
}

function createTelemetryPayload(state: PlantState): TelemetryPayload {
  return {
    timestamp: new Date().toISOString(),
    soil_moisture: Math.round(state.soilMoisture * 10) / 10,
    light: Math.round(state.light * 10) / 10,
    temperature: Math.round(state.temperature * 10) / 10
  };
}

async function main(): Promise<void> {
  const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://mosquitto:1883';
  
  console.log('[Simulator] Connecting to MQTT broker...');
  
  const clientId = 'plantops-simulator-' + Date.now();
  const client = mqtt.connect(brokerUrl, {
    clientId: clientId,
    clean: true,
    reconnectPeriod: 5000,
    connectTimeout: 30000
  });
  
  client.on('connect', () => {
    console.log('[Simulator] Connected to MQTT broker');
    console.log('[Simulator] Publishing telemetry for 6 plants every 10 seconds');
    
    PLANT_IDS.forEach(plantId => {
      plantStates.set(plantId, initializePlantState(plantId));
    });
    
    setInterval(() => {
      PLANT_IDS.forEach(plantId => {
        const state = plantStates.get(plantId);
        if (!state) return;
        
        const newState = updatePlantState(state);
        plantStates.set(plantId, newState);
        
        const payload = createTelemetryPayload(newState);
        const topic = 'plants/' + plantId + '/telemetry';
        
        client.publish(
          topic,
          JSON.stringify(payload),
          { qos: 1 },
          (err) => {
            if (err) {
              console.error('[Simulator] Error publishing:', err.message);
            } else {
              console.log('[Simulator] ' + topic + ':', JSON.stringify(payload));
            }
          }
        );
      });
    }, 10000);
  });
  
  client.on('error', (err) => {
    console.error('[Simulator] MQTT error:', err.message);
  });
  
  client.on('reconnect', () => {
    console.log('[Simulator] Reconnecting...');
  });
  
  client.on('close', () => {
    console.log('[Simulator] Connection closed');
  });
  
  client.on('offline', () => {
    console.log('[Simulator] Client offline');
  });
  
  process.on('SIGTERM', () => {
    console.log('[Simulator] Shutting down...');
    client.end(false, {}, () => {
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    console.log('[Simulator] Shutting down...');
    client.end(false, {}, () => {
      process.exit(0);
    });
  });
}

main().catch((err) => {
  console.error('[Simulator] Fatal error:', err);
  process.exit(1);
});
