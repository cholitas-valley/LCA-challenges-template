import { testConnection, closePool } from './db/client.js';
import { getAllPlants, getLatestTelemetry } from './db/worker-repository.js';
import { checkThresholds } from './evaluator/threshold-checker.js';
import { processThresholdBreach } from './evaluator/alert-manager.js';

// Configurable evaluation interval (default: 30 seconds)
const WORKER_INTERVAL_SECONDS = parseInt(
  process.env.WORKER_INTERVAL_SECONDS || '30',
  10
);

// Retry configuration for database connection
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY_MS = 1000;

let isShuttingDown = false;
let evaluationTimer: NodeJS.Timeout | null = null;

/**
 * Main evaluation cycle
 */
async function evaluatePlants(): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  console.log('Starting evaluation cycle...');
  let alertCount = 0;
  let plantCount = 0;

  try {
    const plants = await getAllPlants();
    console.log(`Evaluating ${plants.length} plants`);

    for (const plant of plants) {
      if (isShuttingDown) {
        break;
      }

      plantCount++;
      const telemetry = await getLatestTelemetry(plant.id);

      if (!telemetry) {
        console.log(`No recent telemetry for ${plant.name} (skipping)`);
        continue;
      }

      // Check thresholds
      const breaches = checkThresholds(plant, telemetry);

      if (breaches.length > 0) {
        const alertTypes = breaches.map((b) => b.alertType).join(', ');
        console.log(`Threshold breaches detected for ${plant.name}: ${alertTypes}`);

        // Process each breach
        for (const breach of breaches) {
          try {
            await processThresholdBreach(plant, breach);
            alertCount++;
          } catch (error) {
            console.error(
              `Failed to process breach for ${plant.name}:`,
              error instanceof Error ? error.message : error
            );
          }
        }
      }
    }

    console.log(
      `Evaluation cycle complete: ${plantCount} plants evaluated, ${alertCount} alerts created`
    );
  } catch (error) {
    console.error('Error during evaluation cycle:', error);
  }
}

/**
 * Connect to database with retry logic
 */
async function connectWithRetry(): Promise<boolean> {
  let retries = 0;
  let delay = INITIAL_RETRY_DELAY_MS;

  while (retries < MAX_RETRIES && !isShuttingDown) {
    const connected = await testConnection();
    if (connected) {
      return true;
    }

    retries++;
    if (retries < MAX_RETRIES) {
      console.log(
        `Database connection failed, retrying in ${delay}ms (attempt ${retries}/${MAX_RETRIES})...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }

  return false;
}

/**
 * Start the worker loop
 */
async function startWorker(): Promise<void> {
  console.log('PlantOps Worker starting...');
  console.log(`Evaluation interval: ${WORKER_INTERVAL_SECONDS} seconds`);

  // Connect to database with retry
  const connected = await connectWithRetry();
  if (!connected) {
    console.error('Failed to connect to database after maximum retries');
    process.exit(1);
  }

  // Run initial evaluation
  await evaluatePlants();

  // Schedule periodic evaluations
  const intervalMs = WORKER_INTERVAL_SECONDS * 1000;
  evaluationTimer = setInterval(() => {
    evaluatePlants();
  }, intervalMs);

  console.log('Worker started successfully');
}

/**
 * Graceful shutdown handler
 */
async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  console.log(`Received ${signal}, starting graceful shutdown...`);
  isShuttingDown = true;

  // Stop scheduling new evaluations
  if (evaluationTimer) {
    clearInterval(evaluationTimer);
    evaluationTimer = null;
    console.log('Evaluation timer stopped');
  }

  // Close database pool
  try {
    await closePool();
  } catch (error) {
    console.error('Error closing database pool:', error);
  }

  console.log('Graceful shutdown complete');
  process.exit(0);
}

// Register signal handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  shutdown('unhandledRejection');
});

// Start the worker
startWorker().catch((error) => {
  console.error('Failed to start worker:', error);
  process.exit(1);
});
