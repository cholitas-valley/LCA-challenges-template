import type { Plant } from '../db/worker-repository.js';
import type { AlertType, ThresholdBreach } from './threshold-checker.js';
import {
  getLastAlert,
  createAlert,
  updateLastAlertTime,
} from '../db/worker-repository.js';
import { sendDiscordNotification } from '../notifications/discord.js';

/**
 * Check if cooldown period has passed for a specific alert type
 */
export async function shouldCreateAlert(
  plant: Plant,
  alertType: AlertType
): Promise<boolean> {
  const lastAlert = await getLastAlert(plant.id, alertType);

  if (!lastAlert) {
    return true; // No previous alert, create new one
  }

  const cooldownMs = plant.alert_cooldown_minutes * 60 * 1000;
  const timeSinceLastAlert = Date.now() - lastAlert.timestamp.getTime();

  if (timeSinceLastAlert >= cooldownMs) {
    return true;
  }

  // Cooldown still active
  const minutesRemaining = Math.ceil((cooldownMs - timeSinceLastAlert) / 60000);
  console.log(
    `Alert suppressed for ${plant.name} (${alertType}): cooldown active (${minutesRemaining} minutes remaining)`
  );
  return false;
}

/**
 * Process a threshold breach: create alert and send Discord notification
 */
export async function processThresholdBreach(
  plant: Plant,
  breach: ThresholdBreach
): Promise<void> {
  // Check cooldown
  const shouldCreate = await shouldCreateAlert(plant, breach.alertType);
  if (!shouldCreate) {
    return;
  }

  // Format message for humans
  const fullMessage = `🌱 **${plant.name}** needs attention: ${breach.message}`;

  // Send Discord notification (if configured)
  let sentToDiscord = false;
  try {
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (discordWebhookUrl && discordWebhookUrl.trim() !== '') {
      await sendDiscordNotification(discordWebhookUrl, fullMessage);
      sentToDiscord = true;
      console.log(`Discord notification sent for ${plant.name}: ${breach.alertType}`);
    } else {
      console.log(`Discord webhook not configured, skipping notification for ${plant.name}`);
    }
  } catch (error) {
    console.error(
      `Failed to send Discord notification for ${plant.name}:`,
      error instanceof Error ? error.message : error
    );
    sentToDiscord = false;
  }

  // Create alert record in database
  try {
    const alert = await createAlert(plant.id, breach.alertType, breach.message, sentToDiscord);
    console.log(
      `Alert created: ${plant.name} - ${breach.alertType} (ID: ${alert.id}, Discord: ${sentToDiscord})`
    );

    // Update last_alert_sent_at for the plant
    await updateLastAlertTime(plant.id);
  } catch (error) {
    console.error(`Failed to create alert for ${plant.name}:`, error);
    throw error;
  }
}
