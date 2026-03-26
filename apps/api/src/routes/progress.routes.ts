import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';
import * as progressService from '../services/progress.service';

const router = Router();

router.use(requireAuth);

router.get('/measurements', async (req: AuthRequest, res: Response) => {
  const measurements = await progressService.getBodyMeasurements(req.user!.id);
  res.json(measurements);
});

router.post('/measurements', async (req: AuthRequest, res: Response) => {
  const measurement = await progressService.addBodyMeasurement(req.user!.id, req.body);
  res.status(201).json(measurement);
});

router.get('/weekly-summary', async (req: AuthRequest, res: Response) => {
  const weeks = req.query.weeks ? parseInt(req.query.weeks as string) : 12;
  const summary = await progressService.getWeeklySummary(req.user!.id, weeks);
  res.json(summary);
});

router.get('/pr/:exerciseId', async (req: AuthRequest, res: Response) => {
  const history = await progressService.getPRHistory(req.user!.id, req.params.exerciseId);
  res.json(history);
});

router.get('/muscle-distribution', async (req: AuthRequest, res: Response) => {
  const days = req.query.days ? parseInt(req.query.days as string) : 30;
  const dist = await progressService.getMuscleGroupDistribution(req.user!.id, days);
  res.json(dist);
});

export default router;
