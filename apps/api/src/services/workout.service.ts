import { query, queryOne } from '../db';

interface WorkoutRow {
  id: string;
  user_id: string;
  name: string;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
}

interface SetRow {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise_name: string;
  muscle_group: string;
  set_number: number;
  reps: number | null;
  weight_kg: string | null;
  rest_secs: number | null;
  is_superset: boolean;
  superset_group: number | null;
  completed: boolean;
}

export async function listWorkouts(userId: string) {
  return query<WorkoutRow>(
    `SELECT id, user_id, name, started_at, ended_at, notes
     FROM workouts WHERE user_id = $1 ORDER BY started_at DESC`,
    [userId]
  );
}

export async function getWorkout(id: string, userId: string) {
  const workout = await queryOne<WorkoutRow>(
    'SELECT * FROM workouts WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  if (!workout) return null;

  const sets = await query<SetRow>(
    `SELECT ws.*, e.name AS exercise_name, e.muscle_group
     FROM workout_sets ws
     JOIN exercises e ON e.id = ws.exercise_id
     WHERE ws.workout_id = $1
     ORDER BY ws.created_at, ws.set_number`,
    [id]
  );

  return { ...workout, sets };
}

export async function createWorkout(userId: string, name: string, notes?: string) {
  return queryOne<WorkoutRow>(
    'INSERT INTO workouts (user_id, name, notes) VALUES ($1, $2, $3) RETURNING *',
    [userId, name, notes ?? null]
  );
}

export async function updateWorkout(
  id: string,
  userId: string,
  data: { name?: string; notes?: string; endedAt?: string }
) {
  const existing = await queryOne<WorkoutRow>(
    'SELECT id FROM workouts WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  if (!existing) return null;

  return queryOne<WorkoutRow>(
    `UPDATE workouts SET
       name = COALESCE($3, name),
       notes = COALESCE($4, notes),
       ended_at = COALESCE($5, ended_at)
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId, data.name ?? null, data.notes ?? null, data.endedAt ?? null]
  );
}

export async function deleteWorkout(id: string, userId: string): Promise<boolean> {
  const result = await query(
    'DELETE FROM workouts WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return (result as unknown as { rowCount: number }).length > 0;
}

export async function addSet(
  workoutId: string,
  userId: string,
  data: {
    exerciseId: string;
    setNumber: number;
    reps?: number;
    weightKg?: number;
    restSecs?: number;
    isSuperset?: boolean;
    supersetGroup?: number;
  }
) {
  // Kullanıcının antrenmanı olduğunu doğrula
  const workout = await queryOne<WorkoutRow>(
    'SELECT id FROM workouts WHERE id = $1 AND user_id = $2',
    [workoutId, userId]
  );
  if (!workout) return null;

  return queryOne<SetRow>(
    `INSERT INTO workout_sets
       (workout_id, exercise_id, set_number, reps, weight_kg, rest_secs, is_superset, superset_group)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      workoutId,
      data.exerciseId,
      data.setNumber,
      data.reps ?? null,
      data.weightKg ?? null,
      data.restSecs ?? null,
      data.isSuperset ?? false,
      data.supersetGroup ?? null,
    ]
  );
}

export async function listExercises(userId: string, search?: string, muscleGroup?: string) {
  let sql = `SELECT * FROM exercises WHERE (is_custom = FALSE OR user_id = $1)`;
  const params: unknown[] = [userId];

  if (search) {
    params.push(`%${search}%`);
    sql += ` AND name ILIKE $${params.length}`;
  }
  if (muscleGroup) {
    params.push(muscleGroup);
    sql += ` AND muscle_group = $${params.length}`;
  }

  sql += ' ORDER BY is_custom ASC, name ASC';
  return query(sql, params);
}

export async function createExercise(
  userId: string,
  data: { name: string; muscleGroup: string; equipment: string }
) {
  return queryOne(
    `INSERT INTO exercises (name, muscle_group, equipment, is_custom, user_id)
     VALUES ($1, $2, $3, TRUE, $4) RETURNING *`,
    [data.name, data.muscleGroup, data.equipment, userId]
  );
}

export async function getPersonalRecords(userId: string) {
  return query(
    `SELECT DISTINCT ON (ws.exercise_id)
       ws.exercise_id, e.name AS exercise_name, e.muscle_group,
       ws.weight_kg, ws.reps, w.started_at AS achieved_at
     FROM workout_sets ws
     JOIN workouts w ON w.id = ws.workout_id
     JOIN exercises e ON e.id = ws.exercise_id
     WHERE w.user_id = $1 AND ws.weight_kg IS NOT NULL AND ws.completed = TRUE
     ORDER BY ws.exercise_id, ws.weight_kg DESC`,
    [userId]
  );
}
