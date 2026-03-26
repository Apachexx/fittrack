import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as nutritionService from '../services/nutrition.service';

export async function searchFoods(req: Request, res: Response): Promise<void> {
  const { q, limit } = req.query as { q?: string; limit?: string };
  if (!q) {
    res.status(400).json({ error: 'Arama terimi gerekli' });
    return;
  }
  const foods = await nutritionService.searchFoods(q, limit ? parseInt(limit) : 20);
  res.json(foods);
}

export async function getFoodByBarcode(req: Request, res: Response): Promise<void> {
  const food = await nutritionService.getFoodByBarcode(req.params.barcode);
  if (!food) {
    res.status(404).json({ error: 'Barkod bulunamadı' });
    return;
  }
  res.json(food);
}

export async function addNutritionLog(req: AuthRequest, res: Response): Promise<void> {
  const log = await nutritionService.addNutritionLog(req.user!.id, req.body);
  res.status(201).json(log);
}

export async function deleteNutritionLog(req: AuthRequest, res: Response): Promise<void> {
  await nutritionService.deleteNutritionLog(req.params.id, req.user!.id);
  res.status(204).send();
}

export async function getDailyLogs(req: AuthRequest, res: Response): Promise<void> {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const logs = await nutritionService.getDailyLogs(req.user!.id, date);
  res.json(logs);
}

export async function getNutritionSummary(req: AuthRequest, res: Response): Promise<void> {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const summary = await nutritionService.getNutritionSummary(req.user!.id, date);
  res.json(summary);
}

export async function addWaterLog(req: AuthRequest, res: Response): Promise<void> {
  const log = await nutritionService.addWaterLog(req.user!.id, req.body);
  res.status(201).json(log);
}

export async function getDailyWater(req: AuthRequest, res: Response): Promise<void> {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const water = await nutritionService.getDailyWater(req.user!.id, date);
  res.json(water);
}
