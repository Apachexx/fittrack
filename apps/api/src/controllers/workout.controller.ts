import { AuthRequest } from '../middleware/auth';
import * as workoutService from '../services/workout.service';
import { Response } from 'express';

export async function listWorkouts(req: AuthRequest, res: Response): Promise<void> {
  try {
    const workouts = await workoutService.listWorkouts(req.user!.id);
    res.json(workouts);
  } catch (err) {
    console.error('listWorkouts error:', err);
    res.status(500).json({ error: 'Antrenmanlar alınamadı' });
  }
}

export async function getWorkout(req: AuthRequest, res: Response): Promise<void> {
  try {
    const workout = await workoutService.getWorkout(req.params.id, req.user!.id);
    if (!workout) {
      res.status(404).json({ error: 'Antrenman bulunamadı' });
      return;
    }
    res.json(workout);
  } catch (err) {
    console.error('getWorkout error:', err);
    res.status(500).json({ error: 'Antrenman alınamadı' });
  }
}

export async function createWorkout(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, notes } = req.body;
    const workout = await workoutService.createWorkout(req.user!.id, name, notes);
    res.status(201).json(workout);
  } catch (err) {
    console.error('createWorkout error:', err);
    res.status(500).json({ error: 'Antrenman oluşturulamadı' });
  }
}

export async function updateWorkout(req: AuthRequest, res: Response): Promise<void> {
  try {
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
  } catch (err) {
    console.error('updateWorkout error:', err);
    res.status(500).json({ error: 'Antrenman güncellenemedi' });
  }
}

export async function deleteWorkout(req: AuthRequest, res: Response): Promise<void> {
  try {
    await workoutService.deleteWorkout(req.params.id, req.user!.id);
    res.status(204).send();
  } catch (err) {
    console.error('deleteWorkout error:', err);
    res.status(500).json({ error: 'Antrenman silinemedi' });
  }
}

export async function addSet(req: AuthRequest, res: Response): Promise<void> {
  try {
    const set = await workoutService.addSet(req.params.id, req.user!.id, req.body);
    if (!set) {
      res.status(404).json({ error: 'Antrenman bulunamadı' });
      return;
    }
    res.status(201).json(set);
  } catch (err) {
    console.error('addSet error:', err);
    res.status(500).json({ error: 'Set eklenemedi' });
  }
}

export async function listExercises(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { search, muscleGroup } = req.query as Record<string, string | undefined>;
    const exercises = await workoutService.listExercises(req.user!.id, search, muscleGroup);
    res.json(exercises);
  } catch (err) {
    console.error('listExercises error:', err);
    res.status(500).json({ error: 'Egzersizler alınamadı' });
  }
}

export async function createExercise(req: AuthRequest, res: Response): Promise<void> {
  try {
    const exercise = await workoutService.createExercise(req.user!.id, req.body);
    res.status(201).json(exercise);
  } catch (err) {
    console.error('createExercise error:', err);
    res.status(500).json({ error: 'Egzersiz oluşturulamadı' });
  }
}

export async function getPersonalRecords(req: AuthRequest, res: Response): Promise<void> {
  try {
    const records = await workoutService.getPersonalRecords(req.user!.id);
    res.json(records);
  } catch (err) {
    console.error('getPersonalRecords error:', err);
    res.status(500).json({ error: 'Kişisel rekorlar alınamadı' });
  }
}

export async function getExerciseLastSession(req: AuthRequest, res: Response): Promise<void> {
  try {
    const sets = await workoutService.getExerciseLastSession(req.user!.id, req.params.exerciseId);
    res.json(sets);
  } catch (err) {
    console.error('getExerciseLastSession error:', err);
    res.status(500).json({ error: 'Son seans verileri alınamadı' });
  }
}

export async function getWorkoutDates(req: AuthRequest, res: Response): Promise<void> {
  try {
    const dates = await workoutService.getWorkoutDates(req.user!.id);
    res.json(dates);
  } catch (err) {
    console.error('getWorkoutDates error:', err);
    res.status(500).json({ error: 'Antrenman tarihleri alınamadı' });
  }
}
