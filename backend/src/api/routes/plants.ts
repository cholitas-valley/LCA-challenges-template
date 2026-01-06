import { Router, Request, Response, NextFunction } from 'express';
import { plantsRepository } from '../../db/plants-repository.js';
import { PlantConfigUpdateSchema } from '../../schema/plant-config.js';

const router = Router();

/**
 * GET /api/plants
 * Get all plants with their latest telemetry
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const plants = await plantsRepository.getAllWithLatestTelemetry();
    res.json(plants);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/plants/:id/history
 * Get telemetry history for a specific plant
 * Query params: hours (default: 24, max: 168)
 */
router.get('/:id/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plantId = req.params.id;
    const hours = Math.min(parseInt(req.query.hours as string) || 24, 168);

    // Verify plant exists
    const plant = await plantsRepository.getById(plantId);
    if (!plant) {
      res.status(404).json({ error: 'Plant not found' });
      return;
    }

    const history = await plantsRepository.getTelemetryHistory(plantId, hours);
    res.json({
      plant_id: plantId,
      plant_name: plant.name,
      hours,
      data: history,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/plants/:id/config
 * Update plant configuration thresholds
 */
router.post('/:id/config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plantId = req.params.id;

    // Verify plant exists
    const plant = await plantsRepository.getById(plantId);
    if (!plant) {
      res.status(404).json({ error: 'Plant not found' });
      return;
    }

    // Validate request body
    const updates = PlantConfigUpdateSchema.parse(req.body);

    // Update configuration
    const updatedConfig = await plantsRepository.updateConfig(plantId, updates);
    
    if (!updatedConfig) {
      res.status(404).json({ error: 'Plant not found' });
      return;
    }

    res.json(updatedConfig);
  } catch (error) {
    next(error);
  }
});

export default router;
