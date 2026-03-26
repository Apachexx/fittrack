import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { registerSchema, loginSchema, refreshTokenSchema } from '@fittrack/shared';
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
} from '../controllers/auth.controller';

const router = Router();

router.post('/register', validate(registerSchema), registerHandler);
router.post('/login', validate(loginSchema), loginHandler);
router.post('/refresh', validate(refreshTokenSchema), refreshHandler);
router.delete('/logout', requireAuth, logoutHandler);

export default router;
