export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'cardio';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'bodyweight'
  | 'cables'
  | 'other';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  isCustom: boolean;
  userId?: string;
}

export interface WorkoutSet {
  id: string;
  workoutId: string;
  exerciseId: string;
  exercise?: Exercise;
  setNumber: number;
  reps?: number;
  weightKg?: number;
  restSecs?: number;
  isSuperset: boolean;
  supersetGroup?: number;
  completed: boolean;
}

export interface Workout {
  id: string;
  userId: string;
  name: string;
  startedAt: string;
  endedAt?: string;
  notes?: string;
  sets?: WorkoutSet[];
}

export interface CreateWorkoutBody {
  name: string;
  notes?: string;
}

export interface AddSetBody {
  exerciseId: string;
  setNumber: number;
  reps?: number;
  weightKg?: number;
  restSecs?: number;
  isSuperset?: boolean;
  supersetGroup?: number;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  achievedAt: string;
}
