import { shouldCreateAlert, processThresholdBreach } from '../evaluator/alert-manager';
import type { Plant } from '../db/worker-repository';
import type { ThresholdBreach } from '../evaluator/threshold-checker';
import * as workerRepository from '../db/worker-repository';
import * as discord from '../notifications/discord';

// Mock dependencies
jest.mock('../db/worker-repository');
jest.mock('../notifications/discord');

describe('alert-manager', () => {
  const mockPlant: Plant = {
    id: 'plant-001',
    name: 'Test Plant',
    soil_moisture_min: 30,
    soil_moisture_max: 70,
    light_min: 40,
    temperature_min: 15,
    temperature_max: 30,
    alert_cooldown_minutes: 60,
    last_alert_sent_at: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    delete process.env.DISCORD_WEBHOOK_URL;
  });

  describe('shouldCreateAlert', () => {
    it('should return true when no previous alert exists', async () => {
      (workerRepository.getLastAlert as jest.Mock).mockResolvedValue(null);

      const result = await shouldCreateAlert(mockPlant, 'soil_moisture_low');

      expect(result).toBe(true);
      expect(workerRepository.getLastAlert).toHaveBeenCalledWith('plant-001', 'soil_moisture_low');
    });

    it('should return true when cooldown period has passed', async () => {
      const oldAlert = {
        id: 'alert-001',
        timestamp: new Date(Date.now() - 61 * 60 * 1000), // 61 minutes ago
        plant_id: 'plant-001',
        alert_type: 'soil_moisture_low',
        message: 'Low moisture',
        sent_to_discord: true,
      };

      (workerRepository.getLastAlert as jest.Mock).mockResolvedValue(oldAlert);

      const result = await shouldCreateAlert(mockPlant, 'soil_moisture_low');

      expect(result).toBe(true);
    });

    it('should return false when cooldown is still active', async () => {
      const recentAlert = {
        id: 'alert-001',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        plant_id: 'plant-001',
        alert_type: 'soil_moisture_low',
        message: 'Low moisture',
        sent_to_discord: true,
      };

      (workerRepository.getLastAlert as jest.Mock).mockResolvedValue(recentAlert);

      const result = await shouldCreateAlert(mockPlant, 'soil_moisture_low');

      expect(result).toBe(false);
    });

    it('should return true exactly at cooldown boundary', async () => {
      const exactAlert = {
        id: 'alert-001',
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // exactly 60 minutes ago
        plant_id: 'plant-001',
        alert_type: 'soil_moisture_low',
        message: 'Low moisture',
        sent_to_discord: true,
      };

      (workerRepository.getLastAlert as jest.Mock).mockResolvedValue(exactAlert);

      const result = await shouldCreateAlert(mockPlant, 'soil_moisture_low');

      expect(result).toBe(true);
    });

    it('should handle different alert types independently', async () => {
      // Last alert was for soil moisture, but we're checking light
      // Different type means no previous alert of this type
      (workerRepository.getLastAlert as jest.Mock).mockResolvedValue(null);

      const result = await shouldCreateAlert(mockPlant, 'light_low');

      expect(result).toBe(true);
    });
  });

  describe('processThresholdBreach', () => {
    const mockBreach: ThresholdBreach = {
      alertType: 'soil_moisture_low',
      message: 'Soil moisture is low (25%)',
      value: 25,
    };

    it('should not create alert when cooldown is active', async () => {
      const recentAlert = {
        id: 'alert-001',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        plant_id: 'plant-001',
        alert_type: 'soil_moisture_low',
        message: 'Low moisture',
        sent_to_discord: true,
      };

      (workerRepository.getLastAlert as jest.Mock).mockResolvedValue(recentAlert);

      await processThresholdBreach(mockPlant, mockBreach);

      expect(workerRepository.createAlert).not.toHaveBeenCalled();
      expect(discord.sendDiscordNotification).not.toHaveBeenCalled();
    });

    it('should create alert and send Discord notification when webhook is configured', async () => {
      process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/webhook/test';

      (workerRepository.getLastAlert as jest.Mock).mockResolvedValue(null);
      (discord.sendDiscordNotification as jest.Mock).mockResolvedValue(undefined);
      (workerRepository.createAlert as jest.Mock).mockResolvedValue({
        id: 'alert-123',
        timestamp: new Date(),
        plant_id: 'plant-001',
        alert_type: 'soil_moisture_low',
        message: 'Soil moisture is low (25%)',
        sent_to_discord: true,
      });
      (workerRepository.updateLastAlertTime as jest.Mock).mockResolvedValue(undefined);

      await processThresholdBreach(mockPlant, mockBreach);

      expect(discord.sendDiscordNotification).toHaveBeenCalledWith(
        'https://discord.com/webhook/test',
        expect.stringContaining('Test Plant')
      );
      expect(workerRepository.createAlert).toHaveBeenCalledWith(
        'plant-001',
        'soil_moisture_low',
        'Soil moisture is low (25%)',
        true
      );
      expect(workerRepository.updateLastAlertTime).toHaveBeenCalledWith('plant-001');
    });

    it('should create alert without Discord when webhook is not configured', async () => {
      (workerRepository.getLastAlert as jest.Mock).mockResolvedValue(null);
      (workerRepository.createAlert as jest.Mock).mockResolvedValue({
        id: 'alert-123',
        timestamp: new Date(),
        plant_id: 'plant-001',
        alert_type: 'soil_moisture_low',
        message: 'Soil moisture is low (25%)',
        sent_to_discord: false,
      });
      (workerRepository.updateLastAlertTime as jest.Mock).mockResolvedValue(undefined);

      await processThresholdBreach(mockPlant, mockBreach);

      expect(discord.sendDiscordNotification).not.toHaveBeenCalled();
      expect(workerRepository.createAlert).toHaveBeenCalledWith(
        'plant-001',
        'soil_moisture_low',
        'Soil moisture is low (25%)',
        false
      );
    });

    it('should handle Discord notification failure gracefully', async () => {
      process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/webhook/test';

      (workerRepository.getLastAlert as jest.Mock).mockResolvedValue(null);
      (discord.sendDiscordNotification as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );
      (workerRepository.createAlert as jest.Mock).mockResolvedValue({
        id: 'alert-123',
        timestamp: new Date(),
        plant_id: 'plant-001',
        alert_type: 'soil_moisture_low',
        message: 'Soil moisture is low (25%)',
        sent_to_discord: false,
      });
      (workerRepository.updateLastAlertTime as jest.Mock).mockResolvedValue(undefined);

      await processThresholdBreach(mockPlant, mockBreach);

      // Alert should still be created even if Discord fails
      expect(workerRepository.createAlert).toHaveBeenCalledWith(
        'plant-001',
        'soil_moisture_low',
        'Soil moisture is low (25%)',
        false
      );
    });

    it('should format message with plant name and emoji', async () => {
      process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/webhook/test';

      (workerRepository.getLastAlert as jest.Mock).mockResolvedValue(null);
      (discord.sendDiscordNotification as jest.Mock).mockResolvedValue(undefined);
      (workerRepository.createAlert as jest.Mock).mockResolvedValue({
        id: 'alert-123',
        timestamp: new Date(),
        plant_id: 'plant-001',
        alert_type: 'soil_moisture_low',
        message: 'Soil moisture is low (25%)',
        sent_to_discord: true,
      });
      (workerRepository.updateLastAlertTime as jest.Mock).mockResolvedValue(undefined);

      await processThresholdBreach(mockPlant, mockBreach);

      expect(discord.sendDiscordNotification).toHaveBeenCalledWith(
        expect.any(String),
        '🌱 **Test Plant** needs attention: Soil moisture is low (25%)'
      );
    });
  });
});
