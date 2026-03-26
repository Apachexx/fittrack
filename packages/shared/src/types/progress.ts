export interface BodyMeasurement {
  id: string;
  userId: string;
  measuredAt: string;
  weightKg?: number;
  bodyFat?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  notes?: string;
}

export interface PRRecord {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  records: Array<{
    weightKg: number;
    reps: number;
    achievedAt: string;
  }>;
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  totalWorkouts: number;
  totalSets: number;
  totalVolume: number;
  avgCaloriesPerDay: number;
  avgProteinPerDay: number;
  weightChange?: number;
}

export interface PhotoProgress {
  id: string;
  userId: string;
  photoUrl: string;
  takenAt: string;
  notes?: string;
}
