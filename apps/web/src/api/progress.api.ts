import api from './client';
import type { BodyMeasurement } from '@fittrack/shared';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toMeasurement(m: any): BodyMeasurement {
  return {
    id: m.id,
    userId: m.user_id ?? m.userId,
    measuredAt: m.measured_at ?? m.measuredAt,
    weightKg: m.weight_kg != null ? parseFloat(m.weight_kg) : m.weightKg,
    bodyFat: m.body_fat != null ? parseFloat(m.body_fat) : m.bodyFat,
    chestCm: m.chest_cm != null ? parseFloat(m.chest_cm) : m.chestCm,
    waistCm: m.waist_cm != null ? parseFloat(m.waist_cm) : m.waistCm,
    hipsCm: m.hips_cm != null ? parseFloat(m.hips_cm) : m.hipsCm,
    notes: m.notes ?? null,
  };
}

export const progressApi = {
  getMeasurements: () =>
    api.get<unknown[]>('/progress/measurements').then((r) => r.data.map(toMeasurement)),
  addMeasurement: (data: Partial<BodyMeasurement>) =>
    api.post<unknown>('/progress/measurements', data).then((r) => toMeasurement(r.data)),
  getWeeklySummary: (weeks?: number) =>
    api.get('/progress/weekly-summary', { params: { weeks } }).then((r) => r.data),
  getPRHistory: (exerciseId: string) =>
    api.get(`/progress/pr/${exerciseId}`).then((r) => r.data),
  getMuscleDistribution: (days?: number) =>
    api.get('/progress/muscle-distribution', { params: { days } }).then((r) => r.data),
};
