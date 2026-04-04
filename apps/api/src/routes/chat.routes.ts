import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { uploadDir } from '../middleware/upload';
import fs from 'fs';
import path from 'path';
import {
  getMessages, getFriends, getPendingRequests, getDMs, getUnreadCounts,
  searchUsers, getMe,
  getBans, unban, getBannedWords, addBannedWord, removeBannedWord,
  getModerators,
} from '../controllers/chat.controller';

const router = Router();
router.use(requireAuth);

router.get('/messages', getMessages);
router.get('/friends', getFriends);
router.get('/requests', getPendingRequests);
router.get('/dm/:userId', getDMs);
router.get('/unread', getUnreadCounts);
router.get('/users', searchUsers);
router.get('/me', getMe);

// DM image upload (base64 JSON — avoids multipart issues)
router.post('/dm/upload', (req: any, res: any) => {
  const { imageData, mimeType } = req.body || {};
  if (!imageData) return res.status(400).json({ error: 'imageData eksik' });
  const validMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const mime = validMimes.includes(mimeType) ? mimeType : 'image/jpeg';
  const ext = mime.split('/')[1];
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = path.join(uploadDir, filename);
  try {
    const buffer = Buffer.from(imageData, 'base64');
    if (buffer.length > 15 * 1024 * 1024) return res.status(400).json({ error: 'Dosya çok büyük (max 15MB)' });
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(filePath, buffer);
    const url = `/api/dm-image/${filename}`;
    console.log('[upload] ok:', url, 'user:', req.user?.id);
    res.json({ url });
  } catch (e: any) {
    console.error('[upload] error:', e.message);
    res.status(500).json({ error: 'Yükleme başarısız' });
  }
});

// Admin
router.get('/admin/mods', getModerators);
router.get('/admin/bans', getBans);
router.delete('/admin/bans/:id', unban);
router.get('/admin/words', getBannedWords);
router.post('/admin/words', addBannedWord);
router.delete('/admin/words/:id', removeBannedWord);

export default router;
