import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  listPrograms,
  getProgram,
  enrollProgram,
  getActiveProgram,
  updateProgress,
  createProgram,
  getExerciseStrengthTrend,
  getCommunityPrograms,
  updateProgramVisibility,
} from '../controllers/program.controller';

const router = Router();

router.use(requireAuth);

router.get('/', listPrograms);
router.post('/', createProgram);
router.get('/active', getActiveProgram);
router.get('/community', getCommunityPrograms);
router.get('/strength-trend/:exerciseId', getExerciseStrengthTrend);
router.get('/:id', getProgram);
router.post('/:id/enroll', enrollProgram);
router.patch('/:id/progress', updateProgress);
router.patch('/:id/visibility', updateProgramVisibility);

export default router;
