import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
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

// Admin
router.get('/admin/mods', getModerators);
router.get('/admin/bans', getBans);
router.delete('/admin/bans/:id', unban);
router.get('/admin/words', getBannedWords);
router.post('/admin/words', addBannedWord);
router.delete('/admin/words/:id', removeBannedWord);

export default router;
