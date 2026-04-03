import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { dmUpload } from '../middleware/upload';
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

// DM image upload
router.post('/dm/upload', (req: any, res: any) => {
  dmUpload.single('image')(req, res, (err: any) => {
    if (err) {
      console.error('[upload] multer error:', err.message);
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı' });
    const url = `/api/dm-image/${req.file.filename}`;
    console.log('[upload] ok:', url, 'user:', req.user?.id);
    res.json({ url });
  });
});

// Admin
router.get('/admin/mods', getModerators);
router.get('/admin/bans', getBans);
router.delete('/admin/bans/:id', unban);
router.get('/admin/words', getBannedWords);
router.post('/admin/words', addBannedWord);
router.delete('/admin/words/:id', removeBannedWord);

export default router;
