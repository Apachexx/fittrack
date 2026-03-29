"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.get('/', async (req, res) => {
    try {
        const { rows } = await db_1.default.query(`SELECT calorie_goal, protein_goal, carbs_goal, fat_goal,
              workouts_per_week, height_cm, weight_kg, water_goal_ml
       FROM users WHERE id = $1`, [req.user.id]);
        const row = rows[0] ?? {};
        res.json({
            calorieGoal: row.calorie_goal ?? 2000,
            proteinGoal: row.protein_goal ?? 150,
            carbsGoal: row.carbs_goal ?? 250,
            fatGoal: row.fat_goal ?? 65,
            workoutsPerWeekGoal: row.workouts_per_week ?? 4,
            heightCm: row.height_cm ?? 0,
            weightKg: parseFloat(row.weight_kg) || 0,
            waterGoalMl: row.water_goal_ml ?? 2500,
        });
    }
    catch (err) {
        console.error('GET /settings error:', err);
        res.status(500).json({ error: 'Ayarlar alınamadı' });
    }
});
router.put('/', async (req, res) => {
    const { calorieGoal, proteinGoal, carbsGoal, fatGoal, workoutsPerWeekGoal, heightCm, weightKg, waterGoalMl, } = req.body;
    try {
        await db_1.default.query(`UPDATE users SET
         calorie_goal      = COALESCE($1, calorie_goal),
         protein_goal      = COALESCE($2, protein_goal),
         carbs_goal        = COALESCE($3, carbs_goal),
         fat_goal          = COALESCE($4, fat_goal),
         workouts_per_week = COALESCE($5, workouts_per_week),
         height_cm         = COALESCE($6, height_cm),
         weight_kg         = COALESCE($7, weight_kg),
         water_goal_ml     = COALESCE($8, water_goal_ml)
       WHERE id = $9`, [calorieGoal, proteinGoal, carbsGoal, fatGoal,
            workoutsPerWeekGoal, heightCm, weightKg, waterGoalMl,
            req.user.id]);
        res.json({ ok: true });
    }
    catch (err) {
        console.error('PUT /settings error:', err);
        res.status(500).json({ error: 'Ayarlar kaydedilemedi' });
    }
});
exports.default = router;
