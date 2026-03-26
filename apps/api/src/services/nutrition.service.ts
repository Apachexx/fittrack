import { query, queryOne } from '../db';
import { cacheGet, cacheSet, cacheDel } from '../db/redis';

interface FoodRow {
  id: string;
  name: string;
  barcode: string | null;
  brand: string | null;
  calories: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  serving_size: string | null;
  serving_unit: string;
  is_verified: boolean;
}

interface NutritionLogRow {
  id: string;
  user_id: string;
  food_id: string;
  food_name: string;
  food_brand: string | null;
  calories: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  logged_at: string;
  meal_type: string;
  servings: string;
}

export async function searchFoods(q: string, limit = 20) {
  const cacheKey = `food:search:${q}:${limit}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return JSON.parse(cached);

  const results = await query<FoodRow>(
    `SELECT * FROM foods WHERE name ILIKE $1 OR brand ILIKE $1 ORDER BY is_verified DESC, name LIMIT $2`,
    [`%${q}%`, limit]
  );

  await cacheSet(cacheKey, JSON.stringify(results), 3600);
  return results;
}

export async function getFoodByBarcode(barcode: string) {
  const local = await queryOne<FoodRow>('SELECT * FROM foods WHERE barcode = $1', [barcode]);
  if (local) return local;

  // Open Food Facts fallback
  try {
    const timeout = parseInt(process.env.OPEN_FOOD_FACTS_TIMEOUT || '3000');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=product_name,brands,nutriments,serving_size`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (!response.ok) return null;
    const data = await response.json() as {
      status: number;
      product?: {
        product_name?: string;
        brands?: string;
        serving_size?: string;
        nutriments?: {
          'energy-kcal_100g'?: number;
          protein_100g?: number;
          carbohydrates_100g?: number;
          fat_100g?: number;
        };
      };
    };
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const nutriments = p.nutriments || {};

    // Veritabanına kaydet (cache)
    const saved = await queryOne<FoodRow>(
      `INSERT INTO foods (name, barcode, brand, calories, protein_g, carbs_g, fat_g, serving_size, serving_unit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (barcode) DO UPDATE SET name = EXCLUDED.name
       RETURNING *`,
      [
        p.product_name || 'Bilinmeyen Ürün',
        barcode,
        p.brands || null,
        nutriments['energy-kcal_100g'] || 0,
        nutriments['protein_100g'] || 0,
        nutriments['carbohydrates_100g'] || 0,
        nutriments['fat_100g'] || 0,
        100,
        'g',
      ]
    );
    return saved;
  } catch {
    return null;
  }
}

export async function addNutritionLog(
  userId: string,
  data: { foodId: string; loggedAt: string; mealType: string; servings: number }
) {
  const log = await queryOne(
    `INSERT INTO nutrition_logs (user_id, food_id, logged_at, meal_type, servings)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, data.foodId, data.loggedAt, data.mealType, data.servings]
  );

  // Cache'i temizle
  await cacheDel(`nutrition:summary:${userId}:${data.loggedAt}`);
  return log;
}

export async function deleteNutritionLog(id: string, userId: string): Promise<void> {
  await query('DELETE FROM nutrition_logs WHERE id = $1 AND user_id = $2', [id, userId]);
}

export async function getDailyLogs(userId: string, date: string) {
  return query<NutritionLogRow>(
    `SELECT nl.*, f.name AS food_name, f.brand AS food_brand,
            f.calories, f.protein_g, f.carbs_g, f.fat_g
     FROM nutrition_logs nl
     JOIN foods f ON f.id = nl.food_id
     WHERE nl.user_id = $1 AND nl.logged_at = $2
     ORDER BY nl.created_at`,
    [userId, date]
  );
}

export async function getNutritionSummary(userId: string, date: string) {
  const cacheKey = `nutrition:summary:${userId}:${date}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return JSON.parse(cached);

  const rows = await query<NutritionLogRow>(
    `SELECT nl.*, f.name AS food_name, f.brand AS food_brand,
            f.calories, f.protein_g, f.carbs_g, f.fat_g
     FROM nutrition_logs nl
     JOIN foods f ON f.id = nl.food_id
     WHERE nl.user_id = $1 AND nl.logged_at = $2
     ORDER BY nl.created_at`,
    [userId, date]
  );

  const summary = {
    date,
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    logs: rows.map((r) => {
      const servings = parseFloat(r.servings);
      const cal = parseFloat(r.calories) * servings;
      const protein = parseFloat(r.protein_g) * servings;
      const carbs = parseFloat(r.carbs_g) * servings;
      const fat = parseFloat(r.fat_g) * servings;
      return {
        id: r.id,
        foodId: r.food_id,
        foodName: r.food_name,
        brand: r.food_brand,
        mealType: r.meal_type,
        servings,
        calculatedCalories: Math.round(cal),
        calculatedProtein: Math.round(protein * 10) / 10,
        calculatedCarbs: Math.round(carbs * 10) / 10,
        calculatedFat: Math.round(fat * 10) / 10,
      };
    }),
  };

  for (const log of summary.logs) {
    summary.totalCalories += log.calculatedCalories;
    summary.totalProtein += log.calculatedProtein;
    summary.totalCarbs += log.calculatedCarbs;
    summary.totalFat += log.calculatedFat;
  }

  await cacheSet(cacheKey, JSON.stringify(summary), 300);
  return summary;
}

export async function addWaterLog(userId: string, data: { loggedAt: string; amountMl: number }) {
  return queryOne(
    'INSERT INTO water_logs (user_id, logged_at, amount_ml) VALUES ($1, $2, $3) RETURNING *',
    [userId, data.loggedAt, data.amountMl]
  );
}

export async function getDailyWater(userId: string, date: string) {
  const logs = await query(
    'SELECT * FROM water_logs WHERE user_id = $1 AND logged_at = $2 ORDER BY created_at',
    [userId, date]
  );
  const totalMl = (logs as Array<{ amount_ml: number }>).reduce((sum, l) => sum + l.amount_ml, 0);
  return { date, totalMl, logs };
}
