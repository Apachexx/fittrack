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

  const weeks = await query<{ id: string; week_number: number }>(
    'SELECT * FROM program_weeks WHERE program_id = $1 ORDER BY week_number',
    [id]
  );

  const weeksWithDays = await Promise.all(
    weeks.map(async (week) => {
      const days = await query<{ id: string; day_number: number; name: string; is_rest_day: boolean }>(
        'SELECT * FROM program_days WHERE week_id = $1 ORDER BY day_number',
        [week.id]
      );

      const daysWithExercises = await Promise.all(
        days.map(async (day) => {
          const exercises = await query(
            `SELECT pde.*, e.name AS exercise_name, e.muscle_group
             FROM program_day_exercises pde
             JOIN exercises e ON e.id = pde.exercise_id
             WHERE pde.day_id = $1 ORDER BY pde.sort_order`,
            [day.id]
          );
          return { ...day, exercises };
        })
      );

      return { ...week, days: daysWithExercises };
    })
  );

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
