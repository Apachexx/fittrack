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
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const progressService = __importStar(require("../services/progress.service"));
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.get('/measurements', async (req, res) => {
    try {
        const measurements = await progressService.getBodyMeasurements(req.user.id);
        res.json(measurements);
    }
    catch (err) {
        console.error('GET /measurements error:', err);
        res.status(500).json({ error: 'Ölçümler alınamadı' });
    }
});
router.post('/measurements', async (req, res) => {
    try {
        const measurement = await progressService.addBodyMeasurement(req.user.id, req.body);
        res.status(201).json(measurement);
    }
    catch (err) {
        console.error('POST /measurements error:', err);
        res.status(500).json({ error: 'Ölçüm kaydedilemedi' });
    }
});
router.get('/weekly-summary', async (req, res) => {
    try {
        const weeks = req.query.weeks ? parseInt(req.query.weeks) : 12;
        const summary = await progressService.getWeeklySummary(req.user.id, weeks);
        res.json(summary);
    }
    catch (err) {
        console.error('GET /weekly-summary error:', err);
        res.status(500).json({ error: 'Haftalık özet alınamadı' });
    }
});
router.get('/pr/:exerciseId', async (req, res) => {
    try {
        const history = await progressService.getPRHistory(req.user.id, req.params.exerciseId);
        res.json(history);
    }
    catch (err) {
        console.error('GET /pr error:', err);
        res.status(500).json({ error: 'PR geçmişi alınamadı' });
    }
});
router.get('/muscle-distribution', async (req, res) => {
    try {
        const days = req.query.days ? parseInt(req.query.days) : 30;
        const dist = await progressService.getMuscleGroupDistribution(req.user.id, days);
        res.json(dist);
    }
    catch (err) {
        console.error('GET /muscle-distribution error:', err);
        res.status(500).json({ error: 'Kas grubu dağılımı alınamadı' });
    }
});
exports.default = router;
