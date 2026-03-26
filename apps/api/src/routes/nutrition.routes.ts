import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { addNutritionLogSchema, addWaterLogSchema } from '@fittrack/shared';
import {
  searchFoods,
  getFoodByBarcode,
  addNutritionLog,
  deleteNutritionLog,
  getDailyLogs,
  getNutritionSummary,
  addWaterLog,
  getDailyWater,
} from '../controllers/nutrition.controller';

const router = Router();

// Halka açık: gıda arama
router.get('/foods', searchFoods);
router.get('/foods/barcode/:barcode', getFoodByBarcode);

// Kimlik doğrulama gerektiren
router.use(requireAuth);
router.post('/logs', validate(addNutritionLogSchema), addNutritionLog);
router.delete('/logs/:id', deleteNutritionLog);
router.get('/logs', getDailyLogs);
router.get('/summary', getNutritionSummary);
router.post('/water', validate(addWaterLogSchema), addWaterLog);
router.get('/water', getDailyWater);

export default router;
