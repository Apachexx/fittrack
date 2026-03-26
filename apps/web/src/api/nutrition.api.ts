import api from './client';
import type { Food, NutritionSummary } from '@fittrack/shared';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toFood(f: any): Food {
  return {
    id: f.id,
    name: f.name,
    brand: f.brand ?? null,
    calories: parseFloat(f.calories) || 0,
    proteinG: parseFloat(f.protein_g ?? f.proteinG) || 0,
    carbsG: parseFloat(f.carbs_g ?? f.carbsG) || 0,
    fatG: parseFloat(f.fat_g ?? f.fatG) || 0,
    barcode: f.barcode ?? null,
    servingSize: f.serving_size ?? f.servingSize ?? 100,
    servingUnit: f.serving_unit ?? f.servingUnit ?? 'g',
    isVerified: f.is_verified ?? f.isVerified ?? false,
  };
}

export const nutritionApi = {
  searchFoods: (q: string) =>
    api.get<unknown[]>('/nutrition/foods', { params: { q } }).then((r) => r.data.map(toFood)),
  getFoodByBarcode: (barcode: string) =>
    api.get<unknown>('/nutrition/foods/barcode/' + barcode).then((r) => toFood(r.data)),
  addLog: (data: { foodId: string; loggedAt: string; mealType: string; servings: number }) =>
    api.post('/nutrition/logs', data).then((r) => r.data),
  deleteLog: (id: string) => api.delete('/nutrition/logs/' + id),
  getDailyLogs: (date?: string) =>
    api.get('/nutrition/logs', { params: { date } }).then((r) => r.data),
  getSummary: (date?: string) =>
    api.get<NutritionSummary>('/nutrition/summary', { params: { date } }).then((r) => r.data),
  addWater: (data: { loggedAt: string; amountMl: number }) =>
    api.post('/nutrition/water', data).then((r) => r.data),
  getWater: (date?: string) =>
    api.get('/nutrition/water', { params: { date } }).then((r) => r.data),
};
