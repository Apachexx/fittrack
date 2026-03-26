CREATE TABLE IF NOT EXISTS programs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  description    TEXT,
  level          TEXT NOT NULL CHECK (level IN ('beginner','intermediate','advanced')),
  goal           TEXT NOT NULL CHECK (goal IN ('strength','hypertrophy','endurance','weight_loss')),
  duration_weeks INT NOT NULL,
  created_by     UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS program_weeks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id   UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  week_number  INT NOT NULL,
  UNIQUE(program_id, week_number)
);

CREATE TABLE IF NOT EXISTS program_days (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id      UUID NOT NULL REFERENCES program_weeks(id) ON DELETE CASCADE,
  day_number   INT NOT NULL,
  name         TEXT NOT NULL,
  is_rest_day  BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS program_day_exercises (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id       UUID NOT NULL REFERENCES program_days(id) ON DELETE CASCADE,
  exercise_id  UUID NOT NULL REFERENCES exercises(id),
  sets         INT NOT NULL DEFAULT 3,
  reps         TEXT NOT NULL DEFAULT '8-12',
  rest_secs    INT NOT NULL DEFAULT 90,
  notes        TEXT,
  sort_order   INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS program_enrollments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program_id   UUID NOT NULL REFERENCES programs(id),
  started_at   DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active    BOOLEAN DEFAULT TRUE,
  current_week INT DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_programs_level ON programs(level);
CREATE INDEX IF NOT EXISTS idx_programs_goal ON programs(goal);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_user ON program_enrollments(user_id);
