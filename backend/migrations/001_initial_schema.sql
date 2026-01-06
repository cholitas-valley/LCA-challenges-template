-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create plants table
CREATE TABLE IF NOT EXISTS plants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  soil_moisture_min INTEGER NOT NULL,
  soil_moisture_max INTEGER NOT NULL,
  light_min INTEGER NOT NULL,
  temperature_min NUMERIC(5,2) NOT NULL,
  temperature_max NUMERIC(5,2) NOT NULL,
  alert_cooldown_minutes INTEGER NOT NULL DEFAULT 60,
  last_alert_sent_at TIMESTAMPTZ
);

-- Create telemetry hypertable
CREATE TABLE IF NOT EXISTS telemetry (
  timestamp TIMESTAMPTZ NOT NULL,
  plant_id TEXT NOT NULL,
  soil_moisture INTEGER NOT NULL,
  light INTEGER NOT NULL,
  temperature NUMERIC(5,2) NOT NULL,
  PRIMARY KEY (timestamp, plant_id),
  FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
);

-- Convert telemetry to hypertable (idempotent - only creates if not already a hypertable)
SELECT create_hypertable('telemetry', 'timestamp', if_not_exists => TRUE);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_telemetry_plant_id ON telemetry(plant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry(timestamp DESC);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  plant_id TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_to_discord BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
);

-- Create index for alerts queries
CREATE INDEX IF NOT EXISTS idx_alerts_plant_id ON alerts(plant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);

-- Insert seed data for 6 plants (idempotent)
INSERT INTO plants (id, name, soil_moisture_min, soil_moisture_max, light_min, temperature_min, temperature_max, alert_cooldown_minutes)
VALUES
  ('monstera', 'Monstera Deliciosa', 20, 80, 300, 18.0, 27.0, 60),
  ('snake-plant', 'Snake Plant', 15, 70, 200, 15.0, 29.0, 60),
  ('pothos', 'Pothos', 25, 85, 250, 17.0, 30.0, 60),
  ('fiddle-leaf', 'Fiddle Leaf Fig', 30, 85, 400, 18.0, 26.0, 60),
  ('spider-plant', 'Spider Plant', 20, 80, 300, 16.0, 28.0, 60),
  ('peace-lily', 'Peace Lily', 35, 90, 250, 18.0, 27.0, 60)
ON CONFLICT (id) DO NOTHING;
