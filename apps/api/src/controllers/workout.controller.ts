import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as workoutService from '../services/workout.service';

export async function listWorkouts(req: AuthRequest, res: Response): Promise<void> {
  const workouts = await workoutService.listWorkouts(req.user!.id);
  res.json(workouts);
}

export async function getWorkout(req: AuthRequest, res: Response): Promise<void> {
  const workout = await workoutService.getWorkout(req.params.id, req.user!.id);
  if (!workout) {
    res.status(404).json({ error: 'Antrenman bulunamadı' });
    return;
  }
  res.json(workout);
}

export async function createWorkout(req: AuthRequest, res: Response): Promise<void> {
  const { name, notes } = req.body;
  const workout = await workoutService.createWorkout(req.user!.id, name, notes);
  res.status(201).json(workout);
}

export async function updateWorkout(req: AuthRequest, res: Response): Promise<void> {
  const workout = await workoutService.updateWorkout(req.params.id, req.user!.id, {
    name: req.body.name,
    notes: req.body.notes,
    endedAt: req.body.endedAt,
  });
  if (!workout) {
    res.status(404).json({ error: 'Antrenman bulunamadı' });
    return;
  }
  res.json(workout);
}

export async function deleteWorkout(req: AuthRequest, res: Response): Promise<void> {
  await workoutService.deleteWorkout(req.params.id, req.user!.id);
  res.status(204).send();
}

export async function addSet(req: AuthRequest, res: Response): Promise<void> {
  const set = await workoutService.addSet(req.params.id, req.user!.id, req.body);
  if (!set) {
    res.status(404).json({ error: 'Antrenman bulunamadı' });
    return;
  }
  res.status(201).json(set);
}

export async function listExercises(req: AuthRequest, res: Response): Promise<void> {
  const { search, muscleGroup } = req.query as Record<string, string | undefined>;
  const exercises = await workoutService.listExercises(req.user!.id, search, muscleGroup);
  res.json(exercises);
}

export async function createExercise(req: AuthRequest, res: Response): Promise<void> {
  const exercise = await workoutService.createExercise(req.user!.id, req.body);
  res.status(201).json(exercise);
}

export async function getPersonalRecords(req: AuthRequest, res: Response): Promise<void> {
  const records = await workoutService.getPersonalRecords(req.user!.id);
  res.json(records);
}
