"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
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
// DM image upload (base64 JSON — avoids multipart issues)
router.post('/dm/upload', (req, res) => {
    const { imageData, mimeType } = req.body || {};
    if (!imageData)
        return res.status(400).json({ error: 'imageData eksik' });
    const validMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const mime = validMimes.includes(mimeType) ? mimeType : 'image/jpeg';
    const ext = mime.split('/')[1];
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = path_1.default.join(upload_1.uploadDir, filename);
    try {
        const buffer = Buffer.from(imageData, 'base64');
        if (buffer.length > 15 * 1024 * 1024)
            return res.status(400).json({ error: 'Dosya çok büyük (max 15MB)' });
        if (!fs_1.default.existsSync(upload_1.uploadDir))
            fs_1.default.mkdirSync(upload_1.uploadDir, { recursive: true });
        fs_1.default.writeFileSync(filePath, buffer);
        const url = `/api/dm-image/${filename}`;
        console.log('[upload] ok:', url, 'user:', req.user?.id);
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
