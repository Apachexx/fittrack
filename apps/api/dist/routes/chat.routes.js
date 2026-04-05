"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const db_1 = __importDefault(require("../db"));
const chat_controller_1 = require("../controllers/chat.controller");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.get('/messages', chat_controller_1.getMessages);
router.get('/friends', chat_controller_1.getFriends);
router.get('/requests', chat_controller_1.getPendingRequests);
router.get('/dm/:userId', chat_controller_1.getDMs);
router.get('/unread', chat_controller_1.getUnreadCounts);
router.get('/users', chat_controller_1.searchUsers);
router.get('/me', chat_controller_1.getMe);
// DM image upload — saves to DB so images survive Railway redeploys
router.post('/dm/upload', async (req, res) => {
    const { imageData, mimeType } = req.body || {};
    if (!imageData)
        return res.status(400).json({ error: 'imageData eksik' });
    const validMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const mime = validMimes.includes(mimeType) ? mimeType : 'image/jpeg';
    try {
        const buffer = Buffer.from(imageData, 'base64');
        if (buffer.length > 15 * 1024 * 1024) {
            return res.status(400).json({ error: 'Dosya çok büyük (max 15MB)' });
        }
        const { rows } = await db_1.default.query('INSERT INTO dm_image_blobs (mime_type, data) VALUES ($1, $2) RETURNING id', [mime, buffer]);
        const url = `/api/dm-image/${rows[0].id}`;
        console.log('[upload] saved to DB:', rows[0].id, 'user:', req.user?.id);
        res.json({ url });
    }
    catch (e) {
        console.error('[upload] error:', e.message);
        res.status(500).json({ error: 'Yükleme başarısız' });
    }
});
// Admin
router.get('/admin/mods', chat_controller_1.getModerators);
router.get('/admin/bans', chat_controller_1.getBans);
router.delete('/admin/bans/:id', chat_controller_1.unban);
router.get('/admin/words', chat_controller_1.getBannedWords);
router.post('/admin/words', chat_controller_1.addBannedWord);
router.delete('/admin/words/:id', chat_controller_1.removeBannedWord);
exports.default = router;
