import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  listSupplements,
  getUserSupplements,
  addUserSupplement,
  updateUserSupplement,
  removeUserSupplement,
  getDailyLogs,
  markTaken,
  unmarkTaken,
  savePushSubscription,
  deletePushSubscription,
  getVapidPublicKey,
} from '../controllers/supplement.controller';

const router = Router();

// Public catalog (no auth required)
router.get('/', listSupplements);

// All other routes require auth
router.use(requireAuth);

// VAPID public key
router.get('/push/vapid-key', getVapidPublicKey);

// Push subscriptions
router.post('/push/subscribe', savePushSubscription);
router.delete('/push/subscribe', deletePushSubscription);

// User's stack
router.get('/my', getUserSupplements);
router.post('/my', addUserSupplement);
router.put('/my/:id', updateUserSupplement);
router.delete('/my/:id', removeUserSupplement);

// Daily logs
router.get('/logs', getDailyLogs);
router.post('/logs/:id/take', markTaken);
router.delete('/logs/:id/take', unmarkTaken);

export default router;
