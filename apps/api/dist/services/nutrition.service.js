"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchFoods = searchFoods;
exports.getFoodByBarcode = getFoodByBarcode;
exports.addNutritionLog = addNutritionLog;
exports.deleteNutritionLog = deleteNutritionLog;
exports.getDailyLogs = getDailyLogs;
exports.getNutritionSummary = getNutritionSummary;
exports.getWeeklyHistory = getWeeklyHistory;
exports.createCustomFood = createCustomFood;
exports.addWaterLog = addWaterLog;
exports.getDailyWater = getDailyWater;
const db_1 = require("../db");
const redis_1 = require("../db/redis");
async function searchFoods(q, limit = 20) {
    const cacheKey = `food:search:${q}:${limit}`;
    const cached = await (0, redis_1.cacheGet)(cacheKey);
    if (cached)
        return JSON.parse(cached);
    const results = await (0, db_1.query)(`SELECT * FROM foods WHERE name ILIKE $1 OR brand ILIKE $1 ORDER BY is_verified DESC, name LIMIT $2`, [`%${q}%`, limit]);
    await (0, redis_1.cacheSet)(cacheKey, JSON.stringify(results), 3600);
    return results;
}
async function getFoodByBarcode(barcode) {
    const local = await (0, db_1.queryOne)('SELECT * FROM foods WHERE barcode = $1', [barcode]);
    if (local)
        return local;
    // Open Food Facts fallback
    try {
        const timeout = parseInt(process.env.OPEN_FOOD_FACTS_TIMEOUT || '3000');
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=product_name,brands,nutriments,serving_size`, { signal: controller.signal });
        clearTimeout(timer);
        if (!response.ok)
            return null;
        const data = await response.json();
        if (data.status !== 1 || !data.product)
            return null;
        const p = data.product;
        const nutriments = p.nutriments || {};
        // Veritabanına kaydet (cache)
        const saved = await (0, db_1.queryOne)(`INSERT INTO foods (name, barcode, brand, calories, protein_g, carbs_g, fat_g, serving_size, serving_unit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (barcode) DO UPDATE SET name = EXCLUDED.name
       RETURNING *`, [
            p.product_name || 'Bilinmeyen Ürün',
            barcode,
            p.brands || null,
            nutriments['energy-kcal_100g'] || 0,
            nutriments['protein_100g'] || 0,
            nutriments['carbohydrates_100g'] || 0,
            nutriments['fat_100g'] || 0,
            100,
            'g',
        ]);
        return saved;
    }
    catch {
        return null;
    }
}
async function addNutritionLog(userId, data) {
    const log = await (0, db_1.queryOne)(`INSERT INTO nutrition_logs (user_id, food_id, logged_at, meal_type, servings)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`, [userId, data.foodId, data.loggedAt, data.mealType, data.servings]);
    // Cache'i temizle
    await (0, redis_1.cacheDel)(`nutrition:summary:${userId}:${data.loggedAt}`);
    return log;
}
async function deleteNutritionLog(id, userId) {
    await (0, db_1.query)('DELETE FROM nutrition_logs WHERE id = $1 AND user_id = $2', [id, userId]);
}
async function getDailyLogs(userId, date) {
    return (0, db_1.query)(`SELECT nl.*, f.name AS food_name, f.brand AS food_brand,
            f.calories, f.protein_g, f.carbs_g, f.fat_g
     FROM nutrition_logs nl
     JOIN foods f ON f.id = nl.food_id
     WHERE nl.user_id = $1 AND nl.logged_at = $2
     ORDER BY nl.created_at`, [userId, date]);
}
async function getNutritionSummary(userId, date) {
    const cacheKey = `nutrition:summary:${userId}:${date}`;
    const cached = await (0, redis_1.cacheGet)(cacheKey);
    if (cached)
        return JSON.parse(cached);
    const rows = await (0, db_1.query)(`SELECT nl.*, f.name AS food_name, f.brand AS food_brand,
            f.calories, f.protein_g, f.carbs_g, f.fat_g
     FROM nutrition_logs nl
     JOIN foods f ON f.id = nl.food_id
     WHERE nl.user_id = $1 AND nl.logged_at = $2
     ORDER BY nl.created_at`, [userId, date]);
    const summary = {
        date,
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        logs: rows.map((r) => {
            const servings = parseFloat(r.servings) || 0;
            const cal = (parseFloat(r.calories) || 0) * servings;
            const protein = (parseFloat(r.protein_g) || 0) * servings;
            const carbs = (parseFloat(r.carbs_g) || 0) * servings;
            const fat = (parseFloat(r.fat_g) || 0) * servings;
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
    await (0, redis_1.cacheSet)(cacheKey, JSON.stringify(summary), 300);
    return summary;
}
async function getWeeklyHistory(userId, days = 7) {
    const rows = await (0, db_1.query)(`SELECT logged_at::text,
            COALESCE(SUM(f.calories * nl.servings), 0)   AS total_calories,
            COALESCE(SUM(f.protein_g * nl.servings), 0)  AS total_protein,
            COALESCE(SUM(f.carbs_g * nl.servings), 0)    AS total_carbs,
            COALESCE(SUM(f.fat_g * nl.servings), 0)      AS total_fat
     FROM nutrition_logs nl
     JOIN foods f ON f.id = nl.food_id
     WHERE nl.user_id = $1
       AND nl.logged_at >= CURRENT_DATE - ($2 || ' days')::interval
     GROUP BY logged_at
     ORDER BY logged_at`, [userId, days]);
    return rows.map((r) => ({
        date: r.logged_at,
        calories: Math.round(parseFloat(r.total_calories)),
        protein: Math.round(parseFloat(r.total_protein) * 10) / 10,
        carbs: Math.round(parseFloat(r.total_carbs) * 10) / 10,
        fat: Math.round(parseFloat(r.total_fat) * 10) / 10,
    }));
}
async function createCustomFood(userId, data) {
    return (0, db_1.queryOne)(`INSERT INTO foods (name, brand, calories, protein_g, carbs_g, fat_g, serving_size, serving_unit, is_verified, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, $9) RETURNING *`, [
        data.name, data.brand ?? null, data.calories, data.proteinG, data.carbsG, data.fatG,
        data.servingSize ?? 100, data.servingUnit ?? 'g', userId,
    ]);
}
async function addWaterLog(userId, data) {
    return (0, db_1.queryOne)('INSERT INTO water_logs (user_id, logged_at, amount_ml) VALUES ($1, $2, $3) RETURNING *', [userId, data.loggedAt, data.amountMl]);
}
async function getDailyWater(userId, date) {
    const logs = await (0, db_1.query)('SELECT * FROM water_logs WHERE user_id = $1 AND logged_at = $2 ORDER BY created_at', [userId, date]);
    const logArray = Array.isArray(logs) ? logs : [];
    const totalMl = logArray.reduce((sum, l) => sum + (Number(l.amount_ml) || 0), 0);
    return { date, totalMl, logs };
}
