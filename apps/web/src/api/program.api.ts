import api from './client';
import type { Program, ProgramEnrollment } from '@fittrack/shared';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toProgram(p: any): Program {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    level: p.level,
    goal: p.goal,
    durationWeeks: p.duration_weeks ?? p.durationWeeks,
    createdBy: p.created_by ?? p.createdBy,
    creatorName: p.creator_name ?? p.creatorName,
    enrollmentCount: parseInt(p.enrollment_count ?? p.enrollmentCount ?? 0),
    weeks: p.weeks?.map(toWeek),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toWeek(w: any) {
  return {
    id: w.id,
    weekNumber: w.week_number ?? w.weekNumber,
    days: w.days?.map(toDay) ?? [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDay(d: any) {
  return {
    id: d.id,
    dayNumber: d.day_number ?? d.dayNumber,
    name: d.name,
    isRestDay: d.is_rest_day ?? d.isRestDay ?? false,
    exercises: d.exercises?.map(toExerciseItem) ?? [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toExerciseItem(e: any) {
  return {
    exerciseId: e.exercise_id ?? e.exerciseId,
    exerciseName: e.exercise_name ?? e.exerciseName,
    muscleGroup: e.muscle_group ?? e.muscleGroup,
    sets: e.sets,
    reps: e.reps,
    restSecs: e.rest_secs ?? e.restSecs,
    notes: e.notes,
    order: e.order,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toEnrollment(e: any): ProgramEnrollment {
  return {
    id: e.id,
    userId: e.user_id ?? e.userId,
    programId: e.program_id ?? e.programId,
    program: e.program ? toProgram(e.program) : undefined,
    startedAt: e.started_at ?? e.startedAt,
    isActive: e.is_active ?? e.isActive ?? false,
    currentWeek: e.current_week ?? e.currentWeek ?? 1,
    title: e.title,
  } as ProgramEnrollment & { title?: string };
}

export interface CustomProgramInput {
  title: string;
  level: string;
  goal: string;
  durationWeeks: number;
  days: Array<{
    dayNumber: number;
    name: string;
    exercises: Array<{
      exerciseId: string;
      sets: number;
      reps: string;
      restSecs?: number;
    }>;
  }>;
}

export const programApi = {
  list: (params?: { level?: string; goal?: string }) =>
    api.get<unknown[]>('/programs', { params }).then((r) => r.data.map(toProgram)),
  get: (id: string) =>
    api.get<unknown>(`/programs/${id}`).then((r) => toProgram(r.data)),
  enroll: (id: string) =>
    api.post<unknown>(`/programs/${id}/enroll`).then((r) => toEnrollment(r.data)),
  getActive: () =>
    api.get<unknown | null>('/programs/active').then((r) => r.data ? toEnrollment(r.data) : null),
  updateProgress: (id: string, currentWeek: number) =>
    api.patch(`/programs/${id}/progress`, { currentWeek }).then((r) => r.data),
  create: (data: CustomProgramInput) =>
    api.post<unknown>('/programs', data).then((r) => toProgram(r.data)),
  getStrengthTrend: (exerciseId: string) =>
    api.get<Array<{ date: string; max_weight: string; reps_at_max: number }>>(
      `/programs/strength-trend/${exerciseId}`
    ).then((r) => r.data),
};
