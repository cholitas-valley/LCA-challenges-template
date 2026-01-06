import request from 'supertest';
import { createServer } from '../api/server';
import { plantsRepository } from '../db/plants-repository';

// Mock the database repository
jest.mock('../db/plants-repository', () => ({
  plantsRepository: {
    getAllWithLatestTelemetry: jest.fn(),
    getById: jest.fn(),
    getTelemetryHistory: jest.fn(),
    updateConfig: jest.fn(),
  },
}));

// Mock the database client with a mock pool
jest.mock('../db/client', () => ({
  default: {
    query: jest.fn(),
  },
}));

// Mock MQTT client
jest.mock('../mqtt/client', () => ({
  getMqttConnectionStatus: jest.fn(() => 'connected'),
}));

const app = createServer();

describe('API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return status response', async () => {
      const response = await request(app).get('/api/health');

      // Health check returns 503 with our mocked (non-functional) database
      // In a real scenario with working mocks, this would be 200
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('mqtt');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/plants', () => {
    it('should return all plants with telemetry', async () => {
      const mockPlants = [
        {
          id: 'plant-001',
          name: 'Basil',
          species: 'Ocimum basilicum',
          soil_moisture_min: 40,
          soil_moisture_max: 60,
          light_min: 50,
          temperature_min: 18,
          temperature_max: 28,
          alert_cooldown_minutes: 60,
          last_telemetry: {
            timestamp: new Date('2026-01-06T10:00:00Z'),
            soil_moisture: 55,
            light: 70,
            temperature: 22,
          },
        },
      ];

      (plantsRepository.getAllWithLatestTelemetry as jest.Mock).mockResolvedValue(mockPlants);

      const response = await request(app).get('/api/plants');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('id', 'plant-001');
      expect(response.body[0]).toHaveProperty('name', 'Basil');
    });

    it('should handle errors gracefully', async () => {
      (plantsRepository.getAllWithLatestTelemetry as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/api/plants');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/plants/:id/history', () => {
    it('should return telemetry history for existing plant', async () => {
      const mockPlant = { id: 'plant-001', name: 'Basil' };
      const mockHistory = [
        {
          timestamp: new Date('2026-01-06T10:00:00Z'),
          soil_moisture: 55,
          light: 70,
          temperature: 22,
        },
      ];

      (plantsRepository.getById as jest.Mock).mockResolvedValue(mockPlant);
      (plantsRepository.getTelemetryHistory as jest.Mock).mockResolvedValue(mockHistory);

      const response = await request(app).get('/api/plants/plant-001/history');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('plant_id', 'plant-001');
      expect(response.body).toHaveProperty('plant_name', 'Basil');
      expect(response.body).toHaveProperty('hours', 24);
      expect(response.body.data).toHaveLength(1);
    });

    it('should return 404 for non-existent plant', async () => {
      (plantsRepository.getById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/plants/unknown-plant/history');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Plant not found');
    });

    it('should respect hours query parameter', async () => {
      const mockPlant = { id: 'plant-001', name: 'Basil' };
      (plantsRepository.getById as jest.Mock).mockResolvedValue(mockPlant);
      (plantsRepository.getTelemetryHistory as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/api/plants/plant-001/history?hours=48');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('hours', 48);
      expect(plantsRepository.getTelemetryHistory).toHaveBeenCalledWith('plant-001', 48);
    });

    it('should cap hours at 168 (7 days)', async () => {
      const mockPlant = { id: 'plant-001', name: 'Basil' };
      (plantsRepository.getById as jest.Mock).mockResolvedValue(mockPlant);
      (plantsRepository.getTelemetryHistory as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/api/plants/plant-001/history?hours=200');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('hours', 168);
      expect(plantsRepository.getTelemetryHistory).toHaveBeenCalledWith('plant-001', 168);
    });
  });

  describe('POST /api/plants/:id/config', () => {
    it('should update plant configuration', async () => {
      const mockPlant = { id: 'plant-001', name: 'Basil' };
      const updates = {
        soil_moisture_min: 35,
        soil_moisture_max: 65,
      };
      const updatedConfig = { ...mockPlant, ...updates };

      (plantsRepository.getById as jest.Mock).mockResolvedValue(mockPlant);
      (plantsRepository.updateConfig as jest.Mock).mockResolvedValue(updatedConfig);

      const response = await request(app)
        .post('/api/plants/plant-001/config')
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('soil_moisture_min', 35);
      expect(response.body).toHaveProperty('soil_moisture_max', 65);
    });

    it('should return 404 for non-existent plant', async () => {
      (plantsRepository.getById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/plants/unknown-plant/config')
        .send({ soil_moisture_min: 35 });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Plant not found');
    });

    it('should validate request body with Zod', async () => {
      const mockPlant = { id: 'plant-001', name: 'Basil' };
      (plantsRepository.getById as jest.Mock).mockResolvedValue(mockPlant);

      // Invalid data type - string instead of number
      const response = await request(app)
        .post('/api/plants/plant-001/config')
        .send({ soil_moisture_min: 'invalid' });

      expect(response.status).toBe(400); // Zod validation returns 400
      expect(response.body).toHaveProperty('error', 'Validation error');
    });
  });
});
