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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSupplementReminderJob = startSupplementReminderJob;
const node_cron_1 = __importDefault(require("node-cron"));
const web_push_1 = __importDefault(require("web-push"));
const supplement_service_1 = require("../services/supplement.service");
function startSupplementReminderJob() {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidEmail = process.env.VAPID_EMAIL || 'mailto:fittrack@example.com';
    if (!vapidPublicKey || !vapidPrivateKey) {
        console.log('⚠️  VAPID keys not set — supplement push notifications disabled');
        return;
    }
    web_push_1.default.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
    // Run every minute
    node_cron_1.default.schedule('* * * * *', async () => {
        try {
            const due = await (0, supplement_service_1.getSupplementsDueForNotification)();
            for (const row of due) {
                const payload = JSON.stringify({
                    title: '💊 Supplement Zamanı!',
                    body: `${row.name_tr} alma vakti geldi.`,
                    url: '/supplements',
                });
                try {
                    await web_push_1.default.sendNotification({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth_key } }, payload);
                    await (0, supplement_service_1.markNotificationSent)(row.id);
                }
                catch (pushErr) {
                    // Remove expired subscriptions (410 Gone)
                    if (pushErr.statusCode === 410) {
                        await Promise.resolve().then(() => __importStar(require('../db'))).then(({ default: pool }) => pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [row.endpoint]));
                    }
                    else {
                        console.error('Push send error:', pushErr.message);
                    }
                }
            }
        }
        catch (err) {
            console.error('Supplement reminder cron error:', err);
        }
    });
    console.log('✓ Supplement reminder cron job started');
}
