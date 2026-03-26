import { z } from 'zod';

export const addNutritionLogSchema = z.object({
  foodId: z.string().uuid(),
  loggedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih formatı YYYY-MM-DD olmalıdır'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  servings: z.number().positive(),
});

export const createFoodSchema = z.object({
  name: z.string().min(1),
  barcode: z.string().optional(),
  brand: z.string().optional(),
  calories: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
  servingSize: z.number().positive().optional(),
  servingUnit: z.string().default('g'),
});

export const addWaterLogSchema = z.object({
  loggedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amountMl: z.number().int().positive(),
});

export type AddNutritionLogInput = z.infer<typeof addNutritionLogSchema>;
export type CreateFoodInput = z.infer<typeof createFoodSchema>;
export type AddWaterLogInput = z.infer<typeof addWaterLogSchema>;
