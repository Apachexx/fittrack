import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  listPrograms,
  getProgram,
  enrollProgram,
  getActiveProgram,
  updateProgress,
} from '../controllers/program.controller';

const router = Router();

router.use(requireAuth);

router.get('/', listPrograms);
router.get('/active', getActiveProgram);
router.get('/:id', getProgram);
router.post('/:id/enroll', enrollProgram);
router.patch('/:id/progress', updateProgress);

export default router;
