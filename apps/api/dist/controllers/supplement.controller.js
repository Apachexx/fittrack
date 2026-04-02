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
exports.listSupplements = listSupplements;
exports.getUserSupplements = getUserSupplements;
exports.addUserSupplement = addUserSupplement;
exports.updateUserSupplement = updateUserSupplement;
exports.removeUserSupplement = removeUserSupplement;
exports.getDailyLogs = getDailyLogs;
exports.markTaken = markTaken;
exports.unmarkTaken = unmarkTaken;
exports.savePushSubscription = savePushSubscription;
exports.deletePushSubscription = deletePushSubscription;
exports.getVapidPublicKey = getVapidPublicKey;
const supplementService = __importStar(require("../services/supplement.service"));
async function listSupplements(req, res) {
    try {
        const { category } = req.query;
        const supplements = await supplementService.listSupplements(category);
        res.json(supplements);
    }
    catch (err) {
        console.error('listSupplements error:', err);
        res.status(500).json({ error: 'Supplementler listelenemedi' });
    }
}
async function getUserSupplements(req, res) {
    try {
        const supplements = await supplementService.getUserSupplements(req.user.id);
        res.json(supplements);
    }
    catch (err) {
        console.error('getUserSupplements error:', err);
        res.status(500).json({ error: 'Supplement listeniz getirilemedi' });
    }
}
async function addUserSupplement(req, res) {
    try {
        const { supplementId, dose, scheduleTime } = req.body;
        if (!supplementId) {
            res.status(400).json({ error: 'supplementId gerekli' });
            return;
        }
        const result = await supplementService.addUserSupplement(req.user.id, supplementId, dose, scheduleTime);
        res.status(201).json(result);
    }
    catch (err) {
        console.error('addUserSupplement error:', err);
        res.status(500).json({ error: 'Supplement eklenemedi' });
    }
}
async function updateUserSupplement(req, res) {
    try {
        const { id } = req.params;
        const { dose, scheduleTime } = req.body;
        const result = await supplementService.updateUserSupplement(req.user.id, id, {
            dose,
            scheduleTime: scheduleTime !== undefined ? scheduleTime : undefined,
        });
        if (!result) {
            res.status(404).json({ error: 'Bulunamadı' });
            return;
        }
        res.json(result);
    }
    catch (err) {
        console.error('updateUserSupplement error:', err);
        res.status(500).json({ error: 'Supplement güncellenemedi' });
    }
}
async function removeUserSupplement(req, res) {
    try {
        await supplementService.removeUserSupplement(req.user.id, req.params.id);
        res.json({ ok: true });
    }
    catch (err) {
        console.error('removeUserSupplement error:', err);
        res.status(500).json({ error: 'Supplement silinemedi' });
    }
}
async function getDailyLogs(req, res) {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const logs = await supplementService.getDailyLogs(req.user.id, date);
        res.json(logs);
    }
    catch (err) {
        console.error('getDailyLogs error:', err);
        res.status(500).json({ error: 'Günlük loglar getirilemedi' });
    }
}
async function markTaken(req, res) {
    try {
        const { id } = req.params;
        const date = req.body.date || new Date().toISOString().split('T')[0];
        const result = await supplementService.markTaken(req.user.id, id, date);
        res.json({ ok: true, log: result });
    }
    catch (err) {
        console.error('markTaken error:', err);
        res.status(500).json({ error: 'İşaretlenemedi' });
    }
}
async function unmarkTaken(req, res) {
    try {
        const { id } = req.params;
        const date = req.query.date || new Date().toISOString().split('T')[0];
        await supplementService.unmarkTaken(req.user.id, id, date);
        res.json({ ok: true });
    }
    catch (err) {
        console.error('unmarkTaken error:', err);
        res.status(500).json({ error: 'İşaret kaldırılamadı' });
    }
}
async function savePushSubscription(req, res) {
    try {
        const { endpoint, keys } = req.body;
        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            res.status(400).json({ error: 'Geçersiz subscription verisi' });
            return;
        }
        await supplementService.savePushSubscription(req.user.id, endpoint, keys.p256dh, keys.auth);
        res.json({ ok: true });
    }
    catch (err) {
        console.error('savePushSubscription error:', err);
        res.status(500).json({ error: 'Bildirim aboneliği kaydedilemedi' });
    }
}
async function deletePushSubscription(req, res) {
    try {
        const { endpoint } = req.body;
        if (!endpoint) {
            res.status(400).json({ error: 'endpoint gerekli' });
            return;
        }
        await supplementService.deletePushSubscription(req.user.id, endpoint);
        res.json({ ok: true });
    }
    catch (err) {
        console.error('deletePushSubscription error:', err);
        res.status(500).json({ error: 'Bildirim aboneliği silinemedi' });
    }
}
async function getVapidPublicKey(_req, res) {
    const key = process.env.VAPID_PUBLIC_KEY;
    if (!key) {
        res.status(503).json({ error: 'Push bildirimleri yapılandırılmamış' });
        return;
    }
    res.json({ key });
}
