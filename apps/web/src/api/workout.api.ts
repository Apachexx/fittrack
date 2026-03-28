import api from './client';
import type { Workout, WorkoutSet, Exercise } from '@fittrack/shared';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSet(s: any): WorkoutSet & { exercise_name?: string } {
  return {
    id: s.id,
    workoutId: s.workout_id,
    exerciseId: s.exercise_id,
    exercise_name: s.exercise_name,
    setNumber: s.set_number ?? s.setNumber,
    reps: s.reps != null ? Number(s.reps) : undefined,
    weightKg: s.weight_kg != null ? parseFloat(s.weight_kg) : s.weightKg != null ? parseFloat(s.weightKg) : undefined,
    restSecs: s.rest_secs ?? s.restSecs,
    isSuperset: s.is_superset ?? s.isSuperset ?? false,
    supersetGroup: s.superset_group ?? s.supersetGroup,
    completed: s.completed ?? false,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toWorkout(w: any): Workout {
  return {
    id: w.id,
    userId: w.user_id ?? w.userId,
    name: w.name,
    startedAt: w.started_at ?? w.startedAt,
    endedAt: w.ended_at ?? w.endedAt ?? null,
    notes: w.notes ?? null,
    sets: w.sets?.map(toSet),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toExercise(e: any): Exercise {
  return {
    id: e.id,
    name: e.name,
    muscleGroup: e.muscle_group ?? e.muscleGroup,
    equipment: e.equipment,
    isCustom: e.is_custom ?? e.isCustom ?? false,
    userId: e.user_id ?? e.userId,
  };
}

export const workoutApi = {
  list: () => api.get<unknown[]>('/workouts').then((r) => r.data.map(toWorkout)),
  get: (id: string) => api.get<unknown>(`/workouts/${id}`).then((r) => toWorkout(r.data)),
  create: (data: { name: string; notes?: string }) =>
    api.post<unknown>('/workouts', data).then((r) => toWorkout(r.data)),
  update: (id: string, data: Partial<Workout>) =>
    api.put<unknown>(`/workouts/${id}`, data).then((r) => toWorkout(r.data)),
  delete: (id: string) => api.delete(`/workouts/${id}`),
  addSet: (workoutId: string, data: Partial<WorkoutSet>) =>
    api.post<unknown>(`/workouts/${workoutId}/sets`, data).then((r) => toSet(r.data as object)),

  listExercises: (params?: { search?: string; muscleGroup?: string }) =>
    api.get<unknown[]>('/workouts/exercises', { params }).then((r) => r.data.map(toExercise)),
  createExercise: (data: { name: string; muscleGroup: string; equipment: string }) =>
    api.post<unknown>('/workouts/exercises', data).then((r) => toExercise(r.data)),
  getPersonalRecords: () =>
    api.get('/workouts/personal-records').then((r) => r.data),
  getExerciseLastSession: (exerciseId: string) =>
    api.get<Array<{ set_number: number; reps: number | null; weight_kg: string | null }>>(
      `/workouts/exercises/${exerciseId}/last-session`
    ).then((r) => r.data),
  getWorkoutDates: () =>
    api.get<Array<{ date: string; count: string }>>('/workouts/dates').then((r) => r.data),
};
