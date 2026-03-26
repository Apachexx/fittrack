export type ProgramLevel = 'beginner' | 'intermediate' | 'advanced';
export type ProgramGoal = 'strength' | 'hypertrophy' | 'endurance' | 'weight_loss';

export interface ProgramExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup?: string;
  sets: number;
  reps: string;
  restSecs: number;
  notes?: string;
  order: number;
}

export interface ProgramDay {
  id: string;
  dayNumber: number;
  name: string;
  isRestDay: boolean;
  exercises: ProgramExercise[];
}

export interface ProgramWeek {
  id: string;
  weekNumber: number;
  days: ProgramDay[];
}

export interface Program {
  id: string;
  title: string;
  description: string;
  level: ProgramLevel;
  goal: ProgramGoal;
  durationWeeks: number;
  createdBy: string;
  creatorName?: string;
  weeks?: ProgramWeek[];
  enrollmentCount?: number;
}

export interface ProgramEnrollment {
  id: string;
  userId: string;
  programId: string;
  program?: Program;
  startedAt: string;
  isActive: boolean;
  currentWeek: number;
}
