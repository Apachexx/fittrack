import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createWorkoutSchema, addSetSchema, createExerciseSchema } from '@fittrack/shared';
import {
  listWorkouts,
  getWorkout,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  addSet,
  listExercises,
  createExercise,
  getPersonalRecords,
} from '../controllers/workout.controller';

const router = Router();

router.use(requireAuth);

// Antrenmanlar
router.get('/', listWorkouts);
router.post('/', validate(createWorkoutSchema), createWorkout);
router.get('/exercises', listExercises);
router.post('/exercises', validate(createExerciseSchema), createExercise);
router.get('/personal-records', getPersonalRecords);
router.get('/:id', getWorkout);
router.put('/:id', updateWorkout);
router.delete('/:id', deleteWorkout);
router.post('/:id/sets', validate(addSetSchema), addSet);

export default router;
