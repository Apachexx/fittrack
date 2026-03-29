import { query, queryOne } from '../db';

interface ProgramRow {
  id: string;
  title: string;
  description: string | null;
  level: string;
  goal: string;
  duration_weeks: number;
  created_by: string | null;
  creator_name: string | null;
  enrollment_count: string;
}

export async function listPrograms(filters: { level?: string; goal?: string }) {
  let sql = `
    SELECT p.*, u.name AS creator_name,
           COUNT(pe.id) AS enrollment_count
    FROM programs p
    LEFT JOIN users u ON u.id = p.created_by
    LEFT JOIN program_enrollments pe ON pe.program_id = p.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (filters.level) {
    params.push(filters.level);
    sql += ` AND p.level = $${params.length}`;
  }
  if (filters.goal) {
    params.push(filters.goal);
    sql += ` AND p.goal = $${params.length}`;
  }

  sql += ' GROUP BY p.id, u.name ORDER BY p.created_at DESC';
  return query<ProgramRow>(sql, params);
}

export async function getProgram(id: string) {
  const program = await queryOne<ProgramRow>(
    `SELECT p.*, u.name AS creator_name
     FROM programs p LEFT JOIN users u ON u.id = p.created_by
     WHERE p.id = $1`,
    [id]
  );
  if (!program) return null;

  // Single query to fetch all weeks, days, and exercises at once
  const rows = await query<{
    week_id: string; week_number: number;
    day_id: string | null; day_number: number | null; day_name: string | null; is_rest_day: boolean | null;
    pde_id: string | null; exercise_id: string | null; exercise_name: string | null;
    muscle_group: string | null; sets: number | null; reps: string | null;
    rest_secs: number | null; sort_order: number | null;
  }>(
    `SELECT
       pw.id AS week_id, pw.week_number,
       pd.id AS day_id, pd.day_number, pd.name AS day_name, pd.is_rest_day,
       pde.id AS pde_id, pde.exercise_id, e.name AS exercise_name, e.muscle_group,
       pde.sets, pde.reps, pde.rest_secs, pde.sort_order
     FROM program_weeks pw
     LEFT JOIN program_days pd ON pd.week_id = pw.id
     LEFT JOIN program_day_exercises pde ON pde.day_id = pd.id
     LEFT JOIN exercises e ON e.id = pde.exercise_id
     WHERE pw.program_id = $1
     ORDER BY pw.week_number, pd.day_number, pde.sort_order`,
    [id]
  );

  // Reconstruct nested structure from flat rows
  const weekMap = new Map<string, { id: string; week_number: number; days: Map<string, { id: string; day_number: number; name: string; is_rest_day: boolean; exercises: unknown[] }> }>();

  for (const row of rows) {
    if (!weekMap.has(row.week_id)) {
      weekMap.set(row.week_id, { id: row.week_id, week_number: row.week_number, days: new Map() });
    }
    const week = weekMap.get(row.week_id)!;

    if (row.day_id) {
      if (!week.days.has(row.day_id)) {
        week.days.set(row.day_id, {
          id: row.day_id,
          day_number: row.day_number!,
          name: row.day_name!,
          is_rest_day: row.is_rest_day!,
          exercises: [],
        });
      }
      const day = week.days.get(row.day_id)!;

      if (row.pde_id) {
        day.exercises.push({
          id: row.pde_id,
          day_id: row.day_id,
          exercise_id: row.exercise_id,
          exercise_name: row.exercise_name,
          muscle_group: row.muscle_group,
          sets: row.sets,
          reps: row.reps,
          rest_secs: row.rest_secs,
          sort_order: row.sort_order,
        });
      }
    }
  }

  const weeksWithDays = Array.from(weekMap.values()).map((week) => ({
    id: week.id,
    week_number: week.week_number,
    days: Array.from(week.days.values()),
  }));

  return { ...program, weeks: weeksWithDays };
}

export async function enrollProgram(programId: string, userId: string) {
  const program = await queryOne('SELECT id FROM programs WHERE id = $1', [programId]);
  if (!program) return null;

  // Var olan kayıtları pasif yap
  await query(
    'UPDATE program_enrollments SET is_active = FALSE WHERE user_id = $1 AND is_active = TRUE',
    [userId]
  );

  return queryOne(
    `INSERT INTO program_enrollments (user_id, program_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, program_id) DO UPDATE
       SET is_active = TRUE, current_week = 1, started_at = CURRENT_DATE
     RETURNING *`,
    [userId, programId]
  );
}

export async function getActiveProgram(userId: string) {
  const enrollment = await queryOne(
    `SELECT pe.*, p.title, p.description, p.level, p.goal, p.duration_weeks
     FROM program_enrollments pe
     JOIN programs p ON p.id = pe.program_id
     WHERE pe.user_id = $1 AND pe.is_active = TRUE`,
    [userId]
  );
  return enrollment;
}

export async function updateEnrollmentProgress(userId: string, programId: string, currentWeek: number) {
  return queryOne(
    `UPDATE program_enrollments SET current_week = $3
     WHERE user_id = $1 AND program_id = $2 AND is_active = TRUE
     RETURNING *`,
    [userId, programId, currentWeek]
  );
}

export async function createCustomProgram(
  userId: string,
  data: {
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
) {
  const program = await queryOne<ProgramRow>(
    `INSERT INTO programs (title, level, goal, duration_weeks, created_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.title, data.level, data.goal, data.durationWeeks, userId]
  );
  if (!program) return null;

  const week = await queryOne<{ id: string }>(
    `INSERT INTO program_weeks (program_id, week_number) VALUES ($1, 1) RETURNING *`,
    [program.id]
  );
  if (!week) return null;

  for (const dayData of data.days) {
    const day = await queryOne<{ id: string }>(
      `INSERT INTO program_days (week_id, day_number, name, is_rest_day)
       VALUES ($1, $2, $3, FALSE) RETURNING *`,
      [week.id, dayData.dayNumber, dayData.name]
    );
    if (!day) continue;

    for (let i = 0; i < dayData.exercises.length; i++) {
      const ex = dayData.exercises[i];
      await query(
        `INSERT INTO program_day_exercises (day_id, exercise_id, sets, reps, rest_secs, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [day.id, ex.exerciseId, ex.sets, ex.reps, ex.restSecs ?? 90, i]
      );
    }
  }

  return program;
}

export async function getCommunityPrograms() {
  return query<{
    id: string; title: string; level: string; goal: string;
    duration_weeks: number; creator_name: string | null; created_by: string | null;
    day_count: string; exercise_count: string;
  }>(
    `SELECT p.id, p.title, p.level, p.goal, p.duration_weeks,
            u.name AS creator_name, p.created_by,
            COUNT(DISTINCT pd.id) AS day_count,
            COUNT(DISTINCT pde.id) AS exercise_count
     FROM programs p
     LEFT JOIN users u ON u.id = p.created_by
     LEFT JOIN program_weeks pw ON pw.program_id = p.id
     LEFT JOIN program_days pd ON pd.week_id = pw.id AND pd.is_rest_day = FALSE
     LEFT JOIN program_day_exercises pde ON pde.day_id = pd.id
     WHERE p.is_public = TRUE
     GROUP BY p.id, u.name, p.created_by
     ORDER BY p.created_at DESC`,
    []
  );
}

export async function toggleProgramVisibility(programId: string, userId: string, isPublic: boolean) {
  return queryOne<{ id: string; is_public: boolean }>(
    `UPDATE programs SET is_public = $1
     WHERE id = $2 AND created_by = $3
     RETURNING id, is_public`,
    [isPublic, programId, userId]
  );
}

export async function getExerciseStrengthTrend(userId: string, exerciseId: string) {
  return query(
    `SELECT DATE(w.started_at) AS date,
            MAX(ws.weight_kg::numeric) AS max_weight,
            MAX(ws.reps) AS reps_at_max
     FROM workout_sets ws
     JOIN workouts w ON w.id = ws.workout_id
     WHERE w.user_id = $1 AND ws.exercise_id = $2
       AND ws.weight_kg IS NOT NULL
     GROUP BY DATE(w.started_at)
     ORDER BY date DESC
     LIMIT 8`,
    [userId, exerciseId]
  );
}
