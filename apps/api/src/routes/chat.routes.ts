import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import pool from '../db';
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

// DM image upload — saves to DB so images survive Railway redeploys
router.post('/dm/upload', async (req: any, res: any) => {
  const { imageData, mimeType } = req.body || {};
  if (!imageData) return res.status(400).json({ error: 'imageData eksik' });

  const validMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const mime = validMimes.includes(mimeType) ? mimeType : 'image/jpeg';

  try {
    const buffer = Buffer.from(imageData, 'base64');
    if (buffer.length > 15 * 1024 * 1024) {
      return res.status(400).json({ error: 'Dosya çok büyük (max 15MB)' });
    }
    const { rows } = await pool.query(
      'INSERT INTO dm_image_blobs (mime_type, data) VALUES ($1, $2) RETURNING id',
      [mime, buffer]
    );
    const url = `/api/dm-image/${rows[0].id}`;
    console.log('[upload] saved to DB:', rows[0].id, 'user:', req.user?.id);
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
