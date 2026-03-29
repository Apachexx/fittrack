"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const shared_1 = require("@fittrack/shared");
const nutrition_controller_1 = require("../controllers/nutrition.controller");
const router = (0, express_1.Router)();
// Public: food search
router.get('/foods', nutrition_controller_1.searchFoods);
router.get('/foods/barcode/:barcode', nutrition_controller_1.getFoodByBarcode);
// Auth required
router.use(auth_1.requireAuth);
router.post('/foods', (0, validate_1.validate)(shared_1.createFoodSchema), nutrition_controller_1.createCustomFood);
router.post('/logs', (0, validate_1.validate)(shared_1.addNutritionLogSchema), nutrition_controller_1.addNutritionLog);
router.delete('/logs/:id', nutrition_controller_1.deleteNutritionLog);
router.get('/logs', nutrition_controller_1.getDailyLogs);
router.get('/summary', nutrition_controller_1.getNutritionSummary);
router.get('/history', nutrition_controller_1.getWeeklyHistory);
router.post('/water', (0, validate_1.validate)(shared_1.addWaterLogSchema), nutrition_controller_1.addWaterLog);
router.get('/water', nutrition_controller_1.getDailyWater);
exports.default = router;
