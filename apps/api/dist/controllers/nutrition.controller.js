"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchFoods = searchFoods;
exports.getFoodByBarcode = getFoodByBarcode;
exports.createCustomFood = createCustomFood;
exports.addNutritionLog = addNutritionLog;
exports.deleteNutritionLog = deleteNutritionLog;
exports.getDailyLogs = getDailyLogs;
exports.getNutritionSummary = getNutritionSummary;
exports.getWeeklyHistory = getWeeklyHistory;
exports.addWaterLog = addWaterLog;
exports.getDailyWater = getDailyWater;
const nutritionService = __importStar(require("../services/nutrition.service"));
async function searchFoods(req, res) {
    try {
        const { q, limit } = req.query;
        if (!q) {
            res.status(400).json({ error: 'Arama terimi gerekli' });
            return;
        }
        const foods = await nutritionService.searchFoods(q, limit ? parseInt(limit) : 30);
        res.json(foods);
    }
    catch (err) {
        console.error('searchFoods error:', err);
        res.status(500).json({ error: 'Yiyecekler aranamadı' });
    }
}
async function getFoodByBarcode(req, res) {
    try {
        const food = await nutritionService.getFoodByBarcode(req.params.barcode);
        if (!food) {
            res.status(404).json({ error: 'Barkod bulunamadı' });
            return;
        }
        res.json(food);
    }
    catch (err) {
        console.error('getFoodByBarcode error:', err);
        res.status(500).json({ error: 'Barkod sorgulanamadı' });
    }
}
async function createCustomFood(req, res) {
    try {
        const food = await nutritionService.createCustomFood(req.user.id, req.body);
        res.status(201).json(food);
    }
    catch (err) {
        console.error('createCustomFood error:', err);
        res.status(500).json({ error: 'Özel gıda oluşturulamadı' });
    }
}
async function addNutritionLog(req, res) {
    try {
        const log = await nutritionService.addNutritionLog(req.user.id, req.body);
        res.status(201).json(log);
    }
    catch (err) {
        console.error('addNutritionLog error:', err);
        res.status(500).json({ error: 'Beslenme kaydı eklenemedi' });
    }
}
async function deleteNutritionLog(req, res) {
    try {
        await nutritionService.deleteNutritionLog(req.params.id, req.user.id);
        res.status(204).send();
    }
    catch (err) {
        console.error('deleteNutritionLog error:', err);
        res.status(500).json({ error: 'Beslenme kaydı silinemedi' });
    }
}
async function getDailyLogs(req, res) {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const logs = await nutritionService.getDailyLogs(req.user.id, date);
        res.json(logs);
    }
    catch (err) {
        console.error('getDailyLogs error:', err);
        res.status(500).json({ error: 'Günlük kayıtlar alınamadı' });
    }
}
async function getNutritionSummary(req, res) {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const summary = await nutritionService.getNutritionSummary(req.user.id, date);
        res.json(summary);
    }
    catch (err) {
        console.error('getNutritionSummary error:', err);
        res.status(500).json({ error: 'Beslenme özeti alınamadı' });
    }
}
async function getWeeklyHistory(req, res) {
    try {
        const days = req.query.days ? parseInt(req.query.days) : 7;
        const history = await nutritionService.getWeeklyHistory(req.user.id, days);
        res.json(history);
    }
    catch (err) {
        console.error('getWeeklyHistory error:', err);
        res.status(500).json({ error: 'Geçmiş veriler alınamadı' });
    }
}
async function addWaterLog(req, res) {
    try {
        const log = await nutritionService.addWaterLog(req.user.id, req.body);
        res.status(201).json(log);
    }
    catch (err) {
        console.error('addWaterLog error:', err);
        res.status(500).json({ error: 'Su kaydı eklenemedi' });
    }
}
async function getDailyWater(req, res) {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const water = await nutritionService.getDailyWater(req.user.id, date);
        res.json(water);
    }
    catch (err) {
        console.error('getDailyWater error:', err);
        res.status(500).json({ error: 'Su verisi alınamadı' });
    }
}
