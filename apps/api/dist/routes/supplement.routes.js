"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const supplement_controller_1 = require("../controllers/supplement.controller");
const router = (0, express_1.Router)();
// Public catalog (no auth required)
router.get('/', supplement_controller_1.listSupplements);
// All other routes require auth
router.use(auth_1.requireAuth);
// VAPID public key
router.get('/push/vapid-key', supplement_controller_1.getVapidPublicKey);
// Push subscriptions
router.post('/push/subscribe', supplement_controller_1.savePushSubscription);
router.delete('/push/subscribe', supplement_controller_1.deletePushSubscription);
// User's stack
router.get('/my', supplement_controller_1.getUserSupplements);
router.post('/my', supplement_controller_1.addUserSupplement);
router.put('/my/:id', supplement_controller_1.updateUserSupplement);
router.delete('/my/:id', supplement_controller_1.removeUserSupplement);
// Daily logs
router.get('/logs', supplement_controller_1.getDailyLogs);
router.post('/logs/:id/take', supplement_controller_1.markTaken);
router.delete('/logs/:id/take', supplement_controller_1.unmarkTaken);
exports.default = router;
