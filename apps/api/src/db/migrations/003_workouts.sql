CREATE TABLE IF NOT EXISTS workouts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at   TIMESTAMPTZ,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_sets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id      UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id     UUID NOT NULL REFERENCES exercises(id),
  set_number      INT NOT NULL,
  reps            INT,
  weight_kg       NUMERIC(6,2),
  rest_secs       INT,
  is_superset     BOOLEAN DEFAULT FALSE,
  superset_group  INT,
  completed       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS body_measurements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  measured_at DATE NOT NULL,
  weight_kg   NUMERIC(5,2),
  body_fat    NUMERIC(4,2),
  chest_cm    NUMERIC(5,2),
  waist_cm    NUMERIC(5,2),
  hips_cm     NUMERIC(5,2),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_started_at ON workouts(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sets_workout_id ON workout_sets(workout_id);
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_id ON body_measurements(user_id);
