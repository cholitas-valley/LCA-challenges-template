import axios from 'axios';

/**
 * Send a notification to Discord via webhook
 */
export async function sendDiscordNotification(
  webhookUrl: string,
  message: string
): Promise<void> {
  const timestamp = new Date().toISOString();
  const payload = {
    content: `${message}\n_${timestamp}_`,
  };

  try {
    await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000, // 5 second timeout
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 'unknown';
      const statusText = error.response?.statusText || error.message;
      throw new Error(`Discord webhook failed: ${status} ${statusText}`);
    }
    throw error;
  }
}
