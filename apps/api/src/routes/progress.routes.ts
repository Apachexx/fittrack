import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';
import * as progressService from '../services/progress.service';

const router = Router();

router.use(requireAuth);

router.get('/measurements', async (req: AuthRequest, res: Response) => {
  try {
    const measurements = await progressService.getBodyMeasurements(req.user!.id);
    res.json(measurements);
  } catch (err) {
    console.error('GET /measurements error:', err);
    res.status(500).json({ error: 'Ölçümler alınamadı' });
  }
});

router.post('/measurements', async (req: AuthRequest, res: Response) => {
  try {
    const measurement = await progressService.addBodyMeasurement(req.user!.id, req.body);
    res.status(201).json(measurement);
  } catch (err) {
    console.error('POST /measurements error:', err);
    res.status(500).json({ error: 'Ölçüm kaydedilemedi' });
  }
});

router.get('/weekly-summary', async (req: AuthRequest, res: Response) => {
  try {
    const weeks = req.query.weeks ? parseInt(req.query.weeks as string) : 12;
    const summary = await progressService.getWeeklySummary(req.user!.id, weeks);
    res.json(summary);
  } catch (err) {
    console.error('GET /weekly-summary error:', err);
    res.status(500).json({ error: 'Haftalık özet alınamadı' });
  }
});

router.get('/pr/:exerciseId', async (req: AuthRequest, res: Response) => {
  try {
    const history = await progressService.getPRHistory(req.user!.id, req.params.exerciseId);
    res.json(history);
  } catch (err) {
    console.error('GET /pr error:', err);
    res.status(500).json({ error: 'PR geçmişi alınamadı' });
  }
});

router.get('/muscle-distribution', async (req: AuthRequest, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const dist = await progressService.getMuscleGroupDistribution(req.user!.id, days);
    res.json(dist);
  } catch (err) {
    console.error('GET /muscle-distribution error:', err);
    res.status(500).json({ error: 'Kas grubu dağılımı alınamadı' });
  }
});

export default router;
