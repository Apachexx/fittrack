import { z } from 'zod';

export const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Antrenman adı boş olamaz'),
  notes: z.string().optional(),
});

export const addSetSchema = z.object({
  exerciseId: z.string().uuid(),
  setNumber: z.number().int().positive(),
  reps: z.number().int().positive().optional(),
  weightKg: z.number().nonnegative().optional(),
  restSecs: z.number().int().nonnegative().optional(),
  isSuperset: z.boolean().optional().default(false),
  supersetGroup: z.number().int().optional(),
  completed: z.boolean().optional().default(false),
});

export const createExerciseSchema = z.object({
  name: z.string().min(1),
  muscleGroup: z.enum(['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio']),
  equipment: z.enum(['barbell', 'dumbbell', 'machine', 'bodyweight', 'cables', 'other']),
});

export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;
export type AddSetInput = z.infer<typeof addSetSchema>;
export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
