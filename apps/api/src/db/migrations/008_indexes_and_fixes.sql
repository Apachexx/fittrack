-- Add is_public column to programs if missing
ALTER TABLE programs ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Indexes for program N+1 query optimization
CREATE INDEX IF NOT EXISTS idx_program_weeks_program_id ON program_weeks(program_id);
CREATE INDEX IF NOT EXISTS idx_program_days_week_id ON program_days(week_id);
CREATE INDEX IF NOT EXISTS idx_program_day_exercises_day_id ON program_day_exercises(day_id);

-- Indexes for workout_sets queries (strength/PR history filters by exercise_id + completed)
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise_id ON workout_sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_completed ON workout_sets(completed) WHERE completed = TRUE;

-- Index for body_measurements ordered queries
CREATE INDEX IF NOT EXISTS idx_body_measurements_measured_at ON body_measurements(user_id, measured_at DESC);
