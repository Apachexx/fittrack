import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as nutritionService from '../services/nutrition.service';

export async function searchFoods(req: Request, res: Response): Promise<void> {
  try {
    const { q, limit } = req.query as { q?: string; limit?: string };
    if (!q) {
      res.status(400).json({ error: 'Arama terimi gerekli' });
      return;
    }
    const foods = await nutritionService.searchFoods(q, limit ? parseInt(limit) : 20);
    res.json(foods);
  } catch (err) {
    console.error('searchFoods error:', err);
    res.status(500).json({ error: 'Yiyecekler aranamadı' });
  }
}

export async function getFoodByBarcode(req: Request, res: Response): Promise<void> {
  try {
    const food = await nutritionService.getFoodByBarcode(req.params.barcode);
    if (!food) {
      res.status(404).json({ error: 'Barkod bulunamadı' });
      return;
    }
    res.json(food);
  } catch (err) {
    console.error('getFoodByBarcode error:', err);
    res.status(500).json({ error: 'Barkod sorgulanamadı' });
  }
}

export async function addNutritionLog(req: AuthRequest, res: Response): Promise<void> {
  try {
    const log = await nutritionService.addNutritionLog(req.user!.id, req.body);
    res.status(201).json(log);
  } catch (err) {
    console.error('addNutritionLog error:', err);
    res.status(500).json({ error: 'Beslenme kaydı eklenemedi' });
  }
}

export async function deleteNutritionLog(req: AuthRequest, res: Response): Promise<void> {
  try {
    await nutritionService.deleteNutritionLog(req.params.id, req.user!.id);
    res.status(204).send();
  } catch (err) {
    console.error('deleteNutritionLog error:', err);
    res.status(500).json({ error: 'Beslenme kaydı silinemedi' });
  }
}

export async function getDailyLogs(req: AuthRequest, res: Response): Promise<void> {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const logs = await nutritionService.getDailyLogs(req.user!.id, date);
    res.json(logs);
  } catch (err) {
    console.error('getDailyLogs error:', err);
    res.status(500).json({ error: 'Günlük kayıtlar alınamadı' });
  }
}

export async function getNutritionSummary(req: AuthRequest, res: Response): Promise<void> {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const summary = await nutritionService.getNutritionSummary(req.user!.id, date);
    res.json(summary);
  } catch (err) {
    console.error('getNutritionSummary error:', err);
    res.status(500).json({ error: 'Beslenme özeti alınamadı' });
  }
}

export async function addWaterLog(req: AuthRequest, res: Response): Promise<void> {
  try {
    const log = await nutritionService.addWaterLog(req.user!.id, req.body);
    res.status(201).json(log);
  } catch (err) {
    console.error('addWaterLog error:', err);
    res.status(500).json({ error: 'Su kaydı eklenemedi' });
  }
}

export async function getDailyWater(req: AuthRequest, res: Response): Promise<void> {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const water = await nutritionService.getDailyWater(req.user!.id, date);
    res.json(water);
  } catch (err) {
    console.error('getDailyWater error:', err);
    res.status(500).json({ error: 'Su verisi alınamadı' });
  }
}
