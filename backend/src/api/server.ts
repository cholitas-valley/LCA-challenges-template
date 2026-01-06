import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import plantsRouter from './routes/plants.js';
import healthRouter from './routes/health.js';
import { errorHandler, requestLogger } from './middleware/error-handler.js';

/**
 * Create and configure Express application
 */
export function createServer(): Express {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  app.use(cors({
    origin: corsOrigin,
    credentials: true,
  }));

  // Body parsing middleware
  app.use(express.json());

  // Request logging
  app.use(requestLogger);

  // Routes
  app.use('/api/health', healthRouter);
  app.use('/api/plants', plantsRouter);

  // Error handling (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Start Express server
 */
export function startServer(port: number): Promise<void> {
  const app = createServer();

  return new Promise((resolve) => {
    app.listen(port, () => {
      console.log(`Express API server listening on port ${port}`);
      resolve();
    });
  });
}
