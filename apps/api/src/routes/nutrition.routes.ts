import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { addNutritionLogSchema, addWaterLogSchema, createFoodSchema } from '@fittrack/shared';
import {
  searchFoods,
  getFoodByBarcode,
  addNutritionLog,
  deleteNutritionLog,
  getDailyLogs,
  getNutritionSummary,
  addWaterLog,
  getDailyWater,
  getWeeklyHistory,
  createCustomFood,
} from '../controllers/nutrition.controller';

const router = Router();

// Public: food search
router.get('/foods', searchFoods);
router.get('/foods/barcode/:barcode', getFoodByBarcode);

// Auth required
router.use(requireAuth);
router.post('/foods', validate(createFoodSchema), createCustomFood);
router.post('/logs', validate(addNutritionLogSchema), addNutritionLog);
router.delete('/logs/:id', deleteNutritionLog);
router.get('/logs', getDailyLogs);
router.get('/summary', getNutritionSummary);
router.get('/history', getWeeklyHistory);
router.post('/water', validate(addWaterLogSchema), addWaterLog);
router.get('/water', getDailyWater);

export default router;
